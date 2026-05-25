---
title: Kit を作って配布する
kind: howto
sidebar:
  order: 200
description: Hapbeat Studio で Kit を作成・編集してデバイスにデプロイするまでの手順。
---

このページは **Studio UI 上で Kit を組み立てる作業手順** に絞ります。Kit の構造や Event ID 命名規則・manifest の意味は [Event ID と Kit](/docs/concepts/event-id-and-kit/)、gain の乗算は [gain の乗算構造](/docs/concepts/gain-architecture/) を参照してください。

## 前提

- Hapbeat Studio が `devtools.hapbeat.com/studio/` で開けること
- `hapbeat-helper` が起動していて、Studio と接続済みであること (デプロイに必要)
- Hapbeat デバイスが同じ Wi-Fi に接続済みで Studio から見えていること

## 1. ワーキングディレクトリを開く

Studio → **Kit タブ** → フォルダ選択で、Kit ファイルを置くディレクトリを指定します。

- **Unity プロジェクトと連携** したいときは `<Project>/Assets/HapbeatSDK/Kits/` を選ぶと、Unity SDK 側で Kit を first-class asset として扱えます (推奨)
- スタンドアロンで使うときは任意のフォルダで構いません

## 2. 新規 Kit を作成

Kit 一覧の **+ New Kit** → Kit 名を入力 (例: `my-game-kit`)。

Kit 名は **フォルダ名 + manifest.name + Event ID の prefix の 3 か所** で同じ文字列が使われます (DEC-028)。命名規則は `^[a-z][a-z0-9-]*$` (英小文字始まり / 英数字とハイフン)。

## 3. クリップを追加

Kit を選択 → **+ Add Clip** で WAV ファイルを追加。クリップごとに次を設定します。

| 設定 | 説明 |
|---|---|
| **intensity** | 基準振動強度 (0.0〜1.0)。Kit 設計時の "標準の強さ" として記録される ([gain の乗算構造](/docs/concepts/gain-architecture/) の基準値) |
| **mode** | `command` (Fire) / `stream_clip` (Clip) のいずれか。詳細: [Mode を切り替える](./modes/) |

クリップ名はそのまま Event ID の後半になります (`<kit-name>.<clip-name>`)。

## 4. デバイスにデプロイ

**Manage タブ** → デバイスを選択 → **Kit サブタブ** → **Deploy**。

- `command` (Fire) モードのクリップは `install-clips/` の WAV がデバイスに転送される
- `stream_clip` (Clip) モードの WAV は実行時にストリーミングするのでデプロイ対象外

## 5. Test Play で確認

Studio の Library で Event を選択し、▶ ボタンで再生テスト。デバイスが装着されている状態で intensity を実機確認しながら微調整します。

## intensity の決め方 (Tips)

- 全イベントを **同じ intensity** から始めて、SDK 側 gain で相対調整するのがシンプル
- 衝撃音など「最大付近で鳴らしたい」クリップは `0.8〜1.0` を目安
- 環境音・通知系などは `0.3〜0.5` を目安
- 実機に装着して感覚で詰める (PC スピーカーやノートで判断しない)

詳細な乗算チェーンは [gain の乗算構造](/docs/concepts/gain-architecture/) を参照。

## ファイル形式について

Kit ビルド時に Studio が自動でリサンプル & ダウンミックスします:

- ステレオ素材は L/R をミックスダウンして mono 化
- 16 kHz 以外のサンプルレートは 16 kHz にリサンプル
- 浮動小数点や 24/32 bit PCM は PCM16 に変換

つまり **入力 WAV のフォーマットは気にせず** 任意の WAV を放り込めます。

## 関連リンク

- [Event ID と Kit](/docs/concepts/event-id-and-kit/) — Kit / manifest / Event ID の概念
- [Mode を切り替える](./modes/) — FIRE / CLIP の Studio 上の操作
- [Fire と Clip の違い](/docs/concepts/fire-vs-clip/) — mode 選択の判断材料
- [gain の乗算構造](/docs/concepts/gain-architecture/) — intensity が乗算チェーンのどこに入るか
- [Kit format 仕様](https://github.com/Hapbeat/hapbeat-contracts/blob/master/specs/kit-format.md) — manifest.json の完全スキーマ
