---
title: FAQ / Troubleshooting
description: よくある質問と典型的なトラブルへの対処法。
---

:::caution
このページはプレースホルダーです。FAQ は実運用で見つかった問題を順次追加していきます。
:::

## 接続関連

### Q. デバイスが Manager で見つからない

- ファームウェアが書き込まれ、Wi-Fi 設定が済んでいるか確認
- PC とデバイスが同じネットワークに繋がっているか
- ファイアウォールで UDP broadcast と mDNS がブロックされていないか
- Manager のログを確認（`View > Logs`）

### Q. Wi-Fi 接続できない

- Hapbeat は 2.4 GHz 帯のみ対応。5 GHz 専用ルーターでは動作しない
- Serial 経由で SSID / パスワードを再設定: [Device Firmware](/docs/firmware/)

### Q. VR HMD（Quest 等）から直接使いたい

- Wi-Fi UDP broadcast 方式なので HMD が同じネットワークにあれば動く
- HMD が AP 機能を持たないためルーターなしでは Hapbeat を AP にする必要あり

## Kit / コンテンツ関連

### Q. Studio でビルドした Kit が転送できない

- Manager が起動中か、WebSocket（localhost:7703）に接続できているか
- Studio 右上の接続インジケータを確認

### Q. 振動が鳴らない

- Kit が転送されているか（Manager の Kit タブで一覧確認）
- Event ID が合っているか
- デバイスの音量（Volume）が十分高いか

## その他

### Q. 複数台同時に別々の振動を出したい

- **Group ID** 機能で分離する。[アーキテクチャと主要概念](/docs/concepts/) 参照
