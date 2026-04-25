---
title: Kit フォーマット
description: 触覚コンテンツの配布単位 Kit の構造、Event ID 仕様、ビルド・転送のフロー。
---

:::note
このページは [hapbeat-contracts](https://github.com/Hapbeat/hapbeat-contracts) の `specs/kit-format.md` / `specs/event-id.md` および [hapbeat-kit-tools](https://github.com/Hapbeat/hapbeat-kit-tools) の `docs/` から自動集約される予定です。現状はプレースホルダーです。
:::

## 用語について

旧称「Pack」は 2026-04-25 に **Kit** に統一された（Studio が先行採用していた語に揃えた）。新規ドキュメント・実装は Kit のみを使用する。

## 概要

触覚コンテンツを 1 セットにまとめたパッケージ。`manifest.json` + クリップ WAV（16 kHz PCM16 に normalize）で構成される。

- **manifest.json**: Event ID とクリップのマッピング、強度設定、mode（command / stream_clip / stream_source）等
- **clips/**: WAV ファイル（16 kHz PCM16 mono）

## ビルド

Hapbeat Studio、または `hapbeat-kit-tools` CLI でビルドする。

## 転送

Manager の TCP raw コマンド経由でデバイスのパーティションに書き込まれる。

## 次に読むページ

- [Protocol リファレンス](/docs/protocol/)
- [Hapbeat Studio](/docs/studio/)
