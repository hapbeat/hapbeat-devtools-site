---
title: Build and Distribute a Kit
kind: howto
sidebar:
  order: 200
description: Step-by-step instructions for creating and editing a Kit in Hapbeat Studio and deploying it to a device.
---

This page focuses on the **hands-on workflow for assembling a Kit in the Studio UI**. For Kit structure, Event ID naming conventions, and manifest semantics, see [](/en/docs/concepts/event-id-and-kit/). For the gain multiplication chain, see [](/en/docs/concepts/gain-architecture/).

## Prerequisites

- Hapbeat Studio is accessible at `devtools.hapbeat.com/studio/`
- The **Helper connected** badge (green) is visible in the header (required for deployment)
- Your Hapbeat device is connected to the same Wi-Fi network and visible in Studio's Manage tab

## 1. Library Folder and Kit Folder

Studio manages WAV clips in a **Library folder** and writes Kit build output to a **Kit folder**.

| Role | Location |
|---|---|
| Library | Specified via the `+ Library` chip in the upper-right of the clip panel. Stores WAV clips |
| Kit folder | Specified via the `+ Kit` chip in the upper-right of the Kit panel (optional). Defaults to a subfolder inside the Library folder if not set |

**Unity project integration**: point the Kit folder to `<Project>/Assets/HapbeatSDK/Kits/` so the Unity SDK can read Kits as first-class assets directly (recommended).

## 2. Create a New Kit

Enter a Kit name in the **input field + Create** in the Kit panel (e.g., `my-game-kit`).

The Kit name is used in **three places simultaneously**: folder name, `manifest.name`, and Event ID prefix ([DEC-028](https://github.com/Hapbeat/hapbeat-sdk-workspace/blob/master/docs/decision-log.md)). Naming rules: `^[a-z][a-z0-9-]*$` (lowercase letter start, alphanumeric and hyphens). Invalid characters are stripped as you type.

## 3. Add Clips

Add clips from the Library using the **`+ Kit` button**, **drag-and-drop**, or by pressing **Enter** on a selected clip to add it to the active Kit.

Each added Kit Event is an **independent copy** of the Library clip (audio bytes included as a snapshot in the Kit). Renaming or archiving a Library clip later has no effect on events already in the Kit.

Each Kit Event card has the following settings:

| Setting | Description |
|---|---|
| **intensity** (Amp slider) | Base vibration intensity (0.0–1.0). Recorded as the "standard strength" for this event at design time (the reference value in [](/en/docs/concepts/gain-architecture/)) |
| **Mode** | 3-button radio: `> FIRE` / `♪ CLIP` / `>♪ BOTH`. Details: [Switch Modes](./modes/) |
| **Edit** | Modal to review and edit Note / Event ID |
| **Swap** | Swap clip name ↔ Note (handy when temporarily staging a source filename before renaming) |
| **×** | Remove from the Kit (the original Library clip is unaffected) |

Use the **Bulk edit…** select in the Kit header to switch all events in the Kit to `FIRE / CLIP / BOTH` at once.

## 4. Save Folder and Deploy

Two buttons appear at the bottom of the Kit panel:

| Button | Action | Requirements |
|---|---|---|
| **Save Folder** | Writes `manifest.json` + WAVs to the Kit folder. Does not send to device | Library / Kit folder only |
| **Deploy** | Runs the same build as Save Folder, then transfers the zip to the device via Helper | + Helper + device |

**How it works**:

- `command` (FIRE) mode clips are placed under `install-clips/` and flashed to device storage.
- `stream_clip` (CLIP) mode WAVs are placed under `stream-clips/` and excluded from the deploy payload (streamed over UDP by the SDK / Helper at runtime).
- `BOTH` mode outputs entries to both the `events` (FIRE) and `stream_events` (CLIP) buckets under the same base eventId.

**Performance**: Events whose audio has not changed since the last save skip WAV re-encoding via cache. If only Amp / intensity / device_wiper values are modified, only the manifest is rewritten, making the operation very fast.

**Kit metadata auto-save**: Metadata such as Kit name, events array, and intensity (`kits-meta.json`) is auto-saved on every edit action. However, **WAV files and `manifest.json` inside the Kit folder are not updated until you press Save Folder or Deploy** (per-edit auto-flush was removed on 2026-05-25).

## 5. Verify with Test Play

Select a Kit Event in Studio and press **Space** to play. If Helper + device is connected, you can verify vibration on the physical device; otherwise, the browser plays the audio for preview. While wearing the device, use **← / →** to fine-tune intensity in ±5% steps.

## Tips for Setting Intensity

- Start all events at **the same intensity** and make relative adjustments on the SDK side for simplicity.
- Clips meant to play at near-maximum (e.g., impact sounds): aim for `0.8–1.0`.
- Ambient sounds, notifications, and similar: aim for `0.3–0.5`.
- Fine-tune while wearing the device — don't judge by PC speakers or a laptop.

For the full multiplication chain, see [](/en/docs/concepts/gain-architecture/).

## Output File Formats

Studio automatically converts audio when saving or deploying. **You can use any input WAV format** — any sample rate, bit depth, or channel count.

| Destination | Format |
|---|---|
| `install-clips/` (FIRE) | **16 kHz PCM16**, **original channel count preserved** (mono → mono, stereo → stereo) |
| `stream-clips/` (CLIP) | **16 kHz PCM16 stereo** (forced stereo because the SDK always assumes stereo) |

Floating-point, 24/32-bit, and 44.1/48 kHz formats are all automatically converted to 16 kHz PCM16.

## Related Links

- [](/en/docs/concepts/event-id-and-kit/) — Kit / manifest / Event ID concepts
- [Switch Modes](./modes/) — How to operate FIRE / CLIP / BOTH in Studio
- [](/en/docs/concepts/fire-vs-clip/) — Decision criteria for mode selection
- [](/en/docs/concepts/gain-architecture/) — Where intensity fits in the multiplication chain
- [Kit format spec](https://github.com/Hapbeat/hapbeat-contracts/blob/master/specs/kit-format.md) — Full `manifest.json` schema
