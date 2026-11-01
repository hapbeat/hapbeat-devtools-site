---
title: EventMap reference
kind: reference
description: The API for EventMap / EventDef, the tuning-side catalog for haptics. Resolves clip_gain, loop, clip, and mode from a kit manifest. The JS SDK is manifest-only.
sidebar:
  order: 7
  label: EventMap
---

`EventMap` is the SDK's **tuning side** (what to play, and how strongly). It is separate
from the fire side (`play` / `stop` / `stopAll`) and is linked **by event id alone**. It
reads a kit manifest (schema 2.0.0) and holds each event's clip gain (`clip_gain`), loop, and
clip.

By keeping material strength out of your fire code and consolidating it in the EventMap, you can
swap "when to play (code)" and "how strongly to play (kit)" independently. For how to use
this on the fire side, see [](/en/docs/sdk-integration/js-sdk/command-vs-clip/).

## Constructors

```ts
import { EventMap } from "@hapbeat/sdk";

// from a parsed kit manifest (recommended)
EventMap.fromManifest(manifest: KitManifest): EventMap

// from a hand-written { eventId: clipGain } map (command only, clipGain only)
EventMap.fromClipGains(clipGains: Record<string, number>): EventMap

// pass EventDefs directly (low level)
new EventMap(events?: Record<string, EventDef> | Map<string, EventDef>)
```

```ts
import { connect, EventMap } from "@hapbeat/sdk";

const manifest = await fetch("/my-kit/my-kit-manifest.json").then((r) => r.json());
const hb = await connect({ eventMap: EventMap.fromManifest(manifest) });
hb.play("sample-kit.sine_100hz"); // fires at this manifest's clip_gain
```

- `fromManifest` reads both the `events` (command) and `stream_events` (clip) buckets,
  taking in each event's `parameters.clip_gain` / `loop` / `device_wiper` and its clip name.
- `fromClipGains` builds from a simple map like `{ "sample-kit.sine_100hz": 0.5 }` (values are `clipGain`); everything
  becomes command mode, `loop: false`, `streaming: false`.

## Instance methods

```ts
em.get("sample-kit.sine_100hz");      // EventDef | undefined
em.clipGainFor("sample-kit.sine_100hz");  // material strength (clip_gain). 1.0 if absent
em.has("sample-kit.sine_100hz");      // boolean
em.ids();                  // string[] — all event ids
em.size;                   // number — count
```

`clipGainFor(id)` is the material strength that `play(id)` multiplies with the call-time `gain` (app gain).
Passing an id not in the EventMap falls back to `1.0`.

## EventDef fields

The `EventDef` returned by `em.get(id)`:

| Field | Type | Meaning |
|---|---|---|
| `eventId` | `string` | Event id |
| `clipGain` | `number` | Material strength (the manifest's `parameters.clip_gain`, 0–1, default 1.0) |
| `loop` | `boolean` | Whether to loop playback |
| `deviceWiper?` | `number` | Device-side wiper value (optional) |
| `streaming` | `boolean` | `true` = clip mode (from `stream_events`) |
| `clip?` | `string` | Clip-mode WAV file name (resolved relative to `clipBase`) |
| `note` | `string` | Note |

## KitManifest shape and bucket → mode

```ts
interface KitManifest {
  schema_version?: string;
  events?: Record<string, ManifestEntry>;        // → command mode
  stream_events?: Record<string, ManifestEntry>; // → clip mode (streaming: true)
}
```

```json
{
  "schema_version": "2.0.0",
  "events": {
    "sample-kit.sine_100hz": { "clip": "hit.wav", "parameters": { "clip_gain": 0.8 } }
  },
  "stream_events": {
    "rain.loop": { "clip": "rain.wav", "parameters": { "clip_gain": 0.3, "loop": true } }
  }
}
```

- `events` bucket → `EventDef(streaming: false)` = **command mode**. The SDK sends a PLAY
  instruction and the device plays its deployed clip.
- `stream_events` bucket → `EventDef(streaming: true, clip: "...")` = **clip mode**. The SDK
  loads the WAV (`clipBase` + `clipLoader`) and streams it over UDP.

For the manifest shape and event-id conventions, see [](/en/docs/concepts/event-id-and-kit/);
for the mode concept, see [](/en/docs/concepts/fire-vs-clip/).

## How `play(id)` consumes it

When you call `play(id)`, the SDK looks up the `eventMap` you passed at connect time and:

1. Makes the value sent `clamp(clipGain × gain, 0, 1)` (`clipGain` = the manifest's `clip_gain`, `gain` = the call-time multiplier, 1 if omitted). `gain` multiplies `clipGain`; it does not replace it.
2. Inspects that id's `EventDef.streaming` to **branch between command and clip**.
   - `streaming: false` → sends a PLAY instruction (the device plays the clip).
   - `streaming: true` → loads the `clip` WAV via `clipBase` + `clipLoader` and streams it
     over UDP as 16 kHz mono PCM16 (the value sent is applied to the source PCM).
- If you don't pass an `eventMap`, every event is treated as command mode and `clip_gain` is
  treated as `1.0` (value sent = `clamp(gain, 0, 1)`).

## Important notes (differences from the Python SDK)

The JS `EventMap` is **manifest-only**. The following features that the Python SDK has are
**not in JS**:

- **No haptic-file overlay (per-event target / gain multiplier)** — JS has no `from_file`
  equivalent. The destination is set via the caller's `target=` or the connection's
  `defaultTarget` ([](/en/docs/sdk-integration/js-sdk/transports/)).
- **No `target` / `mode` field** — `EventDef` carries no targeting. The command vs. clip
  decision is made by the `streaming` flag alone.
- **No `kit_dir` resolution** — clip WAVs are resolved not by `kit_dir` but by the
  connection options `clipBase` (Node: a directory path / Browser: a URL prefix) and
  `clipLoader`.
- **No loop-driven auto-stop** — `loop: true` is only retained as manifest-derived
  metadata; the JS `EventMap` itself does no stop control. To stop, call `stop(id)` /
  `stopAll()` explicitly.

## Next reads

- [](/en/docs/sdk-integration/js-sdk/command-vs-clip/) — choosing between command and clip
- [](/en/docs/sdk-integration/js-sdk/project-structure/) — laying out kits and clips in your project
- [](/en/docs/sdk-integration/js-sdk/streaming-clips/) — clip-mode streaming
