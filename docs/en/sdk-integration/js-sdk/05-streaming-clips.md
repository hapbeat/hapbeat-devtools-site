---
title: Streaming — clips & ad-hoc PCM
kind: reference
description: A reference for how clip mode works internally (WAV requirements, pacing, pre-decode) and how to use streamPcm to push ad-hoc PCM.
sidebar:
  order: 5
  label: Streaming (clips)
---

Clip mode (the manifest's `stream_events` bucket) and `streamPcm()` both follow a path
where the waveform is **not stored on the device — the SDK streams it over UDP**. For when
to use this versus command mode, see [](/en/docs/sdk-integration/js-sdk/command-vs-clip/).
This page covers a clip stream's WAV requirements, pacing, and pre-decode, plus
`streamPcm()` for pushing ad-hoc PCM. For continuously modulating a waveform over time,
see [](/en/docs/sdk-integration/js-sdk/streaming-live/).

## WAV requirements

Clip-mode WAVs are **16 kHz / mono / PCM16**. The SDK only parses the WAV header with
`parseWav()` to extract the PCM16 byte stream — it **does not resample**. Loading anything
other than 16 kHz produces a warning, and the pitch will be off on the device.

```text
[hapbeat] clip "rumble.wav" is 44100Hz; device expects 16000Hz (pitch will be off)
```

Hapbeat Studio writes clips out as `stream-clips/*.wav`, so they are normally already in
this format. For specifying the `clipBase` + `clipLoader` location, see
[](/en/docs/sdk-integration/js-sdk/project-structure/).

## Pacing (the rhythm of sending)

The device's ring buffer only holds about **256 ms** worth of audio (4096 frames at
16 kHz). The SDK therefore cannot burst the whole clip at once; instead it splits the data
into chunks at frame boundaries and sends each one **slightly ahead of its playback time**.
That look-ahead amount is `streamSendAheadSec` (default `0.15` s, capped below 0.256 s).

On the wire, the flow has three stages:

| Message | Role |
|---|---|
| `STREAM_BEGIN` | Once. Declares metadata such as sampleRate / channels / gain / target |
| `STREAM_DATA` | Per chunk. Sent `streamSendAheadSec` ahead of its playback time |
| `STREAM_END` | Delayed until the clip has **fully played out**, then sent |

`STREAM_END` is delayed until drain (full playout) so the tail is never clipped, whether
the firmware drains on END or flushes. `streamPcm()` is paced the same way.

## Pre-decode with preloadClips()

The first time you `play()` a clip, loading and decoding the WAV adds a slight delay to
that first playback. Calling `preloadClips()` pre-decodes all clip-mode (`streaming: true`)
events in the EventMap and warms the cache, so the first play is as delay-free as
subsequent ones.

```ts
import { connect, EventMap } from "@hapbeat/sdk";

const manifest = await fetch("/my-kit/my-kit-manifest.json").then((r) => r.json());
const hb = await connect({
  eventMap: EventMap.fromManifest(manifest),
  clipBase: "/my-kit/stream-clips/",
});

await hb.preloadClips(); // pre-decode all clips (anything that fails to load just warns)
hb.play("ambient.rumble"); // no delay even on the first play
```

## Ad-hoc stereo directional cues with streamPcm()

To stream a synthesized PCM16 buffer once, on the spot, use `streamPcm()`. It is paced the
same way as a clip. It is meant for a one-shot synthesized cue.

```ts
// pass synthesized PCM16 (interleaved stereo)
hb.streamPcm(pcm, { channels: 2, sampleRate: 16000, gain: 0.6 });
```

Setting `channels: 2` lets you carry L/R separately. Since the `play()` wire has **no
pan**, writing the L/R into the PCM directly is the only way to produce a **directional
cue** such as "came from the right" or "came from the left." The `sampleRate` default is
`16000` and the `channels` default is `1`.

## One session = one stream

There is **only one stream at a time** per session. Starting any of a new clip `play()`,
`streamPcm()`, or `openStream()` cancels the in-progress stream, stopping the previous one.
Note that if you want to layer multiple sources, the SDK does not mix them (that is the
app's responsibility).

## gain is applied only once

The `gain` for a clip / `streamPcm()` is folded into the `STREAM_BEGIN` metadata and
applied **once to the entire stream** on the device. You cannot change gain dynamically
during playback (mid-clip gain/pan tween is not implemented).

If you want to **continuously modulate** intensity or direction during playback, use a
persistent stream (`openStream()`), where you write chunks yourself without pacing. For
details, see [](/en/docs/sdk-integration/js-sdk/streaming-live/).

## Next reads

- [](/en/docs/sdk-integration/js-sdk/streaming-live/) — continuous-modulation streams via `openStream()`
- [](/en/docs/sdk-integration/js-sdk/command-vs-clip/) — choosing between command and clip
- [](/en/docs/concepts/fire-vs-clip/) — the command vs. clip concept
- [](/en/docs/sdk-integration/js-sdk/project-structure/) — laying out kits and clips in your project
