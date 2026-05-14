---
title: Group と Player の addressing
kind: explanation
description: 複数 Hapbeat を 1 つのネットワークで同時に動かすための group/player addressing 設計 (DEC-030)。
sidebar:
  order: 4
---

:::caution[執筆中]
このページは Phase B で執筆予定です。現状は要点メモのみ。
:::

## このページで扱うこと (予定)

- Hapbeat の **address** とは何か (`/player/<n>/<part>` + 任意の `/group_<N>` suffix)
- なぜ broadcast + デバイス側フィルタにしたか (Wi-Fi UDP の特性 + 多人数同時稼働)
- `group_id` 1..99 の使い分け (1 = solo / N = multi-player)
- DEC-029 (target string spec) と DEC-030 (group as address suffix) の経緯
- 接続シナリオ A/B/C/D/E (architecture.md と相互リンク)

## 関連リンク

- [アーキテクチャ全体像](/docs/concepts/architecture/)
- [通信モデル](/docs/concepts/communication-model/)
- [Contracts 概要](/docs/reference/contracts/overview/)
