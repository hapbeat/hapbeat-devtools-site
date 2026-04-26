---
title: トラブルシューティング
description: Hapbeat デバイスが起動しない・Wi-Fi に繋がらない・振動が出ない・電池がすぐ切れる、などの対処法。
---

## デバイスが起動しない（OLED 表示が出ない）

### バッテリー切れ

- USB Type-C で充電してください（赤 LED 点灯 → 緑 LED で完了）
- LDO の dropout 電圧の関係で、極端に消耗していると起動しない場合があります。15-30 分充電後に再度確認

### ファームウェア破損

- USB 接続して Manager の Firmware タブで再書き込み
- 万が一書き込みができない場合、PC が ESP32 USB CDC を認識しているか確認（デバイスマネージャー → ポート）

### ハードウェア故障

- 上記で復旧しない場合、ハードウェア故障の可能性。サポートに連絡

## Wi-Fi に繋がらない

### 5 GHz Wi-Fi に接続しようとしている

Hapbeat は **2.4 GHz 帯のみ対応**です。5 GHz 専用 SSID では接続できません。

- ルーター設定で 2.4 GHz / 5 GHz 別 SSID にする
- スマホテザリングは 2.4 GHz 固定モードに

### SSID / パスワードが間違っている

シリアル接続で再設定:

```
wifi set <SSID> <PASSWORD>
reboot
```

詳細: [Wi-Fi 設定](/docs/firmware/wifi-setup/)

### 信号が弱い

- ルーターから 10 m 以上離れていると不安定になりがち
- OLED で RSSI を確認（-70 dBm 以下は弱い）
- ルーター近くで再試行

## Manager に表示されない

Wi-Fi 接続できているのに Manager に出ない場合は [Manager トラブルシュート](/docs/manager/troubleshooting/) を参照（ファイアウォール、同一サブネット、mDNS 等）。

## 振動が出ない

### Volume が 0 になっている

OLED または Manager から Volume を確認・上げる。

```
vol set 64    # シリアル経由
```

### Kit が転送されていない

Manager の Kit タブで対象 Event ID を含む Kit がインストール済みか確認。

### Event ID が間違っている

SDK / Studio から発火する Event ID と Kit の Event ID が一致しているか確認。大文字小文字を区別します。

### 振動子の物理故障

シリアルから直接振動テストを実行:

```
test vibe 100   # 強度 100/128 で 1 秒振動
```

無音なら振動子（VCM / モーター）の配線・故障を疑う。

## 電池がすぐ切れる / バッテリー残量がおかしい

### BQ27220 ガス計のキャリブレーション

新基板や交換後は DesignCapacity が未設定のことがあります。Manager → Settings → "バッテリー再校正" を実行、またはシリアルで:

```
battery recover
```

### 低バッテリー時の音割れ（既知問題）

DuoWL v3.2 系では LDO dropout により低バッテリー時に音が歪むことが報告されています。次基板リビジョンで TPS63802 (buck-boost) に置換予定。回避策:

- 60 % 以上を維持して運用
- 充電しながら使う

## OTA 更新中にエラー

- 通信切れ → 再起動して Manager から再書き込み
- パーティション領域不足 → Kit 削除でスペース確保
- 詳細は Manager のログを Settings → "ログをエクスポート" で開発者に送付

## 関連

- [Wi-Fi 設定](/docs/firmware/wifi-setup/)
- [Manager トラブルシューティング](/docs/manager/troubleshooting/)
