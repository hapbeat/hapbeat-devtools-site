#!/usr/bin/env node
// fetch-docs.mjs
//
// 各サブ repo の docs/ を build 時に取り込む集約スクリプト。
//
// 動作:
//  - ローカル dev: ../<repo>/docs/ が存在すればそこから cp（高速）
//  - CI: git clone --depth=1 して docs/ をコピー
//
// 出力先: src/content/docs/docs/_fetched/<repo-short>/
//   ※ このディレクトリは .gitignore 対象。build 時に regenerate される。
//
// Starlight の sidebar で参照する際は `/docs/_fetched/<repo-short>/<page>` で固定。

import { execSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chokidar from 'chokidar';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
// 各 repo の docs/ は src/content/docs/docs/<short>/ へ集約する。
// portal URL は /docs/<short>/<page>/ となり、fetched という実装名は表に出ない。
// hand-written な docs/getting-started.md / docs/concepts.md と棲み分けるため、
// repo の追加ごとに per-short のサブディレクトリを reset する設計にしている。
const TARGET_PARENT = path.join(ROOT, 'src', 'content', 'docs', 'docs');
const TMP_DIR = path.join(ROOT, '.astro', '_fetch-tmp');
const WORKSPACE_SIBLING = path.resolve(ROOT, '..'); // hapbeat-sdk-workspace/

// ユーザー向け docs/ を持つ repo のみ列挙する。
// hapbeat-bridge / hapbeat-transmitter-firmware は内部コンポーネント
// (ユーザー直接操作なし) なので集約対象外。
// short = portal URL prefix
// repo  = ローカル sibling ディレクトリ名 (旧 hapbeat-pack-tools のまま)
// url   = GitHub の現行 canonical URL (rename 済みの名前)
// label: section landing 自動生成時の表示名 (astro.config.mjs sidebar の label と揃える)。
//        sub-repo が docs/index.md を持っていればそちらが優先 (override)。
const SOURCES = [
  { short: 'contracts',    label: 'Contracts (仕様)',           repo: 'hapbeat-contracts',           url: 'https://github.com/Hapbeat/hapbeat-contracts.git' },
  // hapbeat-kit-tools は内部ツール (Studio/Helper どちらも独自実装で呼ばない) のため docs 集約対象から除外。
  { short: 'firmware',     label: 'Device Firmware',            repo: 'hapbeat-device-firmware',     url: 'https://github.com/Hapbeat/hapbeat-device-firmware.git' },
  // hapbeat-manager は deprecated (Studio + Helper に移行) のため docs 集約対象から除外。
  { short: 'helper',       label: 'Hapbeat Helper (CLI daemon)', repo: 'hapbeat-helper',             url: 'https://github.com/Hapbeat/hapbeat-helper.git' },
  { short: 'studio',       label: 'Hapbeat Studio',             repo: 'hapbeat-studio',              url: 'https://github.com/Hapbeat/hapbeat-studio.git' },
  { short: 'unity-sdk',    label: 'Unity SDK',                  repo: 'hapbeat-unity-sdk',           url: 'https://github.com/Hapbeat/hapbeat-unity-sdk.git' },
  // hapbeat-unreal-sdk / hapbeat-creative-kit は未実装。
  // 単一の docs/coming-soon.md (devtools-site 内) にまとめてあるため fetch しない。
];

// 集約後に portal で表示しないファイル名 (case-insensitive)。
//  - README.md: docs/ ディレクトリの説明 (contributor 向けメタ文書)
//  - .meta:     Unity の asset metadata
const EXCLUDE_FILES = new Set(['readme.md']);
const EXCLUDE_EXTS = new Set(['.meta']);

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

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', ...opts });
}

async function fetchFromSibling(src) {
  const siblingDocs = path.join(WORKSPACE_SIBLING, src.repo, 'docs');
  if (!(await isDir(siblingDocs))) return false;
  const dest = path.join(TARGET_PARENT, src.short);
  await cp(siblingDocs, dest, { recursive: true });
  console.log(`  ok: sibling ${src.repo}/docs → docs/${src.short}/`);
  return true;
}

async function fetchFromGit(src) {
  const tmpRepo = path.join(TMP_DIR, src.repo);
  if (existsSync(tmpRepo)) await rm(tmpRepo, { recursive: true, force: true });
  // private repo の clone には認証必須。DOCS_FETCH_TOKEN (org の repo を read できる
  // fine-grained PAT) が env にあれば clone URL に注入する。
  // GitHub Actions default の GITHUB_TOKEN は current repo scoped なので cross-repo は不可。
  const token = process.env.DOCS_FETCH_TOKEN;
  let cloneUrl = src.url;
  if (token && cloneUrl.startsWith('https://github.com/')) {
    cloneUrl = cloneUrl.replace('https://github.com/', `https://x-access-token:${token}@github.com/`);
  }
  try {
    run(`git clone --depth=1 "${cloneUrl}" "${tmpRepo}"`);
  } catch (e) {
    // エラーメッセージに token が混入する可能性を伏字化
    const safeMsg = String(e.message || '').replace(/x-access-token:[^@]+@/g, 'x-access-token:***@');
    console.warn(`  skip: clone failed for ${src.repo} (${safeMsg})`);
    return false;
  }
  const gitDocs = path.join(tmpRepo, 'docs');
  if (!(await isDir(gitDocs))) {
    console.warn(`  skip: no docs/ in ${src.repo}`);
    return false;
  }
  const dest = path.join(TARGET_PARENT, src.short);
  await cp(gitDocs, dest, { recursive: true });
  console.log(`  ok: clone ${src.repo}/docs → docs/${src.short}/`);
  return true;
}

// Starlight required な frontmatter を取り込んだ .md に保証する。
//  (1) title:
//      - 既に title があれば触らない
//      - 無ければ先頭 H1 or ファイル名から派生して挿入
//  (2) sidebar.order:
//      - filename が getting-started のものは sidebar.order: 1 を自動注入
//        (各セクションで Getting Started を先頭に固定するため)
//      - 既に sidebar が frontmatter にあれば触らない (sub-repo 側で自由に上書き可)
//      - 任意の並び順は frontmatter に sidebar.order: <N> を書けば反映される
async function normalizeMarkdownFrontmatter(filePath) {
  const rawFile = await readFile(filePath, 'utf8');
  // CRLF → LF 正規化（Windows 環境でのファイルを処理するため）
  const raw = rawFile.replace(/\r\n/g, '\n').replace(/^﻿/, '');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  let frontmatter = fmMatch ? fmMatch[1] : '';
  const body = fmMatch ? raw.slice(fmMatch[0].length) : raw;

  const hasTitle = /^title\s*:/m.test(frontmatter);
  const hasSidebar = /^sidebar\s*:/m.test(frontmatter);
  const baseName = path.basename(filePath, path.extname(filePath));
  const isGettingStarted = baseName === 'getting-started';
  const needsOrderInjection = isGettingStarted && !hasSidebar;

  if (hasTitle && !needsOrderInjection) return; // nothing to do

  let newFm = frontmatter;
  if (!hasTitle) {
    const h1 = body.match(/^#\s+(.+)$/m);
    const fallbackTitle = h1
      ? h1[1].trim()
      : baseName
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
    const escaped = fallbackTitle.replace(/"/g, '\\"');
    newFm = newFm ? `${newFm}\ntitle: "${escaped}"` : `title: "${escaped}"`;
  }
  if (needsOrderInjection) {
    newFm = newFm ? `${newFm}\nsidebar:\n  order: 1` : `sidebar:\n  order: 1`;
  }

  await writeFile(filePath, `---\n${newFm}\n---\n${body}`);
}

// frontmatter の title を抜き出す (walkAndNormalize 後なので必ず存在する想定)。
function extractTitleFromFrontmatter(raw) {
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const m = fm[1].match(/^title\s*:\s*"?([^"\n]+)"?$/m);
  return m ? m[1].trim().replace(/\\"/g, '"') : null;
}

// セクションの landing page (index.md) が無ければ自動生成する。
//   - 既存の index.md / index.mdx がある場合は何もしない (sub-repo 側が override)
//   - 自動生成版は: タイトル + getting-started への導線 + ページ一覧 (top-level のみ)
//   - 結果として /docs/<section>/ が 200 OK で開けるようになる
async function ensureSectionIndex(dir, label) {
  if (existsSync(path.join(dir, 'index.md'))) return false;
  if (existsSync(path.join(dir, 'index.mdx'))) return false;

  const entries = await readdir(dir, { withFileTypes: true });
  const pages = [];
  const subdirs = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      subdirs.push(entry.name);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!/\.(md|mdx)$/.test(entry.name)) continue;
    const slug = entry.name.replace(/\.(md|mdx)$/, '');
    if (slug === 'index') continue;
    const raw = await readFile(path.join(dir, entry.name), 'utf8');
    const title = extractTitleFromFrontmatter(raw) || slug;
    pages.push({ slug, title });
  }

  // getting-started を先頭に、その他はタイトル昇順に。
  pages.sort((a, b) => {
    if (a.slug === 'getting-started') return -1;
    if (b.slug === 'getting-started') return 1;
    return a.title.localeCompare(b.title, 'ja');
  });
  subdirs.sort();

  const lines = [];
  lines.push('---');
  lines.push(`title: "${label}"`);
  // sidebar からは隠す: section 見出し (group label) クリックでこの landing
  // に遷移するため、sub-page リストにも index を出すと重複する。
  // 各 sub-repo が docs/index.md を自前で用意した場合は同様に
  // `sidebar: { hidden: true }` を入れることを推奨。
  lines.push('sidebar:');
  lines.push('  hidden: true');
  lines.push('---');
  lines.push('');
  if (pages.length === 0 && subdirs.length === 0) {
    lines.push(`${label} のドキュメントは準備中です。`);
  } else {
    lines.push(`${label} のドキュメント一覧です。`);
    lines.push('');
    for (const p of pages) {
      lines.push(`- [${p.title}](./${p.slug}/)`);
    }
    for (const sub of subdirs) {
      lines.push(`- [${sub}](./${sub}/)`);
    }
  }
  lines.push('');

  await writeFile(path.join(dir, 'index.md'), lines.join('\n'));
  return true;
}

async function walkAndNormalize(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    const lower = entry.name.toLowerCase();
    const ext = path.extname(lower);
    // 除外: portal に出すべきでないファイルを集約後に削除
    if (entry.isFile() && (EXCLUDE_FILES.has(lower) || EXCLUDE_EXTS.has(ext))) {
      await rm(p, { force: true });
      continue;
    }
    if (entry.isDirectory()) await walkAndNormalize(p);
    else if (entry.isFile() && (p.endsWith('.md') || p.endsWith('.mdx'))) {
      await normalizeMarkdownFrontmatter(p);
    }
  }
}

async function main() {
  console.log('[fetch-docs] aggregating docs from sibling repos…');
  await mkdir(TARGET_PARENT, { recursive: true });
  await mkdir(TMP_DIR, { recursive: true });

  // devtools-site 自身の docs/ をまず TARGET_PARENT へフラットにコピーする。
  // 各サブ repo と同じく "ルート直下の docs/ が編集場所" に統一するための仕組み。
  const localDocs = path.join(ROOT, 'docs');
  if (await isDir(localDocs)) {
    await cp(localDocs, TARGET_PARENT, { recursive: true });
    await walkAndNormalize(TARGET_PARENT);
    console.log('  ok: local docs/ → docs/ (portal root pages)');
  }

  const useGit = process.env.FETCH_DOCS_MODE === 'git' || !!process.env.CI;
  if (useGit) console.log('  (mode: git clone — CI or forced)');

  const failed = [];
  for (const src of SOURCES) {
    console.log(`- ${src.repo}`);
    // Per-short の宛先を reset (hand-written な docs/getting-started.md 等を温存するため)。
    const dest = path.join(TARGET_PARENT, src.short);
    await resetDir(dest);

    let ok = false;
    if (!useGit) ok = await fetchFromSibling(src);
    if (!ok) ok = await fetchFromGit(src);
    if (!ok) {
      console.warn(`  warn: ${src.repo} skipped — page may render as placeholder only`);
      failed.push(src.repo);
      continue;
    }
    // Normalize frontmatter (Starlight requires title) and strip excluded files.
    await walkAndNormalize(dest);
    // Section landing が無ければ自動生成 (sub-repo が docs/index.md を持てば override)。
    const generated = await ensureSectionIndex(dest, src.label || src.short);
    if (generated) console.log(`  + auto-generated index for ${src.short}/`);
  }

  // clean tmp
  if (existsSync(TMP_DIR)) await rm(TMP_DIR, { recursive: true, force: true });

  // CI で失敗した場合は build 失敗扱いにする。
  // 過去 (DOCS_FETCH_TOKEN 未設定で全 clone 失敗 → 空 dir で build success → docs 反映漏れ) の
  // silent-fail 事故を防ぐため、CI 時のみ厳格にする。
  // ローカルは sibling 不在の repo があり得るので従来通り skip 許容。
  if (useGit && failed.length > 0) {
    console.error(`[fetch-docs] CI mode: ${failed.length} repo(s) failed to fetch:`);
    for (const repo of failed) console.error(`  - ${repo}`);
    console.error('  → DOCS_FETCH_TOKEN secret が未設定 / 期限切れ / 権限不足の可能性。');
    process.exit(1);
  }

  console.log('[fetch-docs] done.');
}

// --watch モード: 各 sibling repo の docs/ と devtools-site の docs/ を監視し、
// 変更があれば TARGET_PARENT に同期する。Astro/Vite が TARGET_PARENT を watch
// しているので、書き込み時点で HMR が走る。
//
// CI ではこのモードを使わない (sibling は無い、git clone も watch 不可)。
async function syncOneFile(srcFile, baseSrcDir, destBaseDir) {
  const rel = path.relative(baseSrcDir, srcFile);
  const destFile = path.join(destBaseDir, rel);
  const lower = path.basename(destFile).toLowerCase();
  const ext = path.extname(lower);

  if (!existsSync(srcFile)) {
    await rm(destFile, { force: true });
    return;
  }
  if (EXCLUDE_FILES.has(lower) || EXCLUDE_EXTS.has(ext)) {
    await rm(destFile, { force: true });
    return;
  }
  await mkdir(path.dirname(destFile), { recursive: true });
  await cp(srcFile, destFile);
  if (destFile.endsWith('.md') || destFile.endsWith('.mdx')) {
    await normalizeMarkdownFrontmatter(destFile);
  }
}

async function startWatch() {
  console.log('[fetch-docs] watch mode — waiting for changes (sibling docs/ / local docs/)');

  for (const src of SOURCES) {
    const watchDir = path.join(WORKSPACE_SIBLING, src.repo, 'docs');
    if (!existsSync(watchDir)) continue;
    const destDir = path.join(TARGET_PARENT, src.short);
    chokidar
      .watch(watchDir, { ignoreInitial: true, ignored: /(^|[\/\\])\.git/ })
      .on('all', async (event, filePath) => {
        try {
          await syncOneFile(filePath, watchDir, destDir);
          // add/unlink: index ページの list を再生成 (sub-repo が自前 index.md を
          // 持つ場合は触らない — 自前があれば watch でコピー済 / なければ regen)
          if (event === 'add' || event === 'unlink') {
            const userIndex =
              existsSync(path.join(watchDir, 'index.md')) ||
              existsSync(path.join(watchDir, 'index.mdx'));
            if (!userIndex) {
              await rm(path.join(destDir, 'index.md'), { force: true });
              await ensureSectionIndex(destDir, src.label || src.short);
            }
          }
          console.log(`[fetch-docs] ${event}: ${path.relative(WORKSPACE_SIBLING, filePath)}`);
        } catch (e) {
          console.warn(`[fetch-docs] sync error: ${e.message}`);
        }
      });
    console.log(`  watching: ${src.repo}/docs/`);
  }

  const localDocs = path.join(ROOT, 'docs');
  if (existsSync(localDocs)) {
    chokidar
      .watch(localDocs, { ignoreInitial: true, ignored: /(^|[\/\\])\.git/ })
      .on('all', async (event, filePath) => {
        try {
          await syncOneFile(filePath, localDocs, TARGET_PARENT);
          console.log(`[fetch-docs] ${event}: ${path.relative(ROOT, filePath)}`);
        } catch (e) {
          console.warn(`[fetch-docs] sync error: ${e.message}`);
        }
      });
    console.log('  watching: local docs/');
  }
}

main()
  .then(async () => {
    if (process.argv.includes('--watch')) {
      await startWatch();
      // 永続実行 (concurrently 経由で astro dev と並走、Ctrl+C で両方終了)
      await new Promise(() => {});
    }
  })
  .catch((e) => {
    console.error('[fetch-docs] fatal:', e);
    process.exit(1);
  });
