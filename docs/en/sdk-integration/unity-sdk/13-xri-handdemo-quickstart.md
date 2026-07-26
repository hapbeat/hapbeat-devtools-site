---
title: Add Haptics to the XRI Hand Demo
kind: howto
description: How to add Hapbeat haptic feedback to the XR Interaction Toolkit "Hands Interaction Demo" with a single Editor menu command.
sidebar:
  order: 200
  label: Add haptics to XRI demo
---

Add Hapbeat haptic feedback to "Hands Interaction Demo", the official [XR Interaction Toolkit (XRI)](https://docs.unity3d.com/Packages/com.unity.xr.interaction.toolkit@3.3/manual/index.html) sample from Unity. Grabbing, poking, snapping and scrubbing all get haptics.

:::tip[No Unity needed just to try it]
A prebuilt APK is available → [](/en/docs/sdk-integration/unity-sdk/xri-handdemo-apk/)
:::

## What you need

- **Unity 6 (6000.0) or later**
- **[XR Interaction Toolkit](https://docs.unity3d.com/Packages/com.unity.xr.interaction.toolkit@3.3/manual/index.html)** — verified with 3.3.1
- **Hapbeat SDK**
- **A Hapbeat device** — on the same Wi-Fi as the PC running Unity
- **A hand-tracking HMD** — Quest 3 / 3S etc.

## Steps

1. **Install the XR Interaction Toolkit**
   - Package Manager → Unity Registry
   - Projects created from the VR template already have it

2. **From the XRI Samples, import *Starter Assets* and *Hands Interaction Demo***
   - They land in `Assets/Samples/XR Interaction Toolkit/<version>/Hands Interaction Demo/`

3. **Install the Hapbeat SDK**
   - Package Manager → `+` → `Install package from git URL...`, then paste

     ```
     https://github.com/Hapbeat/hapbeat-unity-sdk.git
     ```

   - To pin a version, append a tag (e.g. `#v0.3.0`)

4. **From the Hapbeat SDK Samples, import *XR Helpers* and *XRI Hand Demo (haptics add-on)***
   - **Both are required.** The former holds the XRI filter components, the latter the EventMap and Kit

5. **Open `HandsDemoScene.unity`**

6. **Run the menu command `Hapbeat > Samples > Augment XRI Hand Demo`**
   - Places the haptic components and wires them into XRI's UnityEvents
   - A single Undo reverts everything. Re-running never duplicates anything
   - Logs counts of applied items, skipped items and warnings to the Console as one line

7. **Enable the Hand Interaction Profile and the Hand Tracking Subsystem in OpenXR**
   - Set them in `Project Settings → XR Plug-in Management → OpenXR`, under **the tab for your build target** (Android for standalone Quest, PC for Editor Play over Air Link)
   - Without this you cannot grab. Poking works from finger position alone, but grabbing is a pinch — it needs select input, and the Hand Interaction Profile is what supplies it

8. **Put the Hapbeat on the same Wi-Fi and press Play**

:::tip[When you want to review the wiring points]
Instead of step 6, run `Hapbeat > Samples > Augment XRI Hand Demo (+ diagnostic Event Logger)` to log every XRI event on the poke button to the Console.
:::

:::note[No Kit deployment required]
All 10 entries in the bundled EventMap are CLIP (StreamClip), so the waveforms are streamed from the app. The bundled `hand-demo-kit-manifest.json` exists to preview the reference intensity in the EventMap. For the difference from FIRE, see [](/en/docs/sdk-integration/unity-sdk/fire-vs-clip/).
:::

## When it doesn't work

| Symptom | Fix |
|---|---|
| `HandsDemoEventMap.asset` not found | The *XRI Hand Demo (haptics add-on)* sample is not imported → step 4 |
| The open scene is not the Hands Interaction Demo | Wrong scene, or an XRI version difference. The dialog lists the paths it could not find |
| Console shows `GameObject '…' not found` | XRI renamed or moved it. Wire the paths in the warning manually ([](/en/docs/sdk-integration/unity-sdk/triggers/)) |
| Console shows `type '…HapbeatXRGrabFilter' not found` | The *XR Helpers* sample is not imported → step 4 |
| Cannot grab | Enable the Hand Interaction Profile and the Hand Tracking Subsystem → step 7 |
| No haptic feedback | See the connectivity entries in [](/en/docs/support/faq/) |

## License, and why we ship a tool

The Hapbeat SDK distributes only three things — **the EventMap, the Kit, and the Editor command that applies the wiring** — and does not include the scene itself. Not a single XRI-authored asset is in it.

The XRI samples are covered by the [Unity Companion License (UCL)](http://www.unity3d.com/legal/licenses/Unity_Companion_License). Because ownership of an augmented scene and the obligation to include a copyright notice both come into play, we keep third-party assets out of the SDK.

Shipping a built application (an APK, say) is a different matter: it is exactly the application the UCL contemplates, so it falls within the grant → [](/en/docs/sdk-integration/unity-sdk/xri-handdemo-apk/)

## Next

- [](/en/docs/sdk-integration/unity-sdk/triggers/) — what each applied Trigger component does
- [](/en/docs/sdk-integration/unity-sdk/event-map/) — edit the EventMap to tune the feel
