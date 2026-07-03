---
title: Mode を切り替える
kind: howto
sidebar:
  order: 400
description: Studio で各 Event の再生 mode を切り替える手順と、Studio 固有の制約。
---

Studio では各 Kit Event の再生 mode (`command` / `stream_clip` / 両方) を選べます。このページは **Studio UI 上での操作と Studio 固有の制約** を扱います。Mode の本質的な違いとどちらを選ぶべきかは [](/docs/concepts/fire-vs-clip/) を参照してください。

## Studio 上の表示

Kit Event 行には 3-button radio で mode を選びます。

| Studio 表示 | manifest 内部値 | 通称 | 主な用途 |
|---|---|---|---|
| `> FIRE` | `mode: command` | Fire | 短い one-shot、本番運用 |
| `♪ CLIP` | `mode: stream_clip` | Clip | 長尺・動的変調・プロトタイピング |
| `>♪ BOTH` | `mode: command` + `stream_clip` | Both | 開発段階で両方を試したいとき |

Kit ヘッダーの **「モード説明」** ボタンを押すと、それぞれの挙動と「何が wire を流れるか」を 1 画面にまとめたモーダルが開きます。

## 切り替え手順

1. Kit パネルで対象 Event を選択
2. 行右側の mode pill (`> FIRE` / `♪ CLIP` / `>♪ BOTH`) をクリック
3. **Save Folder** か **Deploy** を押すと、WAV の置き場 (`install-clips/` ↔ `stream-clips/`) も自動的に再構成されます

Kit ヘッダーの **「一括変更…」** セレクトを使えば、Kit 内全 Event を `FIRE` / `CLIP` / `BOTH` のどれかに一括切り替えできます。

## BOTH モードの挙動

BOTH を選ぶと、同じ base eventId に対して **manifest に 2 entry** が出力されます。

```
events: {
  "my-game.sword-hit": { mode: "command", clip: "sword-hit.wav", ... }
},
stream_events: {
  "my-game.sword-hit": { mode: "stream_clip", clip: "stream-clips/sword-hit.wav", ... }
}
```

両 bucket に同名で並ぶため、SDK 側は通常通り 1 つの Event ID を呼ぶだけで、状況に応じて FIRE / CLIP どちらの transport も選べます。WAV は両側 (`install-clips/` と `stream-clips/`) に出力されます。

> 💡 BOTH は **開発段階のための便利機能** です。本番出荷時は基本的に Event ごとに transport を 1 つに決めるのを推奨します (リソース節約と挙動の予測性のため)。

## Studio 固有の制約

### WAV は mode ごとに別フォーマットに整形される

Save Folder / Deploy 時に Studio が以下のフォーマットに変換します。

| 出力先 | フォーマット |
|---|---|
| `install-clips/` (FIRE) | 16 kHz PCM16、**元クリップのチャンネル数を保持** (mono → mono, stereo → stereo) |
| `stream-clips/` (CLIP) | 16 kHz PCM16、**常に stereo** (SDK 側が stereo を仮定するため) |

入力 WAV のサンプルレート / ビット深度は問わない (浮動小数点や 24/32 bit, 44.1/48 kHz でも自動で変換)。

### FIRE は Kit パーティション容量に依存

`install-clips/` 配下の WAV はデバイスのストレージに焼き込まれるため、容量に上限があります (数 MB 程度)。Kit ヘッダーの容量ゲージで現在の使用量を確認できます。長尺ファイルは:

- 分割して短いクリップにする
- または mode を CLIP に切り替えてストリーミングにする

### CLIP は Wi-Fi 経由のストリーミング

Studio から CLIP を再生テストするときは、Helper 接続 + デバイスの Wi-Fi 接続が前提です。Helper を経由せずに SDK から直接ストリーミングする場合は [](/docs/concepts/fire-vs-clip/) を参照。

## 関連リンク

- [](/docs/concepts/fire-vs-clip/) — mode 選択の判断材料 (概念)
- [Kit を作って配布する](/docs/tools/studio/kit-design/) — Studio で Kit を組み立てる手順
- [](/docs/concepts/event-id-and-kit/) — `events` / `stream_events` 辞書と mode フィールドの spec
