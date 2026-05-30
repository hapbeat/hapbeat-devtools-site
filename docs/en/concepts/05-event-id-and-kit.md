---
title: Event ID and Kit
kind: explanation
description: The relationship between a "Kit" (which bundles Hapbeat haptic assets) and an "Event ID" (which the SDK uses to trigger a clip), and naming conventions for both.
sidebar:
  order: 5
---

Hapbeat haptic content is organized into units called **Kits**, and the SDK specifies clips to trigger using strings called **Event IDs**. This page covers the structure and naming conventions for both.

For the formal specification, see [Contracts: kit-format](https://github.com/Hapbeat/hapbeat-contracts/blob/master/specs/kit-format.md) / [event-id](https://github.com/Hapbeat/hapbeat-contracts/blob/master/specs/event-id.md).

## Kit = A Folder of Haptic Assets

A Kit is a folder that bundles **haptic waveforms (WAV files) + metadata (`<kit-name>-manifest.json`)** together. It is created in Studio and transferred to the Hapbeat device via Helper.

```
my-game/                            ← Kit folder (= kit-name)
  my-game-manifest.json             ← event definitions + baseline intensity
  install-clips/                    ← WAV files for Fire (command) mode
    sword-hit.wav
    footstep-grass.wav
  stream-clips/                     ← WAV files for Clip (stream) mode
    bgm-tension.wav
```

For the distinction between `install-clips/` and `stream-clips/`, see [Fire vs. Clip](/en/docs/concepts/fire-vs-clip/). Think of it as: "install" = baked onto the device; "stream" = sent on demand each time.

> **Manifest filename**: On the host side (Studio / Unity SDK / Helper) the canonical filename is `<kit-name>-manifest.json`. It is renamed to `manifest.json` only when transferred to the device's LittleFS. This naming convention improves identifiability when multiple Kits are placed in one project (in OS Explorer or the SDK picker).

## Key Manifest Fields

The manifest has **two buckets: `events` (for Fire) and `stream_events` (for Clip)**. Each bucket is an object (dictionary) keyed by Event ID. Placing the same Event ID in both buckets expresses "this semantic event can be played in either Fire or Clip mode (= BOTH mode)."

```json
{
  "schema_version": "2.0.0",
  "name": "my-game",
  "version": "1.0.0",
  "target_device": {
    "firmware_version_min": "0.1.0",
    "board": "duo_wl_v3"
  },
  "events": {
    "my-game.sword-hit": {
      "clip": "sword-hit.wav",
      "parameters": {
        "intensity": 0.8,
        "device_wiper": 64
      }
    }
  },
  "stream_events": {
    "my-game.bgm-tension": {
      "clip": "bgm-tension.wav",
      "parameters": {
        "intensity": 0.5,
        "loop": true
      }
    }
  }
}
```

| Field | Required | Meaning |
|---|---|---|
| `schema_version` | ✓ | Manifest schema version. Current value: `"2.0.0"` |
| `name` | ✓ | Kit name. **Use the same string as the on-disk folder name.** Equal to the `kit_id` payload on the wire ([DEC-028](https://github.com/Hapbeat/hapbeat-sdk-workspace/blob/master/docs/decision-log.md#DEC-028)) |
| `version` | ✓ | Kit version (semver recommended) |
| `target_device.firmware_version_min` | ✓ | Minimum required firmware version |
| `target_device.board` | — | Expected board identifier (e.g., `duo_wl_v3` / `neck_wl_v2`). A mismatch with firmware metadata produces a warning |
| `events` | ✓ | Dictionary of **Fire (command)** events. Constitutes the device event table; the key appears in the `event_id` field of PLAY/STOP packets |
| `stream_events` | — | Dictionary of **Clip (stream)** events. Sent by the SDK as a UDP audio stream. The device does not recognize the eventId — it is used only as a binding label within the SDK |
| `<bucket>[<id>].clip` | ✓ | WAV filename (bare filename) for the corresponding bucket. `events.<id>.clip` → resolved as `install-clips/<clip>`; `stream_events.<id>.clip` → resolved as `stream-clips/<clip>` |
| `<bucket>[<id>].parameters.intensity` | — | Baseline vibration intensity 0.0–1.0 (the baseline value in the [gain multiplication chain](/en/docs/concepts/gain-architecture/)) |
| `events[<id>].parameters.device_wiper` | — | MCP4018 wiper value (0..127). Reference information for reproducing authoring-time intensity. Not applicable to the `stream_events` side |
| `<bucket>[<id>].parameters.loop` | — | Whether to loop playback (default `false`) |

> **The `mode` field was removed in schema 2.0.0** ([DEC-031](https://github.com/Hapbeat/hapbeat-sdk-workspace/blob/master/docs/decision-log.md#DEC-031)). Which mode an entry uses is determined by **which bucket it is in**. Placing the same Event ID in both buckets = BOTH mode. See the [kit-format spec](https://github.com/Hapbeat/hapbeat-contracts/blob/master/specs/kit-format.md) for the complete schema.

## Event ID Naming Conventions

An Event ID is a string that uniquely identifies a haptic event.

```
Basic form:       <category>.<name>
Extended form:    <category>.<subcategory>.<name>
Namespaced:       <namespace>/<category>.<name>
```

| Rule | Value |
|---|---|
| Allowed characters | Lowercase letters `a-z` / digits `0-9` / hyphen `-` / underscore `_` |
| First character | Must start with a letter |
| Category separator | `.` (dot) |
| Namespace separator | `/` (slash) |
| Segment length | 1–64 characters each |
| Maximum nesting depth | Up to 4 segments including namespace |

Examples:

```
my-game.sword-hit                  ← <category>.<name>
my-game.impact.heavy               ← <category>.<subcategory>.<name>
red-team/impact.hit                ← <namespace>/<category>.<name>
basic-exam-kit.sine_100hz_1s       ← typical auto-sync form generated by Studio
```

The Unity SDK EventMap window auto-generates Event IDs from **Kit name + clip filename** by default, yielding the `<kit-name>.<clip-name>` form. This is a **convention**, not a spec requirement. Use subcategories or namespaces when you want more semantic organization.

## Why "Folder Name = manifest.name = Wire kit_id" Was Unified (DEC-028)

Previously, the manifest had both `kit_id` and `name` fields, causing display inconsistencies (`Basic Exam Kit` vs. `basic-exam-kit`) between Studio and OS Explorer. DEC-028 (2026-04-28) removed `kit_id` and **consolidated everything into a single `name` field**. The folder name, JSON, and wire payload all use the same string.

The `kit_id` field still exists in the wire protocol, but its value is physically guaranteed to always equal manifest `name`.

## Deploy Flow

1. Edit the Kit in Studio's Library (adjust intensity, toggle Fire / Clip / BOTH, add clips)
2. Studio writes `<kit-name>-manifest.json` and WAV files to the working directory
3. Transfer to the device's Kit partition via Helper (`events`-derived = Fire WAVs only; manifest is renamed to `manifest.json` on the wire)
4. `stream_events`-derived WAVs are NOT deployed — the SDK sends them directly via UDP at runtime

## See Also

- [Fire vs. Clip](/en/docs/concepts/fire-vs-clip/) — Choosing a mode
- [Gain Architecture](/en/docs/concepts/gain-architecture/) — Where `intensity` fits in the multiplication chain
- [](/en/docs/tools/studio/kit-design/) — How to create a Kit in Studio (how-to)
- [](/en/docs/tools/studio/modes/) — Switching modes in the Studio UI
