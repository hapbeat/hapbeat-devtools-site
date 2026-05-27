---
title: 仕様と認証
kind: reference
description: Hapbeat Duo WL / Band WL のハードウェア仕様一覧と無線認証 (技適) 情報。
sidebar:
  order: 3
---

Hapbeat 各モデルの仕様と、内蔵無線モジュールの認証情報をまとめます。

## ハードウェア仕様

| 項目 | Duo WL (Necklace) | Band WL |
|---|---|---|
| MCU | ESP32-S3 (Wi-Fi 2.4 GHz / Bluetooth) | ESP32-S3 (Wi-Fi 2.4 GHz / Bluetooth) |
| 無線モジュール | ESP32-S3-MINI-1 (Espressif) | ESP32-S3-MINI-1 (Espressif) |
| 通信 | Wi-Fi UDP broadcast (主経路) / ESP-NOW (オプション) | Wi-Fi UDP broadcast (主経路) / ESP-NOW (オプション) |
| 触覚出力 | 2 ch (左右独立) / 振動素子 | 1 ch / 振動素子 |
| 表示 | OLED (128×32, SSD1306) + LED | OLED (128×32, SSD1306) + LED |
| 操作 | 物理ボタン × 5 + アナログボリュームノブ | 物理ボタン × 3 |
| バッテリー | リチウムイオン電池（内蔵・固定式） | リチウムイオン電池（内蔵・固定式） |
| バッテリー容量 | TBD mAh | TBD mAh |
| 連続使用時間 | TBD 時間 | TBD 時間 |
| 充電端子 | USB Type-C | USB Type-C |
| 充電時間（目安） | TBD | TBD |
| 動作温度 | 0℃ 〜 35℃ | 0℃ 〜 35℃ |
| 保管温度 | 0℃ 〜 35℃（推奨） | 0℃ 〜 35℃（推奨） |
| 重量 | TBD g | TBD g |
| 寸法 | TBD mm | TBD mm |

<small>※ TBD の項目は出荷バージョン確定時に更新します。最新情報は製品ページを参照してください。</small>

## 通信仕様

| 項目 | 値 |
|---|---|
| Wi-Fi 規格 | IEEE 802.11 b/g/n (2.4 GHz 帯のみ、5 GHz 非対応) |
| 受信ポート | UDP 7700 (broadcast) / TCP 7701 (制御 / OTA) |
| アドバタイズ | mDNS `_hapbeat._udp` |
| ESP-NOW | チャネル設定: Bridge と同期 |
| 暗号化 | WPA2 (STA) / WPA2 または open (SoftAP) |

## 認証情報

### 無線（電波法 / 技適）

Hapbeat は Espressif 社製の Wi-Fi / Bluetooth モジュール **ESP32-S3-MINI-1** を内蔵しています。本モジュールは日本の電波法に基づく **技術基準適合証明（技適）** を取得済みです。

| 項目 | 値 |
|---|---|
| 工事設計認証番号 | **201-230385** |
| 認証取得者 | Espressif Systems (Shanghai) Co., Ltd. |
| 認証日 | 2023-06-13 |
| 認証区分 | 特定無線設備の工事設計認証 |

公式認証書 (PDF): [ESP32-S3-MINI-1 TELEC Certification (Espressif)](https://www.espressif.com/sites/default/files/ESP32-S3-MINI-1%20TELEC%20Certification.pdf)

技適済みモジュールを **改造せず** 内蔵しているため、Hapbeat 完成品としては電波法上の追加認証取得は不要です。

### バッテリー安全性

Hapbeat は固定内蔵のリチウムイオン電池を採用しています。以下の品質確保措置を実施しています。

- 採用セルは **国際安全規格 (IEC 62133 等) 適合品** を製造する協力工場から調達
- Hapbeat 組立工程で **電池の外観 / 端子電圧** を全数確認
- 電池は **ユーザー交換不可** の固定実装

## 関連リンク

- [Hapbeat 概要](./overview/) — 製品ラインナップとボタン操作
- [運用ガイド](./care/) — 充電・取扱注意・廃棄
- [トラブルを解決する](./troubleshooting/) — 既知問題と改善方針
- [](/docs/concepts/communication-model/) — Wi-Fi UDP / ESP-NOW の設計判断
