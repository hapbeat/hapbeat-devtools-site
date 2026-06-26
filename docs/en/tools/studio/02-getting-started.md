---
title: Create Your First Kit
kind: tutorial
description: From opening Hapbeat Studio for the first time to transferring your first Kit to a device.
sidebar:
  order: 2
---

Hapbeat Studio is a haptic content design tool that runs entirely client-side in your browser. It handles everything from waveform (Kit) and UI (OLED / LED) design to device management, all within a single SPA.

**Launch**: [Open Hapbeat Studio](https://studio.hapbeat.com/)

## Prerequisites

- Recommended browser: Chrome / Edge (required for Web Audio API + WebSocket + IndexedDB + File System Access API)
- To transfer Kits to a device, `hapbeat-helper` must be installed and running ([](/en/docs/tools/studio/initial-setup/))
- A Hapbeat device with firmware flashed must be connected to Wi-Fi

## 1. Open the Library Folder

On first launch, you will see "Please select a Library folder." The Library is the **location where your WAV clips are stored**. Select any folder you like.

Sample clips are built in and will be automatically copied to an empty folder. You can also add WAV files later by drag-and-drop.

> 💡 You can optionally configure a **Kit folder** separately (via the `+ Kit` chip in the upper-right of the Kit panel). For example, pointing it to `<Project>/Assets/HapbeatSDK/Kits/` in your Unity project lets the Unity SDK read Kits created by Studio directly. If not specified, a Kit folder will be created inside the Library folder.

## 2. Create a New Kit

Type a Kit name in the input field at the top of the Kit panel, then click **Create** (or press Enter).

Kit names must match `^[a-z][a-z0-9-]*$` (lowercase letter start, alphanumeric and hyphens only). Invalid characters are automatically rejected as you type.

## 3. Add Clips to the Kit

Add clips from the Library using the **`+ Kit` button**, or drag them into the Kit panel. With the keyboard, select a clip in the Library and press **Enter** to add it to the active Kit.

The Event ID of each added Kit Event is automatically generated in the format `<kit-name>.<clip-name>`.

## 4. Select a Mode

Use the Mode selector on each Kit Event row to choose a playback method.

| Mode | Display | Use case |
|------|---------|---------|
| **FIRE** (command) | `> FIRE` | Short one-shot. Sends the Event ID and intensity; plays a WAV stored on the device |
| **CLIP** (stream_clip) | `♪ CLIP` | Longer / dynamically modulated. Helper or SDK streams PCM over the network |
| **BOTH** (command + stream_clip) | `>♪ BOTH` | Outputs both FIRE and CLIP entries for a single event, useful for testing during development |

Starting with **FIRE** is the simplest approach. Click the **"Mode info"** button in the Kit header for detailed help. See [Switch Modes](./modes/) for more information.

## 5. Adjust Intensity

Use the Amp slider on each Kit Event card to set the base vibration intensity (0–100%). With the keyboard, press **← / →** on a selected Event to adjust by ±5%.

## 6. Preview with the Keyboard

Select a Kit Event and press **Space** to play / stop. Use **↑ / ↓** to move between Events.

- With Helper + device connected → verify vibration on the physical device
- Without connection → preview the waveform via browser audio

## 7. Save Folder and Deploy

Kit edits are auto-saved as metadata (`kits-meta.json`), but **writing WAV files and `manifest.json` to the Kit folder is now an explicit action** (as of 2026-05-25). Two buttons appear at the bottom of the Kit panel:

| Button | Action |
|---|---|
| **Save Folder** | Writes `manifest.json` + WAVs to the local Kit folder. No Helper or device required |
| **Deploy** | Runs the same build as Save Folder, then transfers the zip to the device via Helper |

Save Folder is for local output only; Deploy also sends to the device. When only Amp / intensity / device_wiper values are changed, WAV re-encoding is skipped via cache, so the operation is fast.

## 8. Fire Events on a Real Device

- Studio: select a Kit Event and press Space (works for both FIRE and CLIP)
- SDK: send the Event ID
- Manage tab → Kit subtab: fire test events from installed Kits

## Next Steps

- [](/en/docs/tools/studio/ui-overview/) — Roles of each panel and tab
- [](/en/docs/tools/studio/kit-design/) — Detailed Kit build and distribution workflow
- [](/en/docs/tools/studio/modes/) — When to use FIRE / CLIP / BOTH
- [](/en/docs/tools/studio/shortcuts/)
