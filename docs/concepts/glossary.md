---
title: 用語集
kind: reference
description: Hapbeat SDK に登場する用語の定義集。Event ID / Kit / Group / Player / intensity / gain / Fire / Clip など。
sidebar:
  order: 99
---

:::caution[執筆中]
このページは Phase B で執筆予定です。現状は要点メモのみ。
:::

## 整理対象の用語 (予定)

各用語に **1〜2 行の定義 + 関連ページへのリンク** を付ける形で整備します。

### コアコンセプト
- **Hapbeat** — 触覚デバイス本体 (Duo WL / Band WL)
- **Kit** — 触覚資産 (WAV + manifest.json) のフォルダ
- **Event ID** — `<kit-name>.<clip-name>` 形式の触覚イベント識別子
- **Address** — `/player/<n>/<part>[/group_<N>]` 形式のデバイス宛先
- **Player** / **Group** — マルチプレイヤー時の addressing 単位

### 強度・モード
- **intensity** — Kit 設計時の基準強度 (manifest.json)
- **gain** — SDK 実行時の動的強度倍率
- **Fire (command)** — Event ID 単発送信モード
- **Clip (stream_clip)** — PCM ストリーミング送信モード

### ツール
- **Hapbeat Studio** — Web ベース Kit デザイン + デバイス管理ツール
- **hapbeat-helper** — Studio とデバイスを橋渡しする CLI daemon
- **Contracts** — 各 repo 間の規範的プロトコル仕様

### ネットワーク
- **UDP broadcast** — 標準通信経路 (Wi-Fi)
- **ESP-NOW** — 上位オプション (Bridge + Transmitter)

## 関連リンク

- [アーキテクチャ全体像](/docs/concepts/architecture/)
- [Contracts 概要](/docs/reference/contracts/overview/)
