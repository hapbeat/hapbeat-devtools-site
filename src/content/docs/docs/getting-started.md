---
title: Getting Started
description: Hapbeat を初めて使う人のための 5 分ガイド。Helper インストール → Studio オープン → デバイス初期設定 → 最初の Kit。
---

このページでは、Hapbeat を箱から出してから **最初の振動を出すまで** の流れを 5 分で示します。

## 構成

Hapbeat の利用には次の 3 つが揃う必要があります:

```
ブラウザ (Studio: https://devtools.hapbeat.com/studio/)
        │  ws://localhost:7703
        ▼
hapbeat-helper (PC 上のローカル daemon)
        │  Wi-Fi LAN 経由
        ▼
   Hapbeat デバイス
```

- **Hapbeat Studio**: 振動コンテンツのデザイン + デバイス管理を行う Web アプリ。インストール不要、ブラウザで開くだけ
- **hapbeat-helper**: PC 上で動かすローカル daemon。ブラウザだけでは行えない mDNS 検出 / UDP broadcast / TCP を Studio に提供する
- **Hapbeat デバイス**: Wi-Fi LAN にぶら下がる本体

## 用意するもの

- **PC** (Windows / macOS / Linux のどれか)
- **Chrome または Edge ブラウザ** (Web Serial / File System Access が必要)
- **USB-C ケーブル** (データ通信対応 — 充電専用ケーブル不可)
- **2.4 GHz Wi-Fi**（Hapbeat は 2.4 GHz のみ対応）
- **Hapbeat デバイス** (Necklace / Band)

## Step 1 — Helper をインストール (3 分)

OS 別の手順は **[hapbeat-helper のインストール](/docs/helper/getting-started/)** を参照してください。要約:

- macOS: `brew install pipx && pipx ensurepath` → `pipx install hapbeat-helper`
- Windows: `py -m pip install --user pipx && py -m pipx ensurepath` → `pipx install hapbeat-helper`

別ターミナルで起動:

```bash
hapbeat-helper start --foreground
```

## Step 2 — Studio を開く (10 秒)

ブラウザで <https://devtools.hapbeat.com/studio/> を開きます。

上部に **「Helper 接続中」** が緑で表示されることを確認してください。出ない場合は Helper が起動していないか、ポート 7703 が塞がれています ([トラブルシューティング](/docs/helper/getting-started/#トラブルシューティング))。

## Step 3 — デバイスを初期設定する (5 分)

Studio の **Devices タブ** にデバイスが何も出ていない状態だと、右側に **オンボーディング ウィザード** が表示されます。USB ケーブルを繋いで指示通り進めると、

1. USB Serial 接続テスト
2. (応答が無ければ) ファームウェア書き込み
3. Wi-Fi / 名前 / グループ設定

の順で初期設定が完了し、左サイドバーにデバイスが現れます。詳細は **[Hapbeat 初期セットアップ](/docs/studio/initial-setup/)** を参照。

> 一度 Wi-Fi に乗せてしまえば、以降は USB ケーブル不要です。電源を入れれば自動的に Wi-Fi に再接続して Studio から見えるようになります。

## Step 4 — 最初の Kit をデザインする (5 分)

Studio の **Kit タブ** から振動コンテンツを作って Save & Deploy します。詳細は **[最初の Kit を作る](/docs/studio/getting-started/)** を参照。

## Step 5 — 動作確認

Studio の **Test タブ** から Event を発火するとデバイスが振動します。SDK から発火させたい場合は次のページへ:

- [Unity SDK インストール](/docs/unity-sdk/installation/)
- [Unreal SDK](/docs/unreal-sdk/) (WIP)

## 次に読むページ

- [アーキテクチャと主要概念](/docs/concepts/) — Event ID / Kit / Group の関係
- [Contracts 仕様](/docs/contracts/overview/) — プロトコル詳細
- [FAQ / トラブルシューティング](/docs/faq/)
