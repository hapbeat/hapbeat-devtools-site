---
title: Walkthrough
kind: tutorial
sidebar:
  order: 200
description: Things to try after playing the Showcase scene — tips for experimenting, switching to Command mode, handling WASD conflicts, and troubleshooting.
---

This page covers **things to try and common stumbling blocks** while playing the [Showcase Sample](/en/docs/sdk-integration/unity-sdk/showcase/overview/). For how to open the scene and zone layout, see the [overview](/en/docs/sdk-integration/unity-sdk/showcase/overview/). For per-zone wiring details, see the [Wiring Reference](/en/docs/sdk-integration/unity-sdk/showcase/wiring/).

## Experiment and Feel the Difference (Playground)

Showcase is not a read-only catalog — it is a **playground where you tweak the Inspector, hit Play, and feel what changes**. Below are small, high-impact edits for each zone.

### Z1 Bowling — Change the velocity scaling

- Lower **Max Velocity** on the `HapbeatCollisionTrigger` of `Prefabs/BowlingPin.prefab` → **even light collisions reach full intensity**
- Switch `Gain Mode` from `VelocityScaled` → `Fixed` → **uniform intensity regardless of speed**. Hear the difference between a "game-feel impact" and a "physical impact"
- Change the Targeting of `Z1_pin_hit` in the EventMap to `*/pos_neck` → feel the impact at the neck instead

### Z2 Door — Change the haptics per state

- Swap the Clip of `Z2_door_open` / `Z2_door_close` for a different WAV → experience how independently you can author the door's "sound" and "haptics"
- Lower the Gain of `Z2_door_close` in the EventMap → a haptic version of a door that closes quietly
- Empty the **Required Previous State** of the `HapbeatStateBehaviour` attached to a state in `DoorAnimator.controller` → it fires no matter which state you come from

### Z3 Fishing — Change the Parameter Binding

- In the Bindings of the `Z3_hook_loop` entry, change **Source Property** from `VelocityMagnitude` → `LocalPositionY` → **gain driven by height** (hold it higher = stronger vibration)
- Changing the input / output Range changes how sharp the response is. Toggle `Curve` between `Linear` and `EaseInOut` to change the ramp-up feel at the start of a swing
- Replace the Clip of `Z3_hook_loop` with a different looping asset to feel the effect of loop length (watch for audible seams with short clips)

### Z4 Stream — Change the Slider and ticks

- Raise **Tick Threshold** on the `HapbeatTickEmitter` of the Gain / Pan Sliders → **fewer ticks, coarser feedback**
- Uncheck **Loop** on `Z4_stream_loop` → notice the difference between an ambient loop and a single shot
- Set the Targeting of `Z4_stream_loop` to `*/pos_r_arm` and verify "only a specific position receives" behaviour
- Remove the Slider's `HapbeatParameterBinding` and enable the commented-out part of `StreamDemoController.cs` (`ActivePlayback.Gain = slider.value`) → the same behaviour written as a script

### Z5 Charge & Shoot — Change the curve shape

- Make **Gain Curve** on the `ChargeShooter` of `Z5_ChargeShot` a convex-up curve → **intensity ramps up strongly from the start of charge**
- Turn **Shot Follows Charge T** ON, and the strength of the shot also follows the charge amount
- Change the Mode of `Z5_tar_hit_light` / `Z5_tar_hit_heavy` to `FIRE (Command)` and deploy via Kit → lower-latency hit response

### Across the EventMap

- Open **Hapbeat → Open Event Map** and change the Gain of each entry to change the overall intensity of the whole zone
- Set Targeting to `*/pos_neck` and try a "neck-only" mode
- Switch Mode from `CLIP (Stream Clip)` → `FIRE (Command)`, deploy the corresponding Kit from Studio, and feel the lower latency (next section)

> If you want to revert your edits, re-import Showcase from the Package Manager to restore the authored version. The sample folder (`Assets/Samples/Hapbeat SDK/<version>/Showcase/`) is overwritten on re-import, so copy any changes you want to keep to a separate folder first.

## Reproducing with Command Mode (Optional, Studio Required)

Showcase is designed to be fully self-contained using **StreamClip only**. As a next step, you can switch to Command mode to experience what changes when you manage your Kit in Hapbeat Studio (optional).

### Benefits of Command Mode

- **Lower latency**: only an event ID (a short string) is sent — arrives faster than a PCM stream
- **Clip playback from device memory**: no WAV files needed on the Unity side (smaller app footprint)
- **Edit clips in Studio**: update and deploy the Kit from Studio without rebuilding the Unity project

### Steps

1. **Deploy the Kit to the device**
   - Showcase bundles `Kit/showcase-kit/` (the manifest, plus `install-clips/` for FIRE and `stream-clips/` for CLIP)
   - Open this folder in the Kit tab of Hapbeat Studio and **Deploy** it to the device (same procedure as "Deploy the Kit from Studio" in [](/en/docs/sdk-integration/unity-sdk/getting-started/))
2. **Switch Mode to FIRE in the EventMap**
   - Example: set the Mode of `Z1_pin_hit` to `FIRE (Command)`. The Event ID is `showcase-kit.z1_pin_hit`
   - Leave the Clip field as-is (it is not used in FIRE)
3. **Switch the entries you want to try to FIRE one by one**
   - You do not need to convert everything — a practical approach is FIRE for the impact events where low latency matters and CLIP for loops
4. Verify in Play mode

### Command + StreamClip Mixed Strategy

- **Suited to FIRE (Command)**: impacts (`Z1_pin_hit`, `Z2_door_slam`, `Z5_tar_hit_*`, `Z5_shot_*`, etc.). Low latency pays off
- **Suited to CLIP (Stream)**: loops (`Z3_hook_loop`, `Z4_stream_loop`, `Z5_charge_loop`). Intensity can be changed during playback via Parameter Binding or script

Playing with both on a real device lets you feel the difference between Command's fast response and StreamClip's expressive flexibility.

## Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| The Slider value moves with WASD after you touch it | Unity's standard UI navigation binds WASD. Showcase already works around it. For the proper fix in a real project, see [](/en/docs/sdk-integration/unity-sdk/showcase/wiring/#handling-the-wasd-vs-ui-nav-conflict) |
| No haptic output at all | Hapbeat device is offline — check connection in Studio / Helper |
| Connected but no output | `HapbeatManager` missing from `[Hapbeat Event Router]`, or a Trigger has no `EventMap` assigned |
| `entry id '...' not found` warning appears | The entry the Trigger references was deleted from the EventMap. Pick it again from the Event dropdown in the Inspector |
| Sequence loop is silent | The Clip is not assigned on the `Z3_hook_loop` entry, or Loop is not checked |
| Tick fires too rapidly | `HapbeatTickEmitter`'s Tick Threshold is too low. Raise the value |
