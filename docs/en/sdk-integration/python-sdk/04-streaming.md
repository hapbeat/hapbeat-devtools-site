---
title: Clip streaming in detail
kind: reference
description: Reading WAVs (16 kHz PCM16), streaming pacing, ad-hoc sending via stream_pcm, stopping, and current limitations.
sidebar:
  order: 4
  label: Streaming details
---

How clip mode works, and how to send PCM without going through a manifest.

## WAV requirements

- Author as **16 kHz, mono, PCM16 (uncompressed 16-bit)**. The device plays at
  16 kHz and the SDK does not resample. Non-16 kHz only warns and still sends
  (pitch/length will be off).
- Reading is based on the stdlib `wave` module (`hapbeat.read_wav_pcm16`).

## Pacing (256 ms ring)

The device's ring buffer can only hold about 256 ms (4096 frames at 16 kHz), so
instead of sending the whole clip at once, the SDK **sends frame-aligned chunks
slightly ahead of their playback time (default `stream_send_ahead=0.15` seconds)**
to prevent buffer overflow. The transmission is
`STREAM_BEGIN → STREAM_DATA×N → STREAM_END`, and END is sent only after the clip
has finished playing. It runs on a dedicated daemon thread and handles **one
stream at a time (per session)**. Starting a new clip reliably ends the previous
one.

```python
hb = hapbeat.connect(app_name="MyApp", kit="kits/my-kit", stream_send_ahead=0.15)
hb.play("rain.loop")     # clip event → stream starts
hb.stop("rain.loop")     # stream ends (STREAM_END)
```

## Ad-hoc PCM sending (no manifest)

You can stream synthesized PCM directly. **Adding a left/right amplitude
difference in stereo (`channels=2`) provides an L/R directional cue** (the PLAY
command has no pan, so direction is expressed through stereo amplitude).

```python
import struct
sr = 16000
frames = bytearray()
for i in range(int(sr * 0.3)):
    env = 1.0 - i / (sr * 0.3)
    frames += struct.pack("<hh", int(2000 * env), int(8000 * env))  # biased right
hb.stream_pcm(bytes(frames), sample_rate=sr, channels=2)
```

You can also stream an arbitrary WAV file directly:

```python
hb.play_clip_file("assets/oneshot.wav", gain=0.6)
```

## Caching and preloading

Clip WAVs are read on first playback and cached thereafter. To avoid the read
latency on the first playback, preload them in advance:

```python
hb.preload_clips()       # read the WAVs for all clip-mode events ahead of time
```

## Gain is not double-applied

The SDK does not process the PCM; it folds `gain` into **STREAM_BEGIN.gain only**
and sends it, and the device applies it once. If `gain` is omitted, the kit
manifest's `intensity` is used.

## Current limitations

- Implemented: **file clip streaming** (sending the WAVs of `stream_events` over
  UDP, one at a time).
- Not supported: **realtime gain / pan modulation** during playback,
  **simultaneous mixing of multiple clips**, and **live capture** streaming from a
  microphone, etc.
