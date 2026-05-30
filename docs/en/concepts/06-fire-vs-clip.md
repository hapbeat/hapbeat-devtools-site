---
title: Fire vs. Clip
kind: explanation
description: The fundamental differences between the two haptic event delivery modes — Fire (command) and Clip (stream) — and guidance on which to choose for each use case.
sidebar:
  order: 6
---

For each haptic Event in Hapbeat, you choose to send it as either **Fire** or **Clip**. Because multiple approaches can achieve the same haptic experience, the choice involves **tradeoffs between latency, bandwidth, and flexibility**. This page consolidates the decision criteria in one place.

## Two Delivery Methods

In the manifest, the delivery method is determined by **which bucket the Event is in** ([DEC-031](https://github.com/Hapbeat/hapbeat-sdk-workspace/blob/master/docs/decision-log.md#DEC-031)).

| Common name | Manifest bucket | On the wire | Payload | Primary use |
|---|---|---|---|---|
| **Fire** | `events` (command) | PLAY/STOP packet with Event ID | Command (a few bytes) | Short one-shot effects |
| **Clip** | `stream_events` (stream) | STREAM_BEGIN / STREAM_DATA / STREAM_END | AudioClip-derived PCM streaming | Long-form, dynamic modulation, prototyping |

Placing the same Event ID in **both buckets** expresses "playable as either Fire or Clip (= BOTH mode)." In Studio's EventMap UI, toggle between FIRE / CLIP / BOTH using the radio buttons.

> Up through schema 1.x, entries had a `mode: "command" | "stream_clip" | "stream_source"` field. In schema 2.0.0 this was replaced by bucket separation, and the `mode` field and `stream_source` mode were removed.

## Fire vs. Clip Comparison

| | **Fire** (`events` bucket) | **Clip** (`stream_events` bucket) |
|---|---|---|
| Pre-deployment required | Yes (bake WAV into install-clips on device) | No |
| What travels over the wire | Event ID + parameters — **a few bytes** | PCM chunks (`STREAM_BEGIN` / `STREAM_DATA` / `STREAM_END`) |
| Latency | A few ms / stable | Tens of ms / environment-dependent |
| Duration | A few ms to several seconds (within Kit partition capacity) | Arbitrary (tens of seconds, loopable) |
| Dynamic control | `gain` only (fixed per fire) | `gain` / pan modulatable during playback |
| Stop immediacy | Immediate | Already-sent buffer plays out before stopping |
| Wireless bandwidth usage | Minimal | Continuous consumption |

## Fire Mode

The Kit WAV is **pre-deployed** to the device, and the SDK sends only an Event ID plus a small set of parameters. The device plays back the WAV corresponding to the received command from its own storage.

### Strengths
- **Low, stable latency** — only a small command travels over the wire, so reliability is high even on congested Wi-Fi
- **Minimal wireless bandwidth** — does not congest even with many simultaneous fires
- **Stop command (`stop`) is also immediate**

### Weaknesses
- **Pre-deployment required** — involves creating a Kit and writing it via Studio
- **Limited by Kit partition capacity** — `install-clips/` has a capacity constraint of a few MB
- **Waveform cannot be changed dynamically** — `gain` adjustment is possible, but the waveform itself is fixed

### Best For
- **Short one-shot effects** such as button press feedback, gunshots, impacts, or footsteps
- Scenarios that require **stable reproducibility**: shipping games, XR interactions, mass-production exhibitions

## Clip Mode

AudioClips or similar audio on the SDK side are converted to PCM data and sent to the device as a sequence of UDP messages: `STREAM_BEGIN` → N × `STREAM_DATA` → `STREAM_END`. No pre-deployment is needed. The device does not recognize the eventId — it receives data per stream session.

### Strengths
- **No deployment, instant iteration** — swap waveforms and experiment freely (ideal for prototyping)
- **Arbitrary length** — supports sustained haptics or loops of tens of seconds
- **Dynamic modulation during playback** — `gain` is multiplied per chunk, so it can track dynamic parameters (distance, velocity, health, etc.)

### Weaknesses
- **Wi-Fi environment dependent** — chunk drops on an unstable network cause interruptions
- **Higher latency** — per-chunk buffering + transmission adds tens of ms (an order of magnitude more than Fire)
- **Stop has a small delay** — already-transmitted buffer plays out before halting

### Best For
- **Prototyping and verification** during development
- **Long-duration sustained haptics** (BGM-like background vibration, ambient effects)
- **Dynamic parameter mapping** (velocity-mapped friction, distance attenuation, etc.)

## Decision Flow

```
Does the haptic fit within a few seconds?
├─ Yes
│  └─ Production use / congested Wi-Fi environment?
│     ├─ Yes → Fire        ← standard default
│     └─ No  (still prototyping) → Clip
└─ No (long-form / loop / dynamic modulation needed)
   └─ Clip
```

**Typical workflow**: Prototype with Clip → once finalized, switch to Fire and commit to the Kit. Just toggle the FIRE / CLIP / BOTH radio in Studio's EventMap — no other migration steps are needed. Leaving it on BOTH means the Kit can be played in either mode after distribution.

## How Gain Is Applied Differently

The [gain multiplication chain](/en/docs/concepts/gain-architecture/) is common to both modes, but **in Clip mode gain is pre-multiplied per PCM chunk**.

| Mode | When gain is applied |
|---|---|
| Fire | Once on the device when the command is received |
| Clip | Multiplied per PCM chunk on the SDK / Helper side → streamed |

This means that in Clip mode **a gain change takes effect from the next chunk** (suitable for continuous modulation). In Fire mode, you cannot dynamically change intensity mid-playback — a new fire (new command) is required.

## Studio UI and SDK API Correspondence

| | Studio display | Manifest storage | Unity SDK API |
|---|---|---|---|
| Fire | `▶ FIRE` | `events.<id>` | `HapbeatManager.Play(eventId, gain)` |
| Clip | `♪ CLIP` | `stream_events.<id>` | `HapbeatManager.StreamAudioClip(clip, gain)` |
| BOTH | `▶♪ BOTH` | Same ID in both buckets | Both of the above (choose as appropriate) |

## Helper's Role (Note)

Clip streaming works as long as the **SDK sends UDP directly to the device**. Helper is not required — it is an **optional tool** used for Studio playback testing and as a host-side relay during SDK development. The minimum runtime configuration is just the SDK + Hapbeat device.

## See Also

- [](/en/docs/tools/studio/modes/) — How to switch modes in Studio (how-to)
- [](/en/docs/sdk-integration/unity-sdk/fire-vs-clip/) — Code examples for Unity implementation
- [](/en/docs/sdk-integration/unity-sdk/streaming/) — Clip mode buffering / latency tuning
- [Gain Architecture](/en/docs/concepts/gain-architecture/) — Which stage gain is multiplied at
