---
title: Wiring Reference
kind: reference
sidebar:
  order: 300
description: Showcase の各 Zone がどう wire されているか — どの GameObject にどの Trigger が貼られ、どの script がどの API を呼んでいるかの実装リファレンス。
---

[Showcase Sample](/docs/sdk-integration/unity-sdk/showcase/overview/) の各 Zone の **wiring 実装リファレンス** です。Unity で `Showcase.unity` を開きながら、各 GameObject の Inspector と見比べる用途を想定しています。

## やりたい入力 → 参照 Zone

「どんな入力から触覚を発火させたいか」で参照すべき Zone は以下:

| やりたいこと | 参照 Zone | 中で使う SDK 要素 |
|---|---|---|
| 物理 Collision に直結 | **Z1 Bowling** (Pin) | `HapbeatCollisionTrigger` + velocity gain |
| Animator state に紐付けて自動発火 | **Z2 Door** | `HapbeatStateBehaviour` (AnimatorController の state に attach) |
| 自前 script から `Fire()` / `Stop()` を呼ぶ | **Z3 Fishing** / **Z4 Stream Console** | `HapbeatSequenceTrigger` / `HapbeatUnityEventTrigger` への参照を script に持たせる |
| Slider 連動で gain / pan を連続 modulate (declarative) | **Z4 Stream Console** | Slider + `HapbeatParameterBinding` (Source=SliderValue, Output=StreamGain / StreamPan) |
| 物体の動きで loop の gain を変える (declarative) | **Z3 Fishing** | `HapbeatParameterBinding` (Source=VelocityMagnitude, Output=StreamGain) |
| 自前 script が判定 → UnityEvent emit → Trigger | **Z5 TargetBoard** | `TargetReceiver.OnHitLight / OnHitHeavy` (UnityEvent) → `HapbeatUnityEventTrigger.Fire` |
| キー入力をコードなしで Trigger に wire | Global hotkeys | `HapbeatKeyDispatcher` → `HapbeatUnityEventTrigger.Fire` / `HapbeatActionHelper.Ping` |
| Trigger を使わず Manager API を直接呼ぶ (上級) | **Z5 ChargeShooter** | EventMap からエントリを読み、`HapbeatManager.StreamAudioClip(...)` を呼ぶ |

→ **1 ゾーン = 1 パターン専用** ではなく、各 Zone 内に複数パターンが混在する設計。スクリプトからの呼び方の手順は [](/docs/sdk-integration/unity-sdk/scripting/) にまとめています。

## 実装方式の使い分け

Showcase は **コンポーネント方式 (Inspector で Trigger を wire)** と **スクリプト方式 (自前 script から呼ぶ)** を Zone ごとに使い分けています。使い分けの判断基準は [BatchSetup vs スクリプト](/docs/sdk-integration/unity-sdk/showcase/method-choice/) を参照。

### コンポーネント方式

| Zone | コンポーネント | なぜこちらか |
|---|---|---|
| Z1 Bowling | `HapbeatCollisionTrigger` (`BowlingPin.prefab` に付いており、6 本のピンが共有) | 同じ設定を多数オブジェクトに貼る典型例 |
| Z2 Door | `HapbeatStateBehaviour` (Animator state に attach) | Animator state Enter は UnityEvent 不要、コンポーネントで宣言的 |
| Z3 Fishing | `HapbeatParameterBinding` (FishingObject の速度 → loop の gain) | 運動量 modulation を Inspector で完結 |
| Z4 Slider | `HapbeatTickEmitter` + `HapbeatParameterBinding` (Gain / Pan Slider) | Slider の値変化をコードなしで tick と gain / pan に流す |
| Z5 Hit | `HapbeatUnityEventTrigger` (TargetReceiver の OnHitLight / OnHitHeavy から wiring) | UnityEvent wiring の典型例 |
| Hotkeys | `HapbeatKeyDispatcher` + `HapbeatActionHelper` + `HapbeatUnityEventTrigger` | キー操作を UnityEvent で宣言的に wire |

### スクリプト方式

| Zone | script | 呼び出す API | なぜこちらか |
|---|---|---|---|
| Z3 Fishing | `FishingController` | `HapbeatSequenceTrigger.Fire()` / `Stop()` | 「つかんだ / 離した」の判定が自前の物理ロジックにある |
| Z4 Stream | `StreamDemoController` | `HapbeatUnityEventTrigger.Fire()` / `Stop()` + `ActivePlayback` | Space キーで再生 / 停止をトグルし、再生中かを判定する |
| Z5 Charge | `ChargeShooter` | `HapbeatManager.StreamAudioClip(...)` + `HapbeatStreamPlayback.ApplyGainModulation(...)` | チャージ量に応じて loop の強さを毎フレーム変え、しきい値・発射の強弱でエントリを切り替える |

## Zone 別の wiring 詳細

### Z1 Bowling Lane

LMB でボールを発射（Space でピンをリセット）。ピンに当たると、各ピンの `HapbeatCollisionTrigger` が衝突速度に応じた gain で発火する。

- `Prefabs/BowlingPin.prefab` に `HapbeatCollisionTrigger`（6 本のピンはこの prefab のインスタンス）
  - **Event Map**: `ShowcaseEventMap`, **Event**: `Z1_pin_hit`
  - **Trigger Event**: `CollisionEnter`
  - **Gain Mode**: `VelocityScaled`（衝突速度が **Max Velocity** に近いほど強い）
- `BallLauncher`（`Z1_Bowling`）は発射とリセットのみ。Hapbeat 系コンポーネントは触らない

### Z2 Swing Door

F で開閉、G で叩きつけ、L で施錠 / 解錠。`DoorController` が Animator のパラメータを操作し、遷移先の state に付いた `HapbeatStateBehaviour` が触覚を発火する。

- `Z2_Door/Door` に `Animator` + `DoorController`（キー → Animator Trigger: F → `DoorAction`, G → `Slam`, L → `LockToggle`）
- `DoorAnimator.controller` の各 state に `HapbeatStateBehaviour`（いずれも **Entry On Enter**）

| state | Event | Required Previous State |
|---|---|---|
| `Open` | `Z2_door_open` | `Closed` |
| `Closed` | `Z2_door_close` | `Open` |
| `Slam` | `Z2_door_slam` | `Open` |
| `LockEngage` | `Z2_door_lock` | — |
| `LockRelease` | `Z2_door_unlock` | — |
| `LockedRattle` | `Z2_door_rattle` | — |

### Z3 Fishing Rod

LMB hold で物体が釣り糸に吊られ、離すと落ちる。吊っている間は Sequence の loop が鳴り、`HapbeatParameterBinding` が物体の速度を loop の gain に反映する。

- `Z3_Fishing` に `HapbeatSequenceTrigger`
  - **On Start**: `Z3_hook_start`
  - **Loop (hold)**: `Z3_hook_loop`（StreamClip, loop）
  - **On Stop**: `Z3_hook_release`
- `Z3_Fishing/FishingObject` に `HapbeatParameterBinding`（`Z3_hook_loop` エントリの Bindings から生成）
  - **Source Property**: `VelocityMagnitude`, **Output**: `StreamGain`
- `FishingController`（`Z3_Fishing`）は LMB の押下 / 解放で `_sequence.Fire()` / `_sequence.Stop()` を呼ぶだけ。触覚に関わるコードはこの 2 行

### Z4 Stream Console

Space で stream の再生 / 停止をトグル。Gain / Pan Slider で再生中の強さと左右を変える（Slider を動かすと tick も鳴る）。

- `Z4_Stream/StreamCanvas/StreamPanelHud` に `HapbeatUnityEventTrigger`（**Event**: `Z4_stream_loop`, StreamClip, loop）+ `StreamDemoController`
  - `StreamDemoController` は Space で `ActivePlayback` を見て、再生中なら `Stop()`、停止中なら `Fire()` を呼ぶ
- `GainSlider` / `PanSlider` にそれぞれ
  - `HapbeatParameterBinding`（**Source Property**: `SliderValue`, **Output**: `StreamGain` / `StreamPan`）
  - `HapbeatTickEmitter`（**Event**: `Z4_slider_tick`）
- `Z4_Stream/AddressOverridePanel` で player / group の実行時 override を試せる（→ [](/docs/sdk-integration/unity-sdk/targeting/)）

> `StreamDemoController.cs` には、Binding の代わりに script から `ActivePlayback.Gain` / `Pan` を書く方式もコメントで残してある。どちらでも同じ挙動。

### Z5 Charge & Shoot

LMB hold でチャージ → release で発射。チャージ中は rumble の loop が強くなり、しきい値を超えると 1 回鳴る。発射時はチャージ量で弱 / 強の 2 種類を出し分ける。的に当たると別の Trigger が鳴る。

- `Z5_ChargeShot` に `ChargeShooter`（**Trigger コンポーネントを使わない**スクリプト方式の例）
  - Inspector で `ShowcaseEventMap` と 4 つのエントリ（`Z5_charge_loop` / `Z5_charge_thd` / `Z5_shot_light` / `Z5_shot_heavy`）を選ぶ
  - チャージ開始: `HapbeatManager.StreamAudioClip(...)` で `Z5_charge_loop` を開始し、毎フレーム `ApplyGainModulation(_gainCurve.Evaluate(chargeT))`
  - 発射: loop を `Stop()` し、チャージ量で `Z5_shot_light` / `Z5_shot_heavy` を 1 回鳴らす
  - gain / target / clip は EventMap のエントリから読む（`entry.GetEffectiveGain()` / `entry.target` / `entry.streamClip`）ので、EventMap ウィンドウの編集がそのまま効く
- `Z5_ChargeShot/TargetBoard` に `TargetReceiver`、子の `Event_Hit_Light` / `Event_Hit_Heavy` に `HapbeatUnityEventTrigger`（`Z5_tar_hit_light` / `Z5_tar_hit_heavy`）
  - `TargetReceiver.OnHitLight` → `Event_Hit_Light` の `Fire()`、`OnHitHeavy` → `Event_Hit_Heavy` の `Fire()`

### Global hotkeys

Q / P キーは UnityEvent ベースで wire。script は HUD 表示のみ。

- `[Hapbeat Event Router]` に以下を集約:
  - `HapbeatManager` (singleton)
  - `HapbeatKeyDispatcher` — Bindings リストで Q / P を UnityEvent として宣言的に wire
  - `HapbeatActionHelper` — `Ping()` を提供
  - `HapbeatUnityEventTrigger`（**Event**: `Z5_tar_hit_light`）
- Wiring:
  - Q → `HapbeatUnityEventTrigger.Fire()`
  - P → `HapbeatActionHelper.Ping()` + `GlobalHotkeys.NotifyPingSent()`
- `GlobalHotkeys` (script) は Pong 受信時に HUD の RTT 表示を更新するだけ

## WASD と UI nav の衝突への対処

Unity の **`InputSystemUIInputModule`** の既定 `UI/Navigate` action には **WASD がバインド**されている。Slider にフォーカスがある状態で WASD を押すと、Player 移動と同時に Slider 値も変化する。

Showcase は Z4 で stream gain slider を触るため、以下の二重対策を入れている。

1. **`SimpleFPSController.HandleMove` は cursor lock 中のみ動作** — Z4 は `unlockCursorOnEnter=true` で cursor unlock 中のため、player は WASD で動かない
2. **`UiDeselectOnPointerUp` を各 Slider に attach** — マウスドラッグを離した時点で EventSystem の selection を解除し、以降 WASD が Slider に届かないようにする

### 実プロジェクトでの根治

zero-config を優先する Showcase では上記の対症療法を採っているが、**実プロジェクトでは UI Input Module 側で WASD を外す**のが筋。

1. `Packages/Input System/.../DefaultInputActions.inputactions` を `Assets/` 配下にコピー
2. コピーを Input Actions Editor で開き、**UI / Navigate / 2D Vector Composite** から `<Keyboard>/w` `<Keyboard>/a` `<Keyboard>/s` `<Keyboard>/d` の 4 binding を削除（Arrow キーは残す）
3. シーンの **EventSystem → Input System UI Input Module → Actions Asset** をコピーに差し替え

これで `UiDeselectOnPointerUp` が不要になり、プロジェクト全体の UI 要素（Slider / Dropdown 等）で WASD が干渉しなくなる。
