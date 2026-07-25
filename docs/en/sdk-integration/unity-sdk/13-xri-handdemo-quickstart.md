---
title: Add Haptics to the XRI Hand Demo
kind: howto
description: How to bolt Hapbeat haptics onto the XR Interaction Toolkit "Hands Interaction Demo" with a single Editor menu command.
sidebar:
  order: 200
  label: Add haptics to XRI demo
---

Add Hapbeat haptics to **"Hands Interaction Demo"**, the official **XR Interaction Toolkit (XRI)** sample from Unity. Grabbing, poking, snapping and scrubbing all get haptic feedback.

:::tip[You don't need Unity just to try it]
We distribute a prebuilt APK → [](/en/docs/sdk-integration/unity-sdk/xri-handdemo-apk/)
:::

## What you need

- Unity Editor (per the requirements in [](/en/docs/sdk-integration/unity-sdk/installation/))
- XR Interaction Toolkit (verified with **3.3.1**)
- Hapbeat SDK
- A Hapbeat device (on the same Wi-Fi as the PC running Unity)
- A hand-tracking HMD (Quest 3 / 3S etc.)

## Steps

1. **Install the XR Interaction Toolkit**
   - From Package Manager → Unity Registry. Projects created from the VR template already have it

2. **From the XRI Samples, import *Starter Assets* and *Hands Interaction Demo***
   - They land in `Assets/Samples/XR Interaction Toolkit/<version>/Hands Interaction Demo/`

3. **Install the Hapbeat SDK**
   - For the Git URL procedure, see [](/en/docs/sdk-integration/unity-sdk/installation/)

4. **From the Hapbeat SDK Samples, import *XR Helpers* and *XRI Hand Demo (haptics add-on)***
   - **Both are required.** The former holds the XRI filter components, the latter the EventMap and Kit

5. **Enable the Hand Interaction Profile and the Hand Tracking Subsystem in OpenXR**
   - Configure them in `Project Settings → XR Plug-in Management → OpenXR`, under **the tab for your build target** (Android for standalone Quest, PC for Editor Play over Air Link)
   - Without this you end up with "haptics fire but you cannot grab." Poking works from finger position alone, but grabbing is a pinch — it needs select input, and the Hand Interaction Profile is what supplies it

6. **Open `HandsDemoScene.unity`**

7. **Run the menu command `Hapbeat > Samples > Augment XRI Hand Demo`**
   - The haptic components are placed and wired into XRI's UnityEvents
   - A single Undo reverts everything. Re-running never duplicates anything
   - Counts of applied items, skipped items and warnings are logged to the Console as one line

8. **Put the Hapbeat on the same Wi-Fi and press Play**

:::tip[When you want to review the wiring points]
Instead of step 7, run `Hapbeat > Samples > Augment XRI Hand Demo (+ diagnostic Event Logger)` to log every XRI event on the poke button to the Console.
:::

## No Kit deployment required

All 10 entries in the bundled EventMap are **CLIP (StreamClip)**, so the waveforms are streamed from the app. Import it, press Play, and it works as-is.

`hand-demo-kit-manifest.json` is bundled so you can preview the reference intensity in the EventMap. For the difference from FIRE, see [](/en/docs/sdk-integration/unity-sdk/fire-vs-clip/).

## When it doesn't work

| Symptom | Fix |
|---|---|
| `HandsDemoEventMap.asset` not found | The *XRI Hand Demo (haptics add-on)* sample is not imported. Step 4 |
| The open scene is not the Hands Interaction Demo | Wrong scene, or an XRI version difference. The dialog lists the paths it could not find |
| Console shows `GameObject '…' not found` | XRI renamed or moved it. **Wire the paths in the warning manually** ([](/en/docs/sdk-integration/unity-sdk/triggers/)) |
| Console shows `type '…HapbeatXRGrabFilter' not found` | The *XR Helpers* sample is not imported. Step 4 |
| Haptics fire but you cannot grab | Enable the Hand Interaction Profile and the Hand Tracking Subsystem. Step 5 |
| No haptics at all | The connectivity entries in [](/en/docs/support/faq/) |

## License, and why we ship a tool

The Hapbeat SDK distributes only three things — **the EventMap, the Kit, and the Editor command that applies the wiring**. It does not include the scene itself. Not a single XRI-authored asset is in it.

The XRI samples are covered by the **Unity Companion License (UCL)**, which does grant reproduction, derivative works, distribution and sublicensing (exercised for creating, using and distributing Unity-engine-dependent applications and content). Even so, we do not ship the scene, for these reasons:

- **UCL section 3.2** — derivative works of the Software (an augmented `HandsDemoScene`) are **owned by Unity**
- **UCL section 5** — distributing a substantial portion of the Software carries an obligation to **include the copyright notice and the license text**
- Keeping third-party assets out of the SDK sidesteps both points

**Shipping a built application (an APK, say) is a different matter** — it is exactly the application the UCL contemplates, so it falls within the grant → [](/en/docs/sdk-integration/unity-sdk/xri-handdemo-apk/)

## Next

- [](/en/docs/sdk-integration/unity-sdk/triggers/) — what each applied Trigger component does
- [](/en/docs/sdk-integration/unity-sdk/event-map/) — edit the EventMap to tune the feel
