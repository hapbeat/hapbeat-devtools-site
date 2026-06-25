---
title: Choosing between command and clip
kind: explanation
description: play(id) auto-branches on the kit manifest bucket between command (the device's installed clip) and clip (the SDK streams the WAV). Decision criteria and how to write it.
sidebar:
  order: 2
  label: command and clip
---

**The same `play(id)` call automatically splits into two playback modes
depending on the kit manifest bucket.** The calling code is one line either way.

## The two modes

| manifest bucket | mode | what happens | pre-deploy |
|---|---|---|---|
| `events` | **command** | the SDK sends a PLAY and the **device** plays its installed clip | required (flash the kit in Studio) |
| `stream_events` | **clip** | the SDK reads the WAV from the kit's `stream-clips/` and **streams it over UDP** | not required |

```python
import hapbeat
hb = hapbeat.connect(app_name="MyApp", kit="kits/my-kit")

hb.play("sample-kit.sine_100hz")   # command → the device plays its installed clip
hb.play("rain.loop")    # clip    → the SDK streams the WAV
hb.stop("rain.loop")    # clip ends the active stream
```

The branch is decided by the information in the EventMap (haptic file). If you
do not pass an EventMap, everything is sent as command.

## Which to choose

| | command | clip |
|---|---|---|
| Recommended | production use, short one-shots | prototyping, long-form, stages with frequent swaps |
| Latency | low, stable | somewhat higher, environment-dependent |
| Pre-deploy | required (flash in Studio) | not required (just drop in the WAV) |
| Swapping the haptic | re-deploy the kit | just replace the WAV |

When in doubt, the basic rule is **prototype with clip, ship with command**.

## How gain is handled (no double-apply)

In clip mode the SDK does not process the PCM; it folds `gain` into
**STREAM_BEGIN.gain only** and sends it, and the device applies it once (the same
meaning as command's `gain`). If `gain` is omitted, the kit manifest's
`intensity` is used; if specified, it overrides.

```python
hb.play("rain.loop")            # intensity (the kit's default)
hb.play("rain.loop", gain=0.3)  # overridden at the call site
```

## Notes

- Author clip WAVs as **16 kHz mono PCM16** (the device plays at 16 kHz; the SDK
  does not resample. Non-16 kHz only warns).
- Only one clip can stream at a time (per session). Starting a new clip
  automatically ends the previous one.
- If the same id appears in both `events` and `stream_events` (Studio's BOTH),
  clip takes priority.
