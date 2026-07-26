---
title: Installation Requirements
kind: reference
sidebar:
  order: 300
  label: Installation
description: How to install the Hapbeat Unity SDK into a Unity project via UPM.
---

The Hapbeat Unity SDK can be installed **directly from a Git URL** via the Unity Package Manager (UPM). No `.unitypackage` download or manual copy is required.

## Requirements

- **Unity 6 (6000.0) or later** (tested on Unity 6000.3.12f1)
- **Git** installed on your PC and available on PATH (required because Unity runs `git clone` internally)
- A network environment where you can connect to the devices on the same network (the same subnet)
- Active Input Handling: **"Both"** / "Old" / "Input System Package" — all are supported

## Installation

### 1. Add via Git URL in Package Manager

1. In Unity Editor, open `Window` → `Package Manager`
2. Click **`+`** in the top-left → **`Install package from git URL...`**
3. Paste the following URL and click **Add**:

```
https://github.com/Hapbeat/hapbeat-unity-sdk.git
```

To pin a specific version, append a tag:

```
https://github.com/Hapbeat/hapbeat-unity-sdk.git#v0.1.0
```

### 2. Updating

- Package Manager → Select Hapbeat SDK → Click **Update** if shown in the right panel
- For tag-pinned URLs: edit `#vX.Y.Z` in `Packages/manifest.json` and save — Unity auto-reimports

### 3. Create the SDK Folder (optional, convenient on first setup)

Run `Hapbeat → Setup → Create HapbeatSDK Folder` to generate:

```
Assets/HapbeatSDK/
  Kits/        ← Haptic waveforms and manifest.json (Studio integration target)
  Scenes/      ← Generated scenes
  EventMaps/   ← EventMap.asset
```

This is generated automatically when using the sample Build menu, so you rarely need to run it explicitly.

## Samples

Select Hapbeat SDK in Package Manager → **Import** from the **Samples** tab in the right panel:

| Sample | Contents | Requirements |
|---|---|---|
| **Basic Example** | Minimal combination of Trigger × 3 + Helper + Dispatcher + StatusOverlay. Test with Space/R/F/S/C keys | Device + Studio or Helper running |
| **Showcase** | Full SDK feature showcase with 5 zones (Bowling / Door / Fishing / Stream Console / Target Range). Works with keyboard and mouse — no XR required | Same |
| **XR Helpers** | Filters for XR Interaction Toolkit integration (XRGrabFilter / XRSocketFilter) | Only for projects with XRI installed |
| **XRI Hand Demo (haptics add-on)** | EventMap + Kit that add haptics to the XRI Hands Interaction Demo. The scene is not bundled — the wiring is applied by an Editor command → [](/en/docs/sdk-integration/unity-sdk/xri-handdemo-quickstart/) | XRI + XR Helpers + a hand-tracking HMD |
| **VR Config Example** | A minimal scene for checking things on a VR headset. Override settings and test firing only. No XRI dependency → [](/en/docs/sdk-integration/unity-sdk/targeting/) | A VR headset such as Quest |

Samples are unpacked to `Assets/Samples/Hapbeat SDK/<version>/<sample>/`. Open the scene (`Scenes/*.unity`) immediately after import and hit Play to verify — no additional build steps required.

## Verifying the Setup

1. Launch **Hapbeat Studio** or **Hapbeat Helper** and confirm your device appears online
2. In Unity, open `Assets/HapbeatSDK/Scenes/BasicExample.unity`
3. Enter Play mode
4. Press **Space** for a one-shot stream, **F** for a Command (Fire) — if the device vibrates, you're set (**R** = Stream loop, **S** = Stop all, **C** = Ping)

If the UI shows `Pong: RTT=...ms`, the SDK ↔ device connection is established.

## Build Notes

- **iOS / Android**: Works out of the box (UDP socket available)
- **Quest (Android)**: `INTERNET` permission is automatically added to the manifest
- **WebGL**: UDP sockets are not available. Hapbeat communication does not work in WebGL builds

## Troubleshooting

| Symptom | Solution |
|---|---|
| Pasting the URL in Package Manager does nothing | Verify Git is on PATH (`git --version` must work from the command line) |
| A sample scene cannot be found | Check that the sample has been imported from Package Manager → Hapbeat SDK → the **Samples** tab. Re-importing an older Sample applies the latest scenes and Editor scripts |
| No haptic feedback during Play | Check that Studio/Helper is running and the device is online; verify that the EventMap target, or the Override Addressing setting, matches the device-side address ([](/en/docs/sdk-integration/unity-sdk/targeting/)) |
| Space / R / F keys have no effect | Check `Edit → Project Settings → Player → Active Input Handling` — if set to `Input Manager (Old)` only, change it to `Both` or `Input System Package` (Unity 6 default is `Both`) |
| Compile errors like `'InputSystem' does not exist` | A stale import may remain. Delete the relevant Sample under `Assets/Samples/Hapbeat SDK/` and re-import |

## Next Steps

- [](/en/docs/sdk-integration/unity-sdk/getting-started/) — Get vibration working with BasicExample as fast as possible
- [](/en/docs/sdk-integration/unity-sdk/integration/) — How to add Hapbeat to your own scene
- [](/en/docs/sdk-integration/unity-sdk/triggers/) — Collision / Sequence / UnityEvent / TickEmitter / StateBehaviour
- [](/en/docs/sdk-integration/unity-sdk/event-map/) — Manage Event ID and waveform mappings with a GUI
- [](/en/docs/sdk-integration/unity-sdk/streaming/) — Tuning the StreamClip buffer
- [](/en/docs/sdk-integration/unity-sdk/ai-assisted-workflow/) — Practical workflow for retrofitting haptics to existing scenes using Claude Code or similar
- [](/en/docs/sdk-integration/unity-sdk/editor-menus/) — Quick reference for all Hapbeat menu items
- [](/en/docs/sdk-integration/unity-sdk/targeting/) — How to decide which devices fire (splitting by player / position / group per setup)
