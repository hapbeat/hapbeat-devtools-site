---
title: Protocol リファレンス
description: UDP / TCP / Serial / WebSocket 各プロトコルの仕様、アドレシング、メッセージフォーマット。
---

:::note
このページは [hapbeat-contracts](https://github.com/Hapbeat/hapbeat-contracts) の `docs/` から自動集約される予定です。現状はプレースホルダーです。
:::

## プロトコル一覧

| プロトコル | 向き | 用途 |
|-----------|------|------|
| Wi-Fi UDP broadcast | SDK → Device | Event 発火、Audio ストリーミング |
| TCP | Manager → Device | Kit 転送、設定、ログ |
| Serial (USB CDC) | Manager → Device | 初期設定、OTA 書き込み |
| WebSocket | Studio → Manager | Deploy 指示、ws ポート 7703 |
| ESP-NOW（オプション） | Transmitter → Device | 大規模時の送信経路 |

## 主要仕様ドキュメント（contracts repo）

- `message-format.md` — UDP / TCP メッセージの全体像
- `device-addressing.md` — device ID / group ID の割り当て
- `serial-config.md` — シリアル設定プロトコル
- `display-layout.md` — OLED ブロック配置
- `kit-format.md` — Kitファイルフォーマット
- `kit-install-protocol.md` — Kit 転送の TCP シーケンス
- `event-id.md` — Event ID 命名規則
- `bridge-api.md` — Bridge 経由時の API
- `internal-bridge-transmitter.md` — Bridge ↔ Transmitter 内部仕様
- `versioning.md` — 互換性ポリシー

## 次に読むページ

- [アーキテクチャと主要概念](/docs/concepts/)
- [Kit フォーマット](/docs/kit/)
