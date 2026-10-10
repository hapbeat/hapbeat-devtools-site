// 台本（voice-lines.json）と共有の声（tools/tts/voice.json）の読み書き。DOM に依存しない純粋関数
// （tests/narration-editor.test.mjs）。正本の形式と生成手順は hapbeat-demos の tools/tts/README.md、
// generate-voice.py、generate-all-voices.ps1。

/** 声の設定ファイル（hapbeat-demos からの相対パス）。 */
export const SHARED_VOICE_PATH = 'tools/tts/voice.json';

/** デモの一覧。key / dir は generate-all-voices.ps1 の $demos と同じ。台本は <dir>/Voice/voice-lines.json。 */
export const DEMOS = [
  { key: 'trex', title: 'T-Rex Encounter', engine: 'Unreal', dir: 'unreal/trex-encounter' },
  { key: 'safetymill', title: 'Safety Mill VR', engine: 'Unreal', dir: 'unreal/safety-mill-vr' },
  { key: 'handdemo', title: 'Hand Demo', engine: 'Unity', dir: 'unity/handdemo' },
  { key: 'energyduel', title: 'Energy Duel', engine: 'Unity', dir: 'unity/energy-duel' },
].map((demo) => ({ ...demo, linesPath: `${demo.dir}/Voice/voice-lines.json` }));

/** generate-voice.py の ID_PATTERN と同じ（id = 生成される WAV のファイル名）。 */
export const ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;

/** 声のキー（generate-voice.py が行・voice・voice.json から読むもの）。 */
export const VOICE_KEYS = ['speaker', 'style', 'speed', 'volume'];
const FLOAT_KEYS = new Set(['speed', 'volume']);

/** 書式の検出（書き戻しで差分を最小にするため）。 */
export function detectFormat(text) {
  const bom = text.startsWith('﻿');
  const body = bom ? text.slice(1) : text;
  const eol = body.includes('\r\n') ? '\r\n' : '\n';
  const finalNewline = body.endsWith('\n');
  const trimmed = body.replace(/\r?\n$/, '');
  const singleLine = !trimmed.includes('\n');
  const indentMatch = /\n( +|\t+)\S/.exec(trimmed);
  return { bom, eol, finalNewline, singleLine, indent: indentMatch ? indentMatch[1] : ' ' };
}

export const DEFAULT_LINES_FORMAT = { bom: false, eol: '\n', finalNewline: true, singleLine: false, indent: ' ' };
export const DEFAULT_VOICE_FORMAT = { bom: false, eol: '\n', finalNewline: true, singleLine: true, indent: ' ' };

/** BOM を除いて JSON として読む（generate-voice.py は utf-8-sig で読む）。 */
export function parseJsonText(text) {
  return JSON.parse(text.startsWith('﻿') ? text.slice(1) : text);
}

/**
 * Python の json.dumps（separators の既定 ", " / ": "、ensure_ascii=False）と同じ 1 行表記。
 * speed / volume は float なので整数値でも "1.0" と書く（既存ファイルの表記に合わせる）。
 */
export function compactJson(value, key) {
  if (Array.isArray(value)) return `[${value.map((item) => compactJson(item)).join(', ')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).map(([k, v]) => `${JSON.stringify(k)}: ${compactJson(v, k)}`);
    return `{${entries.join(', ')}}`;
  }
  if (typeof value === 'number' && FLOAT_KEYS.has(key) && Number.isInteger(value)) return value.toFixed(1);
  return JSON.stringify(value);
}

/**
 * format に合わせて書き出す。複数行のときは最上位のキーを 1 行ずつ、配列（lines）は要素を 1 行ずつ並べる
 * （既存の voice-lines.json の形）。それ以外の値は 1 行表記。キー順は value のまま。
 */
export function formatJson(value, format) {
  const { bom, eol, finalNewline, singleLine, indent } = format;
  let body;
  if (singleLine || !value || typeof value !== 'object' || Array.isArray(value)) {
    body = compactJson(value);
  } else {
    const entries = Object.entries(value).map(([key, v]) => {
      const head = `${indent}${JSON.stringify(key)}: `;
      if (Array.isArray(v) && v.length) {
        const items = v.map((item) => `${indent}${indent}${compactJson(item)}`);
        return `${head}[${eol}${items.join(`,${eol}`)}${eol}${indent}]`;
      }
      return head + compactJson(v, key);
    });
    body = entries.length ? `{${eol}${entries.join(`,${eol}`)}${eol}}` : '{}';
  }
  return (bom ? '﻿' : '') + body + (finalNewline ? eol : '');
}

/** 行の問題（generate-voice.py の read_lines が止める条件と同じ）。index ごとの文言の配列を返す。 */
export function validateLines(lines) {
  const counts = new Map();
  for (const line of lines) counts.set(line.id, (counts.get(line.id) || 0) + 1);
  return lines.map((line) => {
    const problems = [];
    if (!ID_PATTERN.test(line.id || '')) problems.push('id は英小文字・数字・_ - の 64 文字以内（先頭は英小文字か数字）');
    else if (counts.get(line.id) > 1) problems.push('id が重複しています');
    if (!String(line.text || '').trim()) problems.push('文が空です');
    return problems;
  });
}

/**
 * 1 行に効く声。generate-voice.py と同じ優先順: 行の上書き > voice.json > ファイルの voice。
 * shared が null（voice.json が無い・読めない）ならファイルの voice だけ。
 */
export function effectiveVoice(fileVoice, sharedVoice, line = {}) {
  const voice = { ...(fileVoice || {}), ...(sharedVoice || {}) };
  return {
    speaker: line.speaker ?? voice.speaker,
    style: line.style ?? voice.style ?? 'ノーマル',
    speed: Number(line.speed ?? voice.speed ?? 1.0),
    volume: Number(line.volume ?? voice.volume ?? 1.0),
  };
}

/** 行が自分で上書きしている声のキー。 */
export function lineOverrides(line) {
  return VOICE_KEYS.filter((key) => line[key] !== undefined);
}

/** 読み込んだときから消えた id（名前を変えた・削除した行）。 */
export function removedIds(originalIds, lines) {
  const now = new Set(lines.map((line) => line.id));
  return originalIds.filter((id) => !now.has(id));
}

/** 合成結果のキャッシュキー（文と声ごと）。 */
export function synthesisKey(engineUrl, styleId, speed, volume, text) {
  return JSON.stringify([engineUrl, styleId, speed, volume, text.trim()]);
}

/** /speakers の結果から話者名・スタイル名でスタイル id を引く（generate-voice.py resolve_style と同じ）。 */
export function resolveStyleId(speakers, speaker, style) {
  const entry = (speakers || []).find((s) => s.name === speaker);
  if (!entry) return { error: `話者「${speaker}」がエンジンにありません` };
  const found = entry.styles.find((s) => s.name === style);
  if (!found) return { error: `話者「${speaker}」にスタイル「${style}」がありません` };
  return { id: found.id };
}
