---
title: Wi-Fi 設定
description: Hapbeat デバイスを家庭・展示・モバイルホットスポット環境の Wi-Fi に接続する手順。
---

Hapbeat デバイスは Wi-Fi 経由で SDK / Manager と通信します。初回起動時には SSID / パスワードが空なので、シリアル接続で設定を書き込む必要があります。

## 前提

- 2.4 GHz 帯 Wi-Fi（**Hapbeat は 5 GHz 非対応**）
- Hapbeat Manager がインストール済み（[インストール手順](/docs/manager/installation/)）
- USB Type-C データ通信ケーブル

## 手順

### 1. デバイスを USB で PC に接続

ファームウェアが書き込まれているデバイスを USB で PC に接続します。Manager の Firmware タブにシリアルポートが現れたら接続成功です。

### 2. シリアル接続

Manager の Firmware タブ → デバイスのシリアルポート行 → "Connect" ボタン。接続後、シリアルコンソールが開きます。

### 3. Wi-Fi 設定コマンド

シリアルコンソールに以下のコマンドを入力します。

```
wifi set <SSID> <PASSWORD>
```

例:

```
wifi set MyHomeWiFi mypassword123
```

応答:

```
ok: wifi credentials saved (will reconnect on next boot)
```

### 4. 再起動

```
reboot
```

または USB を抜き差しして再起動します。デバイスは新しい SSID で接続を試行します。

### 5. 接続確認

OLED 表示に IP アドレスが出れば接続成功。Manager の Devices タブにも自動的に現れます。

## 接続シナリオ別設定

### 家庭 / オフィス LAN（B シナリオ）

- 通常のルーター経由
- Group ID = 0（デフォルト）

### マルチプレイヤー LAN（C シナリオ）

- 同じルーター下、プレイヤーごとに固有 group ID

```
group set 1   # プレイヤー 1
group set 2   # プレイヤー 2
```

SDK 側でも group ID を一致させる必要があります。

### モバイルホットスポット（D シナリオ）

- スマホ / PC のテザリングを 2.4 GHz 固定にする
- Wi-Fi 設定は通常 LAN と同じ

### Hapbeat SoftAP（A シナリオ、ルーターなし）

VR HMD（Quest 等）を直接デバイスに繋ぐ場合、Hapbeat 側を AP にできます。

```
wifi mode ap
ap set HapbeatAP hapbeat123
```

その後 HMD / PC を `HapbeatAP` SSID に接続。HMD は AP 機能を持たないため、ルーターなし環境では必須の構成です。

### 展示ブース隔離（E シナリオ）

ブースごとに独立 AP を立て、各ブースの Hapbeat はそこに STA 接続。`B シナリオ` と同じ手順で各ブースのルーターに繋ぎます。

## マルチプロファイル

複数の SSID を切替たい場合（家・会社・展示）、プロファイル切替が使えます。

```
wifi profile add work CompanyWiFi mypass2
wifi profile add home MyHomeWiFi mypass1
wifi profile use work
```

詳細はファームウェアバージョン依存。ヘルプ:

```
wifi help
```

## 次のステップ

- [トラブルシューティング](/docs/firmware/troubleshooting/)
- [Hapbeat Manager の使い方](/docs/manager/overview/)
