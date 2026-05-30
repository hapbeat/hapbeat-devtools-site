---
title: Adjusting the Streaming Buffer
kind: howto
sidebar:
  order: 200
description: How the StreamClip send buffer (streamSendAheadSeconds) works, its tradeoffs, and recommended values.
---

`StreamClip` mode continuously sends PCM audio from the host (Unity) to the device over UDP. Unlike `Command` mode — where the device simply plays a locally stored clip — the host's **send buffer** directly affects both playback quality and stop latency.

## Analogy with Audio Interfaces

This is the same tradeoff as adjusting the buffer size (samples / ms) of an audio interface in a DAW:

| | DAW buffer | Hapbeat `streamSendAheadSeconds` |
|---|---|---|
| Smaller | Lower latency, prone to zipper/drop-out under CPU load | Fast stop response, more vulnerable to network delay/jitter |
| Larger | Higher latency, stable and glitch-free | Stop is delayed (residual vibration after release), more stable |

Just as a DAW engineer might use 64 samples for a live session and 1024 samples for mastering, Hapbeat lets you tune this per use case.

## How It Works

`HapbeatManager.StreamAudioClip(clip, ...)` launches a coroutine that does the following every frame:

1. Converts the next chunk of AudioClip data to PCM16
2. Sends it via UDP
3. **Waits until the next frame if total sent time exceeds "real time + sendAhead"**

This keeps the SDK continuously ahead of real time by `sendAhead` seconds. The device consumes this pre-sent buffer as it plays back.

When `StopStream()` is called:
- The SDK stops the coroutine and immediately sends a `STREAM_END` packet
- However, the device **plays out any already-received samples** (up to `sendAhead` seconds) before stopping
- In practice, the perceived delay from pressing Stop to silence is approximately equal to `sendAhead`

## Configuration

Change this via `streamSendAheadSeconds` in [](/en/docs/sdk-integration/unity-sdk/installation/):

```
HapbeatConfig
  Behavior
    streamSendAheadSeconds: 0.05  ← default 50ms
```

Range: 10ms to 200ms.

## Recommended Values

| Use case / environment | Recommended | Reason |
|---|---|---|
| Wired LAN (low jitter) | **20–30 ms** | Very low UDP latency — safe to push for responsive stop |
| Typical Wi-Fi | **40–60 ms** (default 50ms) | Absorbs common jitter while keeping stop delay in an acceptable range |
| Congested Wi-Fi / multiple devices | **80–120 ms** | Prioritizes resilience against packet loss and latency spikes |
| Live performance | Depends on intent | Larger if drop-outs are unacceptable; smaller if immediate responsiveness is critical |

## Only StreamClip Is Affected

| Mode | Stop latency |
|---|---|
| **Command** (FIRE) | Immediate (device stops its local clip) |
| **StreamClip** (CLIP) | Delayed by sendAhead |

`HapbeatActionHelper.StopEverything()` sends stop instructions to both modes — Command audio stops instantly, while Stream audio has ~sendAhead seconds of residual playback.

## :warning: Clip Format Must Be Consistent (Simultaneous StreamClip Playback)

A Hapbeat stream session is **locked to a single format**. Only clips with the **same sample rate and channel count** can be streamed simultaneously within one session. A second clip with a different format will be rejected by the SDK:

```
[Hapbeat] StreamAudioClip: rate/channel mismatch with active session
(session=16000Hz/2ch, new=16000Hz/1ch). Rejecting new source.
```

### Recommended Format: **16 kHz / 2ch (stereo) PCM16**

- Normalize all StreamClip WAV files to **`16 kHz / stereo / PCM 16-bit signed LE`**
- Up-mix mono sources to stereo (duplicate L to R)
- Mixing clips with different sample rates or channel counts prevents simultaneous playback

### Auto-normalize via Studio (since 2026-05-24)

- **Live streaming** (playback in Studio Devices tab): auto-resampled and up-mixed to **2ch / 16 kHz / PCM16** on send
- **Kit deploy** (Helper's `pack_normalize`): normalized using `ffmpeg -ar 16000 -ac 2 -acodec pcm_s16le`

**When using Studio, no manual action is required.** Even if the source WAV is mono or 22.05 kHz, it is automatically normalized before delivery.

### If Not Using Studio

The following cases bypass Studio's auto-normalize — you must **manually prepare WAVs in 16 kHz / 2ch / PCM16 format**:

- AudioClips imported directly via the Unity AssetDatabase and passed to `HapbeatManager.StreamAudioClip`
- WAVs copied directly into a Kit without going through Studio
- Custom deploy scripts or CI pipelines that handle WAVs directly

There are three ways to normalize:

### Method 1: SDK Editor Menu (recommended, Unity-native)

Menu bar → **`Hapbeat → Normalize Audio Folder (16kHz · 2ch · PCM16)`**:

1. A folder picker opens — select the folder containing your WAVs (e.g. `Assets/HapbeatSDK/Kits/.../clips/`)
2. A confirmation dialog warns **"WAVs will be converted to 16kHz / 2ch / PCM16. Files will be overwritten."**
3. Recursively normalizes all WAVs with a progress bar
4. Already-normalized WAVs are skipped; conversion failures are logged as warnings and listed in the completion dialog

→ No need for ffmpeg or Audacity. Runs entirely within Unity. Mono → stereo (L=R duplicate), linear-interpolation resample, PCM16 overwrite.

### Method 2: ffmpeg

```bash
ffmpeg -i input.wav -ar 16000 -ac 2 -acodec pcm_s16le output.wav
```

Use this for batch conversion in CI or shell scripts.

### Method 3: Audacity (GUI)

1. File → Export → WAV (Microsoft, 16-bit PCM)
2. Set "Sample Rate" to 16000 Hz
3. For mono files: run "Tracks → Stereo" first

### Single Clip Only — No Format Constraint

If only **one stream is active at a time** (e.g. a single looping clip playing like background music), format normalization is not required. The first clip sets the session format. The constraint only applies when **playing multiple clips simultaneously or in rapid succession**.

## Related

- [](/en/docs/sdk-integration/unity-sdk/getting-started/) — `Manager.StreamAudioClip` basics
- [](/en/docs/sdk-integration/unity-sdk/triggers/) — StreamClip vs. Command differences
- [](/en/docs/sdk-integration/unity-sdk/event-map/) — Setting entry mode
