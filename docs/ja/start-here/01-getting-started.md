---
title: Getting Started
kind: tutorial
sidebar:
  order: 1
description: Hapbeat を初めて使う人のための最短ガイド。Helper インストール → Studio オープン → Wi-Fi 設定 → ライブラリ再生で動作確認。
---

このページでは、**Studio + Wi-Fi UDP 経由で、無線版 Hapbeat (Duo WL / Band WL) から振動を出すまで** の流れを示します。

## Hapbeat SDK 構成

Hapbeat SDK には **設定・デザインフロー**（Studio + Helper）と、**ゲーム / アプリ実行フロー**（SDK 直結）の 2 系統があります。

![Hapbeat の構成図。左側が設定・デザインフロー（Studio → Helper → Hapbeat デバイス、PC 経由）、右側がゲーム / アプリ実行フロー（Unity SDK / Quest / PC / スマートフォン → Wi-Fi UDP broadcast → Hapbeat デバイス、直結）](@assets/architecture/hapbeat-sdk-architecture.svg)

### 設定・デザインフロー（このページ）

- **Hapbeat Studio**（ブラウザ + ローカルファイル）: 振動波形・ディスプレイ設定・Wi-Fi 設定・ファーム書込みを行う Web アプリ
- **hapbeat-helper**（CLI daemon）: `pipx install hapbeat-helper` で導入する PC daemon。Studio ↔ TCP / デバイス ↔ UDP / mDNS 自動検出を中継
- **Hapbeat**（Duo WL / Band WL）: ESP32 固定ランタイム。Kit ライブラリ・触覚出力・Wi-Fi SoftAP/STA・UDP 受信

### ゲーム / アプリ実行フロー

- **Unity SDK** 等の SDKによって、Quest / PC / スマートフォン等から Wi-Fi UDP broadcast で触覚イベントをHapbeat に Wi-Fi 経由で送信
- onClick / OnCollisionEnter などのイベントを触覚に紐づけるだけで動作
- ※Studio や Helper はアプリ実行時には **不要**

### 用意するもの

- **PC** (Windows / macOS)
- **Python 3.9 以上**（インストール済みか事前に確認してください）
  - 無い場合は公式よりDL→ https://www.python.org/downloads/
- **Chrome または Edge ブラウザ** (Web Serial / File System Access が必要)
- **USB-C ケーブル** (データ通信対応 — 充電専用ケーブル不可)
- **2.4 GHz Wi-Fi LAN**（Hapbeat は 2.4 GHz のみ対応）
- **Hapbeat** (Duo WL / Band WL)

---

## Step 1 — Helper をインストール

コマンドプロンプト / PowerShell（Windows）またはターミナル（macOS）を開き、以下を実行します。**実行するディレクトリはどこでも構いません。**

**Windows:**
```bash
py -m pip install --user pipx && py -m pipx ensurepath
pipx install hapbeat-helper
```

**macOS:**
```bash
brew install pipx && pipx ensurepath
pipx install hapbeat-helper
```


インストール後、以下のコマンドで Helper を起動します:

```bash
hapbeat-helper start
```

OS 別の詳細手順やトラブルシューティングは **[](/docs/tools/helper/getting-started/)** を参照してください。

:::tip[自動起動（常駐）]
毎回コマンドを打たずに PC 起動時に Helper を自動起動させることもできます。
詳細は [](/docs/tools/helper/getting-started/) を参照してください。
:::

---

## Step 2 — Studio を開く

ブラウザで [https://devtools.hapbeat.com/studio/](https://devtools.hapbeat.com/studio/) を開きます。

画面上部に **「Helper 接続中」** が緑で表示されることを確認してください。表示されない場合は Helper が起動していないか、ポート 7703 が塞がれています（[](/docs/tools/helper/getting-started/#トラブルシューティング)）。

:::note[Chrome / Edge のみ対応]
Safari や Firefox では Web Serial / File System Access API が使えないため、デバイスへの書き込みができません。Chrome または Edge をお使いください。
:::

---

## Step 3 — Hapbeat の Wi-Fi 設定と UI 書込み

Hapbeat を PC と同じ Wi-Fi に接続し、ディスプレイ UI を書き込みます。

1. **USB-C ケーブルで PC と Hapbeat を接続します。**

2. **Studio の Manage タブを開き、画面の指示に従います。**
   Studio で [USB Serial で接続] を押下し、Hapbeat とシリアル接続します。指示に従って、Studio を開いている PC と同じ Wi-Fi ネットワークに Hapbeat を接続してください。

   <small>※ シリアル接続しても応答がない場合は、先に [](/docs/tools/studio/initial-setup/) でファームウェアを書き込んでください。</small>

3. **UI タブを開き、デバイスを選択して「デバイスに書き込む」を押します。**
   これでディスプレイ UI が Hapbeat に書き込まれます。※シリアル接続では書き込むことはできません。

![gs-step3](@assets/getting-started/gs-step3.png)

:::note
以後、基本的に USB ケーブルは不要になります。SDK 各種は Wi-Fi に接続されている状態での使用を前提としており、USB ケーブルは Wi-Fi 接続のために使用します。
:::

---

## Step 4 — ライブラリから振動を再生して動作確認

Studio から Wi-Fi UDP 経由で Hapbeat に振動が出ることを確認します。Kit の作成や Deploy はこの段階では不要です。

1. **ワーキングディレクトリを選択**（初回のみ）
   左側パネルの [Choose Folder] を押下し、PC内の任意のフォルダを指定します。後で Kit を作成・保存する場所になります。

2. **左パネルのライブラリからテンプレート波形を選択します。**
   組み込み済みのサンプル波形が一覧表示されます。

3. **再生して Hapbeat が振動することを確認します。**

**Hapbeat が振動すれば動作確認完了です。** このまま Unity SDK に進められます。

![gs-step4](@assets/getting-started/gs-step4.jpg)


:::note
Studio が読み書きするのは、ここで指定したワーキングディレクトリ配下のファイルだけです。それ以外のファイル・ディレクトリは一切触りません（ブラウザの File System Access API により、許可していないパスは技術的にもアクセスできない仕組みです）。
:::

:::caution[再生から振動するまで明らかな遅延が生じる場合]
波形を再生してから振動するまでの遅延は数ミリ秒程度で、 **クリックとほぼ同時に振動する** のが正常です。

「ボタンを押してから明らかに 0.5〜数秒遅れて振動が来る」「振動が来ないことがある」場合は **正常ではありません**。helper を起動した状態で、PC スリープ復帰後など、特定の状況下でこの症状が起きる場合があります。原因は調査中ですが、以下の手順で復旧できます。

1. タスクトレイの Helper を終了する (または `hapbeat-helper stop`)
2. 再起動 (`hapbeat-helper start`)
3. Studio をブラウザでリロード
:::


---

## 次のステップ — SDK からアプリに組み込む

ここまでで Hapbeat 単体での再生環境が整っています。次は SDK 経由でアプリケーション（ゲーム / VR / インスタレーション）から振動を発火させます。

:::tip[➡ Unity SDK で始める]
**[](/docs/sdk-integration/unity-sdk/getting-started/)**

新規 Unity プロジェクトに SDK をインストールし、サンプルシーンから振動を出すまでの最短ガイドです。
:::

Unreal SDK / Creative Kit 等は [](/docs/support/coming-soon/) を参照してください。

## 次に読むページ

設計を深く理解したい人向け:

- [](/docs/concepts/architecture/) — Studio / Helper / SDK / Firmware の役割分担
- [](/docs/concepts/communication-model/) — Wi-Fi UDP broadcast と ESP-NOW
- [](/docs/concepts/gain-architecture/) — Studio と SDK の責務分離

リファレンス・トラブル対応:

- [](/docs/concepts/contracts/overview/) — プロトコル詳細
- [](/docs/support/faq/)
