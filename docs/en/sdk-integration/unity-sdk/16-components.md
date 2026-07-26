---
title: Other Components
kind: reference
sidebar:
  order: 300
description: Runtime components other than Trigger / Parameter Binding — reference for the settings panel, status HUD, key input and UnityEvent helpers.
---

For the Trigger family see [](/en/docs/sdk-integration/unity-sdk/triggers/), and for Parameter Binding see [](/en/docs/sdk-integration/unity-sdk/parameter-binding/). This page covers the remaining runtime components. All of them can be added from `Add Component → Hapbeat/`.

| Component | Role |
|---|---|
| **Hapbeat Address Override Panel** | Generates a UI for setting player / group at runtime |
| **Hapbeat Status Overlay** | A debug HUD showing connection state and event history in UI Text |
| **Hapbeat Key Dispatcher** | Maps a single key press to a UnityEvent |
| **Hapbeat Action Helper** | Makes Stop / StopAll / StopStream / Ping callable from the Inspector |
| **Hapbeat Event Logger (Diagnostic)** | Prints UnityEvent firings to the Console with timestamps |

## Hapbeat Address Override Panel

Adding a single one to a GameObject generates a runtime UI with Player -/+ , Group -/+ , Play, Apply and Exit. You do not need to build a UI hierarchy in the scene. For its purpose and design background, see [](/en/docs/sdk-integration/unity-sdk/targeting/#override-targeting).

### Main settings

| Item | Default | Description |
|---|---|---|
| `Space` | `ScreenSpaceOverlay` | Screen-fixed HUD. Use `WorldSpace` to place it in space for VR |
| `World Attach Mode` | `LazyFollow` | `LazyFollow` = moves in front of you only when it leaves your view / `WorldFixed` = stays where you put it |
| `Follow Distance` | `1.5` m | Distance from the camera in `WorldSpace` |
| `Follow Vertical Offset` | `0` m | Same, vertical position |
| `Follow Deadzone Degrees` | `10°` | It does not move while within this angle |
| `Follow Smooth Seconds` | `0.25` s | Time constant of the movement |
| `World Pixel Density` | `3` (range 1–8) | Font rasterization resolution in `WorldSpace` |

Leaving `Follow Camera` unset uses `Camera.main`. If no camera is found, it warns once and behaves as `WorldFixed`.

### Taking controller input

`RegisterFocusable` / `MoveFocus` / `ActivateFocused` drive a 2D focus grid. The actual work behind Play / Exit is injected externally through `OnPlayRequested` / `OnExitRequested`. For an implementation example, see the VR Config Example sample (→ [](/en/docs/sdk-integration/unity-sdk/vr-config-example/)).

`PanelCanvasTransform` / `IsFollowingView` / `FollowVerticalOffset` / `SnapToView()` are public. Use them to hang your own world-space UI under the panel Canvas, or to implement a "bring it back to the centre of my view" action.

### When text blurs only on device

If it looks clean in the Editor (Air Link etc.) but soft only in a Quest device build, the cause is that **Quality levels are separate per platform**. Editor Play over Air Link uses the Standalone settings, while a device build uses the Android ones.

- The VR template's default URP asset `Mobile_RPAsset` has **Render Scale 0.8**. Opening the asset the Android side references in `Project Settings > Quality` and setting it to `1.0` improves this
- Raising the panel's `World Pixel Density` rasterizes the font at a higher resolution at the same physical size (at the cost of font atlas memory)

Both are **settings of the consuming project**, and cannot be changed from the SDK.

## Hapbeat Status Overlay

A debug HUD that feeds connection state and event history into two UI Texts.

- **Status** — connection state / streaming flag
- **Log** — OnConnected / OnDisconnected / OnPong / OnError and stream transitions, one line each. `maxLogLines` sets the limit

It is meant for verification, not for inclusion in a production build.

## Hapbeat Key Dispatcher

Maps a single key press to a UnityEvent in the Inspector. Intended for situations not worth wiring up `PlayerInput` / `InputAction` (samples, prototypes, debugging).

Combined with `HapbeatUnityEventTrigger` or `HapbeatActionHelper`, it lets you wire key → haptic firing without writing a script.

## Hapbeat Action Helper

A wrapper that exposes the singleton-only methods of `HapbeatManager` (`Stop` / `StopAll` / `StopStream` / `Ping`) as instance methods.

That makes them **directly assignable as targets** from UnityEvents on UI Buttons, the Key Dispatcher, Animation Events and so on, so you no longer need to write a MonoBehaviour just for this purpose.

## Hapbeat Event Logger (Diagnostic)

A diagnostic component that prints one line with a tag and a timestamp to the Console every time it is called through a UnityEvent.

Attach it to an XRI Interactable and wire up all of hoverEntered / selectEntered and so on to observe **which events fire in which order**. Use it while deciding where to wire things, and remove it afterwards since it is otherwise just noise.

The wiring can be automated with `Hapbeat > Attach Event Logger to Selected` (→ [](/en/docs/sdk-integration/unity-sdk/editor-menus/)).
