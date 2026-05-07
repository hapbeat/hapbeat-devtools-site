#!/usr/bin/env node
// postbuild-fix-link-targets.mjs
//
// `dist/**/*.html` を走査し、<a href> の target/rel を以下のルールで揃える:
//   - 同一ドメイン (devtools.hapbeat.com) / 相対 path (`/`, `./`, `#`) → target=_blank を剥がす
//   - 別ドメイン or mailto:, tel: → target="_blank" rel="noopener noreferrer" を付与
//
// 背景:
//   Astro 6 + Starlight 0.38 では markdown.rehypePlugins が .mdx にしか効かず、
//   .md のオートリンクは未処理のまま。さらに別ドメインへの target=_blank が
//   どこかで自動付与されている。post-build HTML transform で全ページを揃える。

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const SITE_HOSTNAME = 'devtools.hapbeat.com';

function shouldNewTab(href) {
  if (!href) return false;
  if (href.startsWith('#') || href.startsWith('/')) return false;
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return true;
  try {
    return new URL(href).hostname !== SITE_HOSTNAME;
  } catch {
    return false;
  }
}

// <a ...> 開きタグだけを置換 (閉じ </a> は触らない)
const A_TAG_RE = /<a\b([^>]*)>/g;
const HREF_RE = /\bhref\s*=\s*"([^"]*)"|\bhref\s*=\s*'([^']*)'/;
const TARGET_RE = /\s+target\s*=\s*"_blank"|\s+target\s*=\s*'_blank'/;
const REL_NOOPENER_RE = /\s+rel\s*=\s*"[^"]*?(?:noopener|noreferrer)[^"]*?"/;
// rel に他の値 (e.g. 'next' for pagination) が含まれているとき迂闊に消すと壊れるので
// noopener / noreferrer のみが含まれる場合に限り削除する。

function transformAttrs(attrs, href) {
  let out = attrs;
  if (shouldNewTab(href)) {
    if (!TARGET_RE.test(out)) out += ' target="_blank"';
    // rel: noopener noreferrer を必ず含むようにする (既存があっても上書きしない)
    if (!/\brel\s*=/.test(out)) out += ' rel="noopener noreferrer"';
  } else {
    out = out.replace(TARGET_RE, '');
    // rel が "noopener" / "noopener noreferrer" などセキュリティ用途のみで構成されていたら
    // target=_blank と一緒に剥がす (他用途 rel と混ざっている場合は触らない)
    out = out.replace(/\s+rel\s*=\s*"\s*(?:noopener|noreferrer)(?:\s+(?:noopener|noreferrer))*\s*"/, '');
    out = out.replace(/\s+rel\s*=\s*'\s*(?:noopener|noreferrer)(?:\s+(?:noopener|noreferrer))*\s*'/, '');
  }
  return out;
}

async function processFile(file) {
  const html = await readFile(file, 'utf8');
  let mutated = false;
  const out = html.replace(A_TAG_RE, (match, attrs) => {
    const m = attrs.match(HREF_RE);
    if (!m) return match;
    const href = m[1] ?? m[2];
    const newAttrs = transformAttrs(attrs, href);
    if (newAttrs === attrs) return match;
    mutated = true;
    return `<a${newAttrs}>`;
  });
  if (mutated) {
    await writeFile(file, out);
    return true;
  }
  return false;
}

async function* walkHtml(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walkHtml(p);
    else if (entry.isFile() && entry.name.endsWith('.html')) yield p;
  }
}

async function main() {
  let total = 0, changed = 0;
  for await (const f of walkHtml(DIST)) {
    total++;
    if (await processFile(f)) changed++;
  }
  console.log(`[postbuild-fix-link-targets] processed ${total} files, mutated ${changed}`);
}

main().catch((e) => {
  console.error('[postbuild-fix-link-targets] error:', e);
  process.exit(1);
});
