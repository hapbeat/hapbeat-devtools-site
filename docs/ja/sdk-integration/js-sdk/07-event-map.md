---
title: EventMap reference
kind: reference
description: 触覚の調整側カタログ EventMap / EventDef の API。kit manifest から clip_gain・loop・clip・mode を解決する。JS SDK は manifest-only。
sidebar:
  order: 7
  label: EventMap
---

`EventMap` は SDK の**調整側**（何を・どれくらいの強さで鳴らすか）です。発火側
（`play` / `stop` / `stopAll`）とは分かれ、**event id だけ**で結ばれます。kit
manifest（schema 2.0.0）を読み、各イベントの素材の強さ（`clip_gain`）・loop・clip を持ちます。

発火コードに素材の強さを書かず EventMap にまとめておくと、「いつ鳴らすか（コード）」と
「どれくらい鳴らすか（kit）」を独立して差し替えられます。発火側での使い分けは
[](/docs/sdk-integration/js-sdk/command-vs-clip/) を参照。

## コンストラクタ

```ts
import { EventMap } from "@hapbeat/sdk";

// パース済み kit manifest から（推奨）
EventMap.fromManifest(manifest: KitManifest): EventMap

// { eventId: clipGain } の手書きマップから（command のみ・clipGain だけ）
EventMap.fromClipGains(clipGains: Record<string, number>): EventMap

// EventDef を直接渡す（低レベル）
new EventMap(events?: Record<string, EventDef> | Map<string, EventDef>)
```

```ts
import { connect, EventMap } from "@hapbeat/sdk";

const manifest = await fetch("/my-kit/my-kit-manifest.json").then((r) => r.json());
const hb = await connect({ eventMap: EventMap.fromManifest(manifest) });
hb.play("sample-kit.sine_100hz"); // この manifest の clip_gain で発火
```

- `fromManifest` は `events`（command）と `stream_events`（clip）の両 bucket を
  読み、各イベントの `parameters.clip_gain` / `loop` / `device_wiper` と clip 名を
  取り込みます。
- `fromClipGains` は `{ "sample-kit.sine_100hz": 0.5 }`（値は `clipGain`）のような単純マップから作り、すべて
  command モード・`loop: false`・`streaming: false` になります。

## インスタンスメソッド

```ts
em.get("sample-kit.sine_100hz");      // EventDef | undefined
em.clipGainFor("sample-kit.sine_100hz");  // 素材の強さ（clip_gain）。無ければ 1.0
em.has("sample-kit.sine_100hz");      // boolean
em.ids();                  // string[] — 全 event id
em.size;                   // number — 件数
```

`clipGainFor(id)` は `play(id)` が呼ぶ時の `gain`（アプリの倍率）と掛ける素材の強さです。
EventMap に無い id を渡すと `1.0` にフォールバックします。

## EventDef のフィールド

`em.get(id)` が返す `EventDef`:

| フィールド | 型 | 意味 |
|---|---|---|
| `eventId` | `string` | イベント id |
| `clipGain` | `number` | 素材の強さ（manifest の `parameters.clip_gain`、0〜1、既定 1.0） |
| `loop` | `boolean` | ループ再生か |
| `deviceWiper?` | `number` | デバイス側ワイパー値（任意） |
| `streaming` | `boolean` | `true` なら clip モード（`stream_events` 由来） |
| `clip?` | `string` | clip モードの WAV ファイル名（`clipBase` 相対で解決） |
| `note` | `string` | メモ |

## KitManifest の形と bucket → mode

```ts
interface KitManifest {
  schema_version?: string;
  events?: Record<string, ManifestEntry>;        // → command モード
  stream_events?: Record<string, ManifestEntry>; // → clip モード（streaming: true）
}
```

```json
{
  "schema_version": "2.0.0",
  "events": {
    "sample-kit.sine_100hz": { "clip": "hit.wav", "parameters": { "clip_gain": 0.8 } }
  },
  "stream_events": {
    "rain.loop": { "clip": "rain.wav", "parameters": { "clip_gain": 0.3, "loop": true } }
  }
}
```

- `events` バケット → `EventDef(streaming: false)` = **command モード**。SDK は PLAY
  指示を送り、デバイスが配備済み clip を再生します。
- `stream_events` バケット → `EventDef(streaming: true, clip: "...")` = **clip モード**。
  SDK が WAV（`clipBase` + `clipLoader`）を読み込んで UDP でストリーミングします。

manifest 形と event id の規約は [](/docs/concepts/event-id-and-kit/)、mode の概念は
[](/docs/concepts/fire-vs-clip/) を参照。

## `play(id)` がどう消費するか

`play(id)` を呼ぶと、SDK は接続時に渡した `eventMap` を引いて:

1. 送る値を `clamp(clipGain × gain, 0, 1)` にする（`clipGain` = manifest の `clip_gain`、`gain` = 呼ぶ時の倍率。省略時は 1）。`gain` は `clipGain` を置き換えず掛ける。
2. その id の `EventDef.streaming` を見て **command / clip を分岐**する。
   - `streaming: false` → PLAY 指示を送る（デバイスが clip を再生）。
   - `streaming: true` → `clip` の WAV を `clipBase` + `clipLoader` で読み込み、
     16 kHz mono PCM16 として UDP ストリーミングする（送る値は source の PCM に掛ける）。
- `eventMap` を渡さない場合は全イベントが command モード扱いで、`clip_gain` は `1.0`
  として扱います（送る値 = `clamp(gain, 0, 1)`）。

## 重要な注記（Python SDK との差）

JS の `EventMap` は **manifest-only** です。Python SDK が持つ次の機能は **JS には
ありません**:

- **触覚ファイル overlay（per-event target / gain の倍率）はない** — JS には
  `from_file` 相当がありません。送信先は呼び出し側の `target=` か接続の
  `defaultTarget` で指定します（[](/docs/sdk-integration/js-sdk/transports/)）。
- **`target` / `mode` フィールドはない** — `EventDef` は targeting を持ちません。
  command / clip の判定は `streaming` フラグだけで行います。
- **`kit_dir` 解決はない** — clip の WAV は `kit_dir` ではなく接続オプションの
  `clipBase`（Node: ディレクトリパス / Browser: URL プレフィックス）と `clipLoader`
  で解決します。
- **loop 駆動の自動停止はない** — `loop: true` は manifest 由来のメタデータとして
  保持されるだけで、JS の `EventMap` 自体は停止制御をしません。停止は `stop(id)` /
  `stopAll()` を明示的に呼びます。

## 次に読む

- [](/docs/sdk-integration/js-sdk/command-vs-clip/) — command と clip の使い分け
- [](/docs/sdk-integration/js-sdk/project-structure/) — kit と clip をプロジェクトに置く構成
- [](/docs/sdk-integration/js-sdk/streaming-clips/) — clip モードのストリーミング
