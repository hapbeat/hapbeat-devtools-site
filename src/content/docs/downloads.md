---
title: Downloads
description: Manager installer、Unity SDK パッケージ、ファームウェアバイナリの入手先。
---

各配布物は GitHub Releases から提供される。以下のリンクは常に **最新リリース** を指す（GitHub が自動で `/releases/latest` を最新版へリダイレクトする）。

## Hapbeat Manager

デバイス管理デスクトップアプリ（Windows）。

- [最新リリース (GitHub)](https://github.com/Hapbeat/hapbeat-manager/releases/latest)
- 全履歴: [Releases 一覧](https://github.com/Hapbeat/hapbeat-manager/releases)

## Unity SDK

Unity Package Manager（UPM）経由でインストール可能。

- [最新リリース (GitHub)](https://github.com/Hapbeat/hapbeat-unity-sdk/releases/latest)
- UPM 登録 URL: `https://github.com/Hapbeat/hapbeat-unity-sdk.git` （タグ指定推奨）
- 導入手順: [Unity SDK ガイド](/docs/unity-sdk/)

## Device Firmware

Hapbeat 本体（ESP32-S3）用ファームウェア。通常は Manager に同梱されるので個別ダウンロードは上級者向け。

- [最新リリース (GitHub)](https://github.com/Hapbeat/hapbeat-device-firmware/releases/latest)

## Transmitter Firmware

ESP-NOW 送信機ファームウェア（大規模構成向け）。

- [最新リリース (GitHub)](https://github.com/Hapbeat/hapbeat-transmitter-firmware/releases/latest)

## ソースコード

各リポジトリは [Hapbeat GitHub org](https://github.com/Hapbeat) で公開予定。

:::note
リリースビルドは各 repo の GitHub Actions が tag push で自動生成する。バージョン履歴は GitHub Releases ページで確認できる。
:::
