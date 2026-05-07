---
title: Getting Started
description: Hapbeat を初めて使う人のための最短ガイド。Helper インストール → Studio オープン → テンプレート Kit で動作確認。
---

このページでは、Hapbeat を箱から出してから **最初の振動を出すまで** の流れを示します。

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

## Step 3 — テンプレート Kit で動作確認

Studio の **Kit タブ** で動作確認を行います。

1. **ワーキングディレクトリを選択**
   画面上部の **Working Directory** から任意の空フォルダを指定します。Studio はこのフォルダ配下にビルド成果物（Kit）を書き出します。

2. **テンプレート Kit を読み込む**
   `+ Kit` ボタン → **Template** から好みのテンプレートを選択。波形・LED・ディスプレイ設定が一式入ったサンプルが配置されます。

3. **Save → Deploy → Test**
   `Deploy` で対象 Hapbeat に Kit を転送し、`Test` タブから Event を発火するとデバイスが振動します。

:::caution
**ファイルアクセス範囲について**
Studio が読み書きを行うのは、ここで指定した **ワーキングディレクトリ配下のファイルのみ** です。設定したフォルダの外にあるファイル・ディレクトリへのアクセス（read / write どちらも）は一切行いません。File System Access API のブラウザ標準機能により、許可していないパスは技術的にもアクセスできません。
:::

## SDK から振動を発火する

ここまでで **Hapbeat 単体での再生環境は整っています**。次は SDK 経由でアプリケーション（ゲーム / VR / インスタレーション）から振動を発火させます。

- **[Unity SDK Getting Started](/docs/unity-sdk/getting-started/)**
- Unreal SDK / Creative Kit — [今後の実装予定](/docs/coming-soon/)

## 次に読むページ

- [アーキテクチャと主要概念](/docs/concepts/) — Event ID / Kit / Group の関係
- [Contracts 仕様](/docs/contracts/overview/) — プロトコル詳細
- [FAQ / トラブルシューティング](/docs/faq/)
