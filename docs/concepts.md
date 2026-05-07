---
title: アーキテクチャと主要概念
description: 固定ランタイム + Kit + SDK の 4 層モデル、通信経路、Event ID、Group ID、接続シナリオ。
---

:::caution
このページはプレースホルダーです。内容は順次拡充します。
:::

## 4 層モデル

Hapbeat は「固定ランタイム + Kit + SDK」の 3 分離を基礎に、制御面を担う Bridge 層をオプションで挟む 4 層構成である。

- **Layer 0: 共通仕様 (hapbeat-contracts)** — 全 repo が参照する仕様の起点
- **Layer 1: 固定ランタイム (hapbeat-device-firmware)** — デバイス本体の ESP32-S3
- **Layer 2: Kit（コンテンツ配布）(hapbeat-kit-tools)** — 触覚アセットを Kit 単位でパッケージ化
- **Layer 3: Bridge (hapbeat-bridge, hapbeat-transmitter-firmware)** — ESP-NOW 経路の制御面（オプション）
- **Layer 4: ツール・SDK (Studio / Helper / Unity SDK)** — ユーザー接点

## 通信経路

- **標準**: SDK → Wi-Fi UDP broadcast → Hapbeat（Bridge 不要、デバイス側が group ID で自己フィルタ）
- **上位オプション**: SDK → Desktop Bridge → Transmitter → ESP-NOW → Hapbeat（数十台規模や Wi-Fi 不可環境向け）

## Event ID

触覚コンテンツを識別する軽量な文字列 ID。SDK は Event ID を送信し、Hapbeat 側で Kit からクリップを解決して再生する。

詳細: [Contracts 概要](/docs/contracts/overview/)

## Group ID

同じ空間に複数のプレイヤーや展示ブースが共存する場合に、デバイスごとに別グループを割り当てて混信を防ぐ仕組み。

## 接続シナリオ

- **A: Hapbeat SoftAP**（ルーターなし）
- **B: 単独プレイヤー LAN**
- **C: マルチプレイヤー LAN**（group ID でプレイヤー分離）
- **D: モバイルホットスポット**
- **E: 展示ブース隔離**（ブースごとに独立 AP）

## 次に読むページ

- [Contracts 概要](/docs/contracts/overview/) — メッセージ仕様・アドレシング・display-layout 等のリファレンス入口
- [Device Firmware](/docs/firmware/wifi-setup/)
