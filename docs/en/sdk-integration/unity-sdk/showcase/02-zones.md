---
title: Showcase zone details
kind: reference
sidebar:
  label: Showcase zone details
  order: 200
description: For each Showcase zone, the controls, the wiring (which GameObject holds which component), the scripts and modifications to try, plus playback in FIRE mode and troubleshooting.
---

For each zone of the [Showcase sample](/en/docs/sdk-integration/unity-sdk/showcase/overview/), this page collects the **controls**, the **wiring** (which GameObject holds which component), and **things to try** (modifications that show the difference when you change the Inspector). It is meant to be read with `Showcase.unity` open in Unity, comparing against the Inspector.

To restore a modified sample, re-import Showcase from the Package Manager. A re-import overwrites the sample folder, so copy the folder elsewhere first if you want to keep your modifications.

## Z1 Bowling Lane

**Controls**: Left-click launches the ball, Space resets the pins. Hitting a pin plays at a strength that follows the collision speed.

**Wiring**

- `Prefabs/BowlingPin.prefab` holds `HapbeatCollisionTrigger` (the 6 pins are instances of this prefab)
  - **Event Map**: `ShowcaseEventMap`, **Event**: `Z1_pin_hit`
  - **Trigger Event**: `CollisionEnter`
  - **Gain Mode**: `VelocityScaled` (the closer the collision speed is to **Max Velocity**, the stronger)
- `BallLauncher` (`Z1_Bowling`) only launches and resets, and does not touch any Hapbeat component

**Try this**

- Lower **Max Velocity** on `HapbeatCollisionTrigger` → even a weak collision plays at full strength
- Set **Gain Mode** to `Fixed` → the strength is the same at any speed
- Set the Targeting of `Z1_pin_hit` in the EventMap to `*/pos_neck` → only the device at the neck position plays

## Z2 Swing Door

**Controls**: F opens / closes, G slams, L locks / unlocks.

**Wiring**

- `Z2_Door/Door` holds `Animator` + `DoorController`. Keys send Animator Triggers (F → `DoorAction`, G → `Slam`, L → `LockToggle`)
- Each state of `DoorAnimator.controller` holds a `HapbeatStateBehaviour`, which plays its entry when the state is entered (**On State Enter**)

| state | Event | Required Previous State |
|---|---|---|
| `Open` | `Z2_door_open` | `Closed` |
| `Closed` | `Z2_door_close` | `Open` |
| `Slam` | `Z2_door_slam` | `Open` |
| `LockEngage` | `Z2_door_lock` | — |
| `LockRelease` | `Z2_door_unlock` | — |
| `LockedRattle` | `Z2_door_rattle` | — |

`DoorController` only drives the Animator and holds no haptics code.

**Try this**

- Replace the Clip of `Z2_door_open` / `Z2_door_close` with another wav → confirms that sound and haptics can be made separately
- Lower the Gain of `Z2_door_close` in the EventMap → the haptics of a door closing quietly
- Empty **Required Previous State** on a state's `HapbeatStateBehaviour` → it plays whichever state it came from

## Z3 Fishing Rod

**Controls**: While you hold left-click, an object hangs on the fishing line (release to drop it). Move the view to swing the rod and the object sways. A loop plays while the object hangs, and it gets stronger the faster the object moves.

**Wiring**

- `Z3_Fishing` holds `HapbeatSequenceTrigger`
  - **On Start**: `Z3_hook_start` (one shot at the moment the object hangs)
  - **Loop (hold)**: `Z3_hook_loop` (CLIP, Loop)
  - **On Stop**: `Z3_hook_release` (one shot at the moment of release)
- `Z3_Fishing/FishingObject` holds `HapbeatParameterBinding` (set in the Bindings of the `Z3_hook_loop` entry)
  - **Source Property**: `VelocityMagnitude`, **Output**: `StreamGain`

**Script**: [`FishingController.cs`](https://github.com/hapbeat/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/FishingController.cs) calls `_sequence.Fire()` when left-click is pressed and `_sequence.Stop()` when it is released. These 2 lines are all the haptics code; the Parameter Binding handles the change in strength.

**Try this**

- Set **Source Property** to `LocalPositionY` in the Bindings of `Z3_hook_loop` → the higher you lift the object, the stronger
- Change the input / output ranges or the Curve → changes how the start of a swing rises
- Replace the Clip of `Z3_hook_loop` with another loop material (watch the loop seam with short material)

## Z4 Stream Console

**Controls**: Space starts / stops loop playback. The Gain / Pan sliders change the strength and left-right during playback (moving a slider also plays tick haptics). Switching to Z4 unlocks the cursor so you can operate the sliders with the mouse.

**Wiring**

- `Z4_Stream/StreamCanvas/StreamPanelHud` holds `HapbeatUnityEventTrigger` (**Event**: `Z4_stream_loop`, CLIP, Loop) and `StreamDemoController`
- `GainSlider` / `PanSlider` each hold
  - `HapbeatParameterBinding` (**Source Property**: `SliderValue`, **Output**: `StreamGain` / `StreamPan`)
  - `HapbeatTickEmitter` (Tick Trigger, **Event**: `Z4_slider_tick`)
- `Z4_Stream/AddressOverridePanel` lets you try overriding the player / group at runtime (→ [](/en/docs/sdk-integration/unity-sdk/targeting/))

**Script**: [`StreamDemoController.cs`](https://github.com/hapbeat/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/StreamDemoController.cs) checks the Trigger's `ActivePlayback` on Space, and calls `Stop()` if it is playing and `Fire()` if it is stopped. A way to write the slider value to `ActivePlayback.Gain` / `Pan` from the script instead of a Binding is also left in the comments (either gives the same behavior).

**Try this**

- Raise **Tick Threshold** on `HapbeatTickEmitter` → fewer ticks, and a coarser feel
- Turn off **Loop** on `Z4_stream_loop` → plays only once
- Set the Targeting of `Z4_stream_loop` to `*/pos_r_arm` → only the device at the right arm position plays
- Remove the sliders' `HapbeatParameterBinding` and enable the commented part of `StreamDemoController.cs` → the same behavior written as a script

## Z5 Charge & Shoot

**Controls**: Hold left-click to charge, release to fire. The loop gets stronger while charging, and plays once when it crosses a threshold. On firing, one of two kinds (light / heavy) plays depending on the charge amount. Hitting the target plays different haptics.

**Wiring**

- `Z5_ChargeShot` holds `ChargeShooter` (a script that uses no Trigger component)
  - In the Inspector, select `ShowcaseEventMap` and 4 entries (`Z5_charge_loop` / `Z5_charge_thd` / `Z5_shot_light` / `Z5_shot_heavy`)
- `Z5_ChargeShot/TargetBoard` holds `TargetReceiver`, and its children `Event_Hit_Light` / `Event_Hit_Heavy` hold `HapbeatUnityEventTrigger` (`Z5_tar_hit_light` / `Z5_tar_hit_heavy`)
  - The UnityEvents `OnHitLight` / `OnHitHeavy` of `TargetReceiver` call `Fire()` of each Trigger (wired in the Inspector)

**Script**: [`ChargeShooter.cs`](https://github.com/hapbeat/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/ChargeShooter.cs) is an advanced example that calls `HapbeatManager` directly.

- Charge start: plays `Z5_charge_loop` with `HapbeatManager.StreamAudioClip(...)`, and every frame calls `ApplyGainModulation(_gainCurve.Evaluate(chargeT))` on the returned handle to change the strength
- Fire: `Stop()`s the loop and plays `Z5_shot_light` / `Z5_shot_heavy` depending on the charge amount
- The strength, destination and clip are read from the EventMap entry (`entry.GetEffectiveGain()` / `entry.target` / `entry.streamClip`), so tuning in the EventMap window takes effect as is

**Try this**

- Make **Gain Curve** on `ChargeShooter` bulge upward → it gets strong early in the charge
- Turn on **Shot Follows Charge T** → the firing strength also follows the charge amount
- Set the Mode of `Z5_tar_hit_light` / `Z5_tar_hit_heavy` to `FIRE (Command)` and deploy the Kit → the hit response gets faster ([below](#play-with-fire-command))

## Wiring of the common key controls

Q / P are wired with UnityEvents, without writing code.

- `[Hapbeat Event Router]` gathers the following
  - `HapbeatManager`
  - `HapbeatKeyDispatcher` — set the mapping between keys and UnityEvents in the Inspector
  - `HapbeatActionHelper` — lets UnityEvents call `Ping()` and similar
  - `HapbeatUnityEventTrigger` (**Event**: `Z5_tar_hit_light`)
- Q → `HapbeatUnityEventTrigger.Fire()`, P → `HapbeatActionHelper.Ping()` and `GlobalHotkeys.NotifyPingSent()`
- `GlobalHotkeys` only receives the Ping reply and updates the on-screen display

## Try it across the whole EventMap

- Change the Gain of each entry in `Hapbeat → Open Event Map` → changes the strength across the zone
- Set Targeting to `*/pos_neck` → only the device at the neck position receives
- Change Mode from `CLIP (Stream Clip)` to `FIRE (Command)` (next section)

## Play with FIRE (Command)

All Showcase entries are CLIP (Stream) so that they work without deploying a Kit. Once you deploy the Kit to the device, you can also play them with FIRE (Command).

With FIRE:

- Only the Event ID is sent, so the response is fast
- The clip stored on the device plays, so the app does not need to hold the WAV
- Updating the Kit in Studio and deploying it again replaces the haptics without rebuilding the Unity side

Steps:

1. Open `Kit/showcase-kit/` bundled with Showcase (the manifest, `install-clips/` for FIRE and `stream-clips/` for CLIP) in the Kit tab of Hapbeat Studio and **Deploy** it to the device (same steps as "Deploy a Kit from Studio to enable FIRE" in [](/en/docs/sdk-integration/unity-sdk/getting-started/))
2. In the EventMap, set the Mode of the entries you want to try to `FIRE (Command)` (for example `Z1_pin_hit` → Event ID `showcase-kit.z1_pin_hit`). Leave the Clip field as it is (FIRE does not use it)
3. Check it with Play

You do not need to make everything FIRE. A practical split is FIRE for what benefits from a fast response, such as impacts (`Z1_pin_hit`, `Z2_door_slam`, `Z5_tar_hit_*`, `Z5_shot_*`), and CLIP for the loops (`Z3_hook_loop`, `Z4_stream_loop`, `Z5_charge_loop`), whose strength can change during playback.

## WASD conflicting with UI navigation

The default `UI/Navigate` of Unity's `InputSystemUIInputModule` has WASD assigned. Pressing WASD with a slider selected also changes the slider value while you move.

Showcase avoids this in 2 ways.

1. `SimpleFPSController` only moves while the cursor is locked (Z4 unlocks the cursor, so WASD does not move you there)
2. Each slider has `UiDeselectOnPointerUp`, which clears the selection when you release the drag

In your own project, removing WASD from the UI side is the reliable way.

1. Copy `Packages/Input System/.../DefaultInputActions.inputactions` under `Assets/`
2. Open the copy in the Input Actions Editor, and under **UI / Navigate / 2D Vector Composite** delete `<Keyboard>/w` `<Keyboard>/a` `<Keyboard>/s` `<Keyboard>/d` (keep the arrow keys)
3. Replace **EventSystem → Input System UI Input Module → Actions Asset** in the scene with the copy

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Nothing plays | The Hapbeat device is offline. Check the connection in Studio / Helper |
| Connected but nothing plays | `[Hapbeat Event Router]` has no `HapbeatManager`, or the Trigger's Event Map is not selected |
| `entry id '...' not found` warning | The entry the Trigger references was removed from the EventMap. Select it again in the Inspector's Event dropdown |
| The Z3 loop does not play | The Clip of `Z3_hook_loop` is not assigned, or Loop is OFF |
| Too many ticks | **Tick Threshold** on `HapbeatTickEmitter` is too small. Raise the value |
| WASD moves the value after you touch a slider | See [above](#wasd-conflicting-with-ui-navigation) |
