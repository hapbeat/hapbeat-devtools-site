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
const SOURCES = [
  { short: 'contracts',    repo: 'hapbeat-contracts',           url: 'https://github.com/Hapbeat/hapbeat-contracts.git' },
  { short: 'kit-tools',    repo: 'hapbeat-pack-tools',          url: 'https://github.com/Hapbeat/hapbeat-kit-tools.git' },
  { short: 'firmware',     repo: 'hapbeat-device-firmware',     url: 'https://github.com/Hapbeat/hapbeat-device-firmware.git' },
  { short: 'manager',      repo: 'hapbeat-manager',             url: 'https://github.com/Hapbeat/hapbeat-manager.git' },
  { short: 'helper',       repo: 'hapbeat-helper',              url: 'https://github.com/Hapbeat/hapbeat-helper.git' },
  { short: 'studio',       repo: 'hapbeat-studio',              url: 'https://github.com/Hapbeat/hapbeat-studio.git' },
  { short: 'unity-sdk',    repo: 'hapbeat-unity-sdk',           url: 'https://github.com/Hapbeat/hapbeat-unity-sdk.git' },
  { short: 'unreal-sdk',   repo: 'hapbeat-unreal-sdk',          url: 'https://github.com/Hapbeat/hapbeat-unreal-sdk.git' },
  { short: 'creative-kit', repo: 'hapbeat-creative-kit',        url: 'https://github.com/Hapbeat/hapbeat-creative-kit.git' },
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

// Starlight requires `title` in frontmatter. 取り込んだ .md にこれを保証する。
//  - frontmatter があり title もあれば触らない
//  - frontmatter があるが title なし → 先頭 H1 or ファイル名から派生して挿入
//  - frontmatter なし → 新規生成して付与
async function normalizeMarkdownFrontmatter(filePath) {
  const raw = await readFile(filePath, 'utf8');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  let frontmatter = fmMatch ? fmMatch[1] : '';
  let body = fmMatch ? raw.slice(fmMatch[0].length) : raw;

  if (/^title\s*:/m.test(frontmatter)) return; // already ok

  const h1 = body.match(/^#\s+(.+)$/m);
  const fallbackTitle = h1
    ? h1[1].trim()
    : path.basename(filePath, path.extname(filePath))
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

  const escaped = fallbackTitle.replace(/"/g, '\\"');
  const newFm = frontmatter ? `${frontmatter}\ntitle: "${escaped}"` : `title: "${escaped}"`;
  await writeFile(filePath, `---\n${newFm}\n---\n${body}`);
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

main().catch((e) => {
  console.error('[fetch-docs] fatal:', e);
  process.exit(1);
});
