---
title: Streaming — clips & ad-hoc PCM
kind: reference
description: clip モードの内部動作（WAV 要件・ペーシング・事前 decode）と、即席 PCM を流す streamPcm の使い方をまとめたリファレンス。
sidebar:
  order: 5
  label: Streaming (clips)
---

clip モード（manifest の `stream_events` バケット）と `streamPcm()` は、どちらも
波形を **デバイス側に置かず SDK が UDP で流し込む** 経路です。command モードとの
使い分けは [](/docs/sdk-integration/js-sdk/command-vs-clip/) を参照。ここでは
clip ストリームの WAV 要件・ペーシング・事前 decode と、即席 PCM を流す
`streamPcm()` を扱います。連続して波形を変調し続ける用途は
[](/docs/sdk-integration/js-sdk/streaming-live/) を見てください。

## WAV 要件

clip モードの WAV は **16 kHz / モノ / PCM16** です。SDK は WAV ヘッダを
`parseWav()` で解析して PCM16 バイト列を取り出すだけで、**リサンプルしません**。
16 kHz 以外を読み込ませると警告が出て、デバイス上ではピッチがずれます。

```text
[hapbeat] clip "rumble.wav" is 44100Hz; device expects 16000Hz (pitch will be off)
```

clip は Hapbeat Studio が `stream-clips/*.wav` として書き出すので、通常はこの形式に
なっています。`clipBase` + `clipLoader` の場所指定は
[](/docs/sdk-integration/js-sdk/project-structure/) を参照。

## ペーシング（送出のリズム）

デバイスのリングバッファは約 **256 ms 分**（16 kHz で 4096 フレーム）しか持てません。
そのため clip 全体を一度にバースト送信できず、SDK はフレーム境界で分割したチャンクを
**再生時刻の少し手前**で送り出します。この先読み量が `streamSendAheadSec`（既定
`0.15` 秒、上限は 0.256 秒未満）です。

wire 上の流れは次の 3 段階です。

| メッセージ | 役割 |
|---|---|
| `STREAM_BEGIN` | 1 回。sampleRate / channels / gain / target などのメタを宣言 |
| `STREAM_DATA` | チャンクごと。再生時刻の `streamSendAheadSec` 手前で送出 |
| `STREAM_END` | clip が**完全に再生され切る**まで遅延してから送出 |

`STREAM_END` を drain（再生し切り）まで遅らせるのは、firmware が END で drain する
実装でも flush する実装でも末尾が欠けないようにするためです。`streamPcm()` も同じ
ペーシングで送られます。

## preloadClips() で事前 decode

clip を初めて `play()` した時は、WAV のロードと decode が走るぶん最初の再生に
わずかな遅延が出ます。`preloadClips()` を呼ぶと、EventMap 上の clip モード
（`streaming: true`）イベントの WAV をすべて先に decode してキャッシュへ温めるので、
2 回目以降と同じく初回も遅延なく鳴らせます。

```ts
import { connect, EventMap } from "@hapbeat/sdk";

const manifest = await fetch("/my-kit/my-kit-manifest.json").then((r) => r.json());
const hb = await connect({
  eventMap: EventMap.fromManifest(manifest),
  clipBase: "/my-kit/stream-clips/",
});

await hb.preloadClips(); // 全 clip を事前 decode（読み込めなかったものは警告のみ）
hb.play("ambient.rumble"); // 初回から遅延なし
```

## streamPcm() で即席のステレオ方向 cue

合成した PCM16 バッファをその場で 1 回流すには `streamPcm()` を使います。clip と
同じくペーシングして送出されます。一発の合成 cue 向きです。

```ts
// 合成した PCM16（インターリーブ stereo）を渡す
hb.streamPcm(pcm, { channels: 2, sampleRate: 16000, gain: 0.6 });
```

`channels: 2` にすると L/R を別々に運べます。`play()` の wire には **pan が無い**ため、
「右から来た」「左から来た」のような **方向 cue は PCM の L/R に直接書き込む**のが
唯一の方法です。`sampleRate` 既定は `16000`、`channels` 既定は `1` です。

## 1 セッション = 1 ストリーム

ストリームはセッション単位で **同時に 1 本だけ**です。新しい clip の `play()`・
`streamPcm()`・`openStream()` のいずれかを始めると、進行中のストリームは
キャンセルされて前のものは止まります。複数音源を重ねたい場合のミキシングは SDK では
行わない（アプリ側の責務）ことに注意してください。

## gain は 1 回だけ適用

clip / `streamPcm()` の `gain` は `STREAM_BEGIN` のメタに畳み込まれて送られ、
デバイス側で **そのストリーム全体に 1 回**適用されます。再生中に gain を動的に
変えることはできません（mid-clip の gain/pan tween は未実装）。

再生しながら強度や方向を**連続的に変調**したい場合は、ペーシングを行わず自分で
チャンクを書き込む永続ストリーム（`openStream()`）を使います。詳しくは
[](/docs/sdk-integration/js-sdk/streaming-live/) を参照。

## 次に読む

- [](/docs/sdk-integration/js-sdk/streaming-live/) — `openStream()` による連続変調ストリーム
- [](/docs/sdk-integration/js-sdk/command-vs-clip/) — command と clip の使い分け
- [](/docs/concepts/fire-vs-clip/) — command と clip の概念
- [](/docs/sdk-integration/js-sdk/project-structure/) — kit と clip をプロジェクトに置く構成
