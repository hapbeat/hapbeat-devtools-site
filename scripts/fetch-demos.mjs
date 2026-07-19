#!/usr/bin/env node
// fetch-demos.mjs
//
// hapbeat-js-sdk の examples/games/（Hapbeat Arcade: ブラウザ触覚ミニゲーム集 + FPS デモ）を
// build 時に取り込み、devtools.hapbeat.com/demos/arcade/ として静的ホストする。
//
// source of truth は js-sdk のまま。fetch-docs.mjs と同じ「local=workspace 参照 /
// CI=shallow clone」パターンを踏襲する。
//
// 動作:
//  - ローカル dev/build: workspace 内 repos-*/hapbeat-js-sdk を探して examples/games/ を cp
//    （実 repo の作業ツリーは汚さない。dist/ が既にあればそのまま使い、無ければ build する）
//  - CI: git clone --depth=1 して同じ処理を行う
//
// 出力先: public/demos/arcade/
//   ※ このディレクトリは .gitignore 対象。build 時に regenerate される。

import { execSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TMP_DIR = path.join(ROOT, '.astro', '_fetch-demos-tmp');

// devtools-site は repos-tools/ 配下、workspace root は 2 階層上 (fetch-docs.mjs と同じ)。
const WORKSPACE_ROOT = path.resolve(ROOT, '..', '..');
const REPO_CATEGORY_DIRS = ['repos-core', 'repos-firmware', 'repos-sdk', 'repos-tools', '_legacy'];

const JS_SDK_REPO = 'hapbeat-js-sdk';
const JS_SDK_GIT_URL = 'https://github.com/hapbeat/hapbeat-js-sdk.git';
const GAMES_SUBDIR = 'examples/games';

const DEMOS_ROOT = path.join(ROOT, 'public', 'demos');
const ARCADE_DEST = path.join(DEMOS_ROOT, 'arcade');

// examples/games/ をコピーする際に除外するもの (相対パス、POSIX 区切り)。
const EXCLUDE_REL_DIRS = new Set(['games/_archive', 'node_modules']);
const EXCLUDE_REL_FILES = new Set([
  'tuning.csv', // 内部調整メモ
]);
// .studio-cache.json は js-sdk 自身の .gitignore でも除外対象になっている
// Studio 側の内部ビルドキャッシュ (demo-kit/**/.studio-cache.json)。配布物には不要。
const EXCLUDE_BASENAMES = new Set(['.studio-cache.json']);

// import map 書き換え対象 (コピー先のみ。元ファイルは不変)。
// [相対パス(コピー先基準), 置換前, 置換後]
const IMPORT_MAP_REWRITES = [
  ['index.html', '"../../dist/browser.js"', '"./vendor/browser.js"'],
  ['fps/index.html', '"../../../dist/browser.js"', '"../vendor/browser.js"'],
];

// 書き換え後の残置検知でスキャンするテキストファイル拡張子。
// ブラウザが実際に読み込むファイルのみ対象 (.md はドキュメント内の説明文で
// "../../dist/browser.js" 等に言及しているだけでも誤検知するため対象外)。
const TEXT_EXTS = new Set(['.html', '.htm', '.js', '.mjs', '.json', '.css']);

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', ...opts });
}

async function isDir(p) {
  try {
    const s = await stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function resetDir(p) {
  if (existsSync(p)) await rm(p, { recursive: true, force: true });
  await mkdir(p, { recursive: true });
}

async function resolveSiblingJsSdk() {
  for (const category of REPO_CATEGORY_DIRS) {
    const p = path.join(WORKSPACE_ROOT, category, JS_SDK_REPO);
    if (await isDir(p)) return p;
  }
  return null;
}

async function fetchFromGitClone() {
  const tmpRepo = path.join(TMP_DIR, JS_SDK_REPO);
  if (existsSync(tmpRepo)) await rm(tmpRepo, { recursive: true, force: true });
  // public repo なので token 無しでも通る想定だが、fetch-docs.mjs と同じ注入パターンを
  // 踏襲しておく (private 化・rate limit 対策時にそのまま使える)。
  const token = process.env.DOCS_FETCH_TOKEN;
  let cloneUrl = JS_SDK_GIT_URL;
  if (token && cloneUrl.startsWith('https://github.com/')) {
    cloneUrl = cloneUrl.replace('https://github.com/', `https://x-access-token:${token}@github.com/`);
  }
  try {
    run(`git clone --depth=1 "${cloneUrl}" "${tmpRepo}"`);
  } catch (e) {
    const safeMsg = String(e.message || '').replace(/x-access-token:[^@]+@/g, 'x-access-token:***@');
    console.warn(`  skip: clone failed for ${JS_SDK_REPO} (${safeMsg})`);
    return null;
  }
  return tmpRepo;
}

// js-sdk の dist/browser.js が無ければ build する。sibling (workspace 実 repo) の
// 作業ツリーは汚さない方針: dist/ が既にあればそのまま使い、無ければ build する
// (node_modules が無い場合のみ npm ci)。CI clone (使い捨てディレクトリ) は自由にビルドしてよい。
async function ensureBuilt(repoDir) {
  const browserJs = path.join(repoDir, 'dist', 'browser.js');
  if (existsSync(browserJs)) {
    console.log(`  ok: using existing dist/browser.js (${path.relative(WORKSPACE_ROOT, repoDir)})`);
    return true;
  }
  console.log(`  dist/browser.js not found — building js-sdk in ${path.relative(WORKSPACE_ROOT, repoDir)}`);
  try {
    const nodeModules = path.join(repoDir, 'node_modules');
    if (!existsSync(nodeModules)) {
      run('npm ci --no-audit --no-fund', { cwd: repoDir });
    }
    run('npm run build', { cwd: repoDir });
  } catch (e) {
    console.warn(`  skip: js-sdk build failed (${e.message})`);
    return false;
  }
  return existsSync(browserJs);
}

async function resolveJsSdk(useGit) {
  if (!useGit) {
    const sibling = await resolveSiblingJsSdk();
    if (sibling) {
      const ok = await ensureBuilt(sibling);
      if (ok) return sibling;
      console.warn(`  warn: sibling ${JS_SDK_REPO} found but build failed — falling back to git clone`);
    } else {
      console.warn(`  warn: sibling ${JS_SDK_REPO} not found under repos-*/ — falling back to git clone`);
    }
  }
  const cloned = await fetchFromGitClone();
  if (!cloned) return null;
  const ok = await ensureBuilt(cloned);
  return ok ? cloned : null;
}

// examples/games/ → public/demos/arcade/ を除外リスト付きでコピーする。
async function copyGamesTree(srcDir, destDir) {
  await cp(srcDir, destDir, {
    recursive: true,
    filter: (src) => {
      const rel = path.relative(srcDir, src).split(path.sep).join('/');
      if (rel === '') return true;
      if (EXCLUDE_REL_DIRS.has(rel)) return false;
      for (const d of EXCLUDE_REL_DIRS) {
        if (rel.startsWith(`${d}/`)) return false;
      }
      if (EXCLUDE_REL_FILES.has(rel)) return false;
      if (EXCLUDE_BASENAMES.has(path.basename(rel))) return false;
      return true;
    },
  });
}

async function copySdkVendorBundle(sdkRepoDir) {
  const vendorDir = path.join(ARCADE_DEST, 'vendor');
  await mkdir(vendorDir, { recursive: true });
  const browserJs = path.join(sdkRepoDir, 'dist', 'browser.js');
  await cp(browserJs, path.join(vendorDir, 'browser.js'));
  const browserMap = path.join(sdkRepoDir, 'dist', 'browser.js.map');
  if (existsSync(browserMap)) {
    await cp(browserMap, path.join(vendorDir, 'browser.js.map'));
  }
  console.log('  ok: dist/browser.js → demos/arcade/vendor/browser.js');
}

async function rewriteImportMaps() {
  for (const [relPath, from, to] of IMPORT_MAP_REWRITES) {
    const filePath = path.join(ARCADE_DEST, relPath);
    if (!existsSync(filePath)) {
      console.warn(`  warn: expected file missing for import-map rewrite: demos/arcade/${relPath}`);
      continue;
    }
    const raw = await readFile(filePath, 'utf8');
    if (!raw.includes(from)) {
      console.warn(`  warn: pattern not found in demos/arcade/${relPath}: ${from}`);
      continue;
    }
    const rewritten = raw.split(from).join(to);
    await writeFile(filePath, rewritten, 'utf8');
    console.log(`  ok: rewrote import map in demos/arcade/${relPath}`);
  }
}

// 書き換え漏れ検知: コピー先ツリー全体を舐めて "../dist/" の残置がないか確認する。
// 将来 example が増えて import map を書き足し忘れた時に build を落として気づけるようにする。
async function scanForStaleDistRefs(dir) {
  const hits = [];
  async function walk(d) {
    for (const entry of await readdir(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) {
        await walk(p);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!TEXT_EXTS.has(ext)) continue;
      let content;
      try {
        content = await readFile(p, 'utf8');
      } catch {
        continue;
      }
      if (content.includes('../dist/')) {
        hits.push(path.relative(ARCADE_DEST, p).split(path.sep).join('/'));
      }
    }
  }
  await walk(dir);
  return hits;
}

// demo-kit/ を Studio の「フォルダを読み込む」用に zip 化する (click-DL 配布物)。
// .studio-cache.json はビルドキャッシュのため zip からも除外する。
async function zipDemoKit() {
  const demoKitDir = path.join(ARCADE_DEST, 'demo-kit');
  if (!(await isDir(demoKitDir))) {
    console.warn('  warn: demos/arcade/demo-kit/ not found — skipping demo-kit zip');
    return;
  }
  const zip = new AdmZip();
  zip.addLocalFolder(demoKitDir, '', (filename) => path.basename(filename) !== '.studio-cache.json');
  const zipPath = path.join(ARCADE_DEST, 'hapbeat-arcade-demo-kit.zip');
  zip.writeZip(zipPath);
  console.log('  ok: demo-kit/ → demos/arcade/hapbeat-arcade-demo-kit.zip');
}

async function main() {
  console.log('[fetch-demos] aggregating Hapbeat Arcade demos from hapbeat-js-sdk…');
  await mkdir(TMP_DIR, { recursive: true });

  const useGit = process.env.FETCH_DEMOS_MODE === 'git' || !!process.env.CI;
  if (useGit) console.log('  (mode: git clone — CI or forced)');

  const sdkDir = await resolveJsSdk(useGit);

  if (!sdkDir) {
    const msg = `[fetch-demos] could not obtain ${JS_SDK_REPO} (sibling not found and git clone/build failed)`;
    if (useGit) {
      console.error(msg);
      console.error('  → CI mode: treating as build failure.');
      if (existsSync(TMP_DIR)) await rm(TMP_DIR, { recursive: true, force: true });
      process.exit(1);
    }
    console.warn(msg);
    console.warn('  → local mode: skipping — leaving any existing public/demos/ from a previous run untouched.');
    if (existsSync(TMP_DIR)) await rm(TMP_DIR, { recursive: true, force: true });
    console.log('[fetch-demos] done (skipped).');
    return;
  }

  const gamesSrc = path.join(sdkDir, GAMES_SUBDIR);
  if (!(await isDir(gamesSrc))) {
    console.error(`[fetch-demos] ${GAMES_SUBDIR}/ not found in ${sdkDir}`);
    if (useGit) {
      if (existsSync(TMP_DIR)) await rm(TMP_DIR, { recursive: true, force: true });
      process.exit(1);
    }
    console.warn('  → local mode: skipping — leaving any existing public/demos/ from a previous run untouched.');
    if (existsSync(TMP_DIR)) await rm(TMP_DIR, { recursive: true, force: true });
    console.log('[fetch-demos] done (skipped).');
    return;
  }

  // idempotent: js-sdk を無事取得できた時点で初めて public/demos/ を丸ごと削除して
  // 再生成する。skip 分岐より前に reset すると、offline 時に前回生成済みの
  // public/demos/ まで消してしまい、直前まで動いていた /demos/arcade/ が 404 に
  // なる事故になるため、reset は「本当に再生成できる」ことが確定してから行う。
  await resetDir(DEMOS_ROOT);

  await mkdir(ARCADE_DEST, { recursive: true });
  await copyGamesTree(gamesSrc, ARCADE_DEST);
  console.log(`  ok: ${GAMES_SUBDIR}/ → demos/arcade/`);

  await copySdkVendorBundle(sdkDir);
  await rewriteImportMaps();

  const staleRefs = await scanForStaleDistRefs(ARCADE_DEST);
  if (staleRefs.length > 0) {
    console.error('[fetch-demos] stale "../dist/" references found after import-map rewrite:');
    for (const hit of staleRefs) console.error(`  - demos/arcade/${hit}`);
    console.error('  → a new example probably references dist/browser.js directly; add it to IMPORT_MAP_REWRITES.');
    if (existsSync(TMP_DIR)) await rm(TMP_DIR, { recursive: true, force: true });
    process.exit(1);
  }

  await zipDemoKit();

  if (existsSync(TMP_DIR)) await rm(TMP_DIR, { recursive: true, force: true });
  console.log('[fetch-demos] done.');
}

main().catch((e) => {
  console.error('[fetch-demos] fatal:', e);
  process.exit(1);
});
