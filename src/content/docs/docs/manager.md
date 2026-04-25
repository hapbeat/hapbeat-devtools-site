---
title: Hapbeat Manager
description: デバイス管理デスクトップアプリ。Serial/TCP/UDP 通信、ファーム書き込み、Kit 転送、Live Audio ストリーミング。
---

:::note
このページは [hapbeat-manager](https://github.com/Hapbeat/hapbeat-manager) の `docs/` から自動集約される予定です。現状はプレースホルダーです。
:::

## Manager とは

ハードウェア I/O に特化した常駐型デスクトップアプリ。USB Serial / TCP / UDP でデバイスと通信し、ファームウェア書き込みと Kit 転送を担う。

## 主な機能

- デバイスの自動検出（mDNS + UDP broadcast）
- シリアル / TCP / UDP 接続の統合管理
- ファームウェア書き込み（esptool 同梱）
- Kit（触覚コンテンツパッケージ）の転送
- Live Audio ストリーミング（PC 音声 → UDP）
- Studio との WebSocket 連携（localhost:7703）

## インストール

[Downloads ページ](/downloads/) から最新の Windows installer を取得する。

## 次に読むページ

- [Getting Started](/docs/getting-started/)
- [Device Firmware](/docs/firmware/)
- [Pack / Kit フォーマット](/docs/pack/)
