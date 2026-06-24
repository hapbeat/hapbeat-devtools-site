---
title: Command vs Clip
kind: explanation
description: play(id) が kit manifest の bucket で command（デバイス内蔵 clip）と clip（SDK が WAV をストリーム）を自動分岐。判断基準・clip 解決・gain の扱い。
sidebar:
  order: 3
  label: Command vs Clip
---

**同じ `play(id)` 呼び出しが、kit manifest の bucket に応じて 2 つの再生モードに
自動で分かれます**。呼ぶ側のコードはどちらでも 1 行で、モードを意識しません。

分岐は [EventMap（触覚ファイル = kit manifest）](/docs/sdk-integration/js-sdk/event-map/)
の情報で決まります。考え方の共通解説は [](/docs/concepts/fire-vs-clip/) も参照してください。

## 2 つのモード

| manifest の bucket | モード | 何が起きるか | 事前 deploy |
|---|---|---|---|
| `events` | **command** | SDK は `PLAY` を送り、**デバイス**が内蔵 clip を再生 | 必要（Studio で kit 書込） |
| `stream_events` | **clip** | SDK が WAV を読み込み（`clipBase` + `clipLoader`）**UDP ストリーム** | 不要 |

```ts
import { connect, EventMap } from "@hapbeat/sdk";

const manifest = await fetch("/my-kit/my-kit-manifest.json").then((r) => r.json());
const hb = await connect({
  eventMap: EventMap.fromManifest(manifest),
  clipBase: "/my-kit/stream-clips/", // clip モードの WAV 置き場
});

hb.play("impact.hit"); // command → デバイスが内蔵 clip を再生
hb.play("rain.loop");  // clip    → SDK が WAV をストリーム
hb.stop("rain.loop");  // clip は再生中のストリームを終了
```

`eventMap` を渡していなければ、SDK は bucket の情報を持たないため**すべて command
として送られます**（このとき gain の既定値は `1.0`）。

## どちらを選ぶか

| | command | clip |
|---|---|---|
| 推奨 | 量産・本番運用の短い one-shot | 試作・長尺・差し替えの多い段階 |
| 遅延 | 小・安定 | やや大きめ・環境依存 |
| 事前 deploy | 要（Studio で kit 書込） | 不要（WAV を置くだけ） |
| 触覚の差し替え | kit を再 deploy | WAV を置き換えるだけ |

迷ったら **試作は clip、固まったら command** が基本です。command はデバイス内蔵の
clip を呼ぶだけなので最も軽量で安定し、clip は WAV をその場で流せるので配備の手間
なくイテレーションできます。

## clip の解決（clipBase + clipLoader）

clip モードでは、SDK が manifest の `clip` ファイル名を `clipBase` に連結し、
`clipLoader` で WAV を読み込んでからストリームします。既定の loader は環境ごとに
切り替わります。

| 環境 | `clipBase` | 既定 `clipLoader` |
|---|---|---|
| Node | ディレクトリパス | `fs.readFile` |
| Browser | URL プレフィックス | `fetch` |

```ts
// Browser: 静的アセットとして配信した kit を URL で解決
const hb = await connect({
  eventMap: EventMap.fromManifest(manifest),
  clipBase: "/my-kit/stream-clips/",
});

// Node: ディレクトリパスで解決
const hb = await connect({
  eventMap: EventMap.fromManifest(manifest),
  clipBase: "./kits/my-kit/stream-clips/",
});
```

バンドルや IndexedDB から読み込みたい場合は `clipLoader` を上書きします。

```ts
const hb = await connect({
  eventMap: EventMap.fromManifest(manifest),
  clipLoader: async (ref) => loadFromBundle(ref), // ArrayBuffer | Uint8Array を返す
});
```

`clipBase` / `clipLoader` を設定していない clip イベントを `play` すると、SDK は
WAV を読めず警告を出して何も鳴らしません。command モードのイベントには不要です。

## gain は二重適用しない

gain の既定値は **kit manifest の `intensity`** です。`play` の `gain` を明示すると
それで**上書き**され、二重には掛かりません。clip モードでも SDK は PCM を加工せず、
gain を **STREAM_BEGIN.gain にのみ**畳んで送り、デバイスが一度だけ適用します
（command の `gain` と同じ意味）。

```ts
hb.play("rain.loop");              // intensity（kit の既定値）で発火
hb.play("rain.loop", { gain: 0.3 }); // 呼び出し側で上書き
```

`gain` は絶対値 0..1 で、SDK 側で clamp されます。再生中の clip に対して gain を
途中で変調する API はありません（[Not implemented](/docs/sdk-integration/js-sdk/streaming-live/)
の連続変調は `openStream` を使います）。

## clip WAV の制約

- clip WAV は **16 kHz モノ PCM16** で用意してください。デバイスは 16 kHz 再生で、
  **SDK は resample しません**（非 16 kHz は警告のみ）。
- 1 度に流せる stream は **1 本**（session 単位）。新しい clip・`streamPcm`・
  `openStream` を始めると、前の stream は自動的に終了します。
- 同じ id を `events` と `stream_events` の両方に書いた場合（Studio の BOTH）は、
  manifest 読み込み時に `stream_events` が後勝ちで上書きするため **clip 側が優先**
  されます。

## Browser と Node の clip ターゲティング差

command モードの `target` は両トランスポートで同じように効きます。一方 clip モード
は helper（Browser）経由だと挙動が異なります。

- **Browser（helper WS 経由）**: clip 再生は helper が認識している**全デバイス**に
  届きます（デバイス単位の clip ターゲティングは未対応）。また `targetTimeUs` は
  helper 経由では**無視**され、常に即時再生になります。
- **Node（直接 UDP）**: clip も command と同様に `target` でアドレッシングできます。

ターゲット構文の詳細は [](/docs/concepts/group-player-addressing/) を参照してください。
