---
title: Showcase Sample
kind: explanation
sidebar:
  label: Showcase
  order: 100
description: SDK の触覚配線パターンを 1 シーン × 5 ゾーンで一覧できる Unity サンプル。動く実装例を真似や改造の起点として使うショーケース。
---

Showcase は「Hapbeat SDK でこういう書き方ができる」という **実装例の集合** です。手取り足取りの step-by-step ではなく、**動く構造体・実装意図・利用ケース** の 3 点を 1 シーンに詰め込んでいます。読むだけでなく **触る・真似する・改造する起点** として使ってください。

XR デバイス不要・キーマウスだけで完結します。

> **設計方針**: Hapbeat SDK の王道は「**Trigger 系コンポーネントを Inspector で wire**」する宣言的スタイル。Showcase も各 Zone で直接 Trigger を使う構成にしています。Script は **Trigger の `Fire() / Stop()` を呼ぶか、`GainMultiplier` を書くだけ** に留まり、触覚計算は SDK 側に任せます。

## 構成

5 ゾーンを 1 シーンに収め、**1〜5 キーでゾーン切替** (`ZoneSwitcher` が現在ゾーン以外を `SetActive(false)`)。各ゾーンは SDK の異なる haptic 登録パターンを 1 つだけ担当します。

| Zone | 教示パターン | 中身 |
|---|---|---|
| **Z1 Bowling Lane** | Collision Trigger (velocity-scaled) | LMB で球を発射、Pin に衝突 |
| **Z2 Swing Door** | Animator State Behaviour | F キーで Animator state Open / Close |
| **Z3 Fishing Rod** | Sequence Trigger + Parameter Binding | LMB hold で物体 attach、振り回すと gain が変化 |
| **Z4 Stream Console** | UnityEvent Trigger (loop) + Tick Emitter | Space で stream、Slider で gain / pan 動的変調 |
| **Z5 Charge & Shoot** | UnityEvent Trigger + curve-driven GainMultiplier | LMB hold でチャージ、release で発射、命中で別 trigger |

各 Zone の wire 詳細 (どの GameObject にどの Trigger が貼られているか) は [Wiring Reference](./wiring/) を参照。

## グローバル操作

| キー | 役割 |
|---|---|
| `WASD` / Mouse | プレイヤー移動 / 視点 |
| `Tab` | カーソル lock / unlock (UI 操作時に解放) |
| `1`〜`5` | ゾーン切替 |
| `Q` | `manual_fire` イベント発火 |
| `P` | Ping (HUD に RTT 表示) |

## 始め方

1. Unity Editor で **Window → Package Manager → Hapbeat SDK → Samples → Showcase → Import**
2. `Assets/Samples/Hapbeat SDK/<version>/Showcase/Scenes/Showcase.unity` を開く
3. Hapbeat デバイスを Studio または Helper でオンラインにして **Play**

Import 直後にシーンを直接開けます。EventMap / kit manifest / audio clip 等はサンプルフォルダに同梱されているため、別途生成手順は不要です。

## 次に読む

- [Walkthrough](./walkthrough/) — 改造ヒント / Command モード切替 / WASD 衝突対処 / トラブルシューティング
- [Wiring Reference](./wiring/) — 各 Zone の wire 実装詳細 (どの GameObject にどの Trigger / Binding が貼られているか)
- [BatchSetup vs スクリプト](./method-choice/) — コンポーネント方式 / スクリプト方式の使い分け基準
