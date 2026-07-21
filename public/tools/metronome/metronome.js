/**
 * Hapbeat Web メトロノーム — vanilla ESM。
 *
 * 音声: WebAudio のみ (lookahead スケジューラでサンプル精度に予約再生)。
 * 触覚: @hapbeat/sdk (ブラウザ transport → hapbeat-helper WS 7703 → UDP)。
 *   helper が居ない/切断されても音声のみで動き続ける (graceful fallback、
 *   catch した例外は状態行/警告行に出すだけで再スローしない)。
 *
 * デスクトップ版 tools/metronome (workspace, Python/Tk) の縮約移植。
 * 意味論は engine.py / sounds.py に合わせる:
 *   - ACCENT_GAIN=1.0 / NORMAL_GAIN=0.65 / SUBDIV_GAIN=0.4
 *   - haptic clip は「拍間隔 × 0.9」に切り詰めて送る/試聴する
 *     (デバイスは毎拍ストリームを差し替えるため、1拍分を超える長尺クリップは
 *     実機ではどのみち途中で打ち切られる — ローカル試聴もそれに合わせる)
 *   - タイミング補正 (bipolar offset): 正 = 触覚を先出しする。
 *     送信/ローカル試聴とも「拍時刻 − offset」を起点にする
 *   - Python 版は複数スレッド + 別カーソルで組んでいたが、ブラウザは
 *     シングルスレッドなので state はただの mutable object で良い
 *     (ロック不要 — UI ハンドラとスケジューラは同じイベントループ上で動く)。
 *     "同時に複数コンシューマが読む" 設計上の理由で python 側にあった
 *     Timeline の 3 独立カーソルは、ここでは 1 回の生成時点で
 *     audio 再生 / ローカル試聴 / 送信の 3 つを直接スケジュールすることで
 *     不要になっている (Web Audio 自体が「未来の時刻を予約」できるため)。
 */

import { connect } from '@hapbeat/sdk';

// ── 定数 ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'hapbeat-web-metronome';

const ACCENT_GAIN = 1.0;
const NORMAL_GAIN = 0.65;
const SUBDIV_GAIN = 0.4;

const SCHEDULER_TICK_MS = 25; // ルックアヘッド・スケジューラの起動間隔
const BASE_SCHEDULE_AHEAD_SEC = 0.3; // 触覚オフセットが無い時の基本先読み幅
const HIGHLIGHT_SEC = 0.12; // 拍ドットのフラッシュ表示時間 (engine.py と同じ)
const TAP_RESET_MS = 2000; // タップテンポの間隔リセット (2s 空いたらやり直し)
const TAP_MAX_SAMPLES = 5; // 直近5打 = 直近4区間の平均

const DEFAULT_STATE = {
  bpm: 120,
  beatsPerBar: 4,
  accentEnabled: true,
  subdiv: 1,
  audioVolume: 80, // 0-100 %
  hapticGain: 80, // 0-100 %
  hapticOffsetMs: 150, // -400..400, 0中心。既定 +150ms (仕様指定)
  audioSourceKind: 'builtin:click',
  hapticSourceKind: 'builtin:100hz',
  hapbeatSendEnabled: false,
  localHapticPreviewEnabled: false,
};

const state = { ...DEFAULT_STATE };

// ── DOM 参照 ────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

const el = {
  startStopBtn: $('startStopBtn'),
  startStopLabel: $('startStopLabel'),
  beatDots: $('beatDots'),
  bpmRange: $('bpmRange'),
  bpmNumber: $('bpmNumber'),
  bpmDown: $('bpmDown'),
  bpmUp: $('bpmUp'),
  tapTempoBtn: $('tapTempoBtn'),
  tapHint: $('tapHint'),
  beatsRange: $('beatsRange'),
  beatsNumber: $('beatsNumber'),
  accentToggle: $('accentToggle'),
  subdivSelect: $('subdivSelect'),
  audioSourceSelect: $('audioSourceSelect'),
  audioFileInput: $('audioFileInput'),
  audioFileName: $('audioFileName'),
  hapticSourceSelect: $('hapticSourceSelect'),
  hapticFileInput: $('hapticFileInput'),
  hapticFileName: $('hapticFileName'),
  audioVolumeRange: $('audioVolumeRange'),
  audioVolumeValue: $('audioVolumeValue'),
  hapticGainRange: $('hapticGainRange'),
  hapticGainValue: $('hapticGainValue'),
  hapbeatSendToggle: $('hapbeatSendToggle'),
  localHapticPreviewToggle: $('localHapticPreviewToggle'),
  offsetRange: $('offsetRange'),
  offsetValue: $('offsetValue'),
  statusLine: $('statusLine'),
  warningLine: $('warningLine'),
};

// ── 小道具 ──────────────────────────────────────────────────────────────

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

const warnings = new Map();
function setWarning(key, message) {
  warnings.set(key, message);
  el.warningLine.textContent = [...warnings.values()].join(' / ');
}
function clearWarning(key) {
  warnings.delete(key);
  el.warningLine.textContent = [...warnings.values()].join(' / ');
}
function setStatus(text) {
  el.statusLine.textContent = text;
}

// ── localStorage 永続化 ─────────────────────────────────────────────────
// 音源選択は builtin:/bundle: のみ永続化 (file: は揮発 — File オブジェクトは
// セッションを跨いで復元できないため)。

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      for (const key of Object.keys(DEFAULT_STATE)) {
        if (!(key in saved)) continue;
        if (key === 'audioSourceKind' || key === 'hapticSourceKind') {
          const v = saved[key];
          if (typeof v === 'string' && (v.startsWith('builtin:') || v.startsWith('bundle:'))) {
            state[key] = v;
          }
          continue;
        }
        state[key] = saved[key];
      }
    }
  } catch {
    /* 壊れた/読めない localStorage は既定値のまま続行 */
  }
  state.bpm = clamp(Math.round(Number(state.bpm) || 120), 30, 500);
  state.beatsPerBar = clamp(Math.round(Number(state.beatsPerBar) || 4), 1, 12);
  state.subdiv = clamp(Math.round(Number(state.subdiv) || 1), 1, 4);
  state.audioVolume = clamp(Number.isFinite(state.audioVolume) ? state.audioVolume : 80, 0, 100);
  state.hapticGain = clamp(Number.isFinite(state.hapticGain) ? state.hapticGain : 80, 0, 100);
  state.hapticOffsetMs = clamp(Number.isFinite(state.hapticOffsetMs) ? state.hapticOffsetMs : 150, -400, 400);
  state.accentEnabled = !!state.accentEnabled;
  state.hapbeatSendEnabled = !!state.hapbeatSendEnabled;
  state.localHapticPreviewEnabled = !!state.localHapticPreviewEnabled;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota 超過などは非致命 */
  }
}

// ── WebAudio 基盤 ───────────────────────────────────────────────────────

const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContextCtor();

function floatArrayToAudioBuffer(floatArr, sampleRate) {
  // AudioBuffer はどの AudioContext にも紐付かないデータ入れ物なので、
  // (再生に使う) audioCtx とは別の sampleRate (16kHz 等) でも直接構築できる。
  const buf = new AudioBuffer({ length: floatArr.length, numberOfChannels: 1, sampleRate });
  buf.copyToChannel(floatArr, 0);
  return buf;
}

function fadeInOut(sig, sampleRate, fadeMs = 3.0) {
  const n = sig.length;
  if (n === 0) return sig;
  const fadeN = Math.max(1, Math.min(Math.floor(n / 2), Math.floor((sampleRate * fadeMs) / 1000)));
  for (let i = 0; i < fadeN; i++) {
    const r = fadeN > 1 ? i / (fadeN - 1) : 1;
    sig[i] *= r;
    sig[n - 1 - i] *= r;
  }
  return sig;
}

function makeSine(freq, durMs, sampleRate, amp = 0.9) {
  const n = Math.max(1, Math.floor((sampleRate * durMs) / 1000));
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = amp * Math.sin((2 * Math.PI * freq * i) / sampleRate);
  return fadeInOut(out, sampleRate);
}

function floatTo16BitPcm(floatArr) {
  const out = new Uint8Array(floatArr.length * 2);
  const view = new DataView(out.buffer);
  for (let i = 0; i < floatArr.length; i++) {
    const s = Math.max(-1, Math.min(1, floatArr[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return out;
}

function toMonoFloat32(buf) {
  const n = buf.length;
  const chCount = buf.numberOfChannels;
  const out = new Float32Array(n);
  for (let c = 0; c < chCount; c++) {
    const data = buf.getChannelData(c);
    for (let i = 0; i < n; i++) out[i] += data[i] / chCount;
  }
  return out;
}

// device ring は約256msなので、1拍を超える尺のクリップは実機ではどのみち
// 次拍で差し替わる。ローカル試聴・送信とも「拍間隔 × 0.9」で切り詰めて、
// プレビューを実機挙動に近づける (engine.py の同等ロジックを踏襲)。
function truncatePcm16(pcm16, sampleRate, maxDurSec) {
  const maxBytes = Math.max(0, Math.floor(maxDurSec * sampleRate) * 2); // mono 16bit = 2 bytes/frame
  if (pcm16.length <= maxBytes) return pcm16;
  return pcm16.subarray(0, maxBytes);
}

async function fetchArrayBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${res.status}: ${url}`);
  return res.arrayBuffer();
}

// ── 音源解決 (音声用 / 触覚用) ───────────────────────────────────────────
// soundBank は「今選ばれている音源から作った再生可能データ」を保持する。
//   audio: { buffer: AudioBuffer(audioCtx.sampleRate) }
//   haptic: { pcm16: Uint8Array(16kHz LE), sampleRate: 16000, localBuffer: AudioBuffer }

const soundBank = { audio: null, haptic: null };

async function resolveAudioSource(kind) {
  if (kind === 'builtin:click') {
    return floatArrayToAudioBuffer(makeSine(2000, 12, audioCtx.sampleRate), audioCtx.sampleRate);
  }
  if (kind === 'builtin:beep') {
    return floatArrayToAudioBuffer(makeSine(1000, 40, audioCtx.sampleRate), audioCtx.sampleRate);
  }
  if (kind.startsWith('bundle:')) {
    const filename = kind.slice('bundle:'.length);
    const arrBuf = await fetchArrayBuffer(`./audio/${filename}`);
    return audioCtx.decodeAudioData(arrBuf.slice(0));
  }
  throw new Error(`unknown audio source kind: ${kind}`);
}

function buildHapticFromSine(freq, durMs) {
  const udpSig = makeSine(freq, durMs, 16000);
  const localSig = makeSine(freq, durMs, audioCtx.sampleRate);
  return {
    pcm16: floatTo16BitPcm(udpSig),
    sampleRate: 16000,
    localBuffer: floatArrayToAudioBuffer(localSig, audioCtx.sampleRate),
  };
}

async function buildHapticFromArrayBuffer(arrBuf) {
  // 送信用: 16kHz mono へデコード (decodeAudioData は対象コンテキストの
  // sampleRate へ自動リサンプルする — OfflineAudioContext は
  // startRendering() せず decodeAudioData だけ使う軽量な使い方)。
  const offline16k = new OfflineAudioContext(1, 1, 16000);
  const buf16k = await offline16k.decodeAudioData(arrBuf.slice(0));
  const pcm16 = floatTo16BitPcm(toMonoFloat32(buf16k));
  // ローカル試聴用: audioCtx のレートで別途デコード。
  const localBuffer = await audioCtx.decodeAudioData(arrBuf.slice(0));
  return { pcm16, sampleRate: 16000, localBuffer };
}

async function resolveHapticSource(kind) {
  if (kind === 'builtin:100hz') return buildHapticFromSine(100, 60);
  if (kind === 'builtin:40hz') return buildHapticFromSine(40, 80);
  if (kind.startsWith('bundle:')) {
    const filename = kind.slice('bundle:'.length);
    const arrBuf = await fetchArrayBuffer(`./audio/${filename}`);
    return buildHapticFromArrayBuffer(arrBuf);
  }
  throw new Error(`unknown haptic source kind: ${kind}`);
}

async function applyAudioSourceKind(kind) {
  el.audioSourceSelect.value = kind;
  try {
    soundBank.audio = { buffer: await resolveAudioSource(kind), kind };
    clearWarning('audio-source');
  } catch (e) {
    setWarning('audio-source', `音源の読み込みに失敗しました: ${e?.message ?? e}`);
  }
}

async function applyHapticSourceKind(kind) {
  el.hapticSourceSelect.value = kind;
  try {
    soundBank.haptic = { ...(await resolveHapticSource(kind)), kind };
    clearWarning('haptic-source');
  } catch (e) {
    setWarning('haptic-source', `触覚音源の読み込みに失敗しました: ${e?.message ?? e}`);
  }
}

// ── Hapbeat 送信 (helper 経由・graceful fallback) ───────────────────────

const hapbeatBridge = { hb: null, connected: false, connecting: false };

function onHapbeatLost() {
  hapbeatBridge.connected = false;
  hapbeatBridge.hb = null;
  setStatus('Hapbeat helper との接続が切れました（音声のみで再生します）');
}

async function connectHapbeat() {
  if (hapbeatBridge.connecting || hapbeatBridge.connected) return;
  hapbeatBridge.connecting = true;
  setStatus('Hapbeat helper に接続中…');
  try {
    const hb = await connect({ appName: 'Hapbeat Web Metronome', onConnectionLost: onHapbeatLost });
    hapbeatBridge.hb = hb;
    hapbeatBridge.connected = true;
    const devices = await hb.discover(1500).catch(() => []);
    setStatus(`Hapbeat helper 接続済み・デバイス ${devices.length} 台検出`);
    clearWarning('hapbeat-connect');
  } catch (e) {
    hapbeatBridge.hb = null;
    hapbeatBridge.connected = false;
    setStatus('Hapbeat helper に接続できません（音声のみで再生します）');
    setWarning('hapbeat-connect', `helper 接続エラー: ${e?.message ?? e}`);
  } finally {
    hapbeatBridge.connecting = false;
  }
}

function disconnectHapbeat() {
  if (hapbeatBridge.hb) {
    try {
      hapbeatBridge.hb.close();
    } catch {
      /* ignore */
    }
  }
  hapbeatBridge.hb = null;
  hapbeatBridge.connected = false;
  hapbeatBridge.connecting = false;
  clearWarning('hapbeat-connect');
  clearWarning('hapbeat-send');
  setStatus('Hapbeat 送信: オフ（音声のみ）');
}

// ── スケジューラ (lookahead) ────────────────────────────────────────────
// 標準的な Web Audio lookahead パターン: 25ms タイマーで
// audioCtx.currentTime 起点の少し先まで beat/subdiv を生成し、その場で
// AudioBufferSourceNode.start(t) を予約する (サンプル精度)。
// 触覚 (ローカル試聴 + hapbeat 送信) も同じ生成ループの中で、同じ論理拍
// 時刻を基準にスケジュールする。

let running = false;
let schedulerTimer = null;
let nextNoteTime = 0; // audioCtx 時間軸
let beatIndex = 0;
let perfOrigin = 0;
let ctxOrigin = 0;
const uiEvents = []; // { time(ctx秒), beatIndex, isAccent } — 拍ドット用
const pendingHapticTimeouts = new Set();
let rafId = null;

function ctxTimeToPerfTime(t) {
  return perfOrigin + (t - ctxOrigin) * 1000;
}

// 触覚オフセットが正 (触覚を先出し) の場合、その分だけ余分に先読みしないと
// 「クリック音より前に触覚を鳴らす/送る」ための予約が間に合わない
// (engine.py の horizon_sec = max(GEN_LOOKAHEAD_SEC, offset+0.15) と同じ考え方)。
function scheduleAheadSecFor(offsetMs) {
  return Math.max(BASE_SCHEDULE_AHEAD_SEC, Math.max(0, offsetMs) / 1000 + 0.15);
}

function scheduleAudioVoice(buffer, time, gain, durationSec) {
  if (!buffer || gain <= 0) return;
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  const g = audioCtx.createGain();
  g.gain.value = gain;
  src.connect(g).connect(audioCtx.destination);
  if (durationSec != null) {
    src.start(time, 0, Math.min(buffer.duration, Math.max(0, durationSec)));
  } else {
    src.start(time);
  }
}

function scheduleHaptic(beatTime, periodSec, offsetMs) {
  const wantLocal = state.localHapticPreviewEnabled;
  const wantSend = state.hapbeatSendEnabled;
  if (!wantLocal && !wantSend) return;
  const haptic = soundBank.haptic;
  if (!haptic) return;

  const offsetSec = offsetMs / 1000;
  const maxDurSec = Math.max(0, periodSec * 0.9);
  if (maxDurSec <= 0) return;

  if (wantLocal && haptic.localBuffer) {
    // 拍の sample 位置を offset ぶんずらして生成する python 版と同様、
    // タイムライン開始直後などで「今より前」になる場合は「今」に floor する。
    const spawnTime = Math.max(audioCtx.currentTime, beatTime - offsetSec);
    scheduleAudioVoice(haptic.localBuffer, spawnTime, clamp(state.hapticGain / 100, 0, 1), maxDurSec);
  }

  if (wantSend && hapbeatBridge.connected && hapbeatBridge.hb) {
    const bytes = truncatePcm16(haptic.pcm16, haptic.sampleRate, maxDurSec);
    if (bytes.length === 0) return;
    const sendPerfTime = ctxTimeToPerfTime(beatTime) - offsetMs;
    const delayMs = Math.max(0, sendPerfTime - performance.now());
    const gain = clamp(state.hapticGain / 100, 0, 1);
    const timeoutId = setTimeout(() => {
      pendingHapticTimeouts.delete(timeoutId);
      if (!running || !hapbeatBridge.connected || !hapbeatBridge.hb) return;
      try {
        hapbeatBridge.hb.streamPcm(bytes, { sampleRate: haptic.sampleRate, channels: 1, gain });
        clearWarning('hapbeat-send');
      } catch (e) {
        setWarning('hapbeat-send', `送信中にエラーが発生しました: ${e?.message ?? e}`);
      }
    }, delayMs);
    pendingHapticTimeouts.add(timeoutId);
  }
}

function schedulerTick() {
  const bpm = clamp(state.bpm, 30, 500);
  const beatsPerBar = clamp(Math.round(state.beatsPerBar), 1, 12);
  const subdiv = clamp(Math.round(state.subdiv), 1, 4);
  const offsetMs = clamp(state.hapticOffsetMs, -400, 400);
  const hapticActive = state.hapbeatSendEnabled || state.localHapticPreviewEnabled;
  const horizon = audioCtx.currentTime + scheduleAheadSecFor(hapticActive ? offsetMs : 0);

  while (nextNoteTime < horizon) {
    const periodSec = 60 / bpm;
    const isAccent = state.accentEnabled && beatIndex === 0;
    const beatTime = nextNoteTime;

    scheduleAudioVoice(
      soundBank.audio?.buffer,
      beatTime,
      (isAccent ? ACCENT_GAIN : NORMAL_GAIN) * (state.audioVolume / 100),
    );
    scheduleHaptic(beatTime, periodSec, offsetMs);
    uiEvents.push({ time: beatTime, beatIndex, isAccent });

    if (subdiv > 1) {
      for (let k = 1; k < subdiv; k++) {
        const subTime = nextNoteTime + (periodSec * k) / subdiv;
        scheduleAudioVoice(soundBank.audio?.buffer, subTime, SUBDIV_GAIN * (state.audioVolume / 100));
      }
    }

    beatIndex = (beatIndex + 1) % beatsPerBar;
    nextNoteTime += periodSec;
  }
}

function startEngine() {
  if (running) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  perfOrigin = performance.now();
  ctxOrigin = audioCtx.currentTime;
  nextNoteTime = audioCtx.currentTime + 0.05;
  beatIndex = 0;
  uiEvents.length = 0;
  running = true;
  schedulerTick();
  schedulerTimer = setInterval(schedulerTick, SCHEDULER_TICK_MS);
  rafId = requestAnimationFrame(uiTick);
  el.startStopBtn.setAttribute('aria-pressed', 'true');
  el.startStopLabel.textContent = '停止';
}

function stopEngine() {
  if (!running) return;
  running = false;
  clearInterval(schedulerTimer);
  schedulerTimer = null;
  for (const id of pendingHapticTimeouts) clearTimeout(id);
  pendingHapticTimeouts.clear();
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  setActiveDot(-1);
  el.startStopBtn.setAttribute('aria-pressed', 'false');
  el.startStopLabel.textContent = '開始';
  if (hapbeatBridge.connected && hapbeatBridge.hb) {
    try {
      hapbeatBridge.hb.stopAll();
    } catch {
      /* ignore */
    }
  }
}

function toggleStartStop() {
  if (running) stopEngine();
  else startEngine();
}

// ── 拍ドット UI ─────────────────────────────────────────────────────────

function rebuildBeatDots(count, accentEnabled) {
  el.beatDots.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('span');
    dot.className = 'beat-dot';
    dot.dataset.active = 'false';
    if (i === 0 && accentEnabled) dot.dataset.accent = 'true';
    el.beatDots.appendChild(dot);
  }
}

function setActiveDot(index) {
  const dots = el.beatDots.querySelectorAll('.beat-dot');
  dots.forEach((d, i) => {
    d.dataset.active = i === index ? 'true' : 'false';
  });
}

function uiTick() {
  if (!running) return;
  const nowCtx = audioCtx.currentTime;
  while (uiEvents.length > 1 && uiEvents[1].time <= nowCtx) uiEvents.shift();
  const current = uiEvents[0];
  if (current && current.time <= nowCtx && nowCtx - current.time <= HIGHLIGHT_SEC) {
    setActiveDot(current.beatIndex);
  } else {
    setActiveDot(-1);
  }
  rafId = requestAnimationFrame(uiTick);
}

// ── タップテンポ ────────────────────────────────────────────────────────

let tapTimes = [];
function handleTap() {
  const t = performance.now();
  if (tapTimes.length && t - tapTimes[tapTimes.length - 1] > TAP_RESET_MS) tapTimes = [];
  tapTimes.push(t);
  if (tapTimes.length > TAP_MAX_SAMPLES) tapTimes.shift();
  if (tapTimes.length >= 2) {
    const intervals = [];
    for (let i = 1; i < tapTimes.length; i++) intervals.push(tapTimes[i] - tapTimes[i - 1]);
    const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    setBpm(Math.round(60000 / avgMs));
  }
  el.tapHint.textContent = tapTimes.length >= 2 ? `タップ間隔から算出中… (${tapTimes.length - 1}区間)` : 'もう一度タップしてください';
}

// ── UI ⇄ state バインディング ────────────────────────────────────────────

function setBpm(bpm) {
  state.bpm = clamp(Math.round(bpm), 30, 500);
  el.bpmRange.value = String(state.bpm);
  el.bpmNumber.value = String(state.bpm);
  saveState();
}

function setBeatsPerBar(n) {
  state.beatsPerBar = clamp(Math.round(n), 1, 12);
  el.beatsRange.value = String(state.beatsPerBar);
  el.beatsNumber.value = String(state.beatsPerBar);
  rebuildBeatDots(state.beatsPerBar, state.accentEnabled);
  saveState();
}

function updateOffsetDisplay(ms) {
  el.offsetValue.textContent = ms > 0 ? `+${ms} ms` : ms < 0 ? `${ms} ms` : '0 ms';
}

function reflectStateToUi() {
  el.bpmRange.value = String(state.bpm);
  el.bpmNumber.value = String(state.bpm);
  el.beatsRange.value = String(state.beatsPerBar);
  el.beatsNumber.value = String(state.beatsPerBar);
  el.accentToggle.checked = state.accentEnabled;
  el.subdivSelect.value = String(state.subdiv);
  el.audioVolumeRange.value = String(state.audioVolume);
  el.audioVolumeValue.textContent = `${state.audioVolume}%`;
  el.hapticGainRange.value = String(state.hapticGain);
  el.hapticGainValue.textContent = `${state.hapticGain}%`;
  el.hapbeatSendToggle.checked = state.hapbeatSendEnabled;
  el.localHapticPreviewToggle.checked = state.localHapticPreviewEnabled;
  el.offsetRange.value = String(state.hapticOffsetMs);
  updateOffsetDisplay(state.hapticOffsetMs);
}

function wireUiEvents() {
  el.startStopBtn.addEventListener('click', toggleStartStop);

  el.bpmRange.addEventListener('input', () => setBpm(Number(el.bpmRange.value)));
  el.bpmNumber.addEventListener('change', () => setBpm(Number(el.bpmNumber.value)));
  el.bpmDown.addEventListener('click', () => setBpm(state.bpm - 1));
  el.bpmUp.addEventListener('click', () => setBpm(state.bpm + 1));

  el.tapTempoBtn.addEventListener('click', handleTap);

  el.beatsRange.addEventListener('input', () => setBeatsPerBar(Number(el.beatsRange.value)));
  el.beatsNumber.addEventListener('change', () => setBeatsPerBar(Number(el.beatsNumber.value)));

  el.accentToggle.addEventListener('change', () => {
    state.accentEnabled = el.accentToggle.checked;
    rebuildBeatDots(state.beatsPerBar, state.accentEnabled);
    saveState();
  });

  el.subdivSelect.addEventListener('change', () => {
    state.subdiv = clamp(Number(el.subdivSelect.value), 1, 4);
    saveState();
  });

  el.audioSourceSelect.addEventListener('change', async () => {
    const val = el.audioSourceSelect.value;
    if (val === 'file') {
      el.audioFileInput.click();
      return;
    }
    el.audioFileName.textContent = '';
    state.audioSourceKind = val;
    saveState();
    await applyAudioSourceKind(val);
  });
  el.audioFileInput.addEventListener('change', async () => {
    const file = el.audioFileInput.files?.[0];
    if (!file) return;
    try {
      const buf = await audioCtx.decodeAudioData((await file.arrayBuffer()).slice(0));
      soundBank.audio = { buffer: buf, kind: 'file' };
      el.audioFileName.textContent = file.name;
      clearWarning('audio-file');
    } catch (e) {
      setWarning('audio-file', `音声ファイルの読み込みに失敗しました: ${e?.message ?? e}`);
    }
  });

  el.hapticSourceSelect.addEventListener('change', async () => {
    const val = el.hapticSourceSelect.value;
    if (val === 'file') {
      el.hapticFileInput.click();
      return;
    }
    el.hapticFileName.textContent = '';
    state.hapticSourceKind = val;
    saveState();
    await applyHapticSourceKind(val);
  });
  el.hapticFileInput.addEventListener('change', async () => {
    const file = el.hapticFileInput.files?.[0];
    if (!file) return;
    try {
      const clip = await buildHapticFromArrayBuffer(await file.arrayBuffer());
      soundBank.haptic = { ...clip, kind: 'file' };
      el.hapticFileName.textContent = file.name;
      clearWarning('haptic-file');
    } catch (e) {
      setWarning('haptic-file', `触覚ファイルの読み込みに失敗しました: ${e?.message ?? e}`);
    }
  });

  el.audioVolumeRange.addEventListener('input', () => {
    state.audioVolume = Number(el.audioVolumeRange.value);
    el.audioVolumeValue.textContent = `${state.audioVolume}%`;
    saveState();
  });
  el.hapticGainRange.addEventListener('input', () => {
    state.hapticGain = Number(el.hapticGainRange.value);
    el.hapticGainValue.textContent = `${state.hapticGain}%`;
    saveState();
  });

  el.hapbeatSendToggle.addEventListener('change', () => {
    state.hapbeatSendEnabled = el.hapbeatSendToggle.checked;
    saveState();
    if (state.hapbeatSendEnabled) connectHapbeat();
    else disconnectHapbeat();
  });
  el.localHapticPreviewToggle.addEventListener('change', () => {
    state.localHapticPreviewEnabled = el.localHapticPreviewToggle.checked;
    saveState();
  });

  el.offsetRange.addEventListener('input', () => {
    state.hapticOffsetMs = clamp(Number(el.offsetRange.value), -400, 400);
    updateOffsetDisplay(state.hapticOffsetMs);
    saveState();
  });

  document.addEventListener('keydown', (e) => {
    const t = e.target;
    const isFormField = t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA');
    if (isFormField) return;
    if (e.code === 'Space') {
      e.preventDefault();
      toggleStartStop();
    } else if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      handleTap();
    }
  });
}

// ── 初期化 ──────────────────────────────────────────────────────────────

async function init() {
  loadState();
  reflectStateToUi();
  rebuildBeatDots(state.beatsPerBar, state.accentEnabled);
  wireUiEvents();
  await Promise.all([applyAudioSourceKind(state.audioSourceKind), applyHapticSourceKind(state.hapticSourceKind)]);
  if (state.hapbeatSendEnabled) connectHapbeat();
}

init();
