---
title: Add Haptics to the XRI Hand Demo
kind: howto
description: How to bolt Hapbeat haptics onto the XR Interaction Toolkit "Hands Interaction Demo" scene with a single Editor menu command — grab, hold, poke and slide all get haptic feedback.
sidebar:
  order: 200
---

This demo adds Hapbeat haptics to **"Hands Interaction Demo"**, a sample scene shipped with Unity's **XR Interaction Toolkit (XRI)**. Grabbing, holding, poking UI, snapping into sockets and scrubbing all get haptic feedback.

The Hapbeat SDK ships only three things: the **EventMap, the Kit, and an Editor command that applies the wiring**. The scene itself is the copy *you* import from the XRI package.

## Why a tool instead of a ready-made scene

XRI and its samples are distributed under the **Unity Companion License**, so Hapbeat cannot redistribute a modified copy of the scene.

The SDK therefore ships a command that applies **only the haptic-side diff (components and UnityEvent wiring) to your own `HandsDemoScene`**. No XRI-authored asset is contained in the Hapbeat SDK.

## What you need

- Unity Editor (see [](/en/docs/sdk-integration/unity-sdk/installation/) for requirements)
- **XR Interaction Toolkit** (verified with **3.3.1**)
- **Hapbeat SDK** (see [](/en/docs/sdk-integration/unity-sdk/installation/))
- A Hapbeat device on the same Wi-Fi LAN as the PC running Unity
- A hand-tracking HMD (Quest 3 / 3S etc.), per XRI's own requirements
- OpenXR's **Hand Interaction Profile** and **Hand Tracking Subsystem** enabled (step 5)

## Steps

1. **Package Manager → Unity Registry → install XR Interaction Toolkit**
   This installs XRI itself. **If you created the project from Unity's VR template, the XR Interaction Toolkit is already installed** and you can skip this step (just check the version). Only projects started from the 3D template and similar need to install it from Package Manager.
2. **In the XR Interaction Toolkit Samples tab, import *Starter Assets* and *Hands Interaction Demo***
   The scene and its assets land in `Assets/Samples/XR Interaction Toolkit/<version>/Hands Interaction Demo/`. Accept any additional samples XRI asks for.
3. **Install the Hapbeat SDK**
   Install from the Git URL — see [](/en/docs/sdk-integration/unity-sdk/installation/).
4. **In the Hapbeat SDK Samples list, import *XR Helpers* and *XRI Hand Demo (haptics add-on)***
   The former provides the XRI filter components; the latter brings `HandsDemoEventMap.asset` and `Kit/hand-demo-kit/`. **Both** are required.
5. **Enable hand-tracking input in the XR (OpenXR) settings**
   Open `Project Settings → XR Plug-in Management → OpenXR` and, in **the tab for your build target** (**Android** for standalone Quest, **PC** for Editor Play over Air Link etc.), set both of the following:
   - Add **Hand Interaction Profile** to **Enabled Interaction Profiles**
   - Enable the **Hand Tracking Subsystem** feature

   Without this you end up in a state where **haptics fire but you cannot grab anything**. Poking works from finger **position** alone, whereas grabbing is a pinch — it needs **select input**, and the Hand Interaction Profile is what supplies it.
6. **Open `HandsDemoScene.unity`**
   The command operates on the currently open scene.
7. **Run the menu command `Hapbeat > Samples > Augment XRI Hand Demo`**
   It places the haptic components (Sequence Trigger / UnityEvent Trigger / Tick Emitter / Parameter Binding, plus a `[Hapbeat Event Router]` object if the scene has no `HapbeatManager` yet) and wires them into XRI's UnityEvents. Counts of applied items, skipped items and warnings are logged to the Console as one line.
   - **Undoable**: a single `Edit → Undo` right after the run reverts everything.
   - **Idempotent**: components and wires that already match are skipped, so re-running never duplicates anything.
   - It **never edits XRI's own select events**. Socket interactions are wired through the events exposed by the *XR Helpers* filter components.
8. **Put the Hapbeat device on the same Wi-Fi, then press Play**
   Put on the HMD and grab a cube, press a button or drag a slider — haptics should follow.

:::tip[Deciding which event to wire]
Instead of step 7, run `Hapbeat > Samples > Augment XRI Hand Demo (+ diagnostic Event Logger)` to also log every XRI interactable event on the poke button to the Console. Useful while choosing wiring points, noisy otherwise.
:::

## About the `hand-demo-kit`

All **10 entries in the bundled EventMap are CLIP (StreamClip)**. CLIP streams a Unity AudioClip to the device as PCM, so **no Kit deployment to the device is required** — import the sample, press Play, and it works.

`Kit/hand-demo-kit/hand-demo-kit-manifest.json` is bundled so the EventMap can **preview the reference intensity** of each entry (per-entry gain acts as a multiplier on top of it). For the difference from FIRE mode, see [](/en/docs/sdk-integration/unity-sdk/fire-vs-clip/).

## Troubleshooting

| Symptom | Meaning and fix |
|---|---|
| Dialog: `HandsDemoEventMap.asset` was not found | The *XRI Hand Demo (haptics add-on)* sample is not imported. Do step 4, then re-run |
| Dialog: the open scene does not look like the Hands Interaction Demo | A different scene is open, or your XRI version changed the scene structure. The dialog lists every GameObject path it could not find — check your XRI version (3.3.1 is the verified one) |
| Console warning: `GameObject '…' not found` | XRI renamed or moved that object. The command applies whatever it can, so **wire the listed paths manually** (see [](/en/docs/sdk-integration/unity-sdk/triggers/) for the patterns) |
| Console warning: `type '…HapbeatXRGrabFilter' not found` | The *XR Helpers* sample is not imported. Do step 4, then re-run |
| Haptics fire but you cannot grab / hand gestures are not recognised | Enable OpenXR's **Hand Interaction Profile** and **Hand Tracking Subsystem** (step 5) |
| No haptics at all | See the connectivity section of [](/en/docs/support/faq/) and the checks in [](/en/docs/sdk-integration/unity-sdk/getting-started/) |

XRI 3.3.1 is the verified version. Other versions work as long as the scene structure is unchanged; where paths differ you get a warning for that spot only — the command as a whole does not fail.

## License note

Because the XRI samples are under the Unity Companion License, **you cannot redistribute the augmented `HandsDemoScene` as a modified scene**. Anyone you share this with has to follow the same steps: import the XRI sample themselves, then run the command.

## Next

- [](/en/docs/sdk-integration/unity-sdk/triggers/) — what each applied Trigger component does
- [](/en/docs/sdk-integration/unity-sdk/event-map/) — edit `HandsDemoEventMap` to tune the feel
- [](/en/docs/sdk-integration/unity-sdk/showcase/overview/) — a sample covering every wiring pattern without an XR device
