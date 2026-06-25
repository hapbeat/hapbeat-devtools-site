---
title: EventMap Reference
kind: reference
description: The haptic file (EventMap / EventDef) API. The tuning-side catalog that resolves intensity, loop, clip, mode, and target from the kit manifest.
sidebar:
  order: 5
  label: EventMap
---

`EventMap` (the haptic file) is the SDK's **tuning side**. It is kept separate
from the fire side (`play` / `stop`) and linked only by event id. It reads the
kit manifest (schema 2.0.0) and holds the defaults for each event.

## Construction

```python
import hapbeat

# From a haptic file (overlay) — recommended; can carry per-event target/gain
em = hapbeat.EventMap.from_file("haptics.json")

# From a kit folder (intensity/clip only; no targeting)
em = hapbeat.EventMap.from_kit("kits/my-kit")

# Point at a manifest directly
em = hapbeat.EventMap.from_manifest("kits/my-kit/my-kit-manifest.json")
em = hapbeat.EventMap.from_manifest(parsed_dict)        # a dict works too

# By hand (command only, gain only)
em = hapbeat.EventMap.from_dict({"sample-kit.sine_100hz": 0.5})
```

`from_file` reads a **haptic file** (an overlay that references a kit) and layers
**target / gain overrides** on top of the manifest's intensity/clip
([](/en/docs/sdk-integration/python-sdk/project-structure/)). `from_kit` /
`from_manifest`(path) remember the **kit_dir** and resolve clip-mode WAVs from
`<kit_dir>/stream-clips/<clip>`.

## EventDef fields

The `EventDef` returned by `em.get(event_id)`:

| Field | Meaning |
|---|---|
| `event_id` | Event id |
| `intensity` | Default gain (the manifest's `parameters.intensity`; default 1.0) |
| `loop` | Whether playback loops |
| `device_wiper` | Device-side wiper value (optional) |
| `streaming` | `True` for clip mode (derived from `stream_events`) |
| `clip` | Clip-mode WAV filename (relative to `stream-clips/`) |
| `target` | Destination address (set in the haptic file). `""` = broadcast |
| `mode` | `"clip"` (streaming) / `"command"` |
| `note` | Note |

The destination for `play(id)` is resolved in this order: **the caller's
`target=` > `EventDef.target` (the haptic file) > the connection's
`default_target`**.

## Key methods

```python
em.get("sample-kit.sine_100hz")          # EventDef | None
em.gain_for("sample-kit.sine_100hz")     # default gain (1.0 if absent)
em.ids()                      # all event ids
"sample-kit.sine_100hz" in em            # membership test
len(em)                       # count
em.kit_dir                    # kit folder (from from_kit/path) or None
```

## Manifest mapping

```json
{
  "schema_version": "2.0.0",
  "name": "my-kit",
  "events": {
    "sample-kit.sine_100hz": { "clip": "sine_100hz.wav", "parameters": { "intensity": 0.8 } }
  },
  "stream_events": {
    "rain.loop": { "clip": "rain.wav", "parameters": { "intensity": 0.3, "loop": true } }
  }
}
```

- `events` → `EventDef(streaming=False, mode="command")`
- `stream_events` → `EventDef(streaming=True, mode="clip", clip="rain.wav")`

For how these are used on the fire side, see [](/en/docs/sdk-integration/python-sdk/command-vs-clip/).
