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

> **設計方針**: Hapbeat SDK の王道は「**Trigger 系コンポーネントを Inspector で wire**」する宣言的スタイル。Showcase も Z1〜Z4 は Trigger を使う構成にしています。自前の Script は **Trigger の `Fire() / Stop()` を呼ぶだけ**（Z3 / Z4）。Z5 だけは、Trigger を使わず `HapbeatManager` を直接呼ぶ上級例です。スクリプトからの呼び方は [](/docs/sdk-integration/unity-sdk/scripting/) を参照。

## 構成

5 ゾーンを 1 シーンに収め、**1〜5 キーでゾーン切替** (`ZoneSwitcher` が現在ゾーン以外を `SetActive(false)`)。各ゾーンは SDK の異なる haptic 登録パターンを 1 つだけ担当します。

| Zone | 教示パターン | 中身 |
|---|---|---|
| **Z1 Bowling Lane** | Collision Trigger (velocity-scaled) | LMB で球を発射、Pin に衝突 |
| **Z2 Swing Door** | Animator State Behaviour | F で開閉、G で叩きつけ、L で施錠 / 解錠。Animator state ごとに触覚 |
| **Z3 Fishing Rod** | Sequence Trigger + Parameter Binding + script から `Fire()` / `Stop()` | LMB hold で物体を吊る、振り回すと gain が変化 |
| **Z4 Stream Console** | UnityEvent Trigger (loop) + Parameter Binding + Tick Emitter | Space で stream 開始 / 停止、Slider で gain / pan を変調。`AddressOverrideDemo` で override の実行時設定も確認可 → [](/docs/sdk-integration/unity-sdk/targeting/) |
| **Z5 Charge & Shoot** | script から `HapbeatManager` を直接呼ぶ（上級）+ UnityEvent Trigger | LMB hold でチャージ、release で発射、命中で UnityEvent Trigger |

各 Zone の wire 詳細 (どの GameObject にどの Trigger が貼られているか) は [Wiring Reference](/docs/sdk-integration/unity-sdk/showcase/wiring/) を参照。

## グローバル操作

| キー | 役割 |
|---|---|
| `WASD` / Mouse | プレイヤー移動 / 視点 |
| `Tab` | カーソル lock / unlock (UI 操作時に解放) |
| `1`〜`5` | ゾーン切替 |
| `Q` | 触覚を 1 回発火（`Z5_tar_hit_light`） |
| `P` | Ping (HUD に RTT 表示) |

## 始め方

1. Unity Editor で **Window → Package Manager → Hapbeat SDK → Samples → Showcase → Import**
2. `Assets/Samples/Hapbeat SDK/<version>/Showcase/Showcase.unity` を開く
3. Hapbeat デバイスを Studio または Helper でオンラインにして **Play**

Import 直後にシーンを直接開けます。EventMap / kit manifest / audio clip 等はサンプルフォルダに同梱されているため、別途生成手順は不要です。

:::note[音と触覚のタイミング]
音声出力の遅延は環境ごとに異なるため、触覚が音より先に感じられることがあります。これは想定内です。`Hapbeat → Open Settings` の **Latency Compensation** で **Haptic Delay (ms)** を少しずつ上げ、触覚に遅延を加えて合わせます。詳しくは <a href="/docs/sdk-integration/unity-sdk/getting-started/#音と触覚のタイミングを合わせる" target="_blank" rel="noopener noreferrer">音と触覚のタイミングを合わせる</a> を参照してください。
:::

## 次に読む

- [Walkthrough](/docs/sdk-integration/unity-sdk/showcase/walkthrough/) — 改造ヒント / Command モード切替 / WASD 衝突対処 / トラブルシューティング
- [Wiring Reference](/docs/sdk-integration/unity-sdk/showcase/wiring/) — 各 Zone の wire 実装詳細 (どの GameObject にどの Trigger / Binding が貼られているか)
- [BatchSetup vs スクリプト](/docs/sdk-integration/unity-sdk/showcase/method-choice/) — コンポーネント方式 / スクリプト方式の使い分け基準
