---
title: Walkthrough
kind: tutorial
sidebar:
  order: 200
description: Things to try after playing the Showcase scene — tips for experimenting, switching to Command mode, handling WASD conflicts, and troubleshooting.
---

This page covers **things to try and common stumbling blocks** while playing the [Showcase Sample](./). For how to open the scene and zone layout, see the [overview](./). For per-zone wiring details, see the [Wiring Reference](/en/docs/sdk-integration/unity-sdk/showcase/wiring/).

## Experiment and Feel the Difference (Playground)

Showcase is not a read-only catalog — it is a **playground where you tweak the Inspector, hit Play, and feel what changes**. Below are small, high-impact edits for each zone.

### Z1 Bowling — Change the velocity scaling curve

- Lower `MaxVelocity` on `Pin_*` `HapbeatCollisionTrigger` from 5 → 2 → **even light collisions reach full intensity**
- Switch `Gain Mode` from `VelocityScaled` → `Fixed` → **uniform intensity regardless of speed**. Hear the difference between a "game-feel impact" and a "physical impact"
- Change the `target` on the `pin_hit` EventMap entry to `*/pos_neck` → feel the impact at the neck instead

### Z2 Door — Wire a different Animator state

- Add `HapbeatStateBehaviour` to another state in `DoorAnimator.controller` → explore more variations of state-transition firing
- Swap the `streamClip` on the `door_open` / `door_close` EventMap entries for a different WAV → experience how independently you can author audio and haptics
- Set `gain` on `door_open` to 0.3 in the EventMap → a haptic version of a quiet close

### Z3 Fishing — Change the Parameter Binding

- In the Binding preset for the `grab_loop` entry, change **Source Property** from `PositionDeltaMagnitude` → `LocalPositionY` → **gain driven by height** (hold higher = stronger vibration)
- Changing Range from 0.2–1.5 → 0.5–3.0 makes the response steeper. Toggle `Curve` between `Linear` and `EaseInOut` to change the ramp-up feel at the start of rubbing
- Replace the `streamClip` on the loop entry with a different looping asset to feel the effect of loop length (watch for audible seams with short clips)

### Z4 Stream — Add a Gain/Pan binding

- Instead of the existing Slider → `playback.Gain` script path, attach `HapbeatParameterBinding` to the Slider → achieve the same result without any script (declarative path)
- Raise `HapbeatTickEmitter` `Tick Threshold` from 0.05 → 0.2 → **fewer ticks, coarser feedback**
- Uncheck `loop` on the StreamClip to make it a one-shot → notice the difference between an ambient loop and a single shot
- Change `target` from broadcast to `*/pos_r_arm` fixed → verify "only a specific position receives" behaviour

### Z5 Charge & Shoot — Change the curve shape

- Edit `ChargeShooter._gainCurve` directly in the Inspector (AnimationCurve field) to a convex-up shape → **intensity ramps up strongly from the start of charge**
- Set the same curve to `Linear` and release at the 1/4 point → see how **release timing directly maps to haptic gain**
- Change the `target_hit` entry mode from `StreamClip` → `Command` and deploy via Kit → experience lower-latency hit response

### Across the EventMap

- Open **Hapbeat → Open Event Map** and change the `gain` column from 0.5 → 1.5 for all entries to raise the overall intensity
- Set `target` to `*/pos_neck` for all entries and try a "neck-only" mode
- Switch `Mode` from `StreamClip` → `Command` in the `Mode` column, deploy the corresponding Kit from Studio, and feel the lower latency

> If you want to revert your edits, re-import Showcase from the Package Manager to restore the authored version. The sample folder (`Assets/Samples/Hapbeat SDK/<version>/Showcase/`) is overwritten on re-import, so copy any changes you want to keep to a separate folder first.

## Reproducing with Command Mode (Optional, Studio Required)

Showcase is designed to be fully self-contained using **StreamClip only**. As a next step, you can switch to Command mode to experience what changes when you manage your Kit in Hapbeat Studio (optional).

### Benefits of Command Mode

- **Lower latency**: only an event ID (a short string) is sent — arrives faster than a PCM stream
- **Clip playback from device memory**: no WAV files needed on the Unity side (smaller app footprint)
- **Edit clips in Studio**: update and deploy the Kit from Studio without rebuilding the Unity project

### Steps

1. **Create a Kit in Studio (or reuse the bundled showcase-kit)**
   - After import, `Assets/Samples/Hapbeat SDK/<version>/Showcase/Kit/showcase-kit-manifest.json` is bundled with the sample
   - Open this Kit in Hapbeat Studio (or work on an independent copy)
   - Add Command WAV files (e.g. `pin_hit.wav`) to `install-clips/`
2. **Deploy the Kit to the device** (Studio: Save → Deploy)
3. **Switch mode to Command in the EventMap**
   - Open the `pin_hit` entry and set Mode to `Command`
   - Category = `showcase-kit`, Event Name = `pin_hit` (Event ID = `showcase-kit.pin_hit`)
   - Leave the `streamClip` field as-is (ignored in Command mode)
4. **Switch entries to Command one by one**
   - You do not need to convert everything — a practical approach is Command for high-impact events and StreamClip for ambient/drag loops
5. Verify in Play mode

### Command + StreamClip Mixed Strategy

- **Command**: impact events (`pin_hit`, `target_hit`, `charge_release`, `manual_fire`, etc.). Low latency matters here.
- **StreamClip**: looping events (`grab_loop`, `stream_demo`). Dynamic modulation via ParameterBinding.

Playing with both side-by-side lets you feel the difference between Command's fast response and StreamClip's expressive flexibility.

## WASD and UI Navigation Conflict (Showcase's Approach)

Unity's **`InputSystemUIInputModule`** binds **WASD** to `UI/Navigate` by default. When a Slider has focus, pressing WASD both moves the player and changes the Slider value (UI navigation).

Zone 4 involves interacting with the stream gain Slider, so Showcase uses a two-pronged workaround:

1. **`SimpleFPSController.HandleMove` only runs while the cursor is locked** — Z4 enters with `unlockCursorOnEnter=true`, so the player does not move with WASD while the cursor is free
2. **`UiDeselectOnPointerUp` is attached to each Slider** — clears the EventSystem selection on mouse-button release, so subsequent WASD presses no longer reach the Slider

### Recommended fix for production projects

Showcase uses the above workaround to prioritise zero-config setup, but **the proper fix for a real project is to remove WASD from the UI Input Module**:

1. Copy `Packages/Input System/.../DefaultInputActions.inputactions` into `Assets/`
2. Open the copy in the Input Actions Editor → under **UI / Navigate / 2D Vector Composite**, delete the four bindings for `<Keyboard>/w`, `<Keyboard>/a`, `<Keyboard>/s`, and `<Keyboard>/d` (keep Arrow keys)
3. On the **EventSystem → Input System UI Input Module → Actions Asset**, assign the copied asset

This makes `UiDeselectOnPointerUp` unnecessary and eliminates WASD interference for all UI elements (Sliders, Dropdowns, etc.) project-wide.

## Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| No haptic output at all | Hapbeat device is offline — check connection in Studio / Helper |
| Connected but no output | `HapbeatManager` missing from `[Hapbeat Event Router]`, or a Trigger has no `EventMap` assigned |
| `[Hapbeat] Entry not found` in the log | Mismatch between the EventMap entry display name and the Trigger's selected entry. Check the Entry dropdown in the Inspector |
| Sequence loop is silent | `streamClip` not assigned on the `grab_loop` entry, or `loop` checkbox not checked |
| Tick fires too rapidly | Tick Threshold is too low. Try ~0.05 |
| Changing the picker has no effect on Z1 | Expected behaviour (the entry's fixed target takes priority). Test dynamic targeting with Z4, Z5, or the hotkeys |
