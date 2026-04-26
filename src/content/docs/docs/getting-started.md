---
title: Getting Started
description: Hapbeat を初めて使う人のための 5 分ガイド。Manager インストール・ファーム書き込み・最初の Kit 作成・動作確認まで。
---

:::caution
このページはプレースホルダーです。内容は順次拡充します。
:::

## 概要

このガイドでは、Hapbeat を初めて使う人が最初の一振動を出すまでの手順をまとめる。

1. Hapbeat Manager をインストールする
2. デバイスにファームウェアを書き込む
3. Hapbeat Studio で最初の Kit を作成する
4. Kit をデバイスに転送する
5. Unity サンプルまたは Studio のテスト再生から発火させる

## 前提

- Windows 10 / 11（現時点では Windows のみ動作確認）
- USB Type-C ケーブル（データ通信対応）
- Wi-Fi 環境（Hapbeat のネットワーク設定に必要）

## 1. Hapbeat Manager をインストール

[Downloads ページ](/downloads/) から最新の Manager インストーラをダウンロードして実行する。

## 2. ファームウェアを書き込む

Manager の「ファームウェア」タブから書き込み対象デバイスを選び、書き込みを実行する。

詳細: [Device Firmware](/docs/_fetched/firmware/wifi-setup/)

## 3. 最初の Kit を Studio で作る

[Hapbeat Studio](/studio/) をブラウザで開く。サンプル波形をロードし、Kit として書き出す。

詳細: [Hapbeat Studio ガイド](/docs/_fetched/studio/getting-started/)

## 4. Kit をデバイスに転送する

Studio の Deploy ボタンで、WebSocket 経由で Manager にルーティングされ、デバイスに転送される。

## 5. 動かしてみる

Studio のテスト再生、または [Unity SDK](/docs/_fetched/unity-sdk/installation/) のサンプルシーンから Event を発火して振動を確認する。

## 次に読むページ

- [アーキテクチャと主要概念](/docs/concepts/)
- [Contracts 概要 (Event ID / Kit / Protocol)](/docs/_fetched/contracts/overview/)
