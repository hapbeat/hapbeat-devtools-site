// Hapbeat ナレーション エディタ — 画面とファイル入出力・再生。計算は loudness.js / voice-files.js / engine.js。
import { integratedLoudness, playbackGain, normalizationGain, TARGET_LUFS } from './loudness.js';
import {
  DEMOS,
  SHARED_VOICE_PATH,
  DEFAULT_LINES_FORMAT,
  DEFAULT_VOICE_FORMAT,
  detectFormat,
  formatJson,
  parseJsonText,
  validateLines,
  effectiveVoice,
  lineOverrides,
  removedIds,
  synthesisKey,
  resolveStyleId,
} from './voice-files.js';
import { DEFAULT_ENGINE_URL, probeEngine, fetchSpeakers, synthesize, engineStartCommand, isLocalOrigin } from './engine.js';

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'hapbeat-narration-editor';
const DEFAULT_VOICE = { speaker: 'まお', style: 'ノーマル', speed: 1.0, volume: 0.85 };
const DEFAULT_SAMPLE_TEXT = 'こんにちは。目の前のティラノサウルスに、そっと手を伸ばしてみてください。';
const HAS_FS_ACCESS = typeof window.showDirectoryPicker === 'function';

// ── 状態 ─────────────────────────────────────────────────────────────────
const state = {
  engineUrl: DEFAULT_ENGINE_URL,
  engineState: 'idle',
  speakers: [],
  hubVolume: 50,
  sampleText: DEFAULT_SAMPLE_TEXT,
  activeDemo: DEMOS[0].key,
  root: null, // hapbeat-demos の FileSystemDirectoryHandle
  // 共有の声（voice.json）。data は書き戻すオブジェクト（キー順を保つ）、savedText は最後に読み書きした内容。
  voice: { status: 'unloaded', handle: null, format: DEFAULT_VOICE_FORMAT, data: { ...DEFAULT_VOICE }, savedText: null, baseline: '' },
  demos: Object.fromEntries(
    DEMOS.map((demo) => [demo.key, { demo, status: 'unloaded', handle: null, format: DEFAULT_LINES_FORMAT, data: null, savedText: null, originalIds: [] }]),
  ),
};

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (typeof saved.engineUrl === 'string' && saved.engineUrl) state.engineUrl = saved.engineUrl;
    if (Number.isFinite(saved.hubVolume)) state.hubVolume = Math.min(100, Math.max(0, Math.round(saved.hubVolume / 10) * 10));
    if (typeof saved.sampleText === 'string' && saved.sampleText) state.sampleText = saved.sampleText;
    if (DEMOS.some((demo) => demo.key === saved.activeDemo)) state.activeDemo = saved.activeDemo;
  } catch {
    /* 読めない保存領域は既定値のまま */
  }
}

function saveSettings() {
  try {
    const { engineUrl, hubVolume, sampleText, activeDemo } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ engineUrl, hubVolume, sampleText, activeDemo }));
  } catch {
    /* 保存できなくても動作は続ける */
  }
}

// ── 未保存の判定 ───────────────────────────────────────────────────────────
const voiceText = () => formatJson(state.voice.data, state.voice.format);
// 共有の声は voice.json が無い・未取得のときも、最初の値（baseline）から変えたら未保存とする。
const isVoiceDirty = () => voiceText() !== (state.voice.savedText ?? state.voice.baseline);
const demoText = (entry) => formatJson(entry.data, entry.format);
const isDemoDirty = (entry) => entry.data !== null && demoText(entry) !== entry.savedText;

function anyDirty() {
  return isVoiceDirty() || Object.values(state.demos).some(isDemoDirty);
}

// ── エンジン ───────────────────────────────────────────────────────────────
const ENGINE_LABELS = {
  idle: '未確認',
  checking: '確認中…',
  connected: 'つながっている',
  cors: 'CORS で拒否',
  down: '起動していない',
  error: 'エラー',
};

async function checkEngine() {
  setEngineState('checking');
  const result = await probeEngine(state.engineUrl);
  if (result.state === 'connected') {
    try {
      state.speakers = await fetchSpeakers(state.engineUrl);
    } catch (error) {
      setEngineState('error', String(error.message || error));
      return;
    }
    setEngineState('connected', `AivisSpeech Engine ${result.version}`);
  } else {
    setEngineState(result.state, result.detail);
  }
  renderVoicePanel();
}

function setEngineState(engineState, detail = '') {
  state.engineState = engineState;
  const pill = $('engineStatus');
  pill.dataset.state = engineState;
  pill.textContent = ENGINE_LABELS[engineState];
  pill.title = detail;
}

function renderSetup() {
  const origin = location.origin;
  $('startCommand').textContent = engineStartCommand(origin, state.engineUrl);
  $('setupLead').textContent = isLocalOrigin(origin)
    ? 'このページは localhost から開いているので、エンジンの既定の設定（localhost だけを許可）のままつながります。'
    : `エンジンは既定で localhost のページだけを許可します。このページ（${origin}）から使うには --allow_origin を付けて起動します。`;
}

// ── 再生 ─────────────────────────────────────────────────────────────────
let audioContext = null;
let currentSource = null;
let playToken = 0;
const synthCache = new Map(); // synthesisKey → Promise<{ buffer, lufs }>

function ensureAudioContext() {
  if (!audioContext) audioContext = new AudioContext();
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

/** 声を解決して合成（キャッシュ付き）。{ buffer, lufs } を返す。 */
function synthesizeLine(text, voice) {
  if (state.engineState !== 'connected') throw new Error('エンジンにつながっていません（「接続確認」を押してください）');
  const style = resolveStyleId(state.speakers, voice.speaker, voice.style);
  if (style.error) throw new Error(style.error);
  const key = synthesisKey(state.engineUrl, style.id, voice.speed, voice.volume, text);
  if (!synthCache.has(key)) {
    const job = (async () => {
      const wav = await synthesize(state.engineUrl, style.id, text.trim(), voice.speed, voice.volume);
      const buffer = await ensureAudioContext().decodeAudioData(wav);
      const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
      return { buffer, lufs: integratedLoudness(channels, buffer.sampleRate) };
    })();
    synthCache.set(key, job);
    job.catch(() => synthCache.delete(key));
  }
  return synthCache.get(key);
}

function stopPlayback() {
  playToken++;
  if (currentSource) {
    try {
      currentSource.stop();
    } catch {
      /* 既に止まっている */
    }
    currentSource = null;
  }
  document.querySelectorAll('.line[data-playing="true"]').forEach((row) => (row.dataset.playing = 'false'));
}

/** 正規化ゲイン × Hub 音量で鳴らし、終わるまで待つ。 */
function playBuffer({ buffer, lufs }, token) {
  return new Promise((resolve) => {
    if (token !== playToken) return resolve(false);
    const ctx = ensureAudioContext();
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = playbackGain(lufs, state.hubVolume);
    source.buffer = buffer;
    source.connect(gain).connect(ctx.destination);
    source.onended = () => {
      if (currentSource === source) currentSource = null;
      resolve(token === playToken);
    };
    currentSource = source;
    source.start();
  });
}

function describeMeasure({ buffer, lufs }) {
  if (!Number.isFinite(lufs)) return `${buffer.duration.toFixed(2)} 秒 / ラウドネスを測れません（無音または短すぎ）`;
  const db = 20 * Math.log10(normalizationGain(lufs));
  return `${buffer.duration.toFixed(2)} 秒 / ${lufs.toFixed(1)} LUFS → ${TARGET_LUFS} LUFS（${db >= 0 ? '+' : ''}${db.toFixed(1)} dB）× ${state.hubVolume}%`;
}

async function playSample() {
  stopPlayback();
  const token = playToken;
  const info = $('sampleInfo');
  info.textContent = '合成中…';
  try {
    const result = await synthesizeLine(state.sampleText, currentVoice());
    if (token !== playToken) return;
    info.textContent = describeMeasure(result);
    await playBuffer(result, token);
  } catch (error) {
    info.textContent = String(error.message || error);
  }
}

/** デモの行を from から順に再生する（single なら 1 行だけ）。 */
async function playLines(entry, from, single) {
  stopPlayback();
  const token = playToken;
  const lines = entry.data.lines;
  for (let i = from; i < (single ? from + 1 : lines.length); i++) {
    const row = document.querySelector(`.line[data-index="${i}"]`);
    const measure = row?.querySelector('.line__measure');
    if (row) row.dataset.playing = 'true';
    try {
      if (measure) measure.textContent = '合成中…';
      const line = lines[i];
      const result = await synthesizeLine(line.text, effectiveVoice(entry.data.voice, currentVoice(), line));
      if (token !== playToken) return;
      if (measure) measure.textContent = describeMeasure(result);
      const finished = await playBuffer(result, token);
      if (row) row.dataset.playing = 'false';
      if (!finished) return;
    } catch (error) {
      if (measure) measure.textContent = String(error.message || error);
      if (row) row.dataset.playing = 'false';
      return;
    }
  }
}

// ── 声のパネル ─────────────────────────────────────────────────────────────
const round2 = (value) => Math.round(value * 100) / 100;

function currentVoice() {
  return effectiveVoice(null, state.voice.data);
}

function setOptions(select, values, current, missingLabel) {
  const list = values.includes(current) || current === undefined ? values : [current, ...values];
  select.replaceChildren(
    ...list.map((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = values.includes(value) ? value : `${value}（${missingLabel}）`;
      return option;
    }),
  );
  select.value = current ?? '';
}

function renderVoicePanel() {
  const voice = currentVoice();
  const connected = state.engineState === 'connected';
  const missing = connected ? 'エンジンに無い' : 'エンジン未接続';
  setOptions($('speakerSelect'), state.speakers.map((s) => s.name), voice.speaker, missing);
  const speaker = state.speakers.find((s) => s.name === voice.speaker);
  setOptions($('styleSelect'), speaker ? speaker.styles.map((s) => s.name) : [], voice.style, missing);
  $('speedRange').value = String(voice.speed);
  $('speedValue').textContent = voice.speed.toFixed(2);
  $('volumeRange').value = String(voice.volume);
  $('volumeValue').textContent = voice.volume.toFixed(2);
  renderVoiceStatus();
}

function renderVoiceStatus() {
  const { status } = state.voice;
  const dirty = isVoiceDirty();
  $('voiceDirty').dataset.dirty = String(dirty);
  const labels = {
    unloaded: HAS_FS_ACCESS ? 'voice.json 未取得（フォルダを開いてください）' : 'voice.json 未取得',
    loaded: `${SHARED_VOICE_PATH} を読み込み済み`,
    missing: `${SHARED_VOICE_PATH} がありません（保存すると作ります）`,
    error: `${SHARED_VOICE_PATH} を読めません`,
  };
  $('voiceStatus').textContent = state.voice.message || labels[status];
  renderSaveSummary();
}

function updateVoice(key, value) {
  state.voice.data = { ...state.voice.data, [key]: value };
  state.voice.message = '';
  renderVoiceStatus();
  renderDemoPanel();
}

// ── デモのタブと台本 ───────────────────────────────────────────────────────
function renderTabs() {
  $('demoTabs').replaceChildren(
    ...DEMOS.map((demo) => {
      const entry = state.demos[demo.key];
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'tab';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(demo.key === state.activeDemo));
      const name = document.createElement('span');
      name.textContent = demo.title;
      const engine = document.createElement('span');
      engine.className = 'tab__engine';
      engine.textContent = demo.engine;
      const dot = document.createElement('span');
      dot.className = 'tab__dirty';
      dot.dataset.dirty = String(isDemoDirty(entry));
      dot.textContent = '●';
      dot.title = '未保存の変更';
      tab.append(name, engine, dot);
      tab.addEventListener('click', () => {
        state.activeDemo = demo.key;
        saveSettings();
        renderTabs();
        renderDemoPanel();
      });
      return tab;
    }),
  );
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label, className, onClick, ariaLabel) {
  const node = el('button', `btn ${className}`, label);
  node.type = 'button';
  if (ariaLabel) node.setAttribute('aria-label', ariaLabel);
  node.addEventListener('click', onClick);
  return node;
}

function renderDemoPanel() {
  const entry = state.demos[state.activeDemo];
  const { demo } = entry;
  const panel = $('demoPanel');
  const head = el('div', 'demo-head');
  const path = el('p', 'demo-path');
  path.append(el('code', '', demo.linesPath), el('span', 'demo-status', ` — ${demoStatusLabel(entry)}`));
  head.append(path);

  const actions = el('div', 'row');
  if (!HAS_FS_ACCESS) actions.append(button('ファイルを選んで読み込む', 'btn--mini', () => pickDemoFile(entry)));
  if (entry.data) {
    actions.append(
      button('▶ このデモを全部続けて再生', 'btn--mini btn--play-all', () => playLines(entry, 0, false)),
      button('■ 停止', 'btn--mini', stopPlayback),
      button('＋ 行を追加', 'btn--mini', () => addLine(entry, entry.data.lines.length)),
      button('このデモを保存', 'btn--mini btn--primary', () => saveDemo(entry)),
    );
  }
  head.append(actions);

  if (!entry.data) {
    panel.replaceChildren(head, el('p', 'empty', entry.status === 'unloaded' ? '未取得 — hapbeat-demos フォルダを開くと読み込みます。' : entry.message || '未取得'));
    return;
  }

  const fileVoice = entry.data.voice || {};
  const voiceNote = el('p', 'hint');
  voiceNote.textContent =
    `このファイルの voice: ${fileVoice.speaker ?? '—'} / ${fileVoice.style ?? '—'} / 話速 ${fileVoice.speed ?? '—'} / volume ${fileVoice.volume ?? '—'}` +
    ' → 共有の声（voice.json）で上書きされます。';
  const notice = el('p', 'notice');
  const list = el('ol', 'lines');
  entry.data.lines.forEach((line, index) => list.append(renderLine(entry, line, index)));
  panel.replaceChildren(head, voiceNote, notice, list);
  refreshValidation(entry);
}

/** 行の問題・id の注意・状態表示を、行を作り直さずに更新する（入力中のフォーカスを保つ）。 */
function refreshValidation(entry) {
  if (entry.demo.key !== state.activeDemo || !entry.data) return;
  const panel = $('demoPanel');
  const status = panel.querySelector('.demo-status');
  if (status) status.textContent = ` — ${demoStatusLabel(entry)}`;
  const removed = removedIds(entry.originalIds, entry.data.lines);
  const notice = panel.querySelector('.notice');
  notice.dataset.active = String(removed.length > 0);
  notice.textContent = removed.length
    ? `読み込み時から無くなった id: ${removed.join(', ')} — id は生成される音声のファイル名です。名前を変えると新しい名前で生成され、旧名の音声（Unreal の取り込み済みアセット等）が残ることがあります。デモのコードが id を参照していれば合わせて直してください。`
    : 'id は生成される音声のファイル名です。既存の id を変えると旧名の音声が残ることがあるので、変えるときはデモ側の参照も確認してください。';
  const problems = validateLines(entry.data.lines);
  panel.querySelectorAll('.line').forEach((row) => {
    const index = Number(row.dataset.index);
    const line = entry.data.lines[index];
    const overrides = lineOverrides(line);
    const problem = row.querySelector('.line__problem');
    problem.textContent = problems[index].length
      ? problems[index].join(' / ')
      : overrides.length
        ? `この行だけ声を指定: ${overrides.map((key) => `${key}=${line[key]}`).join(', ')}`
        : '';
    problem.dataset.kind = problems[index].length ? 'error' : 'info';
  });
}

function demoStatusLabel(entry) {
  const dirty = isDemoDirty(entry);
  switch (entry.status) {
    case 'loaded':
      return `${entry.data.lines.length} 行${dirty ? '・未保存の変更あり' : ''}`;
    case 'missing':
      return '未取得（フォルダにありません）';
    case 'error':
      return '読み込みエラー';
    default:
      return '未取得';
  }
}

function renderLine(entry, line, index) {
  const row = el('li', 'line');
  row.dataset.index = String(index);
  row.dataset.playing = 'false';

  const id = el('input', 'text line__id');
  id.type = 'text';
  id.spellcheck = false;
  id.value = line.id ?? '';
  id.setAttribute('aria-label', `${index + 1} 行目の id`);
  id.addEventListener('input', () => {
    line.id = id.value;
    onLinesEdited(entry, false);
  });

  const text = el('textarea', 'text line__text');
  text.rows = 2;
  text.value = line.text ?? '';
  text.setAttribute('aria-label', `${index + 1} 行目の文`);
  text.addEventListener('input', () => {
    line.text = text.value;
    onLinesEdited(entry, false);
  });

  const controls = el('div', 'line__controls');
  const last = entry.data.lines.length - 1;
  const up = button('↑', 'btn--icon btn--small', () => moveLine(entry, index, -1), '上へ');
  const down = button('↓', 'btn--icon btn--small', () => moveLine(entry, index, 1), '下へ');
  up.disabled = index === 0;
  down.disabled = index === last;
  controls.append(
    button('▶', 'btn--icon btn--small', () => playLines(entry, index, true), '試聴'),
    up,
    down,
    button('＋', 'btn--icon btn--small', () => addLine(entry, index + 1), '下に行を追加'),
    button('✕', 'btn--icon btn--small btn--danger', () => removeLine(entry, index), '削除'),
  );

  const meta = el('div', 'line__meta');
  const problem = el('span', 'line__problem');
  const measure = el('span', 'line__measure');
  meta.append(problem, measure);

  row.append(el('span', 'line__num', String(index + 1)), id, text, controls, meta);
  return row;
}

/** 入力中は再描画せず（フォーカスを保つ）、未保存表示だけ更新する。 */
function onLinesEdited(entry, rerender) {
  if (rerender) renderDemoPanel();
  else refreshValidation(entry);
  renderTabs();
  renderSaveSummary();
}

function addLine(entry, at) {
  entry.data.lines.splice(at, 0, { id: '', text: '' });
  onLinesEdited(entry, true);
  document.querySelector(`.line[data-index="${at}"] .line__id`)?.focus();
}

function removeLine(entry, index) {
  stopPlayback();
  entry.data.lines.splice(index, 1);
  onLinesEdited(entry, true);
}

function moveLine(entry, index, delta) {
  stopPlayback();
  const lines = entry.data.lines;
  const to = index + delta;
  if (to < 0 || to >= lines.length) return;
  [lines[index], lines[to]] = [lines[to], lines[index]];
  onLinesEdited(entry, true);
}

// ── ファイルの読み込み ─────────────────────────────────────────────────────
async function resolveFile(root, relPath) {
  const parts = relPath.split('/');
  let dir = root;
  for (const part of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(part);
  return dir.getFileHandle(parts[parts.length - 1]);
}

function applyDemoText(entry, text) {
  const data = parseJsonText(text);
  if (!Array.isArray(data.lines)) throw new Error('lines がありません');
  entry.data = data;
  entry.format = detectFormat(text);
  entry.savedText = text;
  entry.originalIds = data.lines.map((line) => line.id);
  entry.status = 'loaded';
  entry.message = '';
}

function applyVoiceText(text) {
  const data = parseJsonText(text);
  state.voice.data = data;
  state.voice.format = detectFormat(text);
  state.voice.savedText = text;
  state.voice.status = 'loaded';
  state.voice.message = '';
}

async function openFolder() {
  let root;
  try {
    root = await window.showDirectoryPicker({ id: 'hapbeat-demos', mode: 'readwrite' });
  } catch (error) {
    if (error?.name !== 'AbortError') $('folderStatus').textContent = `開けませんでした: ${error.message || error}`;
    return;
  }
  if (anyDirty() && !confirm('未保存の変更があります。破棄してフォルダを読み込み直しますか？')) return;
  state.root = root;
  let found = 0;
  try {
    state.voice.handle = await resolveFile(root, SHARED_VOICE_PATH);
    applyVoiceText(await (await state.voice.handle.getFile()).text());
    found++;
  } catch (error) {
    state.voice.handle = null;
    state.voice.savedText = null;
    state.voice.baseline = voiceText();
    state.voice.status = error?.name === 'NotFoundError' || error?.name === 'TypeMismatchError' ? 'missing' : 'error';
    state.voice.message = state.voice.status === 'error' ? `${SHARED_VOICE_PATH} を読めません: ${error.message || error}` : '';
  }
  for (const entry of Object.values(state.demos)) {
    try {
      entry.handle = await resolveFile(root, entry.demo.linesPath);
      applyDemoText(entry, await (await entry.handle.getFile()).text());
      found++;
    } catch (error) {
      entry.handle = null;
      entry.data = null;
      entry.savedText = null;
      entry.status = error?.name === 'NotFoundError' || error?.name === 'TypeMismatchError' ? 'missing' : 'error';
      entry.message = entry.status === 'error' ? `読めません: ${error.message || error}` : '未取得（フォルダにありません）';
    }
  }
  const demoCount = Object.values(state.demos).filter((entry) => entry.status === 'loaded').length;
  $('folderStatus').textContent = found
    ? `${root.name}（台本 ${demoCount}/${DEMOS.length}、voice.json ${state.voice.status === 'loaded' ? 'あり' : 'なし'}）`
    : `${root.name} — hapbeat-demos のフォルダではないようです（台本も voice.json も見つかりません）`;
  renderAll();
}

/** File System Access API が無いブラウザ: ファイルを 1 つ選んでもらう。 */
function pickFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', () => resolve(input.files?.[0] || null));
    input.click();
  });
}

async function pickDemoFile(entry) {
  const file = await pickFile();
  if (!file) return;
  try {
    applyDemoText(entry, await file.text());
  } catch (error) {
    entry.status = 'error';
    entry.message = `読めません: ${error.message || error}`;
  }
  renderAll();
}

async function pickVoiceFile() {
  const file = await pickFile();
  if (!file) return;
  try {
    applyVoiceText(await file.text());
  } catch (error) {
    state.voice.message = `${file.name} を読めません: ${error.message || error}`;
  }
  renderVoicePanel();
  renderDemoPanel();
}

// ── 保存 ─────────────────────────────────────────────────────────────────
async function writeFile(handle, text) {
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
}

function download(text, name) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 保存できたら true。問題のある行が残っていれば保存しない（generate-voice.py が止まるため）。 */
async function saveDemo(entry) {
  if (!entry.data) return false;
  const problems = validateLines(entry.data.lines);
  const bad = problems.findIndex((list) => list.length);
  if (bad >= 0) {
    setSaveStatus(`${entry.demo.title}: ${bad + 1} 行目を直してから保存してください（${problems[bad].join(' / ')}）`, 'error');
    return false;
  }
  const text = demoText(entry);
  try {
    if (entry.handle) {
      await writeFile(entry.handle, text);
      setSaveStatus(`${entry.demo.title} を保存しました（${entry.demo.linesPath}）`, 'ok');
    } else {
      download(text, 'voice-lines.json');
      setSaveStatus(`${entry.demo.title}: ダウンロードした voice-lines.json で hapbeat-demos/${entry.demo.linesPath} を置き換えてください`, 'ok');
    }
  } catch (error) {
    setSaveStatus(`${entry.demo.title} を保存できません: ${error.message || error}`, 'error');
    return false;
  }
  entry.savedText = text;
  entry.originalIds = entry.data.lines.map((line) => line.id);
  renderTabs();
  renderDemoPanel();
  renderSaveSummary();
  return true;
}

async function saveVoice() {
  const text = voiceText();
  try {
    if (state.root) {
      if (!state.voice.handle) {
        const dir = await (await state.root.getDirectoryHandle('tools')).getDirectoryHandle('tts');
        state.voice.handle = await dir.getFileHandle('voice.json', { create: true });
      }
      await writeFile(state.voice.handle, text);
      setSaveStatus(`共有の声を保存しました（${SHARED_VOICE_PATH}）。全デモの音声を生成し直してください`, 'ok');
    } else if (!HAS_FS_ACCESS) {
      download(text, 'voice.json');
      setSaveStatus(`ダウンロードした voice.json で hapbeat-demos/${SHARED_VOICE_PATH} を置き換えてください`, 'ok');
    } else {
      setSaveStatus('先に hapbeat-demos フォルダを開いてください', 'error');
      return false;
    }
  } catch (error) {
    setSaveStatus(`voice.json を保存できません: ${error.message || error}`, 'error');
    return false;
  }
  state.voice.savedText = text;
  state.voice.status = 'loaded';
  state.voice.message = '';
  renderVoiceStatus();
  return true;
}

async function saveAll() {
  const saved = [];
  if (isVoiceDirty()) {
    if (!(await saveVoice())) return;
    saved.push('voice.json');
  }
  for (const entry of Object.values(state.demos)) {
    if (!isDemoDirty(entry)) continue;
    if (!(await saveDemo(entry))) return;
    saved.push(entry.demo.title);
  }
  if (saved.length) setSaveStatus(`保存しました: ${saved.join('、')}。下の手順で音声を生成してください`, 'ok');
  else setSaveStatus('未保存の変更はありません', 'info');
}

function setSaveStatus(message, kind) {
  const line = $('saveStatus');
  line.textContent = message;
  line.dataset.kind = kind;
}

function renderSaveSummary() {
  const names = [];
  if (isVoiceDirty()) names.push('voice.json');
  for (const entry of Object.values(state.demos)) if (isDemoDirty(entry)) names.push(entry.demo.title);
  const summary = $('dirtySummary');
  summary.textContent = names.length ? `未保存の変更: ${names.join('、')}` : '未保存の変更はありません';
  summary.dataset.dirty = String(names.length > 0);
}

function renderAll() {
  renderVoicePanel();
  renderTabs();
  renderDemoPanel();
  renderSaveSummary();
}

// ── 初期化 ─────────────────────────────────────────────────────────────────
function bind() {
  const engineUrl = $('engineUrl');
  engineUrl.value = state.engineUrl;
  engineUrl.addEventListener('change', () => {
    state.engineUrl = engineUrl.value.trim() || DEFAULT_ENGINE_URL;
    engineUrl.value = state.engineUrl;
    saveSettings();
    renderSetup();
    checkEngine();
  });
  $('probeBtn').addEventListener('click', checkEngine);

  const openFolderBtn = $('openFolderBtn');
  if (HAS_FS_ACCESS) {
    openFolderBtn.addEventListener('click', openFolder);
  } else {
    openFolderBtn.textContent = 'voice.json を選んで読み込む';
    openFolderBtn.addEventListener('click', pickVoiceFile);
    $('folderStatus').textContent =
      'このブラウザはフォルダを直接読み書きできません。ファイルを 1 つずつ選んで読み込み、保存はダウンロードになります（Chrome / Edge なら直接保存できます）。';
  }

  const hub = $('hubVolume');
  hub.value = String(state.hubVolume);
  $('hubVolumeValue').textContent = `${state.hubVolume}%`;
  hub.addEventListener('input', () => {
    state.hubVolume = Number(hub.value);
    $('hubVolumeValue').textContent = `${state.hubVolume}%`;
    saveSettings();
  });

  $('speakerSelect').addEventListener('change', (event) => {
    const speaker = state.speakers.find((s) => s.name === event.target.value);
    const style = speaker?.styles.some((s) => s.name === currentVoice().style) ? currentVoice().style : speaker?.styles[0]?.name;
    state.voice.data = { ...state.voice.data, speaker: event.target.value, ...(style ? { style } : {}) };
    state.voice.message = '';
    renderVoicePanel();
    renderDemoPanel();
  });
  $('styleSelect').addEventListener('change', (event) => updateVoice('style', event.target.value));
  $('speedRange').addEventListener('input', (event) => {
    const value = round2(Number(event.target.value));
    $('speedValue').textContent = value.toFixed(2);
    updateVoice('speed', value);
  });
  $('volumeRange').addEventListener('input', (event) => {
    const value = round2(Number(event.target.value));
    $('volumeValue').textContent = value.toFixed(2);
    updateVoice('volume', value);
  });
  $('saveVoiceBtn').addEventListener('click', saveVoice);

  const sample = $('sampleText');
  sample.value = state.sampleText;
  sample.addEventListener('input', () => {
    state.sampleText = sample.value;
    saveSettings();
  });
  $('samplePlayBtn').addEventListener('click', playSample);
  $('stopBtn').addEventListener('click', stopPlayback);
  $('saveAllBtn').addEventListener('click', saveAll);

  document.querySelectorAll('[data-copy-target]').forEach((copy) => {
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText($(copy.dataset.copyTarget).textContent);
        copy.textContent = 'コピー済み';
      } catch {
        copy.textContent = '失敗';
      }
      setTimeout(() => (copy.textContent = 'コピー'), 1500);
    });
  });

  window.addEventListener('beforeunload', (event) => {
    if (!anyDirty()) return;
    event.preventDefault();
    event.returnValue = '';
  });
}

loadSettings();
state.voice.baseline = voiceText();
bind();
renderSetup();
renderAll();
checkEngine();
