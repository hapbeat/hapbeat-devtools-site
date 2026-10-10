import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  integratedLoudness,
  normalizationGain,
  playbackGain,
  kWeightingCoefficients,
} from '../public/tools/narration-editor/loudness.js';
import {
  detectFormat,
  formatJson,
  parseJsonText,
  validateLines,
  effectiveVoice,
  removedIds,
  resolveStyleId,
} from '../public/tools/narration-editor/voice-files.js';
import { probeEngine, engineStartCommand } from '../public/tools/narration-editor/engine.js';

function sine(frequency, amplitude, seconds, sampleRate) {
  const samples = new Float32Array(Math.round(seconds * sampleRate));
  for (let i = 0; i < samples.length; i++) samples[i] = amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  return samples;
}

test('BS.1770: 0 dBFS の 1 kHz 正弦波（1 チャンネル）は -3.01 LUFS', () => {
  for (const rate of [48000, 44100, 24000]) {
    const lufs = integratedLoudness([sine(1000, 1, 5, rate)], rate);
    assert.ok(Math.abs(lufs - -3.01) < 0.05, `${rate} Hz: ${lufs}`);
  }
});

test('振幅を 1/10 にすると 20 LU 下がり、正規化ゲインで -20 LUFS に戻る', () => {
  const rate = 48000;
  const loud = integratedLoudness([sine(1000, 1, 3, rate)], rate);
  const quiet = integratedLoudness([sine(1000, 0.1, 3, rate)], rate);
  assert.ok(Math.abs(loud - quiet - 20) < 0.01, `${loud} / ${quiet}`);
  const gain = normalizationGain(quiet);
  const normalized = integratedLoudness([sine(1000, 0.1 * gain, 3, rate)], rate);
  assert.ok(Math.abs(normalized - -20) < 0.01, `${normalized}`);
});

test('48 kHz の K 特性係数は BS.1770 の表の値', () => {
  const [shelf, highpass] = kWeightingCoefficients(48000);
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} vs ${b}`);
  close(shelf.b[0], 1.53512485958697);
  close(shelf.b[1], -2.69169618940638);
  close(shelf.b[2], 1.19839281085285);
  close(shelf.a[1], -1.69065929318241);
  close(shelf.a[2], 0.73248077421585);
  close(highpass.a[1], -1.99004745483398);
  close(highpass.a[2], 0.99007225036621);
});

test('無音・400 ms 未満は測れない（-Infinity）、ゲインは 1 のまま', () => {
  assert.equal(integratedLoudness([new Float32Array(48000 * 2)], 48000), -Infinity);
  assert.equal(integratedLoudness([sine(1000, 1, 0.3, 48000)], 48000), -Infinity);
  assert.equal(normalizationGain(-Infinity), 1);
});

function concat(...parts) {
  const out = new Float32Array(parts.reduce((n, part) => n + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

test('絶対ゲート: 無音（-70 LUFS 未満）のブロックは何秒続いても平均に入らない', () => {
  const rate = 48000;
  const tone = sine(1000, 0.1, 2, rate); // 約 -23 LUFS
  // 境目をまたぐブロックは同じなので、無音の長さで値が変わらなければ無音ブロックはゲートで落ちている
  const short = integratedLoudness([concat(tone, new Float32Array(rate * 2))], rate);
  const long = integratedLoudness([concat(tone, new Float32Array(rate * 20))], rate);
  assert.ok(Math.abs(short - long) < 1e-9, `${short} vs ${long}`);
  assert.ok(Math.abs(short - integratedLoudness([tone], rate)) < 0.5);
});

test('相対ゲート: 平均より 10 LU 以上小さいブロックは除かれる', () => {
  const rate = 48000;
  const loud = sine(1000, 0.5, 2, rate); // 約 -9 LUFS
  const soft = (seconds) => sine(1000, 0.5 / 100, seconds, rate); // -40 LU（絶対ゲートは通る）
  const short = integratedLoudness([concat(loud, soft(2))], rate);
  const long = integratedLoudness([concat(loud, soft(20))], rate);
  assert.ok(Math.abs(short - long) < 1e-6, `${short} vs ${long}`);
  assert.ok(Math.abs(short - integratedLoudness([loud], rate)) < 0.5);
});

test('試聴ゲイン = 正規化ゲイン × Hub 音量 / 100（契約「ナレーションの音量」）', () => {
  assert.ok(Math.abs(playbackGain(-20, 100) - 1) < 1e-12);
  assert.ok(Math.abs(playbackGain(-20, 50) - 0.5) < 1e-12);
  assert.equal(playbackGain(-26, 0), 0);
  assert.ok(Math.abs(playbackGain(-26, 100) - Math.pow(10, 6 / 20)) < 1e-12);
});

const LINES_TEXT =
  '{\n "voice": {"speaker": "まお", "style": "ノーマル", "speed": 1.0, "volume": 0.85},\n "lines": [\n' +
  '  {"id": "a_one", "text": "一つ目。"},\n  {"id": "a_two", "text": "二つ目。", "speed": 1.1}\n ]\n}\n';

test('voice-lines.json: 読んで書き戻すと元と同じ（書式・キー順・末尾改行）', () => {
  assert.equal(formatJson(parseJsonText(LINES_TEXT), detectFormat(LINES_TEXT)), LINES_TEXT);
  const voice = '{"speaker": "まお", "style": "ノーマル", "speed": 1.0, "volume": 0.85}\n';
  assert.equal(formatJson(parseJsonText(voice), detectFormat(voice)), voice);
  const crlfBom = '﻿' + LINES_TEXT.replace(/\n/g, '\r\n');
  assert.equal(formatJson(parseJsonText(crlfBom), detectFormat(crlfBom)), crlfBom);
});

test('voice-lines.json: 1 行の変更は 1 行の差分になる', () => {
  const data = parseJsonText(LINES_TEXT);
  data.lines[0].text = '一つ目を直した。';
  data.lines.push({ id: 'a_three', text: '三つ目。' });
  const out = formatJson(data, detectFormat(LINES_TEXT)).split('\n');
  const before = LINES_TEXT.split('\n');
  assert.equal(out[3], '  {"id": "a_one", "text": "一つ目を直した。"},');
  assert.equal(out[4], '  {"id": "a_two", "text": "二つ目。", "speed": 1.1},');
  assert.equal(out[5], '  {"id": "a_three", "text": "三つ目。"}');
  assert.deepEqual(out.slice(0, 3), before.slice(0, 3));
});

test('行の検証は generate-voice.py と同じ条件', () => {
  const problems = validateLines([
    { id: 'ok_1', text: 'はい' },
    { id: 'Bad', text: 'はい' },
    { id: 'dup', text: 'はい' },
    { id: 'dup', text: 'はい' },
    { id: 'empty', text: '  ' },
  ]);
  assert.deepEqual(problems.map((list) => list.length), [0, 1, 1, 1, 1]);
});

test('声の優先順: 行の上書き > voice.json > ファイルの voice', () => {
  const file = { speaker: 'まお', style: 'ノーマル', speed: 1.0, volume: 0.85 };
  const shared = { speaker: 'コハク', speed: 1.2 };
  assert.deepEqual(effectiveVoice(file, shared), { speaker: 'コハク', style: 'ノーマル', speed: 1.2, volume: 0.85 });
  assert.deepEqual(effectiveVoice(file, shared, { style: 'あまあま' }).style, 'あまあま');
  assert.deepEqual(effectiveVoice(file, null).speaker, 'まお');
});

test('id の変更・削除を検出する', () => {
  assert.deepEqual(removedIds(['a', 'b', 'c'], [{ id: 'a' }, { id: 'b2' }, { id: 'c' }]), ['b']);
});

test('話者・スタイル名からスタイル id を引く', () => {
  const speakers = [{ name: 'まお', styles: [{ name: 'ノーマル', id: 1 }, { name: 'ふつー', id: 2 }] }];
  assert.deepEqual(resolveStyleId(speakers, 'まお', 'ふつー'), { id: 2 });
  assert.ok(resolveStyleId(speakers, 'まお', 'ない').error);
  assert.ok(resolveStyleId(speakers, 'いない', 'ノーマル').error);
});

test('接続状態: つながる / CORS で拒否 / 起動していない を区別する', async () => {
  const ok = async () => ({ ok: true, json: async () => '1.2.0' });
  assert.deepEqual(await probeEngine('http://127.0.0.1:10101/', ok), { state: 'connected', version: '1.2.0' });
  const corsBlocked = async (_url, init) => {
    if (init?.mode === 'no-cors') return { ok: false, type: 'opaque' };
    throw new TypeError('Failed to fetch');
  };
  assert.deepEqual(await probeEngine('http://127.0.0.1:10101', corsBlocked), { state: 'cors' });
  const down = async () => {
    throw new TypeError('Failed to fetch');
  };
  assert.deepEqual(await probeEngine('http://127.0.0.1:10101', down), { state: 'down' });
});

test('起動コマンド: 公開サイトからは --allow_origin を付ける', () => {
  assert.equal(
    engineStartCommand('https://devtools.hapbeat.com'),
    '& "$env:LOCALAPPDATA\\Programs\\AivisSpeech-Engine\\run.exe" --host 127.0.0.1 --port 10101 --disable_sentry --allow_origin https://devtools.hapbeat.com',
  );
  assert.ok(!engineStartCommand('http://localhost:4321').includes('--allow_origin'));
});
