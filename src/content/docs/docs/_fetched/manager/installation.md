---
title: インストール
description: Hapbeat Manager (Windows) のインストール手順と初回起動。
---

Hapbeat Manager は Hapbeat デバイスを管理するための Windows 向けデスクトップアプリです。USB Serial / TCP / UDP 経由のデバイス通信、ファームウェア書き込み、Kit 転送、Live Audio ストリーミングを担います。

## 動作環境

- Windows 10 / 11（64-bit）
- USB Type-C ポート（デバイス書き込み・初期設定用、データ通信対応ケーブル必須）
- Wi-Fi 環境（デバイスとの通常通信用）

macOS / Linux 版は現状ありません。

## インストール手順

### 1. インストーラの取得

[Downloads ページ](https://devtools.hapbeat.com/downloads/) または [GitHub Releases](https://github.com/Hapbeat/hapbeat-manager/releases/latest) から最新版の Windows installer (`HapbeatManager-Setup-x.y.z.exe`) をダウンロードします。

### 2. インストーラの実行

ダウンロードした `.exe` をダブルクリックして起動します。

- インストール先（デフォルト: `C:\Program Files\HapbeatManager\`）を確認
- スタートメニュー / デスクトップショートカット作成の有無を選択
- 「インストール」をクリック

インストーラは Inno Setup ベースで、esptool / ファームウェア `.bin` などの依存物をすべて同梱しています。別途 Python や PlatformIO のインストールは不要です。

### 3. 初回起動

スタートメニューから **Hapbeat Manager** を起動します。

初回起動時、Windows ファイアウォールから「ローカルネットワーク通信を許可しますか」と確認が出る場合があります。**プライベートネットワーク** にチェックを入れて許可してください。Wi-Fi UDP broadcast や mDNS 検出に必要です。

## アンインストール

Windows 設定 → アプリ → インストール済みアプリ → "Hapbeat Manager" → アンインストール

ユーザーデータ（接続履歴、Kit フォルダパス等）は `%APPDATA%\Hapbeat\HapbeatManager\` に保存されます。完全に消したい場合はこのフォルダも手動で削除してください。

## 次のステップ

- [画面構成と基本操作](/docs/manager/overview/) — UI の各タブと使い方
- [Hapbeat Studio](https://devtools.hapbeat.com/studio/) — Kit を作成して Manager 経由でデバイスに転送
- [Device Firmware](/docs/firmware/) — 初回ファーム書き込みと Wi-Fi 設定
