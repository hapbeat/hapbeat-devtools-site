---
title: Live Streaming (openStream)
kind: reference
description: How to open a persistent stream with openStream and push PCM every frame from a game loop to create continuously modulated haptics (directional tones and the like).
sidebar:
  order: 6
  label: Live Streaming
---

`openStream()` is an API that **keeps a single stream open** while the caller keeps pushing
PCM chunks in ~real time. Use it for continuous haptics whose value changes every frame (a
`~100Hz` tone indicating a bullet's direction, a tightening rumble, and so on).

Whereas clip / `streamPcm` is "throw a short waveform and you're done," `openStream` is
"keep writing while holding the session open."

## Why openStream is needed

Calling a discrete clip or `streamPcm` every frame stands up a fresh
`STREAM_BEGIN…DATA…END` session each time, which is then torn down (one session = one
stream). This **per-chunk teardown** causes the device's ring buffer to re-buffer,
producing a "stuttering" break at chunk boundaries.

`openStream` sends `STREAM_BEGIN` **only once**, then appends STREAM_DATA via `write()`, and
sends `STREAM_END` only on `close()`. Because the session is never torn down, the ring
buffer stays continuously filled and the signal joins up smoothly.

```ts
const live = hb.openStream({ channels: 2, sampleRate: 16000, gain: 1 });
function frame(pcm /* Uint8Array: synthesized PCM16 chunk */) {
  live.write(pcm); // STREAM_BEGIN only on the first call; afterwards just append chunks
}
// …on exit
live.close();
```

## API

```ts
openStream(opts?: {
  sampleRate?: number;  // default 16000
  channels?: number;    // 1 = mono / 2 = stereo (L/R for direction; PLAY has no pan)
  gain?: number;        // 0..1, default 1.0
  target?: string;      // device-addressing. "" = broadcast
}): LiveStreamHandle
```

The returned `LiveStreamHandle`:

```ts
interface LiveStreamHandle {
  write(pcm: Uint8Array): void; // send a frame-aligned PCM16 chunk. No-op after close
  close(): void;                // send STREAM_END. Idempotent
  readonly closed: boolean;     // whether close has been called
}
```

- The `pcm` passed to `write(pcm)` is **PCM16** (interleaved L/R if `channels: 2`). The SDK
  does not resample, so pass a waveform that matches `sampleRate` (16 kHz for haptics).
- `write` / `close` are **fire-and-forget** (returning `void`). No `await` is needed.

## Pacing is the caller's responsibility

This is the biggest difference from clip / `streamPcm`.

- **clip / `streamPcm`**: the SDK **paces (rate-limits the send)** according to
  `streamSendAheadSec` (< 0.256). Pass the waveform once and the SDK throttles and streams
  the rest.
- **`openStream`**: the SDK **does not pace**. It simply forwards each `write()` as
  STREAM_DATA.

The device's ring buffer only holds about **256 ms**. If the caller does not keep calling
`write()` at a ~real-time rate, the ring **underruns (runs dry)**, causing dropouts and
breaks. Conversely, if you push too fast, the excess is discarded.

In practice the ideal is "write one chunk (one frame-period's worth) every frame in the
game loop." Match the chunk length to the frame period and carry the `sin` phase across
chunks, and you get a continuous tone with no boundary clicks.

## One session = one stream

There is always **only one** stream session. The open live stream **ends** if any of the
following happen:

- you call clip-mode `play(streamEventId)`
- you call `streamPcm(...)`
- you call a new `openStream(...)`

In other words, a discrete fire (a footstep clip, etc.) interrupting it tears the live
stream down. If you want to keep continuous mode going, check `handle.closed` after the
interruption and reopen if needed (that is what "(re)open" does in the example below).

## Worked example: continuously presenting a directional tone from a game loop

The FPS demo (the haptic FPS "continuous mode" in [](/en/docs/sdk-integration/js-sdk/examples/))
continuously modulates a `~100Hz` tone with the **bearing of the nearest enemy bullet as
L/R balance** and its **distance as amplitude**. The structure is to `write()` stereo PCM
every frame.

```ts
let contStream: LiveStreamHandle | null = null;
let phase = 0; // carry the sin phase across chunks (avoid boundary clicks)

function updateContinuousHaptic() {
  const threat = nearestBullet();
  if (!threat) {                        // no threat → tear down the stream
    contStream?.close();
    contStream = null;
    phase = 0;
    return;
  }

  // bearing → L/R balance, distance → amplitude (closer = stronger)
  const { panL, panR, amp } = directionAndDistance(threat);

  // reopen if it was closed by an interrupting fire/footstep
  if (!contStream || contStream.closed) {
    contStream = hb.openStream({ channels: 2, sampleRate: 16000, gain: 1 });
    phase = 0;
  }

  // write one frame-period's worth of stereo tone as a chunk
  contStream.write(stereoTone(panL * amp, panR * amp, { freq: 100, phase }));
  phase = nextPhase(phase, 100); // append phase for seamless output
}
// …on game exit
contStream?.close();
```

Key points:

- `stereoTone(...)` is your own synthesis function returning interleaved PCM16
  (`Uint8Array`) with separate L/R amplitudes. The SDK does not generate waveforms, so
  synthesis happens on the caller's side.
- Because you `write()` every frame, the frame rate is itself the pacing.
- When the threat disappears you `close()`, and when it reappears you reopen with
  `openStream()` — repeating that cycle.

## Choosing between streamPcm / openStream / clip

| | clip (`play(streamEventId)`) | `streamPcm(pcm, opts)` | `openStream(opts) → handle` |
|---|---|---|---|
| Use | stream a kit WAV | throw a one-shot synthesized PCM | continuous modulation (write every frame) |
| Waveform | kit WAV (16kHz mono PCM16) | any PCM16 buffer | any PCM16 chunk stream |
| Sending | `STREAM_BEGIN…DATA…END` (once) | `STREAM_BEGIN…DATA…END` (once) | `STREAM_BEGIN` once → many `write()` → `close()` |
| Pacing | SDK does it | SDK does it | **caller does it** (~real time) |
| Underrun risk | low | low | **possible** if supply is slow (ring ≈256ms) |
| stereo (direction) | mono only | `channels: 2` for L/R | `channels: 2` for L/R |
| Typical | play a default haptic clip | a one-shot directional cue | a game's "radar" continuous haptic |

If in doubt: use `streamPcm` for one-offs, `openStream` when the value changes every frame,
and a clip (`play`) when you just want to play a waveform baked into the kit. Note that a
continuous-mode waveform is torn down when interrupted by a short discrete cue (a footstep,
etc.) — one session = one stream.

## Related pages

- [](/en/docs/sdk-integration/js-sdk/streaming-clips/) — clip-mode stream playback
- [](/en/docs/sdk-integration/js-sdk/command-vs-clip/) — choosing between command and clip
- [](/en/docs/sdk-integration/js-sdk/examples/) — runnable samples such as the haptic FPS (continuous mode)
- [](/en/docs/concepts/fire-vs-clip/) — the fire vs. clip concept
