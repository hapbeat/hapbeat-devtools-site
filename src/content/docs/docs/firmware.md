---
title: Device Firmware
description: Hapbeat 本体 (ESP32-S3) の固定ランタイム。書き込み手順・シリアル設定・OTA・UI 設定。
---

:::note
このページは [hapbeat-device-firmware](https://github.com/Hapbeat/hapbeat-device-firmware) の `docs/` から自動集約される予定です。現状はプレースホルダーです。
:::

## 概要

Hapbeat 本体（ESP32-S3）上で動作する固定ファームウェア。ユーザーが PlatformIO / VSCode を触る必要はなく、Manager から書き込みと OTA 更新を行う。

## 主な機能

- Wi-Fi STA / UDP / mDNS
- Serial 経由の設定プロトコル
- Pack（Kit）インストール: TCP raw コマンド + パーティション
- OTA 更新
- UI 設定: LED コントローラー・ボリュームノブ・ボタンアクション
- UDP Audio ストリーミング受信（PCM16 / ADPCM、非排他ミキサー）
- ディスプレイ（OLED）表示

## 書き込み手順

[Hapbeat Manager](/docs/manager/) の「ファームウェア」タブから、ビルド済み `.bin` を書き込む。Manager は esptool を内包している。

## 次に読むページ

- [Getting Started](/docs/getting-started/)
- [Hapbeat Manager](/docs/manager/)
- [Protocol リファレンス](/docs/protocol/)
