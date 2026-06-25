---
title: Command vs Clip
kind: explanation
description: play(id) auto-routes between command (device built-in clip) and clip (the SDK streams a WAV) based on the kit manifest bucket. Decision criteria, clip resolution, and how gain is handled.
sidebar:
  order: 3
  label: Command vs Clip
---

**The same `play(id)` call automatically splits into two playback modes depending on the
kit manifest bucket.** The calling code is one line either way and is unaware of the mode.

The split is determined by information in the
[EventMap (haptic file = kit manifest)](/en/docs/sdk-integration/js-sdk/event-map/).
See also [](/en/docs/concepts/fire-vs-clip/) for a shared conceptual explanation.

## Two modes

| manifest bucket | mode | what happens | deploy required |
|---|---|---|---|
| `events` | **command** | the SDK sends `PLAY`, and the **device** plays its built-in clip | yes (write the kit in Studio) |
| `stream_events` | **clip** | the SDK loads the WAV (`clipBase` + `clipLoader`) and **UDP-streams** it | no |

```ts
import { connect, EventMap } from "@hapbeat/sdk";

const manifest = await fetch("/my-kit/my-kit-manifest.json").then((r) => r.json());
const hb = await connect({
  eventMap: EventMap.fromManifest(manifest),
  clipBase: "/my-kit/stream-clips/", // where clip-mode WAVs live
});

hb.play("sample-kit.sine_100hz"); // command → the device plays its built-in clip
hb.play("rain.loop");  // clip    → the SDK streams a WAV
hb.stop("rain.loop");  // clip ends the stream currently playing
```

If you do not pass `eventMap`, the SDK has no bucket information, so **everything is sent as
command** (in which case the default gain is `1.0`).

## Which to choose

| | command | clip |
|---|---|---|
| recommended | mass-produced / production short one-shots | prototyping / long-form / frequently swapped stages |
| latency | small, stable | a bit larger, environment-dependent |
| pre-deploy | required (write the kit in Studio) | not required (just drop the WAV) |
| swapping the haptic | re-deploy the kit | just replace the WAV |

When in doubt, the basic rule is **clip while prototyping, command once it's settled**.
command is the lightest and most stable since it just calls the device's built-in clip, while
clip lets you stream a WAV on the spot so you can iterate without the hassle of deployment.

## clip resolution (clipBase + clipLoader)

In clip mode, the SDK concatenates the manifest's `clip` filename to `clipBase` and loads
the WAV with `clipLoader` before streaming. The default loader switches per environment.

| environment | `clipBase` | default `clipLoader` |
|---|---|---|
| Node | directory path | `fs.readFile` |
| Browser | URL prefix | `fetch` |

```ts
// Browser: resolve a kit served as static assets by URL
const hb = await connect({
  eventMap: EventMap.fromManifest(manifest),
  clipBase: "/my-kit/stream-clips/",
});

// Node: resolve by directory path
const hb = await connect({
  eventMap: EventMap.fromManifest(manifest),
  clipBase: "./kits/my-kit/stream-clips/",
});
```

If you want to load from a bundle or IndexedDB, override `clipLoader`.

```ts
const hb = await connect({
  eventMap: EventMap.fromManifest(manifest),
  clipLoader: async (ref) => loadFromBundle(ref), // return ArrayBuffer | Uint8Array
});
```

If you `play` a clip event without `clipBase` / `clipLoader` set, the SDK cannot read the
WAV, emits a warning, and plays nothing. command-mode events do not need this.

## gain is not applied twice

The default gain is the **kit manifest's `intensity`**. Specifying `play`'s `gain` explicitly
**overrides** it; it is not applied twice. Even in clip mode, the SDK does not process the PCM;
it folds gain **only into STREAM_BEGIN.gain** and sends it, and the device applies it once
(the same meaning as command's `gain`).

```ts
hb.play("rain.loop");              // fires with intensity (the kit default)
hb.play("rain.loop", { gain: 0.3 }); // overridden by the caller
```

`gain` is an absolute value 0..1, clamped by the SDK. There is no API to modulate gain over
the course of a clip already playing (for continuous modulation, see
[Not implemented](/en/docs/sdk-integration/js-sdk/streaming-live/), which uses `openStream`).

## clip WAV constraints

- Prepare clip WAVs as **16 kHz mono PCM16**. The device plays at 16 kHz and **the SDK does
  not resample** (non-16 kHz only produces a warning).
- Only **one** stream can run at a time (per session). Starting a new clip, `streamPcm`, or
  `openStream` automatically ends the previous stream.
- If you write the same id into both `events` and `stream_events` (Studio's BOTH), then on
  manifest load `stream_events` overrides last, so **the clip side wins**.

## clip targeting difference between Browser and Node

A command-mode `target` works the same on both transports. In clip mode, however, behavior
differs when going through the helper (Browser).

- **Browser (via helper WS)**: clip playback reaches **every device** the helper recognizes
  (per-device clip targeting is unsupported). Also, `targetTimeUs` is **ignored** through the
  helper, so playback is always immediate.
- **Node (direct UDP)**: clip can be addressed with `target` just like command.

For details on the target syntax, see [](/en/docs/concepts/group-player-addressing/).
