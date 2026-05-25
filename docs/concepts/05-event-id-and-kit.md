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

Kit は **触覚波形 (WAV) + メタデータ (`manifest.json`)** を 1 つにまとめたフォルダです。Studio で作成し、Helper 経由で Hapbeat デバイスに転送します。

```
my-game/                  ← Kit フォルダ (= kit-name)
  manifest.json           ← イベント定義・基準 intensity
  install-clips/          ← Fire (command) モード用 WAV
    sword-hit.wav
    footstep-grass.wav
  stream-clips/           ← Clip (stream_clip / stream_source) モード用 WAV
    bgm-tension.wav
```

`install-clips/` と `stream-clips/` の使い分けは [Fire と Clip の違い](./fire-vs-clip/) を参照。「install されてデバイスに残る」「stream として都度送る」という動詞対比で覚えると直感的です。

## manifest.json の主なフィールド

`events` は **Event ID をキーとしたオブジェクト (辞書)** です (配列ではない点に注意)。

```json
{
  "name": "my-game",
  "version": "1.0.0",
  "target_device": {
    "firmware_version_min": "0.1.0",
    "board": "duo_wl_v3"
  },
  "events": {
    "my-game.sword-hit": {
      "mode": "command",
      "clip": "sword-hit.wav",
      "parameters": {
        "intensity": 0.8
      }
    }
  }
}
```

| フィールド | 必須 | 意味 |
|---|---|---|
| `name` | ✓ | Kit 名。**on-disk のフォルダ名と同じ文字列を使う**。wire 上の `kit_id` payload と同値 ([DEC-028](https://github.com/Hapbeat/hapbeat-sdk-workspace/blob/master/docs/decision-log.md#DEC-028)) |
| `version` | ✓ | Kit のバージョン (semver 推奨) |
| `target_device.firmware_version_min` | ✓ | 必要なファームウェアの最低バージョン |
| `target_device.board` | — | 想定基板識別子 (例: `duo_wl_v3` / `neck_wl_v2`)。ファームのメタ情報と食い違うと warning |
| `events[<id>].mode` | — | 既定 `command`。他: `stream_clip` / `stream_source` |
| `events[<id>].clip` | 条件付き | mode=command では必須で `install-clips/` 配下の bare filename。stream_* では optional で Kit ルートからの相対パス (`stream-clips/...`) |
| `events[<id>].parameters.intensity` | — | 基準振動強度 0.0〜1.0 ([gain の乗算構造](./gain-architecture/) の基準値) |
| `events[<id>].parameters.device_wiper` | — | MCP4018 wiper 値 (0..127)。authoring 時の強度を再現するための参照情報 |

完全な schema は [kit-format spec](https://github.com/Hapbeat/hapbeat-contracts/blob/master/specs/kit-format.md) を参照。

## Event ID の命名規則

Event ID は触覚イベントを一意に識別する文字列です。

```
基本形式:        <category>.<name>
拡張形式:        <category>.<subcategory>.<name>
名前空間付き:    <namespace>/<category>.<name>
```

| 規則 | 値 |
|---|---|
| 使用可能文字 | 英小文字 `a-z` / 数字 `0-9` / ハイフン `-` / アンダースコア `_` |
| 先頭文字 | 英字で始まる |
| カテゴリ区切り | `.` (ドット) |
| 名前空間区切り | `/` (スラッシュ) |
| 各セグメント長 | 1〜64 文字 |
| 最大階層深度 | 名前空間含めて 4 セグメントまで |

実例:

```
my-game.sword-hit                  ← <category>.<name>
my-game.impact.heavy               ← <category>.<subcategory>.<name>
red-team/impact.hit                ← <namespace>/<category>.<name>
basic-exam-kit.sine_100hz_1s       ← Studio が auto-sync で生成する典型形
```

Unity SDK の EventMap ウィンドウでは **Kit 名 + clip ファイル名から自動合成** するワークフローが既定で、結果として `<kit-name>.<clip-name>` 形式に揃いますが、これは命名の **慣習** であって spec が強制する形ではありません。意味的に整理したいときは subcategory や namespace を活用できます。

## 「フォルダ名 = manifest.name = wire 上の kit_id」を一本化した理由 (DEC-028)

過去は `manifest.kit_id` と `manifest.name` の 2 フィールドがあり、表記揺れ (`Basic Exam Kit` vs `basic-exam-kit`) で Studio 表示と OS Explorer 表示が一致しない事故が起きていました。2026-04-28 の DEC-028 で `kit_id` を削除し **`name` 1 つに集約**。フォルダ名・JSON・wire payload すべてに同じ文字列を使うルールに統一しました。

wire-protocol 上の `kit_id` field 自体は引き続き存在しますが、その値は常に manifest の `name` と等しいことが物理的に保証されています。

## デプロイの流れ

1. Studio の Library で Kit を編集 (intensity 調整、mode 切替、clip 追加)
2. Studio が `manifest.json` と WAV をワーキングディレクトリに書き出し
3. Helper 経由でデバイスの Kit パーティションに転送 (`command` mode 用 WAV)
4. `stream_clip` / `stream_source` 用 WAV はデプロイ対象外 — 実行時に SDK / Helper が直接送信

## 関連リンク

- [Fire と Clip の違い](./fire-vs-clip/) — mode の選び方
- [gain の乗算構造](./gain-architecture/) — `intensity` が乗算チェーンのどこに入るか
- [Kit を作って配布する](/docs/tools/studio/kit-design/) — Studio で Kit を作る手順 (howto)
- [Mode を切り替える](/docs/tools/studio/modes/) — Studio UI 上での mode 切替
