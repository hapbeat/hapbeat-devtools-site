---
title: Fire と Clip — どちらで送るか
kind: explanation
description: 触覚イベントの送信モード「Fire (command)」と「Clip (stream)」の本質的な違いと、どちらをどのケースで選ぶか。
sidebar:
  order: 6
---

:::caution[執筆中]
このページは Phase B で執筆予定です。現状は要点メモのみ。
:::

## このページで扱うこと (予定)

- **Fire** (command mode) — Event ID を送るだけ。Kit にプリインストールされた波形をデバイス側で再生
- **Clip** (stream_clip mode) — PCM データを stream で送る。動的なパラメータ変調が可能
- それぞれの **遅延 / 帯域 / 柔軟性** トレードオフ
- 「ボタン押下時の単発フィードバック」「擦り感などの連続パラメータ連動」など、典型ユースケースでの選び方
- Studio の Mode 表示 (FIRE / CLIP) と Unity SDK の API (`Fire()` / `PlayStreamClip()`) の対応関係

## 関連リンク

- [Mode の使い分け (Studio 視点)](/docs/tools/studio/modes/) — Studio で Mode を選ぶ手順 (howto)
- [Fire と Clip の比較 (Unity SDK 視点)](/docs/sdk-integration/unity-sdk/fire-vs-clip/) — Unity SDK 実装での選び方
- [gain の乗算構造](/docs/concepts/gain-architecture/) — Clip 時の dynamic gain 適用箇所
