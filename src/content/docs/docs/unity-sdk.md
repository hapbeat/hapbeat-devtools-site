---
title: Unity SDK
description: Unity 向け Hapbeat SDK。Trigger コンポーネント・EventMap・BindingPreset で触覚を簡単に組み込む。
---

:::note
このページは [hapbeat-unity-sdk](https://github.com/Hapbeat/hapbeat-unity-sdk) の `docs/` から自動集約される予定です。現状はプレースホルダーです。
:::

## 概要

Unity 向け SDK。Wi-Fi UDP broadcast で Hapbeat デバイスに直接通信する。Bridge 不要、VR HMD（Quest 等）でも動作。

## インストール

UPM（Unity Package Manager）経由でのインストールに対応。詳細手順は [GitHub リポジトリ](https://github.com/Hapbeat/hapbeat-unity-sdk) の README 参照。

## 主な機能

- `HapbeatBridge` 基底クラス（UDP ブロードキャスト送信）
- Trigger コンポーネント群: `AnimatorTrigger`, `CollisionTrigger`, `SequenceTrigger`
- `EventMap` ウィンドウ（Event ID と波形の対応を GUI で管理）
- `HapbeatParameterBinding`（Transform / Rigidbody → AudioSource / Bridge パラメータ汎用マッピング）
- サンプルシーン: BasicExample / PlayerDemo / CreatorTutorial
- XRI ヘルパー（Samples~/XriHelpers/）

## 次に読むページ

- [Getting Started](/docs/getting-started/)
- [Pack / Kit フォーマット](/docs/pack/)
