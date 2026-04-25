---
title: Pack / Kit フォーマット
description: 触覚コンテンツパッケージ (Pack / Kit) の構造、Event ID 仕様、ビルド・転送のフロー。
---

:::note
このページは [hapbeat-contracts](https://github.com/Hapbeat/hapbeat-contracts) の `docs/pack-format.md` / `docs/event-id.md` および [hapbeat-pack-tools](https://github.com/Hapbeat/hapbeat-pack-tools) の `docs/` から自動集約される予定です。現状はプレースホルダーです。
:::

## 用語について

当初は「Pack」と呼ばれていたが、Studio 側で先に **Kit** 用語が使われ始め、段階的に **Kit** に統一中。詳細は [agent-memory の移行プラン](https://github.com/Hapbeat/hapbeat-sdk-workspace/blob/master/docs/agent-memory/project_pack_to_kit_migration.md) 参照。

- UI 表示は基本的に **Kit**
- 内部プロトコル・スキーマは現状 **Pack**（移行中）

## 概要

触覚コンテンツを 1 セットにまとめたパッケージ。`manifest.json` + クリップ WAV（16 kHz PCM16 に normalize）で構成される。

- **manifest.json**: Event ID とクリップのマッピング、強度設定、mode（command / stream_clip / stream_source）等
- **clips/**: WAV ファイル（16 kHz PCM16 mono）

## ビルド

Hapbeat Studio、または `hapbeat-pack-tools` CLI でビルドする。

## 転送

Manager の TCP raw コマンド経由でデバイスのパーティションに書き込まれる。

## 次に読むページ

- [Protocol リファレンス](/docs/protocol/)
- [Hapbeat Studio](/docs/studio/)
