---
title: トラブルシューティング
description: デバイスが見つからない・接続が不安定・Kit 転送失敗など、Manager でよくある問題と解決策。
---

## デバイスが Devices タブに表示されない

### 確認 1: ファームウェアと Wi-Fi 設定

- デバイスにファームウェアが書き込まれていることを確認（電源 ON で OLED に表示が出る）
- Wi-Fi 設定（SSID / パスワード）が完了していることを確認
- 詳細手順: [Device Firmware - Wi-Fi 設定](/docs/firmware/wifi-setup/)

### 確認 2: 同一ネットワーク

- PC とデバイスが **同じネットワーク（同じサブネット）** にいることを確認
- スマホを 2.4 GHz Wi-Fi に固定して PC をテザリングする等で簡単に揃えられます
- Hapbeat は **2.4 GHz 帯のみ対応**。5 GHz 専用ルーターでは接続できません

### 確認 3: ファイアウォール

Windows ファイアウォールが UDP broadcast や mDNS をブロックしている可能性があります。

1. `Windows セキュリティ` → `ファイアウォールとネットワーク保護` → `アプリにファイアウォール経由の通信を許可する`
2. `HapbeatManager` を探し、**プライベート** にチェックが入っていることを確認
3. 一覧にない場合は「別のアプリの許可」から `C:\Program Files\HapbeatManager\HapbeatManager.exe` を追加

### 確認 4: Serial 接続でデバイスを再起動

USB ケーブルでデバイスを PC につなぎ、Firmware タブからシリアル接続してください。接続できればファーム自体は生きています。`reboot` コマンドで再起動を試みてください。

## Kit 転送が失敗する

- デバイスとの TCP 接続が通っているか（Devices カードでオンラインか確認）
- パーティション容量が足りているか（小さい Kit から試す）
- Studio の Kit に含まれる WAV が破損していないか
- Manager のログ（DEBUG レベル）で具体的なエラーを確認

## Studio から Deploy ボタンを押しても何も起きない

Studio は WebSocket（`ws://localhost:7703`）で Manager と通信します。

- Manager が起動しているか
- Studio 右上の接続インジケータが緑になっているか
- 別のアプリが port 7703 を占有していないか（タスクマネージャーで確認）
- Chrome のセキュリティ設定（特に `chrome://flags` で localhost 例外がオフになっていないか）

## Live Audio で音が出ない / 遅延が大きい

- Settings の Audio Bridge → 適切なソース（"Speakers (System)" 等）を選択
- Preview モードで PC 内モニタ → 音が出るか確認してから Streaming 開始
- ストリーミング中は WASAPI で 48 kHz → 16 kHz デシメーション、~50ms 遅延が目安
- それ以上遅い場合は Wi-Fi 環境を確認（ルーターからの距離、混雑）

## バッテリー表示がおかしい / すぐ電池切れになる

- BQ27220 ガス計の DesignCapacity 自動書き込みは初回起動時に実行されます
- 古いファーム + 新基板の組み合わせで値がずれていることがあります
- Settings → デバイス詳細 → "バッテリー再校正" コマンドを試してください

## ログを Anthropic / 開発者に送りたい

Settings → "ログをエクスポート" で `.zip` を保存できます。送信前に SSID やパスワード等が含まれていないか確認してください。

## 関連

- [画面構成](/docs/manager/overview/)
- [Device Firmware - トラブルシュート](/docs/firmware/troubleshooting/)
