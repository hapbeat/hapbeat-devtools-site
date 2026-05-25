---
title: BatchSetup vs スクリプト
kind: explanation
sidebar:
  order: 400
description: Hapbeat Unity SDK の触覚配線をどちらの方式で書くべきか — 判断基準と設計のコツ。
---

Hapbeat の触覚を Unity に組み込む方法は大きく 2 通りあります:

1. **BatchSetup / Inspector でコンポーネントを貼る** — UnityEvent や Animator state、Collision callback と直結
2. **スクリプトから `HapbeatBridge` / `HapbeatManager` を呼ぶ** — 自前のロジック内で能動的に発火

どちらも正解で、状況によって使い分けます。

## 早見表

| 状況 | 推奨方式 |
|---|---|
| 同じ Trigger を 3 個以上のオブジェクトに貼る | BatchSetup |
| 発火条件が「衝突した・スライダ動いた・state 変わった」だけで決まる | コンポーネント |
| gain は EventMap entry そのまま、または velocity scaling だけで足りる | コンポーネント |
| 発火条件に複数の game state (charge レベル、アイテム所持、HP 等) が絡む | スクリプト |
| gain / pan / target を runtime で計算したい | スクリプト |
| 1 つの発火点から複数の Event を分岐させたい | スクリプト |
| 同じイベントを多数の場所から発火する (例: 自作 Bridge にロジック集約) | スクリプト |

> Showcase の各 Zone がどちらの方式を採用しているかは [Walkthrough](./walkthrough/#実装方式の使い分け) を参照。「やりたい入力 → 参照 Zone」のマトリクスも同じページに整理してあります。

## 設計のコツ

### Bridge 派生クラスを作る

スクリプト方式を選んだ場合でも、`HapbeatManager.Instance.Play()` を直接呼ぶより、**プロジェクト固有の `HapbeatBridge` 派生クラス** を 1 つ作って、そこに発火ロジックを集約するのが推奨です。

理由:
- gain / target / curve のチューニングが 1 箇所に集まる
- ロジックが game logic から分離して保守しやすい
- Showcase の `ShowcaseBridge` がこの形 ([Scripts/ShowcaseBridge.cs](https://github.com/yus988/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/ShowcaseBridge.cs))

### 両方を組み合わせる

Z3 Fishing は典型的な組み合わせ例です:
- `HapbeatSequenceTrigger` (コンポーネント) で Fire→Loop→Stop の構造を宣言
- `FishingController` (スクリプト) でマウス入力に応じて `Sequence.Fire()` / `Stop()` を呼ぶ
- `HapbeatParameterBinding` (コンポーネント) で loop 中の gain を物体の運動に連動

「コンポーネントで宣言的に書ける部分はコンポーネント、ロジックが必要な部分だけスクリプト」が読みやすいコードになります。

## まとめ

- まず [BatchSetup](/docs/sdk-integration/unity-sdk/event-map/#batch-setup) で書けないか考える
- 書けないなら自前 Bridge 派生 + スクリプト
- 同じシーンで両方を混在させて OK (Showcase サンプルがそうしている)
- 具体的な実装例は [Walkthrough](./walkthrough/) の「Zone 別の wiring 詳細」を参照
