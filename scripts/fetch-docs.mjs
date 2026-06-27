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
import { cp, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
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
// EN ロケール: docs/en/ → src/content/docs/en/docs/ (Starlight の locale folder 規約)。
// JA (root) は docs/ja/ → TARGET_PARENT。assets は docs/assets/ にロケール中立で共有。
const EN_TARGET = path.join(ROOT, 'src', 'content', 'docs', 'en', 'docs');
const TMP_DIR = path.join(ROOT, '.astro', '_fetch-tmp');
// workspace root = .../hapbeat-sdk-workspace。devtools-site は repos-tools/ 配下なので 2 階層上。
// sub-repo は 2026-06 の再編でフラットから repos-<category>/ 配下に分類移動した
// (正規パスは .claude-workspace.json の sub_repos)。sibling docs は各カテゴリを横断探索する。
const WORKSPACE_ROOT = path.resolve(ROOT, '..', '..');
const REPO_CATEGORY_DIRS = ['repos-core', 'repos-firmware', 'repos-sdk', 'repos-tools', '_legacy'];

// ユーザー向け docs/ を持つ repo のみ列挙する。
// hapbeat-bridge / hapbeat-transmitter-firmware は内部コンポーネント
// (ユーザー直接操作なし) なので集約対象外。
// short = portal URL prefix
// repo  = ローカル sibling ディレクトリ名 (旧 hapbeat-pack-tools のまま)
// url   = GitHub の現行 canonical URL (rename 済みの名前)
// label: section landing 自動生成時の表示名 (astro.config.mjs sidebar の label と揃える)。
//        sub-repo が docs/index.md を持っていればそちらが優先 (override)。
// 2026-05-11: docs IA 再設計により、helper / studio / firmware / unity-sdk の
// docs は devtools-site/docs/<short>/ に物理移動し、fetch 不要となった。
// contracts のみ「タグごとに freeze される規範的仕様」として fetch を維持する。
// 詳細: docs/instructions-docs-ia-restructure-202605111600.md (workspace)
// short は TARGET_PARENT 配下のサブパス。Contracts (仕様) は Concepts セクションに
// 取り込む方針 (Reference トップレベルを廃止)。
const SOURCES = [
  { short: 'concepts/contracts', label: 'Contracts (仕様)', repo: 'hapbeat-contracts', url: 'https://github.com/Hapbeat/hapbeat-contracts.git' },
];

// 各リポジトリの CHANGELOG.md を docs ポータルに公開する設定。
// destPath: TARGET_PARENT 配下の相対パス (URL に対応)
// title:    Starlight ページタイトル (frontmatter に注入)
// 各 CHANGELOG.md は Keep a Changelog 形式で管理。
// CI / ローカルともに取得できなかった場合は静かにスキップ（ビルド失敗にしない）。
const CHANGELOG_SOURCES = [
  { repo: 'hapbeat-studio',               destPath: 'tools/studio/changelog.md',                  title: '変更履歴 — Hapbeat Studio'         },
  { repo: 'hapbeat-helper',               destPath: 'tools/helper/changelog.md',                   title: '変更履歴 — hapbeat-helper'         },
  { repo: 'hapbeat-unity-sdk',            destPath: 'sdk-integration/unity-sdk/changelog.md',      title: '変更履歴 — Hapbeat Unity SDK'      },
  { repo: 'hapbeat-python-sdk',           destPath: 'sdk-integration/python-sdk/changelog.md',     title: '変更履歴 — Hapbeat Python SDK'     },
  { repo: 'hapbeat-js-sdk',               destPath: 'sdk-integration/js-sdk/changelog.md',         title: '変更履歴 — Hapbeat JavaScript SDK' },
  { repo: 'hapbeat-arduino',              destPath: 'sdk-integration/arduino-sdk/changelog.md',    title: '変更履歴 — Hapbeat Arduino'        },
  { repo: 'hapbeat-device-firmware',      destPath: 'hardware/device-firmware/changelog.md',       title: '変更履歴 — デバイスファームウェア'  },
  { repo: 'hapbeat-transmitter-firmware', destPath: 'hardware/transmitter-firmware/changelog.md',  title: '変更履歴 — 送信機ファームウェア'   },
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

async function resolveSiblingDocs(repo) {
  // Unity package repos use docs~/ to exclude from Unity's asset import.
  // Non-Unity repos use docs/. Try docs~/ first, fall back to docs/.
  // repos-<category>/ を横断して repo を探す (例: repos-core/hapbeat-contracts/docs)。
  for (const category of REPO_CATEGORY_DIRS) {
    for (const dir of ['docs~', 'docs']) {
      const p = path.join(WORKSPACE_ROOT, category, repo, dir);
      if (await isDir(p)) return p;
    }
  }
  return null;
}

async function fetchFromSibling(src) {
  const siblingDocs = await resolveSiblingDocs(src.repo);
  if (!siblingDocs) return false;
  const dest = path.join(TARGET_PARENT, src.short);
  await cp(siblingDocs, dest, { recursive: true });
  const dirName = path.basename(siblingDocs);
  console.log(`  ok: sibling ${src.repo}/${dirName} → docs/${src.short}/`);
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
  // Unity package repos use docs~/, others use docs/.
  let gitDocs = path.join(tmpRepo, 'docs~');
  if (!(await isDir(gitDocs))) gitDocs = path.join(tmpRepo, 'docs');
  if (!(await isDir(gitDocs))) {
    console.warn(`  skip: no docs~/ or docs/ in ${src.repo}`);
    return false;
  }
  const dest = path.join(TARGET_PARENT, src.short);
  await cp(gitDocs, dest, { recursive: true });
  const dirName = path.basename(gitDocs);
  console.log(`  ok: clone ${src.repo}/${dirName} → docs/${src.short}/`);
  return true;
}

// ファイル名の数字 prefix (`01-`, `02-` …) を sidebar.order に変換しつつ
// dest 上の filename からは prefix を剥がす。これにより:
//   - IDE でアルファベット順 = 表示順になる (`01-architecture.md` 等)
//   - URL は prefix なしの綺麗なまま (`/docs/concepts/architecture/`)
//   - frontmatter に sidebar.order を手で書く必要なし
// 既に sidebar.order が frontmatter で明示されていればそちらを優先 (上書きしない)。
// 対応パターン: `^(\d+)[-_](.+)\.mdx?$` (例: `01-foo.md` / `005_bar.mdx`)
// rename 後の dest path を返す。
async function stripOrderPrefix(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const m = base.match(/^(\d+)[-_](.+\.(?:md|mdx))$/);
  if (!m) return { finalPath: filePath, orderFromPrefix: null };
  const orderFromPrefix = parseInt(m[1], 10);
  const newPath = path.join(dir, m[2]);
  // 衝突 (prefix なし同名ファイルが既存) があれば prefix 付きを優先 (上書き)
  if (existsSync(newPath) && newPath !== filePath) {
    await rm(newPath, { force: true });
  }
  await rename(filePath, newPath);
  return { finalPath: newPath, orderFromPrefix };
}

// ========================================================================
// Changelog 取得ロジック
// ========================================================================

// 1 repo の CHANGELOG.md を取得して文字列で返す。取得できなければ null。
// ローカル (sibling) → CI (git clone) の順に試みる。
async function fetchOneChangelog(repo, useGit) {
  // 1. sibling lookup (ローカル dev)
  for (const category of REPO_CATEGORY_DIRS) {
    const p = path.join(WORKSPACE_ROOT, category, repo, 'CHANGELOG.md');
    if (existsSync(p)) {
      return { content: await readFile(p, 'utf8'), from: 'sibling' };
    }
  }

  if (!useGit) return null; // ローカル non-git: sibling 無ければスキップ

  // 2. sparse git clone (CI / git mode)
  const token = process.env.DOCS_FETCH_TOKEN;
  let cloneUrl = `https://github.com/Hapbeat/${repo}.git`;
  if (token) cloneUrl = cloneUrl.replace('https://github.com/', `https://x-access-token:${token}@github.com/`);
  const tmpDir = path.join(TMP_DIR, `changelog-${repo}`);
  if (existsSync(tmpDir)) await rm(tmpDir, { recursive: true, force: true });
  try {
    // sparse checkout で CHANGELOG.md のみ取得（大規模 repo でも高速）
    run(`git clone --depth=1 --filter=blob:none --no-checkout "${cloneUrl}" "${tmpDir}"`, { stdio: 'pipe' });
    run(`git -C "${tmpDir}" sparse-checkout set CHANGELOG.md`, { stdio: 'pipe' });
    run(`git -C "${tmpDir}" checkout`, { stdio: 'pipe' });
    const f = path.join(tmpDir, 'CHANGELOG.md');
    if (!existsSync(f)) return null;
    return { content: await readFile(f, 'utf8'), from: 'git' };
  } catch {
    return null; // 静かにスキップ（private repo / token 未設定等を想定）
  } finally {
    try { await rm(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

// 全 CHANGELOG_SOURCES を処理して TARGET_PARENT に配置する。
// 取得失敗はスキップ。CI でも失敗時は build failure にしない（docs と異なる仕様）。
async function fetchChangelogs(useGit) {
  const fetched = [];
  for (const src of CHANGELOG_SOURCES) {
    const result = await fetchOneChangelog(src.repo, useGit);
    if (!result) {
      console.log(`  skip (changelog): ${src.repo}/CHANGELOG.md not found`);
      continue;
    }
    // 先頭の BOM / CRLF を正規化
    const raw = result.content.replace(/^﻿/, '').replace(/\r\n/g, '\n');
    // 先頭 H1 行 ("# Changelog" 等) を strip し、frontmatter のタイトルで代替
    const bodyWithoutH1 = raw.replace(/^#[^\n]*\n+/, '');
    // Starlight frontmatter を注入
    const page = [
      '---',
      `title: "${src.title}"`,
      'sidebar:',
      '  order: 99',
      '  label: 変更履歴',
      '---',
      '',
      bodyWithoutH1.trimStart(),
    ].join('\n');
    const dest = path.join(TARGET_PARENT, src.destPath);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, page, 'utf8');
    fetched.push(`docs/${src.destPath} (${result.from})`);
  }
  if (fetched.length > 0) {
    console.log(`  ok (changelogs): ${fetched.join(', ')}`);
  }
}

// ========================================================================
// frontmatter 文字列内の sidebar.order を set / inject する。既存の sidebar:
// ブロックがあれば order だけ書き換え、他のサブキー (label / hidden 等) は温存。
function setSidebarOrder(frontmatter, order) {
  const lines = frontmatter.split('\n');
  const sidebarIdx = lines.findIndex((l) => /^sidebar\s*:/.test(l));
  if (sidebarIdx === -1) {
    // sidebar ブロックがない → 末尾に新規追加
    const block = `sidebar:\n  order: ${order}`;
    return frontmatter ? `${frontmatter}\n${block}` : block;
  }
  // sidebar ブロックの範囲を特定 (次の非インデント行 or 終端まで)
  let endIdx = sidebarIdx + 1;
  while (endIdx < lines.length && /^  \S|^\s*$/.test(lines[endIdx])) endIdx++;
  // ブロック内に order: 行があるか探す
  let orderIdx = -1;
  for (let i = sidebarIdx + 1; i < endIdx; i++) {
    if (/^  order\s*:/.test(lines[i])) { orderIdx = i; break; }
  }
  if (orderIdx >= 0) {
    lines[orderIdx] = `  order: ${order}`;
  } else {
    lines.splice(sidebarIdx + 1, 0, `  order: ${order}`);
  }
  return lines.join('\n');
}

// Starlight required な frontmatter を取り込んだ .md に保証する。
//  (1) title:
//      - 既に title があれば触らない
//      - 無ければ先頭 H1 or ファイル名から派生して挿入
//  (2) sidebar.order:
//      - orderFromPrefix が与えられた場合 (filename が `01-` 等の prefix 付き)、
//        **既存 frontmatter の order を上書き** する (prefix が常に勝つ)
//      - prefix がなく filename が getting-started の場合は sidebar.order: 1 を補完
//      - それ以外は frontmatter の sidebar.order をそのまま尊重
async function normalizeMarkdownFrontmatter(filePath, { orderFromPrefix = null } = {}) {
  const rawFile = await readFile(filePath, 'utf8');
  const raw = rawFile.replace(/\r\n/g, '\n').replace(/^﻿/, '');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  let frontmatter = fmMatch ? fmMatch[1] : '';
  const body = fmMatch ? raw.slice(fmMatch[0].length) : raw;

  const hasTitle = /^title\s*:/m.test(frontmatter);
  const hasSidebar = /^sidebar\s*:/m.test(frontmatter);
  const baseName = path.basename(filePath, path.extname(filePath));
  const isGettingStarted = baseName === 'getting-started';

  let changed = false;
  let newFm = frontmatter;

  // (1) title
  if (!hasTitle) {
    const h1 = body.match(/^#\s+(.+)$/m);
    const fallbackTitle = h1
      ? h1[1].trim()
      : baseName
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
    const escaped = fallbackTitle.replace(/"/g, '\\"');
    newFm = newFm ? `${newFm}\ntitle: "${escaped}"` : `title: "${escaped}"`;
    changed = true;
  }

  // (2) sidebar.order — prefix が常に勝つ
  if (orderFromPrefix !== null) {
    newFm = setSidebarOrder(newFm, orderFromPrefix);
    changed = true;
  } else if (isGettingStarted && !hasSidebar) {
    newFm = setSidebarOrder(newFm, 1);
    changed = true;
  }

  if (!changed) return;
  await writeFile(filePath, `---\n${newFm}\n---\n${body}`);
}

// frontmatter から `draft: true` を検出する。dev / build 両方で隠したいページに
// 付ける運用。検出されたファイルは TARGET_PARENT から削除されるため、Astro の
// content loader からも完全に見えなくなる (= 「push 後と同じ見た目で local 確認」)。
async function isDraftMarkdown(filePath) {
  try {
    const raw = await readFile(filePath, 'utf8');
    const fm = raw.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---/);
    if (!fm) return false;
    return /^draft\s*:\s*true\s*$/m.test(fm[1]);
  } catch {
    return false;
  }
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
      // 数字 prefix (`01-foo.md` 等) があれば剥がして sidebar.order に変換
      const { finalPath, orderFromPrefix } = await stripOrderPrefix(p);
      // draft: true は dev / build どちらでも非公開扱い → 削除して loader から隠す
      if (await isDraftMarkdown(finalPath)) {
        await rm(finalPath, { force: true });
        console.log(`  skip (draft): ${path.relative(TARGET_PARENT, finalPath)}`);
        continue;
      }
      await normalizeMarkdownFrontmatter(finalPath, { orderFromPrefix });
    }
  }
}

async function main() {
  console.log('[fetch-docs] aggregating docs from sibling repos…');
  // TARGET_PARENT を完全リセット (cp recursive は既存ファイルを削除しないため、
  // 旧 SOURCES 由来の stale な index.md 等が残留する事故を防ぐ)。
  await resetDir(TARGET_PARENT);
  await mkdir(TMP_DIR, { recursive: true });

  // devtools-site 自身の docs/ を locale ごとに content collection へ取り込む。
  //   docs/ja/ → src/content/docs/docs/        (root locale = 日本語, URL /docs/...)
  //   docs/en/ → src/content/docs/en/docs/     (en locale, URL /en/docs/...)
  //   docs/assets/ は locale 中立で共有 (markdown は @assets/ alias で参照、複製しない)
  // 未訳ページは Starlight の locale fallback で root (JA) コンテンツが表示される。
  const jaDocs = path.join(ROOT, 'docs', 'ja');
  if (await isDir(jaDocs)) {
    await cp(jaDocs, TARGET_PARENT, { recursive: true });
    await walkAndNormalize(TARGET_PARENT);
    console.log('  ok: docs/ja/ → docs/ (root locale, JA)');
    // 方針 (2026-05-24 改定): セクション URL の auto-gen index.md は生成しない。
    //   /docs/<section>/ URL は 404 になるが、サイドバーのグループラベルは
    //   toggle のみで navigation しないので UX 上の問題は無い。
  }

  const enDocs = path.join(ROOT, 'docs', 'en');
  if (await isDir(enDocs)) {
    await resetDir(EN_TARGET);  // en/docs/ のみ wipe (en/index.mdx 等の手書き top-level は温存)
    await cp(enDocs, EN_TARGET, { recursive: true });
    await walkAndNormalize(EN_TARGET);
    console.log('  ok: docs/en/ → en/docs/ (EN locale)');
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
    // (auto-gen index.md は無効化。/docs/<section>/ は 404 で OK の方針)
  }

  // 各リポジトリの CHANGELOG.md を取得して changelog ページを生成する。
  // SOURCES (contracts) と同じ useGit フラグを参照。
  // 取得失敗はスキップするため CI の失敗判定には影響しない。
  console.log('- changelogs');
  await fetchChangelogs(useGit);

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
    // 数字 prefix を剥がして sidebar.order に変換
    const { finalPath, orderFromPrefix } = await stripOrderPrefix(destFile);
    // draft: true なら HMR でも消す。frontmatter から draft 行を消すと再 sync で
    // 復活する (cp で再コピー → ここで draft 判定が false → normalize 経由で残る)
    if (await isDraftMarkdown(finalPath)) {
      await rm(finalPath, { force: true });
      console.log(`  skip (draft): ${path.relative(TARGET_PARENT, finalPath)}`);
      return;
    }
    await normalizeMarkdownFrontmatter(finalPath, { orderFromPrefix });
  }
}

async function startWatch() {
  console.log('[fetch-docs] watch mode — waiting for changes (sibling docs/ / local docs/)');

  for (const src of SOURCES) {
    const watchDir = await resolveSiblingDocs(src.repo);
    if (!watchDir || !existsSync(watchDir)) continue;
    const destDir = path.join(TARGET_PARENT, src.short);
    chokidar
      .watch(watchDir, { ignoreInitial: true, ignored: /(^|[\/\\])\.git/ })
      .on('all', async (event, filePath) => {
        try {
          await syncOneFile(filePath, watchDir, destDir);
          console.log(`[fetch-docs] ${event}: ${path.relative(WORKSPACE_ROOT, filePath)}`);
        } catch (e) {
          console.warn(`[fetch-docs] sync error: ${e.message}`);
        }
      });
    console.log(`  watching: ${path.relative(WORKSPACE_ROOT, watchDir)}/`);
  }

  // locale ごとに監視: docs/ja/ → TARGET_PARENT, docs/en/ → EN_TARGET
  for (const [srcRel, destBase, label] of [
    ['docs/ja', TARGET_PARENT, 'docs/ja/ (JA)'],
    ['docs/en', EN_TARGET, 'docs/en/ (EN)'],
  ]) {
    const srcDir = path.join(ROOT, srcRel);
    if (!existsSync(srcDir)) continue;
    chokidar
      .watch(srcDir, { ignoreInitial: true, ignored: /(^|[\/\\])\.git/ })
      .on('all', async (event, filePath) => {
        try {
          await syncOneFile(filePath, srcDir, destBase);
          console.log(`[fetch-docs] ${event}: ${path.relative(ROOT, filePath)}`);
        } catch (e) {
          console.warn(`[fetch-docs] sync error: ${e.message}`);
        }
      });
    console.log(`  watching: ${label}`);
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
