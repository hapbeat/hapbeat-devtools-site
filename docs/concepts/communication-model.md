---
title: 通信モデル — Wi-Fi UDP と ESP-NOW
description: Hapbeat の標準通信経路（Wi-Fi UDP broadcast）と上位オプション（ESP-NOW）の使い分け、なぜこの設計を採用したかの背景。
kind: explanation
sidebar:
  order: 2
---

Hapbeat の触覚イベントはネットワーク経由でデバイスに届きます。このページでは **標準経路（Wi-Fi UDP broadcast）** と **上位オプション（ESP-NOW）** の設計判断を説明します。

## 標準: Wi-Fi UDP broadcast

```
SDK / アプリ
  ↓ UDP broadcast (同一サブネット)
Hapbeat デバイス（複数台が group / player フィルタで自己受信判定）
```

SDK は触覚イベントを **UDP broadcast** で同一サブネットの全デバイスに撒きます。各デバイスは受信したパケットに含まれる **target（group / player）** を見て、自分宛てかどうかを判定して再生 / 無視します。

### なぜ broadcast か

| 設計判断 | 理由 |
|---|---|
| **デバイス IP の管理が不要** | DHCP で割り当てが変わってもアドレス指定の更新は不要 |
| **1 台でも複数台でも同じ送信コード** | unicast vs broadcast の切替が不要 |
| **PC / Quest / スマホで動作が同一** | 各プラットフォームの UDP socket API だけで完結 |
| **Bridge / 中継サーバーが不要** | アプリ起動だけで触覚が出る |

### なぜ ACK しないか

UDP には ACK / 再送がありません。これは意図的な選択です:

> **触覚は「遅れて届くより消えた方がマシ」**

ゲーム中の効果音は、ネットワーク遅延で 200ms 後に届くより、その回のフレームだけ脱落するほうが体験を壊しません。ACK / 再送を入れると遅延変動が大きくなるため、Hapbeat は no-ACK で固定遅延を取ります。

### 制約

- **同一サブネット必須** — broadcast はルーターを越えません
- **2.4 GHz Wi-Fi のみ対応**（ESP32 の制約）
- **VR HMD は AP 機能を持たない** ため、ルーターなし環境では **Hapbeat 自身が SoftAP** になる構成を取ります（後述）

## 接続シナリオ

| シナリオ | 構成 | 用途 |
|---|---|---|
| **A. 単独プレイヤー LAN**（推奨） | 通常ルーター経由、group=0 | 自宅 / オフィス |
| **B. マルチプレイヤー LAN** | ルーター経由、プレイヤー毎に固有 group/player ID | 同一 LAN で複数人プレイ |
| **C. モバイルホットスポット** | スマホ / PC テザリング（2.4 GHz 固定） | 移動先・出張 |
| **D. Hapbeat SoftAP** | Hapbeat 1 台が AP、HMD + 他 Hapbeat が STA | ルーターなし環境（Quest 等） |
| **E. 展示ブース隔離** | ブースごとに独立 AP、B と同等 | イベント・展示会 |

詳細: [Studio: Wi-Fi 設定](/docs/studio/initial-setup/) / [Firmware: Wi-Fi Setup](/docs/firmware/wifi-setup/)

## 上位オプション: ESP-NOW 経路

UDP broadcast では捌けない規模（数十台同時）や、Wi-Fi が使えない環境では **ESP-NOW** 経由のオプション経路があります。

```
SDK / アプリ
  ↓ UDP / OSC
hapbeat-bridge (PC / ホスト)
  ↓ シリアル
hapbeat-transmitter-firmware (ESP32 送信機)
  ↓ ESP-NOW (2.4 GHz radio, AP 不要)
Hapbeat デバイス（複数台一斉）
```

- **送信機（Transmitter）** が ESP-NOW で複数 Hapbeat に同報
- **Bridge** がホスト側の制御面（UDP/OSC 受信、device registry、time sync）
- ルーターも AP も不要、ESP-NOW の生帯域だけ使う

通常の用途では Wi-Fi UDP で十分なので、ESP-NOW 経路は「大規模パフォーマンス」「Wi-Fi 不在環境」「Hapbeat 専用ネットワークを組みたい」場合のみ採用します。

## なぜ Bluetooth を主経路にしないか

過去の v1 では Bluetooth 経路を使っていましたが、以下の理由で Wi-Fi UDP に移行しました:

- **ペアリング管理が煩雑** — 複数台 / 複数プラットフォームで体験が劣化
- **ブロードキャストが不得意** — BLE Advertise は帯域・パケット数で UDP に劣る
- **PC / Quest / スマホで API が分断** — 各 OS で BLE 実装が違いすぎる
- **同時接続数の制約** — Central 側のリンク数上限

現行 BT 版（hapbeat-bt-firmware）は v1 互換維持のため残っていますが、新規ユーザーは Wi-Fi 版（Duo WL / Band WL）が前提です。

## low-latency の鍵: targetTime

Hapbeat は遅延を吸収するために **targetTime（将来の発火時刻）** を指定できます。SDK は「今すぐ」ではなく「100ms 後に発火」と送り、デバイスは時刻同期した自分の時計でその時点に再生します。

これにより、ネットワーク揺らぎがあっても発火タイミングは安定します。詳細は [Message Protocol 仕様](/docs/contracts/) を参照。

## 関連

- [アーキテクチャ全体像](./architecture/)
- [Group / Player アドレッシング](./group-player-addressing/)（予定）
- [Studio: Wi-Fi 設定](/docs/studio/initial-setup/)
