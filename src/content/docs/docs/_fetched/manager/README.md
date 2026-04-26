---
title: "docs/ — ユーザー向けドキュメント"
---
# docs/ — ユーザー向けドキュメント

このディレクトリは、本リポジトリの **ユーザー向け公開ドキュメント** 置き場である。

- 想定読者: Hapbeat Manager を使う一般ユーザー
- 集約先: [hapbeat-devtools-site](https://devtools.hapbeat.com/) が build 時に自動取得し、`/docs/manager/` の URL で公開する

## ディレクトリ分類

| ディレクトリ | 用途 | 公開対象 |
|------|-----|--------|
| `docs/` | ユーザー向け解説（このディレクトリ） | ◯ portal site に掲載 |
| `dev-notes/` | （存在する場合）内部実装の知見・履歴 | ✗ portal には載らない |

## 書くものの例

- インストール手順（installer 実行 → 初回起動 → ファーム書き込み）
- 各タブの使い方（デバイス / Kit / ファームウェア / Live Audio / ログ）
- Studio 連携の仕組み（WebSocket localhost:7703）
- デバイスが見つからないときの確認手順
- Live Audio ストリーミングのセットアップ
- アンインストール手順
