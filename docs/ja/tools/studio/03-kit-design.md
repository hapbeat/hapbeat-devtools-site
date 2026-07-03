---
title: Kit を作って配布する
kind: howto
sidebar:
  order: 200
description: Hapbeat Studio で Kit を作成・編集してデバイスにデプロイするまでの手順。
---

このページは **Studio UI 上で Kit を組み立てる作業手順** に絞ります。Kit の構造や Event ID 命名規則・manifest の意味は [](/docs/concepts/event-id-and-kit/)、gain の乗算は [](/docs/concepts/gain-architecture/) を参照してください。

## 前提

- Hapbeat Studio が `studio.hapbeat.com/` で開けること
- ヘッダーの **Helper 接続中**（緑バッジ）が表示されていること（デプロイに必要）
- Hapbeat デバイスが同じ Wi-Fi に接続済みで Studio の Manage タブから見えていること

## 1. Library フォルダと Kit フォルダ

Studio は WAV 素材を **Library フォルダ** で管理し、Kit のビルド成果物を **Kit フォルダ** に出力します。

| 役割 | 場所 |
|---|---|
| Library | クリップパネル右上 `+ Library` チップで指定。WAV 素材の置き場 |
| Kit フォルダ | Kit パネル右上 `+ Kit` チップで指定 (任意)。指定しなければ Library フォルダ直下に Kit が作られる |

**Unity プロジェクトと連携** するときは Kit フォルダに `<Project>/Assets/HapbeatSDK/Kits/` を指定すると、Unity SDK 側で Kit を first-class asset として直接読めます (推奨)。

## 2. 新規 Kit を作成

Kit パネルの **入力欄 + Create** で Kit 名を入力（例: `my-game-kit`）。

Kit 名は **フォルダ名 + manifest.name + Event ID の prefix の 3 か所** で同じ文字列が使われます。命名規則は `^[a-z][a-z0-9-]*$` (英小文字始まり / 英数字とハイフン)。違反文字は入力時点で除去されます。

## 3. クリップを追加

Library から **`+ Kit` ボタン** か **ドラッグ＆ドロップ**、または **Enter** で選択中のクリップをアクティブ Kit に追加します。

追加された Kit Event は Library のクリップとは **独立した copy** です (audio bytes も含めて Kit 側にスナップショット)。Library で後からクリップを rename / archive しても、Kit 内のイベントには影響しません。

各 Kit Event カードでは:

| 設定 | 説明 |
|---|---|
| **intensity** (Amp スライダー) | 基準振動強度 (0.0〜1.0)。Kit 設計時の "標準の強さ" として記録される ([](/docs/concepts/gain-architecture/) の基準値) |
| **Mode** | `> FIRE` / `♪ CLIP` / `>♪ BOTH` の 3-button radio。詳細: [Mode を切り替える](/docs/tools/studio/modes/) |
| **Edit** | モーダルで Note / Event ID を確認・編集 |
| **Swap** | クリップ名 ↔ Note を入れ替え (素材ファイル名を一時退避してリネームしたいときに便利) |
| **×** | Kit から削除 (元の Library クリップは消えない) |

Kit ヘッダーの **一括変更…** セレクトで、Kit 内全 Event を `FIRE / CLIP / BOTH` 一括切替もできます。

## 4. Save Folder と Deploy

Kit パネル下部にボタンが 2 つ並びます。

| ボタン | 動作 | 必要なもの |
|---|---|---|
| **Save Folder** | `manifest.json` + WAV を Kit フォルダに書き出す。デバイスには送らない | Library / Kit Folder のみ |
| **Deploy** | Save Folder と同じビルドを行い、その zip を Helper 経由でデバイスに転送 | + Helper + デバイス |

**動作の仕組み**:

- `command` (FIRE) モードのクリップは `install-clips/` 配下の WAV に置かれ、デバイス flash に焼かれる
- `stream_clip` (CLIP) モードの WAV は `stream-clips/` 配下に置かれ、デプロイ対象外 (実行時に SDK / Helper が UDP ストリーミング送信)
- `BOTH` モードは同じ base eventId のまま、`events` (FIRE) と `stream_events` (CLIP) の両 bucket に entry が並ぶ

**パフォーマンス**: 前回保存以降に音声が変わっていない event は WAV 再エンコードがキャッシュで skip されます。Amp / intensity / device_wiper を触っただけのケースは manifest 書き換えだけで完了するため高速です。

**Kit メタの自動保存**: Kit 名 / events 配列 / intensity などのメタデータ (`kits-meta.json`) は編集アクションごとに自動保存されます。ただし **Kit フォルダ内の WAV / manifest.json は Save Folder か Deploy を押すまで書き換わりません** (2026-05-25 で per-edit auto-flush を廃止)。

## 5. Test Play で確認

Studio で Kit Event を選択して **Space** で再生。Helper + デバイス接続済なら振動を実機で確認、未接続ならブラウザ音声でプレビューします。実機装着時は **← / →** で intensity を ±5% ずつ動かしながら詰めるのが速いです。

## intensity の決め方 (Tips)

- 全イベントを **同じ intensity** から始めて、SDK 側 gain で相対調整するのがシンプル
- 衝撃音など「最大付近で鳴らしたい」クリップは `0.8〜1.0` を目安
- 環境音・通知系などは `0.3〜0.5` を目安
- 実機に装着して感覚で詰める (PC スピーカーやノートで判断しない)

詳細な乗算チェーンは [](/docs/concepts/gain-architecture/) を参照。

## ファイル形式について

Studio が Save Folder / Deploy 時に自動で整形します。**入力 WAV のフォーマットは気にせず** 任意のサンプルレート / ビット深度 / チャンネル数の WAV を放り込めます。

| 出力先 | フォーマット |
|---|---|
| `install-clips/` (FIRE) | **16 kHz PCM16**, **元クリップのチャンネル数を保持** (mono → mono, stereo → stereo) |
| `stream-clips/` (CLIP) | **16 kHz PCM16 stereo** (SDK 側が常に stereo を仮定するため強制 stereo 化) |

浮動小数点 / 24/32 bit / 44.1/48 kHz などは自動で 16 kHz PCM16 に変換されます。

## 関連リンク

- [](/docs/concepts/event-id-and-kit/) — Kit / manifest / Event ID の概念
- [Mode を切り替える](/docs/tools/studio/modes/) — FIRE / CLIP / BOTH の Studio 上の操作
- [](/docs/concepts/fire-vs-clip/) — mode 選択の判断材料
- [](/docs/concepts/gain-architecture/) — intensity が乗算チェーンのどこに入るか
