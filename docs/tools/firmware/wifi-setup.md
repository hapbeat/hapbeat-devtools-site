---
title: Wi-Fi 設定
kind: howto
sidebar:
  order: 200
description: Hapbeat デバイスを家庭・展示・モバイルホットスポット環境の Wi-Fi に接続する手順。
---

Hapbeat デバイスは Wi-Fi 経由で SDK / Hapbeat Studio と通信します。初回起動時には SSID / パスワードが未設定なので、初期セットアップで Wi-Fi を登録する必要があります。

> **推奨**: [Hapbeat Studio のオンボーディングウィザード](/docs/tools/studio/initial-setup/)を使うと USB Serial 接続 → ファーム書き込み → Wi-Fi 設定を画面に沿って完了できます。以下のシリアルコマンド手順は上級者向けです。

## 前提

- 2.4 GHz 帯 Wi-Fi（**Hapbeat は 5 GHz 非対応**）
- USB Type-C データ通信ケーブル（充電専用ケーブルは不可）
- [Hapbeat Studio](https://devtools.hapbeat.com/studio/) + `hapbeat-helper` が起動済み

## Studio から設定する（推奨）

1. Studio を開いて Manage タブに進む
2. デバイスを USB で接続してシリアルポートを選択
3. Wi-Fi サブタブ → 「+ 新規追加」で SSID とパスワードを入力
4. 追加後「接続」ボタンを押すとデバイスが再起動して Wi-Fi に繋がる

## シリアルコマンドで設定する（上級者向け）

### 手順

1. デバイスを USB で PC に接続
2. Studio の Manage タブでシリアルポートを選択して接続
3. シリアルコンソールに以下を入力:

```
wifi set <SSID> <PASSWORD>
reboot
```

例:

```
wifi set MyHomeWiFi mypassword123
reboot
```

### 接続確認

OLED に IP アドレスが表示されれば成功。Studio の Manage タブのサイドバーにデバイスが自動で現れます。

## 接続シナリオ別設定

### 家庭 / オフィス LAN（推奨）

- 通常のルーター経由。Studio から Wi-Fi を設定するだけで完結します
- UDP broadcast の到達範囲（同一サブネット）であればどのデバイスからも制御可能

### マルチプレイヤー LAN

同じ LAN で複数プレイヤーを分離したい場合は、各デバイスにグループを割り当てます。

Studio の Manage タブ → 設定 → デバイス識別 → グループ番号（1〜99）を設定。

SDK 側でも対応するアドレス suffix `group_<N>` を送信ターゲットに指定します。

### モバイルホットスポット

スマホ / PC のテザリングを 2.4 GHz 固定モードにして、通常 LAN と同じ手順で設定します。

### Hapbeat SoftAP（ルーターなし）

VR HMD（Quest 等）を直接デバイスに繋ぐ場合、Hapbeat を AP にします。シリアルから:

```
wifi mode ap
ap set HapbeatAP hapbeat123
```

HMD / PC を `HapbeatAP` SSID に接続。HMD は AP 機能を持たないため、ルーターなし環境ではこの構成が必要です。

### 展示ブース隔離

ブースごとに独立 AP を立て、各ブースの Hapbeat はそこに STA 接続します（通常 LAN 設定と同じ手順）。

## マルチプロファイル（複数 SSID の切替）

Studio の Wi-Fi タブから最大 5 件の SSID を登録できます。

シリアルコマンド経由でも管理可能:

```
wifi help
```

## 次のステップ

- [トラブルシューティング](/docs/tools/firmware/troubleshooting/)
- [Hapbeat 初期セットアップ](/docs/tools/studio/initial-setup/)
