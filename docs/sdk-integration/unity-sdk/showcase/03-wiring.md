---
title: Wiring Reference
kind: reference
sidebar:
  order: 300
description: Showcase の各 Zone がどう wire されているか — どの GameObject にどの Trigger が貼られ、どの script がどの API を呼んでいるかの実装リファレンス。
---

[Showcase Sample](./) の各 Zone の **wiring 実装リファレンス** です。Unity で `Showcase.unity` を開きながら、各 GameObject の Inspector と見比べる用途を想定しています。

## やりたい入力 → 参照 Zone

「どんな入力から触覚を発火させたいか」で参照すべき Zone は以下:

| やりたいこと | 参照 Zone | 中で使う SDK 要素 |
|---|---|---|
| 物理 Collision に直結 | **Z1 Bowling** (Pin) | `HapbeatCollisionTrigger` + velocity gain |
| Animator state に紐付けて自動発火 | **Z2 Door** | `HapbeatStateBehaviour` (AnimatorController state に attach) |
| UI Toggle / Button から発火 (UnityEvent → Trigger) | **Z4 Stream Console** | UI Toggle.onValueChanged → `HapbeatUnityEventTrigger.Fire` |
| Slider 連動で gain / pan を連続 modulate (declarative) | **Z4 Stream Console** | Slider + `HapbeatParameterBinding` (Source=SliderValue, Output=StreamGain/Pan) |
| 自前 script が判定 → UnityEvent emit → Trigger | **Z5 TargetBoard** | `TargetReceiver.OnHit` (UnityEvent) → `HapbeatUnityEventTrigger.Fire` |
| Custom 物理ロジックから script で Fire/Stop 直叩き | **Z3 Fishing** / **Z5 ChargeShooter** | `_sequenceTrigger.Fire()` / `.Stop()` |
| 物理計算結果を script から binding に流す (External source) | **Z3 Fishing** | `HapbeatParameterBinding` (Source=External) + `binding.SetValue(v)` |
| Manager API 直叩き (Trigger を介さない最上級) | (Z5 の発展形) | `HapbeatManager.Instance.StreamAudioClip(...)` |

→ **1 ゾーン = 1 パターン専用** ではなく、各 Zone 内に複数パターンが混在する設計。

## 実装方式の使い分け

Showcase は **コンポーネント方式 (Inspector で Trigger を wire)** と **スクリプト方式 (API を直接呼ぶ)** を Zone ごとに使い分けています。使い分けの判断基準は [BatchSetup vs スクリプト](./method-choice/) を参照。

### コンポーネント方式

| Zone | コンポーネント | なぜこちらか |
|---|---|---|
| Z1 Bowling | `HapbeatCollisionTrigger` (BatchSetup で Pin 6 個に一括) | 同じ設定を多数オブジェクトに貼る典型例。BatchSetup の真骨頂 |
| Z2 Door | `HapbeatStateBehaviour` (Animator state に attach) | Animator state Enter は UnityEvent 不要、コンポーネントで宣言的 |
| Z3 Fishing | `HapbeatSequenceTrigger` + `HapbeatParameterBinding` | Fire→Loop→Stop と運動量 modulation を Inspector で完結 |
| Z4 Slider Tick | `HapbeatTickEmitter` (BatchSetup) | Slider.onValueChanged を自動 wire できる |
| Z5 Hit | `HapbeatUnityEventTrigger` (TargetReceiver の OnHit から wiring) | UnityEvent wiring の典型例 |
| Hotkeys | `HapbeatKeyDispatcher` + `HapbeatActionHelper` + `HapbeatUnityEventTrigger` | キー操作を UnityEvent で宣言的に wire |

### スクリプト方式

| Zone | 呼び出す API | なぜこちらか |
|---|---|---|
| Z4 Stream | `StreamPlayback.Gain / Pan` 直接書き換え (`StreamDemoController`) | runtime で gain/pan を毎フレーム計算する |
| Z5 Charge | `_trigger.GainMultiplier = curve(chargeT)` (`ChargeShooter`) | charge state を `AnimationCurve` で動的 mapping |

## Zone 別の wiring 詳細

### Z1 Bowling Lane

ボールをピンにぶつけて倒すと、各ピンの `HapbeatCollisionTrigger` が collision velocity に応じた gain で発火する。

- `Z1_Bowling/Pin_1`〜`Pin_6` の各オブジェクトに `HapbeatCollisionTrigger`
  - **EventMap**: `ShowcaseEventMap`, **Entry**: `pin_hit`
  - **Trigger Event**: `OnCollisionEnter`
  - **Gain Mode**: `VelocityScaled`, **Min / Max Velocity**: 0.5 / 5
- `BallLauncher` は物理 (ball reset + launch) のみ。Hapbeat 系コンポーネントは触らない

### Z2 Swing Door

F キーで Animator の `IsOpen` bool をトグル → state Enter が発火し、`HapbeatStateBehaviour` 経由で触覚 event を呼ぶ。

- `Z2_Door/Door` に `Animator` + `DoorController` (F キーで `IsOpen` bool トグル)
- `DoorAnimator.controller` の `Open` / `Closed` state にそれぞれ `HapbeatStateBehaviour` を attach
  - Open state: **Entry**: `door_open`, **Event**: `OnStateEnter`
  - Closed state: **Entry**: `door_close`, **Event**: `OnStateEnter`

### Z3 Fishing Rod

LMB hold で物体が釣り糸に attach。Hold 中は Sequence loop が走り、`HapbeatParameterBinding` が物体の運動量を gain にリアルタイム反映する。

- `Z3_Fishing` root に `HapbeatSequenceTrigger`
  - **EventMap**: `ShowcaseEventMap`
  - **On Start Entry**: `grab_start`
  - **Loop Entry**: `grab_loop` (loop=true)
  - **On Stop Entry**: `grab_release`
- 同じ root に `HapbeatParameterBinding` (`grab_loop` の preset から auto-attach)
  - **Source Transform Path**: `FishingObject` (root からの相対)
  - **Source Property**: `PositionDeltaMagnitude`
  - **Output**: `StreamGain`, range 0.2〜1.5, curve `EaseInOut`
- `FishingController` (script) は LMB hold に応じて `Sequence.Fire() / Stop()` を呼ぶだけ

### Z4 Stream Console

Space で stream をトグル開始 / 停止、Gain / Pan slider で再生中の値を動的変調する。

- `Z4_Stream/StreamPanel` に `HapbeatUnityEventTrigger`
  - **EventMap**: `ShowcaseEventMap`, **Entry**: `stream_demo` (StreamClip, loop=true)
- `StreamDemoController` (script): Space キー → `trigger.Fire() / Stop()`
  - 同 script が毎フレーム `trigger.ActivePlayback.Gain = gainSlider.value`、`Pan = panSlider.value` で gain / pan をリアルタイム更新
- Gain / Pan Slider に `HapbeatTickEmitter` (BatchSetup)
  - **Entry**: `slider_tick`, **Tick Threshold**: 0.05

### Z5 Charge & Shoot

LMB hold でチャージ → release で発射。`AnimationCurve` で charge 量を gain に mapping。命中時は別 Trigger が発火。

- 発射台に `HapbeatUnityEventTrigger`
  - **EventMap**: `ShowcaseEventMap`, **Entry**: `charge_release`
- `ChargeShooter` (script) が LMB hold で charge → release 時に:
  ```csharp
  _trigger.GainMultiplier = _gainCurve.Evaluate(chargeT);
  _trigger.Fire();
  ```
- `Z5_Target/TargetBoard` に `TargetReceiver` + 別の `HapbeatUnityEventTrigger`
  - **Entry**: `target_hit`
  - `TargetReceiver.OnHit` (UnityEvent) → `HapbeatUnityEventTrigger.Fire()` を wire

### Global hotkeys

Q / P キーは UnityEvent ベースで wire。script はログ表示のみ。

- `[Hapbeat Event Router]` GameObject に以下を集約:
  - `HapbeatManager` (singleton)
  - `HapbeatKeyDispatcher` — Bindings リストで Q / P を UnityEvent として宣言的に wire
  - `HapbeatActionHelper` — `Ping()` を提供
  - `HapbeatUnityEventTrigger` (entry: `manual_fire`)
- Wiring:
  - Q → `HapbeatUnityEventTrigger.Fire()` (entry: `manual_fire`)
  - P → `HapbeatActionHelper.Ping()`
- `GlobalHotkeys` (script) は Pong 受信時に HUD テキストを更新するだけ
