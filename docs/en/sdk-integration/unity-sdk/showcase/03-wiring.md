---
title: Wiring Reference
kind: reference
sidebar:
  order: 300
description: How each Showcase zone is wired — which GameObjects hold which Triggers, and which scripts call which APIs.
---

This is the **wiring implementation reference** for each zone in the [Showcase Sample](/en/docs/sdk-integration/unity-sdk/showcase/overview/). Intended to be read alongside the Inspector in `Showcase.unity`.

## Input Type → Reference Zone

Use the table below to find the right zone based on what input you want to trigger haptics from:

| What you want to do | Reference Zone | SDK elements used |
|---|---|---|
| React directly to a physics Collision | **Z1 Bowling** (Pin) | `HapbeatCollisionTrigger` + velocity gain |
| Fire automatically on Animator state transitions | **Z2 Door** | `HapbeatStateBehaviour` (attached to AnimatorController state) |
| Call `Fire()` / `Stop()` from your own script | **Z3 Fishing** / **Z4 Stream Console** | Hold a reference to `HapbeatSequenceTrigger` / `HapbeatUnityEventTrigger` in the script |
| Continuously modulate gain / pan from a Slider (declarative) | **Z4 Stream Console** | Slider + `HapbeatParameterBinding` (Source=SliderValue, Output=StreamGain / StreamPan) |
| Change the loop gain with an object's motion (declarative) | **Z3 Fishing** | `HapbeatParameterBinding` (Source=VelocityMagnitude, Output=StreamGain) |
| Custom script evaluates condition → emits UnityEvent → Trigger | **Z5 TargetBoard** | `TargetReceiver.OnHitLight / OnHitHeavy` (UnityEvent) → `HapbeatUnityEventTrigger.Fire` |
| Wire key input to a Trigger without code | Global hotkeys | `HapbeatKeyDispatcher` → `HapbeatUnityEventTrigger.Fire` / `HapbeatActionHelper.Ping` |
| Call the Manager API directly without a Trigger (advanced) | **Z5 ChargeShooter** | Read entries from the EventMap and call `HapbeatManager.StreamAudioClip(...)` |

→ **Zones are not exclusive to one pattern** — each zone contains multiple patterns in practice. For the procedure of calling from a script, see [](/en/docs/sdk-integration/unity-sdk/scripting/).

## When to Use Each Approach

Showcase uses both the **component approach (wire Triggers in the Inspector)** and the **script approach (call from your own script)**, varying per zone. For guidance on choosing between them, see [BatchSetup vs Script](/en/docs/sdk-integration/unity-sdk/showcase/method-choice/).

### Component Approach

| Zone | Component | Why this approach |
|---|---|---|
| Z1 Bowling | `HapbeatCollisionTrigger` (on `BowlingPin.prefab`, shared by all 6 pins) | Classic use case for applying the same settings to many objects |
| Z2 Door | `HapbeatStateBehaviour` (attached to Animator state) | Animator state Enter needs no UnityEvent — the component handles it declaratively |
| Z3 Fishing | `HapbeatParameterBinding` (FishingObject velocity → loop gain) | Momentum-based modulation, all within the Inspector |
| Z4 Slider | `HapbeatTickEmitter` + `HapbeatParameterBinding` (Gain / Pan Slider) | Feeds Slider value changes into ticks and gain / pan without code |
| Z5 Hit | `HapbeatUnityEventTrigger` (wired from TargetReceiver's OnHitLight / OnHitHeavy) | Textbook UnityEvent wiring example |
| Hotkeys | `HapbeatKeyDispatcher` + `HapbeatActionHelper` + `HapbeatUnityEventTrigger` | Key input wired declaratively via UnityEvent |

### Script Approach

| Zone | Script | API called | Why this approach |
|---|---|---|---|
| Z3 Fishing | `FishingController` | `HapbeatSequenceTrigger.Fire()` / `Stop()` | The "grabbed / released" decision lives in custom physics logic |
| Z4 Stream | `StreamDemoController` | `HapbeatUnityEventTrigger.Fire()` / `Stop()` + `ActivePlayback` | Space toggles play / stop, and it needs to know whether it is playing |
| Z5 Charge | `ChargeShooter` | `HapbeatManager.StreamAudioClip(...)` + `HapbeatStreamPlayback.ApplyGainModulation(...)` | Changes the loop strength every frame by charge amount, and switches entries by threshold and shot strength |

## Per-Zone Wiring Details

### Z1 Bowling Lane

LMB launches a ball (Space resets the pins). When it hits a pin, that pin's `HapbeatCollisionTrigger` fires with a gain scaled to the collision velocity.

- `Prefabs/BowlingPin.prefab` has `HapbeatCollisionTrigger` (the 6 pins are instances of this prefab)
  - **Event Map**: `ShowcaseEventMap`, **Event**: `Z1_pin_hit`
  - **Trigger Event**: `CollisionEnter`
  - **Gain Mode**: `VelocityScaled` (the closer the collision velocity is to **Max Velocity**, the stronger)
- `BallLauncher` (`Z1_Bowling`) handles only launching and resetting. It does not touch any Hapbeat components

### Z2 Swing Door

F opens / closes, G slams, L locks / unlocks. `DoorController` operates the Animator parameters, and the `HapbeatStateBehaviour` on the destination state fires the haptics.

- `Z2_Door/Door` has `Animator` + `DoorController` (key → Animator Trigger: F → `DoorAction`, G → `Slam`, L → `LockToggle`)
- Each state in `DoorAnimator.controller` has a `HapbeatStateBehaviour` (all with **Entry On Enter**)

| state | Event | Required Previous State |
|---|---|---|
| `Open` | `Z2_door_open` | `Closed` |
| `Closed` | `Z2_door_close` | `Open` |
| `Slam` | `Z2_door_slam` | `Open` |
| `LockEngage` | `Z2_door_lock` | — |
| `LockRelease` | `Z2_door_unlock` | — |
| `LockedRattle` | `Z2_door_rattle` | — |

### Z3 Fishing Rod

LMB hold hangs an object from the fishing line, and releasing drops it. While it is hanging, the Sequence loop plays, and `HapbeatParameterBinding` reflects the object's velocity in the loop gain.

- `Z3_Fishing` has `HapbeatSequenceTrigger`
  - **On Start**: `Z3_hook_start`
  - **Loop (hold)**: `Z3_hook_loop` (StreamClip, loop)
  - **On Stop**: `Z3_hook_release`
- `Z3_Fishing/FishingObject` has `HapbeatParameterBinding` (generated from the Bindings of the `Z3_hook_loop` entry)
  - **Source Property**: `VelocityMagnitude`, **Output**: `StreamGain`
- `FishingController` (`Z3_Fishing`) only calls `_sequence.Fire()` / `_sequence.Stop()` on LMB press / release. These two lines are all the haptics-related code

### Z4 Stream Console

Space toggles stream playback on / off. The Gain / Pan Sliders change the strength and left / right balance during playback (moving a Slider also plays ticks).

- `Z4_Stream/StreamCanvas/StreamPanelHud` has `HapbeatUnityEventTrigger` (**Event**: `Z4_stream_loop`, StreamClip, loop) + `StreamDemoController`
  - On Space, `StreamDemoController` checks `ActivePlayback` and calls `Stop()` if playing, `Fire()` if stopped
- `GainSlider` / `PanSlider` each have
  - `HapbeatParameterBinding` (**Source Property**: `SliderValue`, **Output**: `StreamGain` / `StreamPan`)
  - `HapbeatTickEmitter` (**Event**: `Z4_slider_tick`)
- `Z4_Stream/AddressOverridePanel` lets you try the runtime override of player / group (→ [](/en/docs/sdk-integration/unity-sdk/targeting/))

> `StreamDemoController.cs` also keeps, in comments, the approach of writing `ActivePlayback.Gain` / `Pan` from the script instead of the Binding. Both give the same behaviour.

### Z5 Charge & Shoot

LMB hold charges → release fires. While charging, the rumble loop gets stronger, and it plays once when a threshold is exceeded. On firing, a weak or strong shot is chosen by charge amount. Hitting the target plays a separate Trigger.

- `Z5_ChargeShot` has `ChargeShooter` (an example of the script approach that **does not use Trigger components**)
  - Select `ShowcaseEventMap` and four entries (`Z5_charge_loop` / `Z5_charge_thd` / `Z5_shot_light` / `Z5_shot_heavy`) in the Inspector
  - Start of charge: starts `Z5_charge_loop` with `HapbeatManager.StreamAudioClip(...)` and calls `ApplyGainModulation(_gainCurve.Evaluate(chargeT))` every frame
  - Firing: `Stop()`s the loop and plays `Z5_shot_light` / `Z5_shot_heavy` once depending on charge amount
  - Gain / target / clip are read from the EventMap entries (`entry.GetEffectiveGain()` / `entry.target` / `entry.streamClip`), so edits in the EventMap window take effect as they are
- `Z5_ChargeShot/TargetBoard` has `TargetReceiver`, and its children `Event_Hit_Light` / `Event_Hit_Heavy` have `HapbeatUnityEventTrigger` (`Z5_tar_hit_light` / `Z5_tar_hit_heavy`)
  - `TargetReceiver.OnHitLight` → `Fire()` of `Event_Hit_Light`, `OnHitHeavy` → `Fire()` of `Event_Hit_Heavy`

### Global Hotkeys

Q and P keys are wired via UnityEvent. Scripts handle only HUD display.

- `[Hapbeat Event Router]` GameObject consolidates:
  - `HapbeatManager` (singleton)
  - `HapbeatKeyDispatcher` — Q / P declared declaratively as UnityEvents in the Bindings list
  - `HapbeatActionHelper` — provides `Ping()`
  - `HapbeatUnityEventTrigger` (**Event**: `Z5_tar_hit_light`)
- Wiring:
  - Q → `HapbeatUnityEventTrigger.Fire()`
  - P → `HapbeatActionHelper.Ping()` + `GlobalHotkeys.NotifyPingSent()`
- `GlobalHotkeys` (script) only updates the HUD RTT display when a Pong is received

## Handling the WASD vs UI nav conflict

Unity's **`InputSystemUIInputModule`** binds **WASD** to the default `UI/Navigate` action. When a Slider has focus, pressing WASD moves the player and changes the Slider value at the same time.

Showcase touches the stream gain Slider in Z4, so it applies a two-pronged workaround.

1. **`SimpleFPSController.HandleMove` only runs while the cursor is locked** — Z4 enters with `unlockCursorOnEnter=true`, so the player does not move with WASD
2. **`UiDeselectOnPointerUp` is attached to each Slider** — clears the EventSystem selection on mouse-button release, so subsequent WASD presses no longer reach the Slider

### The proper fix in a real project

Showcase takes the workaround above to prioritise zero-config setup, but **the proper fix in a real project is to remove WASD from the UI Input Module**.

1. Copy `Packages/Input System/.../DefaultInputActions.inputactions` into `Assets/`
2. Open the copy in the Input Actions Editor and delete the four bindings for `<Keyboard>/w`, `<Keyboard>/a`, `<Keyboard>/s` and `<Keyboard>/d` under **UI / Navigate / 2D Vector Composite** (keep the Arrow keys)
3. Replace the **EventSystem → Input System UI Input Module → Actions Asset** with the copy

This makes `UiDeselectOnPointerUp` unnecessary and eliminates WASD interference for the UI elements (Sliders, Dropdowns, etc.) across the whole project.
