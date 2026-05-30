---
title: Gain Architecture
description: Hapbeat vibration intensity is determined by multiplying the manifest intensity (set in Studio) by the SDK gain. A design that separates the responsibilities of Kit authors and SDK developers.
kind: explanation
sidebar:
  order: 3
---

Hapbeat vibration intensity is determined by **multiplying multiple gain values together**. This is an intentional design that separates the responsibilities of the Kit author (content side) from the SDK developer (application side).

## Formula

```
Actual vibration intensity = manifest intensity × EventMap gain × SDK gain
```

- **manifest intensity** — the baseline intensity written into the Kit in Studio (0.0 to 1.0)
- **EventMap gain** — an offset configured in the EventMap entry of the Unity SDK or equivalent
- **SDK gain** — a multiplier applied dynamically at runtime via code or ParameterBinding

## Why Multiplication?

### Division of Responsibilities

| Role | Gain they control | Perspective |
|---|---|---|
| **Kit author** (haptic artist) | manifest intensity | "Gunshots loud, footsteps soft" |
| **SDK developer** (game developer) | EventMap gain / code gain | "Let the artist handle gunshot vs. footstep balance; I just implement 'half intensity when the enemy is far away'" |

Because the two parties **don't compete for the same parameter**, changes remain independent:

- An artist updating the Kit requires no changes to game code
- Adding distance attenuation in game code does not break the Kit's baseline values

### What `gain = 1.0` Means

In the SDK, `gain = 1.0` is the default. It means "play at the standard intensity the Kit author defined."

- `0.5` → half intensity
- `2.0` → double intensity (e.g., when manifest is 0.5 and you want it to play at full)
- `0.0` → silent (temporary mute)

## Concrete Example

Suppose a gunshot clip (`my-game.gunshot`) with `intensity: 0.8` set in Studio:

| Case | EventMap gain | SDK gain | Final intensity |
|---|---|---|---|
| Normal fire | 1.0 | 1.0 | 0.8 |
| "Quieter" (adjusted in EventMap) | 0.5 | 1.0 | 0.4 |
| Distance attenuation (Parameter Binding) | 1.0 | 0.3 (enemy far away) | 0.24 |
| Dramatic peak (temporary code boost) | 1.0 | 1.5 | 1.2 (clipped) |

The final intensity is clipped to 0.0–1.0 on the device side.

## Combining with ParameterBinding

The Unity SDK's `HapbeatParameterBinding` dynamically maps in-game values (velocity, distance, health, etc.) to the **SDK gain layer**. This acts on the "SDK gain" layer described above.

```
manifest 0.8  (Kit author's baseline)
   × EventMap 1.0  (per-event offset)
   × Binding output 0.3  (derived from distance to enemy)
   = actual intensity 0.24
```

You can dynamically vary intensity based on runtime conditions without touching the Kit itself.

## What to Modify

When in doubt, use this guidance:

| Goal | Where to change it |
|---|---|
| "This clip is too strong overall" | Lower manifest intensity in Studio |
| "Just this Event a bit quieter" | Lower the EventMap gain |
| "Vary strength based on in-game state" | Code or ParameterBinding for SDK gain |
| "Temporarily mute all Events" | `HapbeatManager.SetGlobalGain(0)` equivalent (SDK-dependent) |

## See Also

- [](/en/docs/tools/studio/kit-design/) — Setting manifest intensity in Studio
- [](/en/docs/sdk-integration/unity-sdk/event-map/) — Editing EventMap gain
- [](/en/docs/sdk-integration/unity-sdk/parameter-binding/) — Dynamic gain mapping
- [Fire vs. Clip](/en/docs/concepts/fire-vs-clip/) — How gain is handled differently by mode
