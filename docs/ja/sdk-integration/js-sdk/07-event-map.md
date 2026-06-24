---
title: EventMap reference
kind: reference
description: 触覚の調整側カタログ EventMap / EventDef の API。kit manifest から intensity・loop・clip・mode を解決する。JS SDK は manifest-only。
sidebar:
  order: 7
  label: EventMap
---

`EventMap` は SDK の**調整側**（何を・どれくらいの強さで鳴らすか）です。発火側
（`play` / `stop` / `stopAll`）とは分かれ、**event id だけ**で結ばれます。kit
manifest（schema 2.0.0）を読み、各イベントの既定 intensity・loop・clip を持ちます。

発火コードに強度を書かず EventMap にまとめておくと、「いつ鳴らすか（コード）」と
「どれくらい鳴らすか（kit）」を独立して差し替えられます。発火側での使い分けは
[](/docs/sdk-integration/js-sdk/command-vs-clip/) を参照。

## コンストラクタ

```ts
import { EventMap } from "@hapbeat/sdk";

// パース済み kit manifest から（推奨）
EventMap.fromManifest(manifest: KitManifest): EventMap

// { eventId: gain } の手書きマップから（command のみ・gain だけ）
EventMap.fromGains(gains: Record<string, number>): EventMap

// EventDef を直接渡す（低レベル）
new EventMap(events?: Record<string, EventDef> | Map<string, EventDef>)
```

```ts
import { connect, EventMap } from "@hapbeat/sdk";

const manifest = await fetch("/my-kit/my-kit-manifest.json").then((r) => r.json());
const hb = await connect({ eventMap: EventMap.fromManifest(manifest) });
hb.play("impact.hit"); // この manifest の intensity で発火
```

- `fromManifest` は `events`（command）と `stream_events`（clip）の両 bucket を
  読み、各イベントの `parameters.intensity` / `loop` / `device_wiper` と clip 名を
  取り込みます。
- `fromGains` は `{ "impact.hit": 0.5 }` のような単純マップから作り、すべて
  command モード・`loop: false`・`streaming: false` になります。

## インスタンスメソッド

```ts
em.get("impact.hit");      // EventDef | undefined
em.gainFor("impact.hit");  // 既定 gain（intensity）。無ければ 1.0
em.has("impact.hit");      // boolean
em.ids();                  // string[] — 全 event id
em.size;                   // number — 件数
```

`gainFor(id)` は `play(id)` で gain を省略したときに使われる既定値です。EventMap に
無い id を渡すと `1.0`（フルゲイン）にフォールバックします。

## EventDef のフィールド

`em.get(id)` が返す `EventDef`:

| フィールド | 型 | 意味 |
|---|---|---|
| `eventId` | `string` | イベント id |
| `intensity` | `number` | 既定 gain（manifest の `parameters.intensity`、既定 1.0） |
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
    "impact.hit": { "clip": "hit.wav", "parameters": { "intensity": 0.8 } }
  },
  "stream_events": {
    "rain.loop": { "clip": "rain.wav", "parameters": { "intensity": 0.3, "loop": true } }
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

1. gain 未指定なら `gainFor(id)`（= manifest の intensity）を既定値にする。
2. その id の `EventDef.streaming` を見て **command / clip を分岐**する。
   - `streaming: false` → PLAY 指示を送る（デバイスが clip を再生）。
   - `streaming: true` → `clip` の WAV を `clipBase` + `clipLoader` で読み込み、
     16 kHz mono PCM16 として UDP ストリーミングする。
- `eventMap` を渡さない場合は全イベントが command モード扱いで、gain は `1.0` に
  なります。

## 重要な注記（Python SDK との差）

JS の `EventMap` は **manifest-only** です。Python SDK が持つ次の機能は **JS には
ありません**:

- **触覚ファイル overlay（per-event target / gain 上書き）はない** — JS には
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
