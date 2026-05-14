---
title: Mode の切り替え方（FIRE / CLIP）
kind: howto
sidebar:
  order: 400
description: Studio で各 Event の再生 mode を切り替える手順と、Studio 固有の制約。
---

Studio では各 Event の再生 mode (`command` / `stream_clip` / `stream_source`) を Library パネルから切り替えられます。このページは **Studio UI 上での操作と Studio 固有の制約** を扱います。Mode の本質的な違いとどちらを選ぶべきかは [Fire と Clip — どちらで送るか](/docs/concepts/fire-vs-clip/) を参照してください。

## Studio 上の表示

Library パネルの各 Event は以下のラベルで mode を示します。

| Studio 表示 | manifest 内部値 | 通称 |
|---|---|---|
| `▶ FIRE` | `command` | Fire |
| `♪ CLIP` | `stream_clip` | Clip |

## 切り替え手順

1. Studio の Library パネルで対象 Event を選択
2. Mode ドロップダウンから希望の mode を選択
3. Library 全体の保存 (デバウンス自動保存) でファイルに反映

mode を切り替えると **WAV の置き場所も自動的に切り替わる** ことに注意してください。

- `command` (FIRE) → `install-clips/<filename>.wav`
- `stream_clip` (CLIP) → `stream-clips/<filename>.wav`

Studio がワーキングディレクトリ上で適切な場所に移動します。

## Studio 固有の制約

### WAV は 16 kHz PCM16 mono に正規化される

Kit ビルド時に Studio が自動でリサンプル & ダウンミックスします (FIRE / CLIP 共通)。

- ステレオ素材は L/R をミックスダウンして mono 化
- 16 kHz 以外のサンプルレートは 16 kHz にリサンプル
- 浮動小数点や 24/32 bit PCM は 16 bit signed PCM (PCM16) に変換

### FIRE は Kit パーティション容量に依存

`install-clips/` 配下の WAV はデバイスのストレージに焼き込まれるため、容量に上限があります (数 MB 程度)。長尺ファイルは:

- 分割して短いクリップにする
- または mode を CLIP に切り替えてストリーミングにする

### CLIP は Wi-Fi 接続中のみ再生可能

Studio から CLIP を再生テストするときは、Helper 接続 + デバイスの Wi-Fi 接続が前提です。Helper を経由せずに SDK から直接ストリーミングする場合は [Fire と Clip](/docs/concepts/fire-vs-clip/) を参照。

## 関連リンク

- [Fire と Clip — どちらで送るか](/docs/concepts/fire-vs-clip/) — mode 選択の判断材料 (概念)
- [Kit デザインガイド](./kit-design/) — Studio で Kit を組み立てる手順
- [Event ID と Kit の構造](/docs/concepts/event-id-and-kit/) — `events` 辞書と mode フィールドの spec
