---
title: Switch Modes
kind: howto
sidebar:
  order: 400
description: How to switch the playback mode of each Event in Studio and Studio-specific constraints.
---

Studio lets you choose the playback mode (`command` / `stream_clip` / both) for each Kit Event. This page covers **how to operate modes in the Studio UI and Studio-specific constraints**. For the fundamental difference between modes and guidance on which to choose, see [](/en/docs/concepts/fire-vs-clip/).

## Display in Studio

Each Kit Event row has a 3-button radio to select a mode.

| Studio display | Internal manifest value | Common name | Primary use |
|---|---|---|---|
| `> FIRE` | `mode: command` | Fire | Short one-shot, production use |
| `♪ CLIP` | `mode: stream_clip` | Clip | Long content, dynamic modulation, prototyping |
| `>♪ BOTH` | `mode: command` + `stream_clip` | Both | Testing both transports during development |

Click the **"Mode info"** button in the Kit header to open a modal summarizing the behavior of each mode and "what flows over the wire."

## How to Switch

1. Select the target Event in the Kit panel.
2. Click the mode pill on the right side of the row (`> FIRE` / `♪ CLIP` / `>♪ BOTH`).
3. Press **Save Folder** or **Deploy** — the WAV destination (`install-clips/` ↔ `stream-clips/`) is automatically restructured.

Use the **"Bulk edit…"** select in the Kit header to switch all Events in the Kit to `FIRE` / `CLIP` / `BOTH` at once.

## BOTH Mode Behavior

Selecting BOTH outputs **2 entries in the manifest** for the same base eventId.

```
events: {
  "my-game.sword-hit": { mode: "command", clip: "sword-hit.wav", ... }
},
stream_events: {
  "my-game.sword-hit": { mode: "stream_clip", clip: "stream-clips/sword-hit.wav", ... }
}
```

Because both buckets share the same name, the SDK only needs to call a single Event ID and can choose either the FIRE or CLIP transport depending on the situation. WAVs are written to both locations (`install-clips/` and `stream-clips/`).

> 💡 BOTH is a **convenience feature for the development phase**. For production releases, it is generally recommended to commit each Event to a single transport (to conserve resources and ensure predictable behavior).

## Studio-Specific Constraints

### WAV files are reformatted per mode

Studio converts audio to the following formats on Save Folder / Deploy:

| Destination | Format |
|---|---|
| `install-clips/` (FIRE) | 16 kHz PCM16, **original channel count preserved** (mono → mono, stereo → stereo) |
| `stream-clips/` (CLIP) | 16 kHz PCM16, **always stereo** (the SDK assumes stereo) |

Input WAV sample rate and bit depth do not matter — floating-point, 24/32-bit, and 44.1/48 kHz formats are all automatically converted.

### FIRE is limited by Kit partition capacity

WAVs under `install-clips/` are flashed to device storage, so they are subject to a capacity limit (on the order of a few MB). Check current usage with the capacity gauge in the Kit header. For long files, either:

- Split them into shorter clips, or
- Switch the mode to CLIP to use streaming instead.

### CLIP requires Wi-Fi streaming

When testing CLIP playback from Studio, Helper must be connected and the device must be on Wi-Fi. For direct streaming from the SDK without Helper, see [](/en/docs/concepts/fire-vs-clip/).

## Related Links

- [](/en/docs/concepts/fire-vs-clip/) — Decision criteria for mode selection (concepts)
- [Build and Distribute a Kit](./kit-design/) — How to assemble a Kit in Studio
- [](/en/docs/concepts/event-id-and-kit/) — `events` / `stream_events` dictionaries and the mode field spec
