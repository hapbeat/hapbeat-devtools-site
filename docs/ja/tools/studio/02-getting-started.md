---
title: 最初の Kit を作る
kind: tutorial
description: Hapbeat Studio を初めて開いてから、最初の Kit をデバイスに転送するまで。
sidebar:
  order: 2
---

Hapbeat Studio はブラウザ完全クライアントサイドで動作する触覚コンテンツのデザインツールです。波形 (Kit) と UI (OLED / LED) のデザインから、デバイス管理までを 1 つの SPA で扱います。

**起動**: [Hapbeat Studio を開く](https://studio.hapbeat.com/)

## 前提

- 推奨ブラウザ: Chrome / Edge（Web Audio API + WebSocket + IndexedDB + File System Access API を使うため）
- Kit をデバイスに転送する場合は `hapbeat-helper` がインストール・起動されていること（[](/docs/tools/studio/initial-setup/)）
- ファームウェアが書き込まれた Hapbeat デバイスが Wi-Fi 接続されていること

## 1. 作業フォルダを選ぶ

初めて開くと、どのタブでも画面上部に「**まず作業フォルダを選んでください**」という案内が出ます。作業フォルダは、振動クリップ（WAV）と Kit の情報を置くパソコン上のフォルダです。

![初回の画面。画面上部の案内と ① 作業フォルダを選ぶ ボタン](@assets/studio/getting-started-work-folder.png)

1. 新しい空のフォルダを作っておきます（例: ドキュメント内に `Hapbeat`）。
2. ① **作業フォルダを選ぶ** を押し、そのフォルダを選びます。
3. ブラウザから許可を求められたら許可します。

空のフォルダを選ぶと、内蔵のサンプルクリップがフォルダ内の `template/` にコピーされ、Kit タブの Clips 欄に並びます。▶ で試聴できます。

![作業フォルダを選んだ後の Kit タブ。Clips 欄にサンプルの振動クリップが並ぶ](@assets/studio/getting-started-sample-clips.png)

既に WAV が入っているフォルダを選ぶと、その中身をそのまま読み込みます。後から WAV をドラッグ＆ドロップや `+ Import` で追加することもできます。

次回からは同じフォルダを開きます。ブラウザの許可が切れているときは「前回の作業フォルダを開いてください」と表示されるので、**「（フォルダ名）」を開く** を押して許可します。

> 💡 必要に応じて **Kit フォルダ** も別途設定できます (Kit パネル右上の `+ Kit` チップ)。例えば Unity プロジェクトの `<Project>/Assets/HapbeatSDK/Kits/` を指定すると、Studio が作る Kit が Unity SDK 側で直接読まれます。指定しない場合は作業フォルダの中に Kit フォルダが作られます。

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

最初は **FIRE** から始めるのが簡単です。Kit ヘッダーの **「モード説明」** ボタンで詳細ヘルプを開けます。詳細は [Mode を切り替える](/docs/tools/studio/modes/)。

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

- [](/docs/tools/studio/ui-overview/) — 各パネル・タブの役割
- [](/docs/tools/studio/kit-design/) — Kit ビルドと配布の詳しい手順
- [](/docs/tools/studio/modes/) — FIRE / CLIP / BOTH の使い分け
- [](/docs/tools/studio/shortcuts/)
