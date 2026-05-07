---
title: Getting Started
description: Hapbeat を初めて使う人のための最短ガイド。Helper インストール → Studio オープン → テンプレート Kit で動作確認。
---

このページでは、Hapbeat を箱から出してから **最初の振動を出すまで** の流れを示します。

## 構成

Hapbeat には **設定・デザインフロー**（Studio + Helper）と、**ゲーム / アプリ実行フロー**（SDK 直結）の 2 系統があります。

![Hapbeat の構成図。左側が設定・デザインフロー（Studio → Helper → Hapbeat デバイス、PC 経由）、右側がゲーム / アプリ実行フロー（Unity SDK / Quest / PC / スマートフォン → Wi-Fi UDP broadcast → Hapbeat デバイス、直結）](/images/hapbeat-sdk-architecture.jpg)

### 設定・デザインフロー（このガイドが対象）

- **Hapbeat Studio**（ブラウザ + ローカルファイル）: 振動波形・ディスプレイ設定・Wi-Fi 設定・ファーム書込みを行う Web アプリ
- **hapbeat-helper**（自動起動サービス）: `pipx install hapbeat-helper` で導入する PC daemon。Studio ↔ TCP / デバイス ↔ UDP / mDNS 自動検出を中継
- **Hapbeat デバイス**（Duo WL / Band WL）: ESP32 固定ランタイム。Kit ライブラリ・触覚出力・Wi-Fi SoftAP/STA・UDP 受信

### ゲーム / アプリ実行フロー

- **Unity SDK**（Quest / PC / スマートフォン）等のアプリが、Wi-Fi UDP broadcast で **Hapbeat に直接** 送信
- onClick / OnCollisionEnter などのイベントを触覚に紐づけるだけで動作
- Studio や Helper はアプリ実行時には **不要**

## 用意するもの

- **PC** (Windows / macOS / Linux のどれか)
- **Chrome または Edge ブラウザ** (Web Serial / File System Access が必要)
- **USB-C ケーブル** (データ通信対応 — 充電専用ケーブル不可)
- **2.4 GHz Wi-Fi**（Hapbeat は 2.4 GHz のみ対応）
- **Hapbeat デバイス** (Necklace / Band)

## Step 1 — Helper をインストール

OS 別の手順は **[hapbeat-helper のインストール](/docs/helper/getting-started/)** を参照してください。要約:

- macOS: `brew install pipx && pipx ensurepath` → `pipx install hapbeat-helper`
- Windows: `py -m pip install --user pipx && py -m pipx ensurepath` → `pipx install hapbeat-helper`

別ターミナルで起動:

```bash
hapbeat-helper start --foreground
```

## Step 2 — Studio を開く

ブラウザで <https://devtools.hapbeat.com/studio/> を開きます。

上部に **「Helper 接続中」** が緑で表示されることを確認してください。出ない場合は Helper が起動していないか、ポート 7703 が塞がれています（[トラブルシューティング](/docs/helper/getting-started/#トラブルシューティング)）。

## Step 3 — ライブラリから振動を再生して動作確認

Studio から Hapbeat に振動が出ることを確認します。Kit の作成や Deploy はこの段階では不要です。

1. **ワーキングディレクトリを選択**（初回のみ）
   画面上部から任意のフォルダを指定します。後で Kit を作成・保存する場所になります。

2. **左パネルのライブラリからテンプレート波形を選択**
   組み込み済みのサンプル波形が一覧表示されます。

3. **再生して Hapbeat が振動することを確認**
   選択した波形を再生すると、接続中の Hapbeat に振動が出力されます。

:::note
Studio が読み書きするのは、ここで指定したワーキングディレクトリ配下のファイルだけです。それ以外のファイル・ディレクトリは一切触りません（ブラウザの File System Access API により、許可していないパスは技術的にもアクセスできない仕組みです）。
:::

## SDK から振動を発火する

ここまでで **Hapbeat 単体での再生環境は整っています**。次は SDK 経由でアプリケーション（ゲーム / VR / インスタレーション）から振動を発火させます。

- **[Unity SDK Getting Started](/docs/unity-sdk/getting-started/)**
- Unreal SDK / Creative Kit — [今後の実装予定](/docs/coming-soon/)

## 次に読むページ

- [アーキテクチャと主要概念](/docs/concepts/) — Event ID / Kit / Group の関係
- [Contracts 仕様](/docs/contracts/overview/) — プロトコル詳細
- [FAQ / トラブルシューティング](/docs/faq/)
