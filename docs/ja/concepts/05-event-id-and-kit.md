---
title: Event ID と Kit
kind: explanation
description: Hapbeat の触覚資産を束ねる「Kit」と、SDK が発火する「Event ID」の関係と命名規則。
sidebar:
  order: 5
---

Hapbeat の触覚コンテンツは **Kit** という単位でまとめられ、SDK は **Event ID** という文字列でクリップを指定して発火します。このページは両者の構造と命名規則を扱います。

仕様の正式定義は [Contracts: kit-format](https://github.com/Hapbeat/hapbeat-contracts/blob/master/specs/kit-format.md) / [event-id](https://github.com/Hapbeat/hapbeat-contracts/blob/master/specs/event-id.md) を参照。

## Kit = 触覚資産のフォルダ

Kit は **触覚波形 (WAV) + メタデータ (`<kit-name>-manifest.json`)** を 1 つにまとめたフォルダです。Studio で作成し、Helper 経由で Hapbeat デバイスに転送します。

```
my-game/                            ← Kit フォルダ (= kit-name)
  my-game-manifest.json             ← イベント定義・基準 intensity
  install-clips/                    ← Fire (command) 用 WAV
    sword-hit.wav
    footstep-grass.wav
  stream-clips/                     ← Clip (stream) 用 WAV
    bgm-tension.wav
```

`install-clips/` と `stream-clips/` の使い分けは [Fire と Clip の違い](./fire-vs-clip/) を参照。「install されてデバイスに残る」「stream として都度送る」という動詞対比で覚えると直感的です。

> **manifest ファイル名**: host 側 (Studio / Unity SDK / Helper) では `<kit-name>-manifest.json` を正とし、デバイスの LittleFS に転送される際だけ `manifest.json` に rename されます。複数 Kit を 1 プロジェクトに置いたとき OS Explorer や SDK の picker で識別性を上げるための規約です。

## manifest の主なフィールド

manifest は **`events` (Fire 用) と `stream_events` (Clip 用) の 2 つの bucket** で構成されます。各 bucket は Event ID をキーとしたオブジェクト (辞書) です。同一の Event ID を両 bucket に置くことで「同じ意味的イベントを Fire でも Clip でも再生する (= BOTH モード)」を表現できます。

```json
{
  "schema_version": "2.0.0",
  "name": "my-game",
  "version": "1.0.0",
  "target_device": {
    "firmware_version_min": "0.1.0",
    "board": "duo_wl_v3"
  },
  "events": {
    "my-game.sword-hit": {
      "clip": "sword-hit.wav",
      "parameters": {
        "intensity": 0.8,
        "device_wiper": 64
      }
    }
  },
  "stream_events": {
    "my-game.bgm-tension": {
      "clip": "bgm-tension.wav",
      "parameters": {
        "intensity": 0.5,
        "loop": true
      }
    }
  }
}
```

| フィールド | 必須 | 意味 |
|---|---|---|
| `schema_version` | ✓ | manifest スキーマのバージョン。現行 `"2.0.0"` |
| `name` | ✓ | Kit 名。**on-disk のフォルダ名と同じ文字列を使う**。wire 上の `kit_id` payload と同値 ([DEC-028](https://github.com/Hapbeat/hapbeat-sdk-workspace/blob/master/docs/decision-log.md#DEC-028)) |
| `version` | ✓ | Kit のバージョン (semver 推奨) |
| `target_device.firmware_version_min` | ✓ | 必要なファームウェアの最低バージョン |
| `target_device.board` | — | 想定基板識別子 (例: `duo_wl_v3` / `neck_wl_v2`)。ファームのメタ情報と食い違うと warning |
| `events` | ✓ | **Fire (command)** イベントの辞書。device の event table を構成し、PLAY/STOP packet の `event_id` フィールドにこのキーが乗る |
| `stream_events` | — | **Clip (stream)** イベントの辞書。SDK が UDP audio stream で送信。device は eventId を認識せず、SDK 内部の binding ラベルとしてのみ使う |
| `<bucket>[<id>].clip` | ✓ | bucket に対応する WAV のファイル名 (bare filename)。`events.<id>.clip` → `install-clips/<clip>`、`stream_events.<id>.clip` → `stream-clips/<clip>` として自動解決 |
| `<bucket>[<id>].parameters.intensity` | — | 基準振動強度 0.0〜1.0 ([gain の乗算構造](./gain-architecture/) の基準値) |
| `events[<id>].parameters.device_wiper` | — | MCP4018 wiper 値 (0..127)。authoring 時の強度を再現するための参照情報。`stream_events` 側は対象外 |
| `<bucket>[<id>].parameters.loop` | — | ループ再生の有無 (default `false`) |

> **schema 2.0.0 で `mode` フィールドは廃止**されました ([DEC-031](https://github.com/Hapbeat/hapbeat-sdk-workspace/blob/master/docs/decision-log.md#DEC-031))。entry がどちらの mode で再生されるかは **入っている bucket** で決まります。同じ Event ID を両 bucket に置けば BOTH モード。完全な schema は [kit-format spec](https://github.com/Hapbeat/hapbeat-contracts/blob/master/specs/kit-format.md) を参照。

## Event ID の命名規則

Event ID は触覚イベントを一意に識別する文字列です。正準フォーマットは [event-id spec](https://github.com/Hapbeat/hapbeat-contracts/blob/master/specs/event-id.md) (DEC-040) が定義します。

```
<kit-name>.<file-name>
```

- **`<kit-name>`** — その clip が属する Kit の `name`（上の manifest の `name`・on-disk フォルダ名・wire の `kit_id` と同値）
- **`<file-name>`** — Kit 内の clip ファイル名から拡張子 `.wav` を除いた basename
- 区切りは **`.` (ドット) 1 個**。`<kit-name>` が名前空間を兼ねるため、異なる Kit 間で ID が衝突しません

| 規則 | 値 |
|---|---|
| `<kit-name>` | `^[a-z][a-z0-9-]*$`（英小文字始まり・英数字・ハイフン。アンダースコア不可） |
| `<file-name>` | `^[a-z][a-z0-9_-]*$`（英小文字始まり・英数字・アンダースコア・ハイフン） |
| 区切り文字 | `.` (ドット) 1 個のみ |
| 大文字 | 使用不可（小文字のみに正規化） |
| `<file-name>` 先頭 | 英字始まり（`100hz` ではなく `sine_100hz`） |
| ID 全体の最大長 | 255 文字 |

実例:

```
sample-kit.sine_100hz      ← 公式の疎通確認イベント (sample-kit)
showcase-kit.z1_pin_hit    ← showcase-kit の clip z1_pin_hit.wav
my-game.sword_slash        ← my-game kit の clip sword_slash.wav
```

Event ID は **Studio が Kit 名 + clip ファイル名から自動合成**します（ユーザーが手で組み立てません）。`sample-kit` / `showcase-kit` / `hapbeat-*` は Hapbeat 公式用途に予約されており、コンテンツ開発者は使用しません。

## 「フォルダ名 = manifest.name = wire 上の kit_id」を一本化した理由 (DEC-028)

過去は `manifest.kit_id` と `manifest.name` の 2 フィールドがあり、表記揺れ (`Basic Exam Kit` vs `basic-exam-kit`) で Studio 表示と OS Explorer 表示が一致しない事故が起きていました。2026-04-28 の DEC-028 で `kit_id` を削除し **`name` 1 つに集約**。フォルダ名・JSON・wire payload すべてに同じ文字列を使うルールに統一しました。

wire-protocol 上の `kit_id` field 自体は引き続き存在しますが、その値は常に manifest の `name` と等しいことが物理的に保証されています。

## デプロイの流れ

1. Studio の Library で Kit を編集 (intensity 調整、Fire / Clip / BOTH 切替、clip 追加)
2. Studio が `<kit-name>-manifest.json` と WAV をワーキングディレクトリに書き出し
3. Helper 経由でデバイスの Kit パーティションに転送 (`events` 由来 = Fire 用 WAV のみ。manifest は wire 上で `manifest.json` に rename)
4. `stream_events` 由来の WAV はデプロイ対象外 — 実行時に SDK が直接 UDP で送信

## 関連リンク

- [Fire と Clip の違い](./fire-vs-clip/) — mode の選び方
- [gain の乗算構造](./gain-architecture/) — `intensity` が乗算チェーンのどこに入るか
- [](/docs/tools/studio/kit-design/) — Studio で Kit を作る手順 (howto)
- [](/docs/tools/studio/modes/) — Studio UI 上での mode 切替
