---
title: BatchSetup vs スクリプト
kind: explanation
sidebar:
  order: 400
description: Hapbeat Unity SDK の触覚配線をどちらの方式で書くべきか — 判断基準と設計のコツ。
---

Hapbeat の触覚を Unity に組み込む方法は大きく 2 通りあります:

1. **BatchSetup / Inspector でコンポーネントを貼る** — UnityEvent や Animator state、Collision callback と直結
2. **スクリプトから Trigger の `Fire()` / `Stop()` を呼ぶ** — 自前のロジック内で能動的に発火（手順: [](/docs/sdk-integration/unity-sdk/scripting/)）

どちらも正解で、状況によって使い分けます。どちらの方式でも、波形・強さ・送信先は EventMap のエントリが決めます。

## 早見表

| 状況 | 推奨方式 |
|---|---|
| 同じ Trigger を 3 個以上のオブジェクトに貼る | BatchSetup |
| 発火条件が「衝突した・スライダ動いた・state 変わった」だけで決まる | コンポーネント |
| gain は EventMap entry そのまま、または velocity scaling だけで足りる | コンポーネント |
| 発火条件に複数の game state (charge レベル、アイテム所持、HP 等) が絡む | スクリプト |
| gain / pan を runtime で計算したい | スクリプト（`GainMultiplier` / `Pan`） |
| 1 つの発火点から複数の Event を分岐させたい | スクリプト（エントリごとに Trigger を用意して呼び分ける） |

> Showcase の各 Zone がどちらの方式を採用しているかは [Wiring Reference](/docs/sdk-integration/unity-sdk/showcase/wiring/#実装方式の使い分け) を参照。「やりたい入力 → 参照 Zone」のマトリクスも同じページに整理してあります。

## 設計のコツ

### スクリプトは Trigger を呼ぶだけにする

スクリプト方式を選んだ場合でも、`HapbeatManager.Instance.Play()` を直接呼ぶより、**Trigger コンポーネントへの参照を持って `Fire()` を呼ぶ** のが推奨です。

理由:
- gain / target / clip を EventMap ウィンドウで調整でき、コードを書き直さずに済む
- Kit の intensity 補正・遅延補正が自動で効く
- EventMap ウィンドウに「どこから呼ばれているか」が表示される

`HapbeatManager` を直接呼ぶのは、Event ID を実行時に組み立てる場合などに限ります（→ [](/docs/sdk-integration/unity-sdk/scripting/#trigger-を使わずに鳴らす)）。

### 両方を組み合わせる

Z3 Fishing は典型的な組み合わせ例です:
- `HapbeatSequenceTrigger` (コンポーネント) で Fire→Loop→Stop の構造を宣言
- `FishingController` (スクリプト) でマウス入力に応じて `Fire()` / `Stop()` を呼ぶ
- `HapbeatParameterBinding` (コンポーネント) で loop 中の gain を物体の速度に連動

「コンポーネントで宣言的に書ける部分はコンポーネント、ロジックが必要な部分だけスクリプト」が読みやすいコードになります。

## まとめ

- まず [](/docs/sdk-integration/unity-sdk/editor-menus/#batch-setup) で書けないか考える
- 書けないならスクリプトから Trigger の `Fire()` / `Stop()` を呼ぶ
- 同じシーンで両方を混在させて OK (Showcase サンプルがそうしている)
- 具体的な実装例は [Wiring Reference](/docs/sdk-integration/unity-sdk/showcase/wiring/#zone-別の-wiring-詳細) を参照
