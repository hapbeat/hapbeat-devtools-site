---
title: Live Streaming (openStream)
kind: reference
description: openStream で永続ストリームを開き、ゲームループから毎フレーム PCM を流し込んで連続変調する触覚（方向トーンなど）の作り方。
sidebar:
  order: 6
  label: Live Streaming
---

`openStream()` は、**1 本のストリームを開きっぱなしにして**、呼び出し側が
PCM チャンクを ~リアルタイムで流し込み続ける API です。毎フレーム値が変わる連続
触覚（弾の方向を示す `~100Hz` のトーン、締まっていくランブルなど）に使います。

clip / `streamPcm` が「短い波形を投げて終わり」なのに対し、`openStream` は
「セッションを保持したまま書き続ける」点が違います。

## なぜ openStream が要るのか

discrete な clip や `streamPcm` を毎フレーム呼ぶと、その都度
`STREAM_BEGIN…DATA…END` のセッションが立っては畳まれます（1 セッション = 1
ストリーム）。この **per-chunk teardown** がデバイス側リングバッファの再バッファ
を招き、チャンク境界で「ガタガタ」した途切れになります。

`openStream` は `STREAM_BEGIN` を **一度だけ**送り、以降は `write()` で
STREAM_DATA を継ぎ足し、`close()` で初めて `STREAM_END` を送ります。セッションを
畳まないので、リングバッファが連続的に満たされ続け、信号が滑らかにつながります。

```ts
const live = hb.openStream({ channels: 2, sampleRate: 16000, gain: 1 });
function frame(pcm /* Uint8Array: 合成した PCM16 チャンク */) {
  live.write(pcm); // STREAM_BEGIN は最初の 1 回だけ。以降はチャンクを継ぎ足す
}
// …終了時
live.close();
```

## API

```ts
openStream(opts?: {
  sampleRate?: number;  // 既定 16000
  channels?: number;    // 1 = mono / 2 = stereo（L/R で方向を出す。PLAY に pan は無い）
  gain?: number;        // 0..1、既定 1.0
  target?: string;      // device-addressing。"" = ブロードキャスト
}): LiveStreamHandle
```

返り値の `LiveStreamHandle`:

```ts
interface LiveStreamHandle {
  write(pcm: Uint8Array): void; // フレーム境界に揃えた PCM16 チャンクを送る。close 後は no-op
  close(): void;                // STREAM_END を送る。冪等
  readonly closed: boolean;     // close 済みかどうか
}
```

- `write(pcm)` の `pcm` は **PCM16**（`channels: 2` ならインターリーブ L/R）。SDK は
  リサンプルしないので、`sampleRate` に合わせた波形を渡してください（触覚は 16 kHz）。
- `write` / `close` は **fire-and-forget**（返り値 `void`）。await は不要です。

## ペーシングは呼び出し側の責任

ここが clip / `streamPcm` との最大の違いです。

- **clip / `streamPcm`**: SDK が `streamSendAheadSec`（< 0.256）に沿って**ペーシング
  （送出のレート制御）して**くれます。波形を 1 回渡せば、あとは SDK が間引いて流します。
- **`openStream`**: SDK は **ペーシングしません**。`write()` を STREAM_DATA として
  そのまま転送するだけです。

デバイス側のリングバッファは **約 256 ms** ぶんしか持ちません。呼び出し側が
~リアルタイムのレートで `write()` し続けないと、リングが **underrun（枯渇）**して
音切れ・途切れになります。逆に速く流し込みすぎると、超過分が捨てられます。

実装としては「ゲームループで毎フレーム 1 チャンク（フレーム周期ぶんの長さ）を
`write()`」が理想です。チャンク長をフレーム周期に合わせ、`sin` の位相をチャンク間で
持ち越せば、境界クリックの無い連続トーンになります。

## 1 セッション = 1 ストリーム

ストリームセッションは常に **1 本だけ**です。次のいずれかが起きると、開いている
ライブストリームは**終了**します。

- clip モードの `play(streamEventId)` を呼んだ
- `streamPcm(...)` を呼んだ
- 新しい `openStream(...)` を呼んだ

つまり、discrete な fire（足音 clip など）が割り込むとライブストリームは畳まれます。
連続モードを維持したいなら、割り込み後に `handle.closed` を見て、必要なら開き直して
ください（下の例の「(re)open」がそれです）。

## ワーク例：ゲームループで方向トーンを連続提示

FPS デモ（[](/docs/sdk-integration/js-sdk/examples/) の触覚 FPS「連続モード」）は、
最接近の敵弾の **方位を L/R バランス**で、**距離を振幅**で `~100Hz` トーンに連続変調
しています。毎フレーム stereo PCM を `write()` する構造です。

```ts
let contStream: LiveStreamHandle | null = null;
let phase = 0; // sin の位相をチャンク間で持ち越す（境界クリック回避）

function updateContinuousHaptic() {
  const threat = nearestBullet();
  if (!threat) {                        // 脅威が無ければストリームを畳む
    contStream?.close();
    contStream = null;
    phase = 0;
    return;
  }

  // 方位 → L/R バランス、距離 → 振幅（closer = stronger）
  const { panL, panR, amp } = directionAndDistance(threat);

  // discrete な発砲/足音に割り込まれて閉じていたら開き直す
  if (!contStream || contStream.closed) {
    contStream = hb.openStream({ channels: 2, sampleRate: 16000, gain: 1 });
    phase = 0;
  }

  // フレーム周期ぶんの stereo トーンを 1 チャンク書き込む
  contStream.write(stereoTone(panL * amp, panR * amp, { freq: 100, phase }));
  phase = nextPhase(phase, 100); // 位相を継ぎ足して seamless に
}
// …ゲーム終了時
contStream?.close();
```

ポイント:

- `stereoTone(...)` は L/R 別振幅のインターリーブ PCM16（`Uint8Array`）を返す自前の
  合成関数です。SDK は波形を作らないので、合成は呼び出し側で行います。
- 毎フレーム `write()` するので、フレームレートがそのままペーシングになります。
- 脅威が消えたら `close()`、再び現れたら `openStream()` で開き直す、を繰り返します。

## streamPcm / openStream / clip の使い分け

| | clip（`play(streamEventId)`） | `streamPcm(pcm, opts)` | `openStream(opts) → handle` |
|---|---|---|---|
| 用途 | kit の WAV をストリーム再生 | 一発の合成 PCM を投げる | 連続変調（毎フレーム書く） |
| 波形 | kit の WAV（16kHz mono PCM16） | 任意の PCM16 バッファ | 任意の PCM16 チャンク列 |
| 送出 | `STREAM_BEGIN…DATA…END`（1 回） | `STREAM_BEGIN…DATA…END`（1 回） | `STREAM_BEGIN` 1 回 → `write()` 多数 → `close()` |
| ペーシング | SDK が行う | SDK が行う | **呼び出し側が行う**（~リアルタイム） |
| underrun リスク | 低い | 低い | 供給が遅いと **あり**（リング ≈256ms） |
| stereo（方向） | mono のみ | `channels: 2` で L/R | `channels: 2` で L/R |
| 典型 | 既定の触覚クリップを鳴らす | 一発の方向キュー | ゲームの「レーダー」連続触覚 |

迷ったら：単発なら `streamPcm`、毎フレーム値が変わるなら `openStream`、kit に
仕込んだ波形を鳴らすだけなら clip（`play`）です。連続モードの波形は短い discrete
キュー（足音など）に割り込まれて畳まれる点（1 セッション = 1 ストリーム）に注意して
ください。

## 関連ページ

- [](/docs/sdk-integration/js-sdk/streaming-clips/) — clip モードのストリーム再生
- [](/docs/sdk-integration/js-sdk/command-vs-clip/) — command と clip の使い分け
- [](/docs/sdk-integration/js-sdk/examples/) — 触覚 FPS（連続モード）など動くサンプル
- [](/docs/concepts/fire-vs-clip/) — fire と clip の概念
