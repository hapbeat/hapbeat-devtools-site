---
title: Glossary
kind: reference
description: Definitions of terms used in the Hapbeat SDK — Event ID, Kit, Group, Player, intensity, gain, Fire, Clip, and more.
sidebar:
  order: 99
---

Each term used throughout the documentation is defined in one to two lines. For the **formal specification, see [](/en/docs/concepts/contracts/overview/)**.

## Core Concepts

**Hapbeat**
: The haptic device hardware. Current models are **Duo WL** (neck-worn wireless) and **Band WL** (wrist/ankle worn), both with an embedded ESP32 that receives and plays haptic events over Wi-Fi UDP.

**Kit**
: The unit of haptic assets — a folder. Composed of `<kit-name>-manifest.json` + WAV files. Created in Studio and transferred to the Hapbeat device via Helper. Details: [Event ID and Kit](/en/docs/concepts/event-id-and-kit/)

**Event ID**
: A string that identifies a haptic event. Canonical form is `<kit-name>.<file-name>` (e.g. `sample-kit.sine_100hz`) — the Kit name plus the clip filename with its extension stripped, joined by a single `.`. Studio auto-generates it. Details: [Event ID and Kit](/en/docs/concepts/event-id-and-kit/)

**address**
: The destination string for a packet. Format: `[prefix/] player_{N} / {position} [/group_{M}]`. Details: [Address System](/en/docs/concepts/group-player-addressing/)

**Player number**
: The unit that groups multiple devices belonging to the same player together. Range: 1..99.

**Group ID**
: The unit that separates players or booths from one another. Used to prevent interference between different groups on the same Wi-Fi network. Range: 1..99 (omitting it means all groups receive the packet).

## Intensity and Modes

**intensity**
: The baseline vibration intensity defined at Kit authoring time. Recorded as 0.0–1.0 in `events[<id>].parameters.intensity` / `stream_events[<id>].parameters.intensity` in the manifest. Acts as the **baseline value (× 1.0 reference)** for the SDK-side `gain`.

**gain**
: The dynamic intensity multiplier applied at SDK runtime. Supplied via the EventMap or ParameterBinding in the Unity SDK or equivalent. `gain = 1.0` means "play at the standard intensity the Kit author defined."

**Fire**
: Common name for one haptic delivery method. Triggers an Event stored in the manifest's `events` bucket by its Event ID, and the device plays back the pre-installed waveform from its storage. Low latency, stable — suited for production. Details: [Fire vs. Clip](/en/docs/concepts/fire-vs-clip/)

**Clip**
: Common name for the other haptic delivery method. The SDK converts an Event stored in the manifest's `stream_events` bucket to PCM data and streams it via `STREAM_BEGIN` / `STREAM_DATA` / `STREAM_END`. Suited for prototyping, long-form content, and dynamic modulation.

**BOTH mode**
: A configuration where the same Event ID is placed in both the `events` and `stream_events` buckets. Allows firing as either Fire or Clip as needed. Set with the `▶♪ BOTH` radio button in Studio's EventMap UI.

**bucket (manifest)**
: The Event storage category in the manifest introduced in schema 2.0.0 ([DEC-031](https://github.com/Hapbeat/hapbeat-sdk-workspace/blob/master/docs/decision-log.md#DEC-031)). Two types: `events` (for Fire / device-baked) and `stream_events` (for Clip / host streaming). **Which bucket an Event is in determines its delivery method** (the legacy `mode` field has been removed).

## Tools

**Hapbeat Studio**
: A web-based Kit design and device management tool. Runs as a SPA at `devtools.hapbeat.com/studio/`.

**hapbeat-helper**
: A CLI daemon that bridges Studio and Hapbeat devices. Installed via `pipx install hapbeat-helper`. Bridges the WebSocket at `localhost:7703` with mDNS / UDP / TCP / Serial. Not required at app runtime.

**Contracts (hapbeat-contracts)**
: A repo that centralizes the normative protocol specifications shared across all repos. The single source of truth for Kit format, message protocol, display layout, device addressing, and more.

**device firmware**
: The ESP32 fixed runtime flashed onto Hapbeat hardware. Users do not need to modify it (updated via OTA).

## Networking

**Wi-Fi UDP broadcast**
: The standard communication path. The SDK sends via UDP broadcast; each Hapbeat self-filters by address. No relay server required.

**ESP-NOW**
: The upper-tier optional communication path. Uses Bridge + Transmitter firmware to form an independent network without an AP. For large-scale performances or Wi-Fi-free environments.

**SoftAP / STA**
: **SoftAP** — Hapbeat acts as a Wi-Fi access point. **STA** — Hapbeat connects to an existing router as a station. In router-less environments such as VR HMD setups, Hapbeat itself becomes the SoftAP.

**targetTime**
: A future timestamp specifying "fire N ms from now." Absorbs network jitter and stabilizes fire timing.

## Kit and Manifest

**install-clips/**
: Kit subdirectory containing WAV files for Fire (`events` bucket). The name reflects that these files are **installed and remain resident** on the device.

**stream-clips/**
: Kit subdirectory containing WAV files for Clip (`stream_events` bucket). These are **streamed on demand** at runtime and are not deployed to the device.

**target_device**
: A field in `manifest.json`. Records the board the Kit targets (e.g., `duo_wl_v3` / `neck_wl_v2`) and the minimum required firmware version.

**device_wiper**
: The wiper value (0..127) for the MCP4018 digital potentiometer in the Hapbeat device. Stored in the manifest as **reference information** to reproduce the volume setting used during authoring.

## See Also

- [Architecture Overview](/en/docs/concepts/architecture/) — Component roles and boundaries
- [](/en/docs/concepts/contracts/overview/) — Formal specification
- [](/en/docs/concepts/contracts/overview/) — API / command reference
