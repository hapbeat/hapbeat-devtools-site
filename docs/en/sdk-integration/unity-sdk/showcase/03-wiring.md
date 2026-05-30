---
title: Wiring Reference
kind: reference
sidebar:
  order: 300
description: How each Showcase zone is wired — which GameObjects hold which Triggers, and which scripts call which APIs.
---

This is the **wiring implementation reference** for each zone in the [Showcase Sample](./). Intended to be read alongside the Inspector in `Showcase.unity`.

## Input Type → Reference Zone

Use the table below to find the right zone based on what input you want to trigger haptics from:

| What you want to do | Reference Zone | SDK elements used |
|---|---|---|
| React directly to a physics Collision | **Z1 Bowling** (Pin) | `HapbeatCollisionTrigger` + velocity gain |
| Fire automatically on Animator state transitions | **Z2 Door** | `HapbeatStateBehaviour` (attached to AnimatorController state) |
| Fire from a UI Toggle / Button (UnityEvent → Trigger) | **Z4 Stream Console** | UI Toggle.onValueChanged → `HapbeatUnityEventTrigger.Fire` |
| Continuously modulate gain / pan from a Slider (declarative) | **Z4 Stream Console** | Slider + `HapbeatParameterBinding` (Source=SliderValue, Output=StreamGain/Pan) |
| Custom script evaluates condition → emits UnityEvent → Trigger | **Z5 TargetBoard** | `TargetReceiver.OnHit` (UnityEvent) → `HapbeatUnityEventTrigger.Fire` |
| Custom physics logic calls Fire/Stop directly from script | **Z3 Fishing** / **Z5 ChargeShooter** | `_sequenceTrigger.Fire()` / `.Stop()` |
| Push a calculated physics value into a binding from script (External source) | **Z3 Fishing** | `HapbeatParameterBinding` (Source=External) + `binding.SetValue(v)` |
| Call the Manager API directly (bypassing Triggers entirely) | (Z5 advanced variant) | `HapbeatManager.Instance.StreamAudioClip(...)` |

→ **Zones are not exclusive to one pattern** — each zone contains multiple patterns in practice.

## When to Use Each Approach

Showcase uses both the **component approach (wire Triggers in the Inspector)** and the **script approach (call the API directly)**, varying per zone. For guidance on choosing between them, see [BatchSetup vs Script](/en/docs/sdk-integration/unity-sdk/showcase/method-choice/).

### Component Approach

| Zone | Component | Why this approach |
|---|---|---|
| Z1 Bowling | `HapbeatCollisionTrigger` (applied to all 6 Pins via BatchSetup) | Classic use case for applying the same settings to many objects. BatchSetup at its best. |
| Z2 Door | `HapbeatStateBehaviour` (attached to Animator state) | Animator state Enter needs no UnityEvent — the component handles it declaratively |
| Z3 Fishing | `HapbeatSequenceTrigger` + `HapbeatParameterBinding` | Fire→Loop→Stop structure and momentum-based modulation, all wired in the Inspector |
| Z4 Slider Tick | `HapbeatTickEmitter` (via BatchSetup) | Slider.onValueChanged can be auto-wired |
| Z5 Hit | `HapbeatUnityEventTrigger` (wired from `TargetReceiver.OnHit`) | Textbook UnityEvent wiring example |
| Hotkeys | `HapbeatKeyDispatcher` + `HapbeatActionHelper` + `HapbeatUnityEventTrigger` | Key input wired declaratively via UnityEvent |

### Script Approach

| Zone | API called | Why this approach |
|---|---|---|
| Z4 Stream | `StreamPlayback.Gain / Pan` written directly (`StreamDemoController`) | Gain/pan need to be computed every frame at runtime |
| Z5 Charge | `_trigger.GainMultiplier = curve(chargeT)` (`ChargeShooter`) | Charge state needs to be mapped dynamically via `AnimationCurve` |

## Per-Zone Wiring Details

### Z1 Bowling Lane

Hitting a pin triggers `HapbeatCollisionTrigger` on that pin, firing with a gain scaled to the collision velocity.

- Each of `Z1_Bowling/Pin_1` through `Pin_6` has `HapbeatCollisionTrigger`
  - **EventMap**: `ShowcaseEventMap`, **Entry**: `pin_hit`
  - **Trigger Event**: `OnCollisionEnter`
  - **Gain Mode**: `VelocityScaled`, **Min / Max Velocity**: 0.5 / 5
- `BallLauncher` handles physics only (ball reset + launch). No Hapbeat components.

### Z2 Swing Door

The F key toggles the `IsOpen` bool on the Animator → state Enter fires, and `HapbeatStateBehaviour` calls the haptic event.

- `Z2_Door/Door` has `Animator` + `DoorController` (F key toggles `IsOpen` bool)
- `DoorAnimator.controller` has `HapbeatStateBehaviour` attached to both the `Open` and `Closed` states
  - Open state: **Entry**: `door_open`, **Event**: `OnStateEnter`
  - Closed state: **Entry**: `door_close`, **Event**: `OnStateEnter`

### Z3 Fishing Rod

LMB hold attaches an object to the fishing line. While held, the Sequence loop runs and `HapbeatParameterBinding` maps the object's momentum to gain in real time.

- `Z3_Fishing` root has `HapbeatSequenceTrigger`
  - **EventMap**: `ShowcaseEventMap`
  - **On Start Entry**: `grab_start`
  - **Loop Entry**: `grab_loop` (loop=true)
  - **On Stop Entry**: `grab_release`
- Same root has `HapbeatParameterBinding` (auto-attached from the `grab_loop` preset)
  - **Source Transform Path**: `FishingObject` (relative from root)
  - **Source Property**: `PositionDeltaMagnitude`
  - **Output**: `StreamGain`, range 0.2–1.5, curve `EaseInOut`
- `FishingController` (script) only calls `Sequence.Fire()` / `Stop()` in response to LMB hold

### Z4 Stream Console

Space toggles streaming on/off; Gain and Pan sliders modulate the playing stream in real time.

- `Z4_Stream/StreamPanel` has `HapbeatUnityEventTrigger`
  - **EventMap**: `ShowcaseEventMap`, **Entry**: `stream_demo` (StreamClip, loop=true)
- `StreamDemoController` (script): Space key → `trigger.Fire()` / `Stop()`
  - Same script updates `trigger.ActivePlayback.Gain = gainSlider.value` and `Pan = panSlider.value` every frame
- Gain / Pan Sliders have `HapbeatTickEmitter` (via BatchSetup)
  - **Entry**: `slider_tick`, **Tick Threshold**: 0.05

### Z5 Charge & Shoot

LMB hold charges → release fires. An `AnimationCurve` maps charge amount to gain. A separate Trigger fires on target hit.

- The launch platform has `HapbeatUnityEventTrigger`
  - **EventMap**: `ShowcaseEventMap`, **Entry**: `charge_release`
- `ChargeShooter` (script) charges on LMB hold and on release:
  ```csharp
  _trigger.GainMultiplier = _gainCurve.Evaluate(chargeT);
  _trigger.Fire();
  ```
- `Z5_Target/TargetBoard` has `TargetReceiver` + a separate `HapbeatUnityEventTrigger`
  - **Entry**: `target_hit`
  - `TargetReceiver.OnHit` (UnityEvent) is wired to `HapbeatUnityEventTrigger.Fire()`

### Global Hotkeys

Q and P keys are wired via UnityEvent. Scripts handle only HUD display.

- `[Hapbeat Event Router]` GameObject consolidates:
  - `HapbeatManager` (singleton)
  - `HapbeatKeyDispatcher` — Q / P declared declaratively as UnityEvents in the Bindings list
  - `HapbeatActionHelper` — provides `Ping()`
  - `HapbeatUnityEventTrigger` (entry: `manual_fire`)
- Wiring:
  - Q → `HapbeatUnityEventTrigger.Fire()` (entry: `manual_fire`)
  - P → `HapbeatActionHelper.Ping()`
- `GlobalHotkeys` (script) only updates the HUD text when a Pong is received
