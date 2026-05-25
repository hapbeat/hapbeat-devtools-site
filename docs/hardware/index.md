---
title: Hapbeat 概要
kind: reference
description: Hapbeat ハードウェアの製品ラインナップと、Duo WL / Band WL 各モデルの特徴・操作方法・主な仕様。
sidebar:
  order: 1
---

Hapbeat は装着して使う **ワイヤレス触覚デバイス** です。ESP32 を内蔵し、Wi-Fi UDP 経由でゲーム / アプリ / Studio から触覚イベントを受け取って振動します。本ページではハードウェア各モデルの特徴と基本的な使い方を扱います。

## 製品ラインナップ

| モデル | 装着部位 | チャネル数 | 主用途 |
|---|---|---|---|
| **Duo WL** | 首掛け | 2 ch (左右独立) | VR / ゲームの空間触覚・全身に響かせたい場面 |
| **Band WL** | リスト / アンクル | 1 ch | スマホ・アプリ・控えめなフィードバック向け |

## Duo WL

![Duo WL の外観と各部名称 {.bg-white}](../assets/device-duo-wl-feature.png)

### 特徴

- **首掛けの 2 チャネル独立駆動** で、左右に分離した触覚を伝えられる
- **Wi-Fi UDP 受信** で PC / Quest / スマートフォンと**直接通信** (中継サーバ・PC ペアリング不要)
- **OLED ディスプレイ** + **物理ボタン** でデバイス側から Wi-Fi 切替・Player / Group 番号変更が可能
- **USB-C 充電** + **バッテリー残量自動報告**
- ファームウェアは出荷時に書き込み済み。**ユーザーがソースコードを書く必要は無い**

### 主な仕様

| 項目 | 値 |
|---|---|
| MCU | ESP32 (Wi-Fi 2.4 GHz) |
| 通信 | Wi-Fi UDP broadcast (主経路) / ESP-NOW (オプション) |
| 触覚出力 | 2 ch / 振動素子 |
| バッテリー | TBD mAh / 連続使用 TBD 時間 |
| 充電 | USB Type-C |
| 表示 | OLED + LED |
| 操作 | 物理ボタン × TBD |
| 重量 | TBD g |
| サイズ | TBD mm |

<small>※ 数値は出荷バージョンにより異なる場合があります。最新仕様は製品ページを参照してください。</small>

### LED / OLED の意味

| 表示 | 状態 |
|---|---|
| LED 赤点灯 | 充電中 |
| LED 緑点灯 | 充電完了 |
| OLED `Gr:NN` | 現在の Group ID |
| OLED `P:NN` | 現在の Player 番号 |
| OLED アプリ名 | 接続中のアプリ名 (Unity SDK 等が送信) |

詳細表示要素は [Address の仕組み](/docs/concepts/group-player-addressing/) を参照。

### 装着のコツ

- ネックバンド部を **首の付け根** に乗せ、振動素子が **鎖骨の上** に当たる位置に調整する
- 振動が伝わりにくい場合は装着位置を微調整する
- 服の上から装着しても構わないが、**薄手の生地** の方が振動が伝わりやすい

## Band WL

<!-- TODO: device-band-wl-feature.png 追加後に画像とテキストを差し替える -->

リスト / アンクル装着の単チャネル版。詳細は今後追加予定です。

## 関連リンク

- [Hapbeat を初期設定する](/docs/tools/studio/initial-setup/) — 入手後の Wi-Fi 設定とファーム書込手順
- [Wi-Fi を設定する](./wifi-setup/) — 別 Wi-Fi に切り替える場合
- [トラブルを解決する](./troubleshooting/) — 起動しない / 振動が出ない時
- [アーキテクチャ全体像](/docs/concepts/architecture/) — Hapbeat と Studio / SDK の関係
