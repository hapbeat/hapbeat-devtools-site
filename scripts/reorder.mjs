#!/usr/bin/env node
// reorder.mjs
//
// docs/ 配下のページ順序をブラウザで drag&drop で並び替え、結果に従って
// ファイル名の数字 prefix (`01-foo.md`) を一括書き換えするローカルツール。
//
// 使い方:
//   npm run reorder    # localhost:7777 で起動 → ブラウザでアクセス
//
// 仕組み:
//   - GET /api/list : docs/ 配下の prefix 付き .md/.mdx を ディレクトリ毎に
//                     現在の順序で並べた JSON を返す
//   - POST /api/save: 受け取った新しい順序で git mv を実行
//                     (二段階 rename で衝突回避: tmp prefix → final prefix)
//
// 対象外:
//   - index.md / index.mdx (ディレクトリ landing)
//   - `_` で始まるディレクトリ / ファイル (_drafts/ 等)
//   - 数字 prefix が付いていないファイル

import http from 'node:http';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const PORT = 7777;

// ----- discovery ----------------------------------------------------------
function isHidden(name) {
  return name.startsWith('_') || name === 'assets' || name === '.git';
}

function extractTitle(filePath) {
  try {
    const raw = readFileSync(filePath, 'utf8');
    const fm = raw.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---/);
    if (!fm) return null;
    const tm = fm[1].match(/^title\s*:\s*"?([^"\n]+?)"?\s*$/m);
    return tm ? tm[1].trim() : null;
  } catch {
    return null;
  }
}

function readDirs(rootDir, result = {}) {
  const entries = readdirSync(rootDir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = path.join(rootDir, e.name);
    if (e.isDirectory()) {
      if (!isHidden(e.name)) readDirs(p, result);
      continue;
    }
    if (!/\.(md|mdx)$/i.test(e.name)) continue;
    if (e.name.startsWith('index.')) continue;
    const m = e.name.match(/^(\d+)[-_](.+\.(?:md|mdx))$/i);
    const prefix = m ? parseInt(m[1], 10) : null;
    const baseNoPrefix = m ? m[2] : e.name;
    if (prefix === null) continue; // 未 prefix ファイルは並び替え対象外
    files.push({
      filename: e.name,
      baseNoPrefix,
      prefix,
      title: extractTitle(p) || baseNoPrefix.replace(/\.(md|mdx)$/, ''),
    });
  }
  if (files.length) {
    files.sort((a, b) => a.prefix - b.prefix || a.filename.localeCompare(b.filename));
    const relDir = path.relative(DOCS, rootDir).replace(/\\/g, '/') || '.';
    result[relDir] = files;
  }
  return result;
}

// ----- rename -------------------------------------------------------------
function tryGitMv(absRoot, oldAbs, newAbs) {
  // git mv first (preserves history); fall back to native rename if not tracked.
  try {
    execSync(`git mv -f "${oldAbs}" "${newAbs}"`, { cwd: absRoot, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function renumberDir(dir, files) {
  const absDir = path.join(DOCS, dir);
  // 一段目: tmp 名にリネーム (collision 回避)
  for (let i = 0; i < files.length; i++) {
    const oldAbs = path.join(absDir, files[i].filename);
    const tmpAbs = path.join(absDir, `__reorder_tmp_${i}_${files[i].baseNoPrefix}`);
    if (!existsSync(oldAbs)) continue;
    if (!tryGitMv(ROOT, oldAbs, tmpAbs)) await rename(oldAbs, tmpAbs);
  }
  // 二段目: 最終名
  const renamed = [];
  for (let i = 0; i < files.length; i++) {
    const tmpAbs = path.join(absDir, `__reorder_tmp_${i}_${files[i].baseNoPrefix}`);
    const finalName = `${String(i + 1).padStart(2, '0')}-${files[i].baseNoPrefix}`;
    const finalAbs = path.join(absDir, finalName);
    if (!existsSync(tmpAbs)) continue;
    if (!tryGitMv(ROOT, tmpAbs, finalAbs)) await rename(tmpAbs, finalAbs);
    renamed.push({ from: files[i].filename, to: finalName });
  }
  return renamed;
}

// ----- HTML ---------------------------------------------------------------
const HTML = `<!doctype html><html lang="ja"><head>
<meta charset="utf-8"><title>Page Reorder</title>
<style>
  :root { color-scheme: dark; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", sans-serif;
         margin: 0; padding: 24px 32px 96px; background: #16181d; color: #e4e6eb;
         font-size: 14px; line-height: 1.5; }
  h1 { margin: 0 0 6px; font-size: 18px; font-weight: 600; }
  .lead { margin: 0 0 24px; color: #8b9099; font-size: 13px; }
  h2 { margin: 28px 0 8px; font-size: 11px; font-weight: 600; letter-spacing: .08em;
       color: #8b9099; text-transform: uppercase; }
  ul.list { list-style: none; padding: 0; margin: 0;
            border: 1px solid #2b2f37; border-radius: 6px; overflow: hidden; background: #1d2026; }
  li.item { display: flex; align-items: center; padding: 10px 14px;
            border-top: 1px solid #2b2f37; cursor: grab; user-select: none;
            transition: background .12s; }
  li.item:first-child { border-top: 0; }
  li.item:hover { background: #232830; }
  li.item.dragging { opacity: .35; }
  li.item.drag-before { box-shadow: inset 0 2px 0 0 #4a9eff; }
  li.item.drag-after  { box-shadow: inset 0 -2px 0 0 #4a9eff; }
  .grip { color: #4a4f59; margin-right: 12px; cursor: grab; }
  .idx { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px;
         color: #6b7280; min-width: 28px; text-align: right; margin-right: 14px; }
  .title { color: #e4e6eb; font-weight: 500; flex: 1; }
  .fname { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11px;
           color: #5b6370; margin-left: 16px; }
  .toolbar { position: fixed; left: 0; right: 0; bottom: 0; padding: 14px 32px;
             background: #16181d; border-top: 1px solid #2b2f37;
             display: flex; align-items: center; gap: 16px; }
  .status { color: #8b9099; font-size: 13px; flex: 1; }
  .status.dirty { color: #f0b04f; }
  .status.ok    { color: #5bcd8f; }
  .status.err   { color: #ff6b6b; }
  button { background: #4a9eff; color: white; border: 0; padding: 9px 20px;
           font-size: 14px; font-weight: 500; border-radius: 5px; cursor: pointer;
           transition: background .12s; }
  button:hover:not(:disabled) { background: #3a8eee; }
  button:disabled { background: #2b2f37; color: #5b6370; cursor: not-allowed; }
  button.secondary { background: transparent; color: #8b9099; border: 1px solid #2b2f37; }
  button.secondary:hover:not(:disabled) { background: #232830; color: #e4e6eb; }
</style>
</head><body>
<h1>📚 Page Reorder</h1>
<p class="lead">各セクションでページを drag&drop して並び替え → Save で git mv 実行。</p>
<div id="app">Loading…</div>
<div class="toolbar">
  <span id="status" class="status">読み込み中…</span>
  <button id="revert" class="secondary" disabled>Revert</button>
  <button id="save" disabled>Save</button>
</div>
<script>
let original = null, data = null;
const $ = (s) => document.querySelector(s);
const escapeHtml = (s) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
function setStatus(msg, cls) {
  const el = $('#status');
  el.textContent = msg;
  el.className = 'status' + (cls ? ' ' + cls : '');
}
function isDirty() {
  return JSON.stringify(data) !== JSON.stringify(original);
}
function refreshButtons() {
  const dirty = isDirty();
  $('#save').disabled = !dirty;
  $('#revert').disabled = !dirty;
  if (dirty) setStatus('未保存の変更あり', 'dirty');
  else setStatus('変更なし');
}
async function load() {
  setStatus('読み込み中…');
  const r = await fetch('/api/list');
  data = await r.json();
  original = JSON.parse(JSON.stringify(data));
  render();
  refreshButtons();
}
function render() {
  const root = $('#app');
  root.innerHTML = '';
  for (const dir of Object.keys(data).sort()) {
    const files = data[dir];
    const section = document.createElement('div');
    section.innerHTML = '<h2>' + escapeHtml(dir) + '</h2>';
    const ul = document.createElement('ul');
    ul.className = 'list';
    ul.dataset.dir = dir;
    files.forEach((f, i) => {
      const li = document.createElement('li');
      li.className = 'item';
      li.draggable = true;
      li.dataset.filename = f.filename;
      li.innerHTML =
        '<span class="grip">⋮⋮</span>' +
        '<span class="idx">' + String(i+1).padStart(2,'0') + '</span>' +
        '<span class="title">' + escapeHtml(f.title) + '</span>' +
        '<span class="fname">' + escapeHtml(f.filename) + '</span>';
      ul.appendChild(li);
    });
    bindDnD(ul);
    section.appendChild(ul);
    root.appendChild(section);
  }
}
function bindDnD(ul) {
  let dragEl = null;
  ul.addEventListener('dragstart', e => {
    const li = e.target.closest('.item'); if (!li) return;
    dragEl = li; li.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  ul.addEventListener('dragend', e => {
    const li = e.target.closest('.item'); if (!li) return;
    li.classList.remove('dragging');
    ul.querySelectorAll('.drag-before,.drag-after').forEach(el =>
      el.classList.remove('drag-before','drag-after'));
    dragEl = null;
  });
  ul.addEventListener('dragover', e => {
    e.preventDefault();
    const li = e.target.closest('.item');
    if (!li || li === dragEl) return;
    ul.querySelectorAll('.drag-before,.drag-after').forEach(el =>
      el.classList.remove('drag-before','drag-after'));
    const rect = li.getBoundingClientRect();
    li.classList.add((e.clientY - rect.top) > rect.height / 2 ? 'drag-after' : 'drag-before');
  });
  ul.addEventListener('drop', e => {
    e.preventDefault();
    const li = e.target.closest('.item');
    if (!li || !dragEl || li === dragEl) return;
    const rect = li.getBoundingClientRect();
    const after = (e.clientY - rect.top) > rect.height / 2;
    li.parentNode.insertBefore(dragEl, after ? li.nextSibling : li);
    li.classList.remove('drag-before','drag-after');
    syncDir(ul.dataset.dir);
  });
}
function syncDir(dir) {
  const ul = document.querySelector('ul[data-dir="' + CSS.escape(dir) + '"]');
  const lis = [...ul.querySelectorAll('.item')];
  const map = Object.fromEntries(data[dir].map(f => [f.filename, f]));
  data[dir] = lis.map((li, i) => {
    li.querySelector('.idx').textContent = String(i+1).padStart(2,'0');
    return map[li.dataset.filename];
  });
  refreshButtons();
}
$('#save').addEventListener('click', async () => {
  $('#save').disabled = $('#revert').disabled = true;
  setStatus('保存中…');
  try {
    const r = await fetch('/api/save', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify(data),
    });
    const j = await r.json();
    if (j.ok) {
      setStatus('保存完了 ✓ (' + j.renamed + ' files renamed)', 'ok');
      await load();
    } else {
      setStatus('エラー: ' + j.error, 'err');
      refreshButtons();
    }
  } catch (e) {
    setStatus('エラー: ' + e.message, 'err');
    refreshButtons();
  }
});
$('#revert').addEventListener('click', () => {
  data = JSON.parse(JSON.stringify(original));
  render();
  refreshButtons();
  setStatus('元に戻しました');
});
load();
</script>
</body></html>`;

// ----- server -------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(HTML);
      return;
    }
    if (req.method === 'GET' && req.url === '/api/list') {
      const data = readDirs(DOCS);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
      return;
    }
    if (req.method === 'POST' && req.url === '/api/save') {
      let body = '';
      for await (const chunk of req) body += chunk;
      const incoming = JSON.parse(body);
      let totalRenamed = 0;
      for (const [dir, files] of Object.entries(incoming)) {
        const renamed = await renumberDir(dir, files);
        totalRenamed += renamed.length;
        console.log(`  ${dir}: ${renamed.length} renames`);
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, renamed: totalRenamed }));
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: e.message }));
  }
});

server.listen(PORT, () => {
  console.log(`[reorder] running at http://localhost:${PORT}`);
  console.log(`[reorder] docs root: ${DOCS}`);
});
