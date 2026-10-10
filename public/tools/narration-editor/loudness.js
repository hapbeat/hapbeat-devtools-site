// ITU-R BS.1770 の積分ラウドネス（LUFS）。DOM に依存しない純粋関数（tests/narration-editor.test.mjs）。
//
// - K 特性フィルタ: 高域シェルフ + 高域通過の 2 段 biquad。係数は BS.1770 の 48 kHz 値を
//   任意のサンプルレートへ双一次変換で求める（libebur128 と同じ設計式）。
// - 400 ms ブロック、75% 重なり（100 ms 刻み）。
// - 絶対ゲート -70 LUFS、相対ゲート（絶対ゲート通過ブロックの平均 -10 LU）。
// - true peak の制限はしない（試聴用。正本の生成は tools/tts/loudness.py が ffmpeg で行う）。

export const TARGET_LUFS = -20;
const ABSOLUTE_GATE_LUFS = -70;
const RELATIVE_GATE_LU = -10;
const BLOCK_SECONDS = 0.4;
const STEP_SECONDS = 0.1;

/** K 特性フィルタの係数（2 段の biquad、a0 = 1 に正規化済み）。 */
export function kWeightingCoefficients(sampleRate) {
  // 1 段目: 高域シェルフ（頭部の音響効果）
  let f0 = 1681.974450955533;
  const G = 3.999843853973347;
  let Q = 0.7071752369554196;
  let K = Math.tan((Math.PI * f0) / sampleRate);
  const Vh = Math.pow(10, G / 20);
  const Vb = Math.pow(Vh, 0.4996667741545416);
  let a0 = 1 + K / Q + K * K;
  const shelf = {
    b: [(Vh + (Vb * K) / Q + K * K) / a0, (2 * (K * K - Vh)) / a0, (Vh - (Vb * K) / Q + K * K) / a0],
    a: [1, (2 * (K * K - 1)) / a0, (1 - K / Q + K * K) / a0],
  };
  // 2 段目: 高域通過（RLB 特性）
  f0 = 38.13547087602444;
  Q = 0.5003270373238773;
  K = Math.tan((Math.PI * f0) / sampleRate);
  a0 = 1 + K / Q + K * K;
  const highpass = {
    b: [1, -2, 1],
    a: [1, (2 * (K * K - 1)) / a0, (1 - K / Q + K * K) / a0],
  };
  return [shelf, highpass];
}

function applyBiquad(input, { b, a }) {
  const out = new Float64Array(input.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < input.length; i++) {
    const x = input[i];
    const y = b[0] * x + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    out[i] = y;
  }
  return out;
}

const blockLoudness = (power) => -0.691 + 10 * Math.log10(power);

/**
 * 積分ラウドネス（LUFS）。channels はチャンネルごとのサンプル列（Float32Array 等、-1〜1）。
 * モノラル・ステレオ想定でチャンネル重みは全て 1.0。
 * 400 ms に満たない、または全ブロックがゲートで落ちる（無音）場合は -Infinity。
 */
export function integratedLoudness(channels, sampleRate) {
  if (!channels.length) return -Infinity;
  const length = channels[0].length;
  const blockSize = Math.round(BLOCK_SECONDS * sampleRate);
  const step = Math.round(STEP_SECONDS * sampleRate);
  if (length < blockSize) return -Infinity;
  const filters = kWeightingCoefficients(sampleRate);
  // チャンネルごとに K 特性を掛けた二乗値の累積和（ブロック平均を O(1) で取る）
  const cumulative = channels.map((samples) => {
    const weighted = filters.reduce((signal, filter) => applyBiquad(signal, filter), samples);
    const sums = new Float64Array(length + 1);
    for (let i = 0; i < length; i++) sums[i + 1] = sums[i] + weighted[i] * weighted[i];
    return sums;
  });
  const powers = [];
  for (let start = 0; start + blockSize <= length; start += step) {
    let power = 0;
    for (const sums of cumulative) power += (sums[start + blockSize] - sums[start]) / blockSize;
    powers.push(power);
  }
  const absGated = powers.filter((p) => p > 0 && blockLoudness(p) > ABSOLUTE_GATE_LUFS);
  if (!absGated.length) return -Infinity;
  const mean = (list) => list.reduce((sum, p) => sum + p, 0) / list.length;
  const relativeGate = blockLoudness(mean(absGated)) + RELATIVE_GATE_LU;
  const gated = absGated.filter((p) => blockLoudness(p) > relativeGate);
  if (!gated.length) return -Infinity;
  return blockLoudness(mean(gated));
}

/** -20 LUFS に合わせるゲイン（線形）。測れない（無音・短すぎ）なら 1（そのまま）。 */
export function normalizationGain(lufs, target = TARGET_LUFS) {
  return Number.isFinite(lufs) ? Math.pow(10, (target - lufs) / 20) : 1;
}

/**
 * 試聴の再生ゲイン = 正規化ゲイン × Hub のナレーション音量 / 100
 * （hapbeat-contracts specs/demo-session.md「ナレーションの音量」。エンジン補正係数は実機側の値なので掛けない）。
 */
export function playbackGain(lufs, narrationVolume, target = TARGET_LUFS) {
  return normalizationGain(lufs, target) * (narrationVolume / 100);
}
