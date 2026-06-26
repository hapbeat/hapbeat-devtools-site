#!/usr/bin/env node
// i18n-sync.mjs — JA → EN ドキュメント同期の「検知エンジン」
//
// 翻訳そのものは行わない。翻訳は、このスクリプトの出力を受けた
// Claude Code skill `/i18n-sync` が担う（API キー不要、Claude 自身が訳す）。
//
// 仕組み:
//   docs/.i18n-state.json が各 EN ページ → 翻訳元 JA の git blob sha を記録する。
//   本スクリプトは各 JA ソースの「現在の作業ツリー内容」の blob sha
//   (`git hash-object`、clean フィルタ適用済みで ls-tree と整合) を記録値と
//   比較し、変化していれば「要再翻訳」と判定する。検知は sha 比較のみなので
//   全ページでも一瞬（LLM コストは変更ページにだけ発生）。コミット済み/未コミット
//   どちらの JA 変更も作業ツリー hash なので拾える。
//
// 使い方:
//   node scripts/i18n-sync.mjs              # 人間向けサマリ
//   node scripts/i18n-sync.mjs --json       # 機械可読（skill が parse）
//   node scripts/i18n-sync.mjs --mark <en-rel-path>   # 翻訳後に state を前進
//
// カテゴリ:
//   changed          : state 登録済み・JA が記録 sha から変化 → 差分追従で再翻訳
//   missing_en       : state 登録済みだが EN ファイルが無い        → 全訳
//   orphan_en        : state 登録済みだが JA ソースが消えた        → EN 削除を検討
//   unchanged        : state 登録済み・JA 不変                     → スキップ
//   baseline_missing : EN は在るが state 未登録（手訳セクション）  → baseline 設定待ち
//   untranslated     : JA が在り EN も state も無い               → 新規全訳

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATE_REL = 'docs/.i18n-state.json';
const STATE_PATH = path.join(ROOT, STATE_REL);
const JA_DIR_REL = 'docs/ja';

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

// 作業ツリーのファイル内容に対する blob sha（clean フィルタ適用 = ls-tree と同値）。
// ファイルが無ければ null。
function workingSha(relPath) {
  try {
    return git(['hash-object', '--', relPath]) || null;
  } catch {
    return null;
  }
}

const toPosix = (p) => p.split(path.sep).join('/');
const jaToEn = (rel) => rel.replace(/^docs\/ja\//, 'docs/en/');
const enToJa = (rel) => rel.replace(/^docs\/en\//, 'docs/ja/');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

function loadState() {
  if (!fs.existsSync(STATE_PATH)) {
    return { version: 1, note: '', pages: {} };
  }
  return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
}

function saveState(state) {
  const sortedPages = {};
  for (const k of Object.keys(state.pages).sort()) sortedPages[k] = state.pages[k];
  state.pages = sortedPages;
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');
}

function listJaPages() {
  const dir = path.join(ROOT, JA_DIR_REL);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { recursive: true })
    .map((p) => toPosix(p))
    .filter((p) => /\.mdx?$/.test(p))
    .map((p) => `${JA_DIR_REL}/${p}`);
}

function analyze() {
  const state = loadState();
  const out = {
    summary: {},
    changed: [],
    missing_en: [],
    orphan_en: [],
    unchanged: [],
    baseline_missing: [],
    untranslated: [],
  };
  const tracked = new Set();

  for (const [en, meta] of Object.entries(state.pages)) {
    const ja = meta.source || enToJa(en);
    tracked.add(ja);
    const cur = workingSha(ja);
    if (cur === null) {
      out.orphan_en.push({ en, ja, recorded_sha: meta.source_sha });
    } else if (!exists(en)) {
      out.missing_en.push({ en, ja, recorded_sha: meta.source_sha, current_sha: cur });
    } else if (cur !== meta.source_sha) {
      out.changed.push({ en, ja, old_sha: meta.source_sha, new_sha: cur });
    } else {
      out.unchanged.push(en);
    }
  }

  for (const ja of listJaPages()) {
    if (tracked.has(ja)) continue;
    const en = jaToEn(ja);
    const cur = workingSha(ja);
    if (exists(en)) out.baseline_missing.push({ en, ja, current_sha: cur });
    else out.untranslated.push({ en, ja, current_sha: cur });
  }

  out.summary = {
    changed: out.changed.length,
    missing_en: out.missing_en.length,
    orphan_en: out.orphan_en.length,
    unchanged: out.unchanged.length,
    baseline_missing: out.baseline_missing.length,
    untranslated: out.untranslated.length,
  };
  return out;
}

function mark(enRel) {
  enRel = toPosix(enRel);
  const state = loadState();
  const ja = state.pages[enRel]?.source || enToJa(enRel);
  const cur = workingSha(ja);
  if (cur === null) {
    console.error(`mark: JA source not found for ${enRel} (${ja})`);
    process.exit(1);
  }
  state.pages[enRel] = { source: ja, source_sha: cur, translated_at: new Date().toISOString() };
  saveState(state);
  console.log(`marked ${enRel} → ${ja}@${cur.slice(0, 10)}`);
}

// --- entry ---
const args = process.argv.slice(2);
if (args[0] === '--mark') {
  if (!args[1]) { console.error('usage: --mark <en-rel-path>'); process.exit(1); }
  mark(args[1]);
} else {
  const res = analyze();
  if (args.includes('--json')) {
    console.log(JSON.stringify(res, null, 2));
  } else {
    const s = res.summary;
    const actionable = s.changed + s.missing_en + s.untranslated + s.orphan_en;
    console.log(`i18n-sync — JA→EN 同期状況 (state: ${STATE_REL})\n`);
    console.log(`  changed          ${s.changed}\t要再翻訳（差分追従）`);
    console.log(`  missing_en       ${s.missing_en}\tEN ファイル欠落 → 全訳`);
    console.log(`  untranslated     ${s.untranslated}\tEN/state 共に無し → 新規全訳`);
    console.log(`  orphan_en        ${s.orphan_en}\tJA 消失 → EN 削除検討`);
    console.log(`  unchanged        ${s.unchanged}\tスキップ`);
    console.log(`  baseline_missing ${s.baseline_missing}\tEN 在るが state 未登録（手訳セクション）`);
    const show = (label, arr, fmt) => {
      if (!arr.length) return;
      console.log(`\n[${label}]`);
      for (const x of arr) console.log('  ' + fmt(x));
    };
    show('changed', res.changed, (x) => `${x.ja}  (${x.old_sha.slice(0, 8)} → ${x.new_sha.slice(0, 8)})`);
    show('missing_en', res.missing_en, (x) => x.ja);
    show('untranslated', res.untranslated, (x) => x.ja);
    show('orphan_en', res.orphan_en, (x) => `${x.en} (JA ${x.ja} 消失)`);
    console.log(`\n→ 要対応 ${actionable} 件 / 不変 ${s.unchanged} 件`);
    if (actionable === 0) console.log('✅ EN は JA に追従済み。翻訳不要（スキップ）。');
  }
}
