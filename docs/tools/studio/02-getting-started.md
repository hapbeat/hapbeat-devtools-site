---
title: 最初の Kit を作る
kind: tutorial
description: Hapbeat Studio を初めて開いてから、最初の Kit をデバイスに転送するまで。
sidebar:
  order: 2
---

Hapbeat Studio はブラウザ完全クライアントサイドで動作する触覚コンテンツのデザインツールです。波形 (Kit) と UI (OLED / LED) のデザインから、デバイス管理までを 1 つの SPA で扱います。

**起動**: [Hapbeat Studio を開く](https://devtools.hapbeat.com/studio/)

## 前提

- 推奨ブラウザ: Chrome / Edge（Web Audio API + WebSocket + IndexedDB + File System Access API を使うため）
- Kit をデバイスに転送する場合は `hapbeat-helper` がインストール・起動されていること（[初期セットアップ](/docs/tools/studio/initial-setup/)）
- ファームウェアが書き込まれた Hapbeat デバイスが Wi-Fi 接続されていること

## 1. Library フォルダを開く

初回起動時に「Library フォルダを選択してください」と表示されます。Library は **WAV 素材（クリップ）の置き場** です。任意のフォルダを選択してください。

サンプル素材は内蔵されており、空フォルダを選ぶと自動でコピーされます。後からドラッグ＆ドロップで WAV を追加することもできます。

> 💡 必要に応じて **Kit フォルダ** も別途設定できます (Kit パネル右上の `+ Kit` チップ)。例えば Unity プロジェクトの `<Project>/Assets/HapbeatSDK/Kits/` を指定すると、Studio が作る Kit が Unity SDK 側で直接読まれます。指定しない場合は Library フォルダ直下に Kit フォルダが作られます。

## 2. Kit を新規作成

Kit パネル上部の入力欄に Kit 名を入力 → **Create** ボタン (または Enter)。

Kit 名は `^[a-z][a-z0-9-]*$` (英小文字始まり / 英数字とハイフン) のみ。違反文字は入力時点で自動的に弾かれます。

## 3. クリップを Kit に追加

Library のクリップカードを **`+ Kit` ボタン** で追加するか、ドラッグして Kit パネルにドロップします。キーボードでは Library 内のクリップを選択して **Enter** でアクティブ Kit に追加できます。

追加された Kit Event の Event ID は `<kit-name>.<clip-name>` 形式で自動合成されます。

## 4. Mode を選択

Kit Event 行の Mode セレクタで再生方式を選びます。

| Mode | 表示 | 用途 |
|------|------|-----|
| **FIRE** (command) | `> FIRE` | 短い one-shot。Event ID と強度だけを送り、デバイス内蔵 WAV を再生 |
| **CLIP** (stream_clip) | `♪ CLIP` | やや長め / 動的変調。Helper または SDK が PCM をストリーミング送信 |
| **BOTH** (command + stream_clip) | `>♪ BOTH` | 開発中に FIRE と CLIP の両方を試したいときに 1 event で両 entry を出力 |

最初は **FIRE** から始めるのが簡単です。Kit ヘッダーの **「モード説明」** ボタンで詳細ヘルプを開けます。詳細は [Mode を切り替える](./modes/)。

## 5. 強度（Intensity）を調整

各 Kit Event カードの Amp スライダーで基準振動強度 (0–100%) を設定します。キーボードでは選択中の Event で **← / →** で ±5% 調整できます。

## 6. キーボードで試聴

Kit Event を選択して **Space** で再生 / 停止。**↑ / ↓** で前後の Event に移動できます。

- Helper + デバイスが接続済 → デバイスから振動を確認
- 未接続 → ブラウザ音声で波形を確認

## 7. Save Folder と Deploy

Kit の編集はメタデータ (kits-meta.json) として自動保存されますが、**Kit フォルダへの WAV / manifest.json の書き出しは明示操作** に変わりました (2026-05-25)。Kit パネル下部にボタンが 2 つ並びます。

| ボタン | 動作 |
|---|---|
| **Save Folder** | ローカルの Kit フォルダに `manifest.json` + WAV を書き出す。Helper / デバイス不要 |
| **Deploy** | Save Folder と同じビルドを実行し、その zip を Helper 経由でデバイスに転送 |

Save Folder はローカル保存だけ、Deploy はデバイスにも送るという関係です。Amp / intensity / device_wiper のみ変更したときは WAV の再エンコードがキャッシュで skip されるため高速です。

## 8. 実機で Event を発火

- Studio: Kit Event を選択して Space (FIRE / CLIP どちらでも)
- SDK: Event ID を送信
- Manage タブ → Kit サブタブからインストール済 Kit の Event を発火テスト

## 次のステップ

- [画面構成](/docs/tools/studio/ui-overview/) — 各パネル・タブの役割
- [Kit を作って配布する](/docs/tools/studio/kit-design/) — Kit ビルドと配布の詳しい手順
- [Mode を切り替える](/docs/tools/studio/modes/) — FIRE / CLIP / BOTH の使い分け
- [ショートカット一覧](/docs/tools/studio/shortcuts/)
