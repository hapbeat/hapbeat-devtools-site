---
title: Gain Architecture
description: Hapbeat vibration strength is determined by multiplying clip gain (clip_gain) × app gain (app_gain) × device volume. A design that separates the responsibilities of Kit authors and SDK developers.
kind: explanation
sidebar:
  order: 3
---

The strength of a Hapbeat vibration is determined by **multiplying three frames: "clip (material)", "app", and "device"**. This is an intentional design that separates the responsibilities of the Kit author (content side) from the SDK developer (application side).

## Formula

```text
output = clip × app_gain × device_volume
clip   = WAV × clip_gain
sent value = clamp(clip_gain × app_gain, 0, 1)
```

- **Clip (material)** — a WAV paired with its **clip gain (`clip_gain`)**, the material's strength. `clip_gain` is written into the Kit manifest (`parameters.clip_gain`) in Studio (0.0 to 1.0, absent = 1)
- **App** — the **app gain (`app_gain`)**, the product of the multipliers the playing app applies. The EventMap entry's `gain`, the ParameterBinding output, the `gain` argument at call time, and so on keep their names; their product is `app_gain` (0 or more, 1 = as authored)
- **Device** — the Hapbeat device volume. The wearer sets it; the app does not know it

Only the sender (SDK / Studio) multiplies `clip_gain × app_gain`; the device does not read the manifest's `clip_gain`. Only the final product is capped to 0–1 in the sent value; individual multipliers may exceed 1.

## Why Multiplication?

### Division of Responsibilities

| Role | Value they control | Perspective |
|---|---|---|
| **Kit author** (haptic artist) | clip gain (`clip_gain`) | "Gunshots loud, footsteps soft" |
| **SDK developer** (game developer) | app gain (EventMap gain / code gain) | "Let the artist handle gunshot vs. footstep balance; I just implement 'half strength when the enemy is far away'" |

Because the two parties **don't compete for the same parameter**, changes remain independent:

- An artist updating the Kit requires no changes to game code
- Adding distance attenuation in game code does not break the Kit's baseline values

The `gain` at call time **multiplies** `clip_gain`; it does not replace it.

### What `gain = 1.0` Means

In the SDK, `gain = 1.0` is the default. It means "play at the clip gain (`clip_gain`) the Kit author defined."

- `0.5` → half strength
- `2.0` → double strength (e.g., when `clip_gain` is 0.5 and you want it to play at 1.0)
- `0.0` → silent (temporary mute)

## Concrete Example

Suppose a gunshot clip (`my-game.gunshot`) with `clip_gain: 0.8` set in Studio:

| Case | EventMap gain | Call-time gain | Sent value |
|---|---|---|---|
| Normal fire | 1.0 | 1.0 | 0.8 |
| "Quieter" (adjusted in EventMap) | 0.5 | 1.0 | 0.4 |
| Distance attenuation (Parameter Binding) | 1.0 | 0.3 (enemy far away) | 0.24 |
| Dramatic peak (temporary code boost) | 1.0 | 1.5 | 1.0 (1.2 capped) |

The sent value is capped to 0.0–1.0 on the sender side (SDK / Studio). The actual output is this value times the device volume.

## Combining with ParameterBinding

The Unity SDK's `HapbeatParameterBinding` dynamically maps in-game values (velocity, distance, health, etc.) to the **app gain**. This acts on the "app" frame (`app_gain`) described above.

```
clip_gain 0.8  (the material strength set by the Kit author)
   × EventMap 1.0  (per-event multiplier)
   × Binding output 0.3  (derived from distance to enemy)
   = sent value 0.24
```

You can dynamically vary strength based on runtime conditions without touching the Kit itself.

## What to Modify

When in doubt, use this guidance:

| Goal | Where to change it |
|---|---|
| "This clip is too strong overall" | Lower the clip gain (`clip_gain`) in Studio |
| "Just this Event a bit quieter" | Lower the EventMap gain |
| "Vary strength based on in-game state" | Code or ParameterBinding for the app gain |
| "Temporarily mute all Events" | `HapbeatManager.SetGlobalGain(0)` equivalent (SDK-dependent) |

## See Also

- [](/en/docs/tools/studio/kit-design/) — Setting the clip gain (`clip_gain`) in Studio
- [](/en/docs/sdk-integration/unity-sdk/event-map/) — Editing EventMap gain
- [](/en/docs/sdk-integration/unity-sdk/parameter-binding/) — Dynamic gain mapping
- [Fire vs. Clip](/en/docs/concepts/fire-vs-clip/) — How gain is handled differently by mode
