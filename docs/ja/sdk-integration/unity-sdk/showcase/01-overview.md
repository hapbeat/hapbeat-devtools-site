---
title: Showcase サンプル
kind: explanation
sidebar:
  label: 概要
  order: 100
description: SDK の触覚の組み込み方を 1 シーン × 5 ゾーンで一覧できる Unity サンプル。各ゾーンの内容と、やりたいことから参照するゾーンの早見表。
---

Showcase は、Hapbeat SDK で触覚を組み込む方法を **1 つのシーンの 5 つのゾーン** に並べた実装例です。ゾーンごとに、衝突・Animator・スクリプトなど違う方法で触覚を再生しています。XR デバイスは不要で、キーボードとマウスだけで動きます。

各ゾーンの配線（どの GameObject にどのコンポーネントが付いているか）・スクリプト・試せる改造は [](/docs/sdk-integration/unity-sdk/showcase/zones/) にまとめています。

## 開き方

1. Unity Editor で **Window → Package Manager → Hapbeat SDK → Samples → Showcase → Import**
2. `Assets/Samples/Hapbeat SDK/<version>/Showcase/Showcase.unity` を開く
3. Hapbeat デバイスを Studio または Helper でオンラインにして **Play**

EventMap・Kit・AudioClip はサンプルに同梱されているため、追加の準備は不要です。サンプルを改造する場合は、再 Import で上書きされないよう、Showcase フォルダを `Assets/` 内の別の場所にコピーしてから編集してください。

:::note[音と触覚のタイミング]
音声出力の遅延は環境ごとに異なるため、触覚が音より先に感じられることがあります。これは想定内です。`Hapbeat → Open Settings` の **Latency Compensation** で **Haptic Delay (ms)** を少しずつ上げ、触覚に遅延を加えて合わせます。詳しくは <a href="/docs/sdk-integration/unity-sdk/getting-started/#音と触覚のタイミングを合わせる" target="_blank" rel="noopener noreferrer">音と触覚のタイミングを合わせる</a> を参照してください。
:::

## ゾーン

1〜5 キーでゾーンを切り替えます。

<div class="hb-card-grid">
<div>

![Z1 Bowling Lane](@assets/unity/showcase-z1-bowling.jpg)

**[Z1 Bowling Lane](/docs/sdk-integration/unity-sdk/showcase/zones/#z1-bowling-lane)** — ボールを発射してピンに当てる。衝突の速さに応じた強さで再生（Collision Trigger）

</div>
<div>

![Z2 Swing Door](@assets/unity/showcase-z2-door.jpg)

**[Z2 Swing Door](/docs/sdk-integration/unity-sdk/showcase/zones/#z2-swing-door)** — ドアの開閉・叩きつけ・施錠。Animator の state ごとに再生（State Behaviour）

</div>
<div>

![Z3 Fishing Rod](@assets/unity/showcase-z3-fishing.jpg)

**[Z3 Fishing Rod](/docs/sdk-integration/unity-sdk/showcase/zones/#z3-fishing-rod)** — 物体を釣り糸で吊って振り回す。吊っている間ループ再生し、物体の速さで強さが変わる（Sequence Trigger + Parameter Binding + スクリプト）

</div>
<div>

![Z4 Stream Console](@assets/unity/showcase-z4-stream.jpg)

**[Z4 Stream Console](/docs/sdk-integration/unity-sdk/showcase/zones/#z4-stream-console)** — ループ再生の開始 / 停止と、スライダーでの強さ・左右の変更（UnityEvent Trigger + Parameter Binding + Tick Trigger + スクリプト）

</div>
<div>

![Z5 Charge & Shoot](@assets/unity/showcase-z5-charge.jpg)

**[Z5 Charge & Shoot](/docs/sdk-integration/unity-sdk/showcase/zones/#z5-charge--shoot)** — チャージして発射し、的に当てる。チャージ量で強さが変わる（スクリプトから HapbeatManager を直接呼ぶ上級例 + UnityEvent Trigger）

</div>
</div>

## 共通の操作

| キー | 動作 |
|---|---|
| `WASD` / マウス | 移動 / 視点 |
| `Tab` | カーソルのロック / 解除（UI を操作するとき） |
| `1`〜`5` | ゾーン切替 |
| `Q` | 触覚を 1 回再生（`Z5_tar_hit_light`） |
| `P` | Ping（往復時間を画面右上に表示） |

各ゾーンの操作は [](/docs/sdk-integration/unity-sdk/showcase/zones/) を参照してください。

## やりたいこと → 参照するゾーン

| やりたいこと | ゾーン | 使っている SDK の要素 |
|---|---|---|
| 物理の衝突で再生する | **Z1** | `HapbeatCollisionTrigger`（速度に応じた強さ） |
| Animator の state に合わせて再生する | **Z2** | `HapbeatStateBehaviour` |
| 自分のスクリプトから再生・停止する | **Z3** / **Z4** | `HapbeatSequenceTrigger` / `HapbeatUnityEventTrigger` の `Fire()` / `Stop()` |
| 物体の動きでループの強さを変える | **Z3** | `HapbeatParameterBinding`（Source = VelocityMagnitude） |
| スライダーで強さ・左右を変える | **Z4** | `HapbeatParameterBinding`（Source = SliderValue） |
| 値の変化に合わせて刻み（tick）を再生する | **Z4** | `HapbeatTickEmitter`（Tick Trigger） |
| 自前の判定から UnityEvent 経由で再生する | **Z5** | `TargetReceiver` の UnityEvent → `HapbeatUnityEventTrigger.Fire()` |
| キー入力をコードなしで再生につなぐ | 共通の操作 | `HapbeatKeyDispatcher` → `HapbeatUnityEventTrigger.Fire()` |
| Trigger を使わず HapbeatManager を直接呼ぶ | **Z5** | `HapbeatManager.StreamAudioClip(...)` |

スクリプトからの再生方法は [](/docs/sdk-integration/unity-sdk/scripting/)、コンポーネントの設定項目は [](/docs/sdk-integration/unity-sdk/triggers/) を参照してください。
