---
title: VR Config Example
kind: howto
sidebar:
  order: 200
description: A minimal sample for setting Address Override and test-firing on a VR headset. Reusable as-is as the settings screen of your own project.
---

A minimal scene for **setting Address Override and test-firing** on a VR headset (Quest etc.). You can decide which Hapbeat to pair with while still wearing the headset.

**It does not depend on the XR Interaction Toolkit.** It runs on the Input System alone, so it drops into projects that have not adopted XRI.

## What it does

- **Setting player / group** — pick the numbers on the panel and confirm with Apply. The values are persisted, so they are restored on the next launch
- **Test firing** — check the vibration on the spot with the Play button. The bundled EventMap uses a CLIP entry (100 Hz sine), so **no Kit needs to be deployed to the device**
- **Returning to your own scene** — set a return destination for Exit and you can embed it into your own project as a settings screen

## Setup

1. **Import *VR Config Example* from Samples in the Package Manager**
2. **Open `Scenes/VRConfigExample.unity` and Build / Play**
3. **Connect the Hapbeat to the same Wi-Fi**

## Controls

There are only **two** controller operations. Either hand performs the same actions (roles are not split between left and right).

| Action | Binding | Keyboard |
|---|---|---|
| Move focus | Tilt the stick (either hand) | Arrow keys |
| Confirm | Trigger / A(X) / B(Y), any of them (either hand) | Enter / Space |
| Pull the panel in front of you | Stick click | R |

Player -/+ , Group -/+ , Play, Apply and Exit are all laid out as buttons on a 2D grid inside the panel, so the two operations above cover everything.

The panel only moves in front of you when it leaves the centre of your view. It does not snap to the front automatically at startup, so use the stick click to pull it in when you want to line it up.

## Embedding it in your own project

Set a return destination on **Return Scene** of `VRConfigExampleController` and Exit takes you back to your own scene. That lets you **use this scene as-is as a "Hapbeat settings screen."**

If you want to build your own UI, adding a single `HapbeatAddressOverridePanel` to a GameObject generates an equivalent settings UI (→ [](/en/docs/sdk-integration/unity-sdk/targeting/#override-targeting)).

## See also

- [](/en/docs/sdk-integration/unity-sdk/targeting/) — how to decide player / group and how Override targeting works
- [](/en/docs/sdk-integration/unity-sdk/showcase/overview/) — a sample covering every wiring pattern without XR
