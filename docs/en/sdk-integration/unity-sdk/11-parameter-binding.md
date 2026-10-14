---
title: Parameter Binding
kind: reference
sidebar:
  order: 300
description: How to use HapbeatParameterBinding to dynamically map game state (movement, velocity, distance) to StreamGain / StreamPan.
---

`HapbeatParameterBinding` is a component that writes to the **gain** and **pan** of an active StreamClip playback every frame, driven by game state such as Transform position / scale, Rigidbody velocity, or a UI Slider value.

It lets you create continuous haptic expressions — like a stronger grip feeling as a grabbed box is moved, or foot vibration that intensifies with walking speed — without writing any code.

## Where It Operates

ParameterBinding writes to the **ActivePlayback** (`HapbeatStreamPlayback` handle during StreamClip playback) held by `HapbeatTriggerBase`. The flow is:

```
[Trigger.Fire]
    → Manager.StreamAudioClip(clip) → acquire StreamPlayback handle
    → Trigger holds it as ActivePlayback
[ParameterBinding.Update] (every frame)
    → read source value (e.g. Transform.position)
    → normalize to 0..1 using input range
    → shape with curve
    → map to output range
    → write to ActivePlayback.Gain / ActivePlayback.Pan
```

ParameterBinding **dynamically multiplies streaming samples**. It has no effect in Command mode (event ID delivery) — Commands are one-shot and have no playback to modulate.

## Settings

| Field | Purpose |
|---|---|
| Source Transform Path | The Transform to read from. Empty = this GameObject itself |
| Source Property | Choose from `LocalPositionX` / `LocalPositionY` / `LocalPositionZ` / `LocalScaleX` / `LocalScaleY` / `LocalScaleZ` / `VelocityMagnitude` / `AngularVelocityMagnitude` / `PositionDeltaMagnitude` / `SliderValue` (UI Slider) / `External` (push via `binding.SetValue()` from script) |
| Input Min / Max | The source value range to normalize to 0..1 |
| Curve Type | `Linear` / `EaseIn` / `EaseOut` / `Exponential` / `Custom` |
| Output Parameter | `StreamGain` (0..2) or `StreamPan` (-1..+1) |
| Output Min / Max | Output range |
| Debug Log | Log input/output to the Console periodically when true (useful for debugging) |

## Real-world Example: Showcase Z3

The Fishing Rod (Z3) in [](/en/docs/sdk-integration/unity-sdk/showcase/overview/) tracks the **velocity of the swung object** to drive the loop gain while it is in motion.

Settings (`HapbeatParameterBinding` on the `Z3_Fishing` root):

| Field | Value |
|---|---|
| Source Transform Path | `FishingObject` (relative from root) |
| Source Property | `VelocityMagnitude` |
| Input Min / Max | 0 / 3 |
| Curve Type | `Linear` |
| Output Parameter | `StreamGain` |
| Output Min / Max | 0 / 1.5 |

Behavior:
- **Hold `FishingObject` still**: `VelocityMagnitude = 0` → normalized 0 → output 0 (the loop is silent)
- **Swing it vigorously**: `VelocityMagnitude ≥ 3` → normalized 1 → output 1.5 (strong loop)

`FishingController` (script) only calls `Sequence.Fire() / Stop()` based on mouse input. The binding is registered as a preset on the EventMap entry (`Z3_hook_loop`), so `HapbeatParameterBinding` is automatically attached to `Z3_Fishing` via BatchSetup or the `Sync Scene` button in the EventMap window (add presets with `+ Binding` in the Parameter Bindings section).

## Linked Preset vs. Standalone

ParameterBinding has two configuration modes:

1. **Linked preset** (EventMap-managed): Register a preset in the EventMap entry's `bindings[]` → BatchSetup auto-generates the component on the target GameObject and links it by preset ID. Editing the preset is reflected at runtime (live tuning is possible)
2. **Standalone**: Add the component directly to a GameObject and configure all fields locally. No link to a preset

| | Linked preset | Standalone |
|---|---|---|
| Configured in | EventMap window's Binding section | AddComponent directly on the scene GameObject |
| Stored in | ScriptableObject (asset) | Scene |
| Source reference | String path (relative from Trigger) | Direct component ref (Transform/Slider) |
| Hierarchy constraint | **Yes** (only descendants of the Trigger) | **None** (any GameObject in the scene) |
| Prefab portability | ◎ (self-contained in prefab) | △ (direct scene refs require prefab overrides) |
| Share across multiple Triggers | ✓ Auto-attached to all Triggers referencing the same entry | ✗ 1 binding = 1 Trigger |

### Hierarchy Constraint for Linked Presets

Because EventMap presets are ScriptableObjects (assets), Unity's principles prevent them from **storing direct references to scene GameObjects**. Instead, the source is expressed as a **path string relative to the trigger GameObject**:

```
Trigger GO
├─ ChildA   ← reachable via path "ChildA"
│   └─ Grandchild  ← path "ChildA/Grandchild"
└─ ChildB   ← path "ChildB"
```

Only **descendants of the Trigger** can be used as sources — keep this design constraint in mind.

#### Recommended Pattern: Consolidate Haptic Objects Under a Root

```
Zone_Root (← ★ attach Trigger here)
├─ Visual / Mesh
├─ Physics / Rigidbody
└─ SourceObject (← reachable via binding source path "SourceObject")
```

If the Trigger is on the zone root, all child GameObjects become reachable as binding sources via the preset (no hierarchy constraint). This is the **pattern that maximizes EventMap management**.

→ Showcase Z3 uses this pattern: SequenceTrigger on the `Z3_Fishing` root, with `FishingObject` as the child source.

#### When This Constraint Is a Problem: Script-Driven Approach (see Z5 Charge)

When the **binding source cannot be a descendant of the Trigger** (e.g. a UI canvas Slider that is not under the Blaster Trigger, or a management object in a different hierarchy), skip EventMap presets and **modulate directly from script**:

```csharp
// Excerpt from Z5 ChargeShooter
// When charging starts: _loopPlayback = HapbeatManager.Instance.StreamAudioClip(...);
private void Update() {
    if (_charging) {
        float t = ...;
        if (_loopPlayback != null && !_loopPlayback.IsStopped)
            _loopPlayback.ApplyGainModulation(_gainCurve.Evaluate(t));
        // ↑ Gain = BaselineGain × modulator. The same entry point as ParameterBinding
    }
}
```

- No ParameterBinding attached or used
- Call `ApplyGainModulation(v)` every frame on the value returned by `HapbeatManager.StreamAudioClip(...)` (a `HapbeatStreamPlayback`) — the same entry point as ParameterBinding rewrites gain
- When playing through a Trigger, writing `Trigger.GainMultiplier = v` has the same effect (the setter calls `ApplyGainModulation(v)` internally)
- Ideal for complex game state (accumulated values / threshold detection / multi-state composition)

→ Showcase Z5 ChargeShooter (`Samples~/Showcase/Scripts/ChargeShooter.cs`) is the reference implementation. The Blaster's Trigger and the chargeBar Slider (under a UI canvas) are in different hierarchies, making presets impossible → script-driven is used.

### Quick Reference — Which to Use

| Situation | Recommendation |
|---|---|
| Trigger and source can be in the same prefab / under the same root | **Linked preset** (EventMap-managed) |
| Source is on a UI canvas, different hierarchy, or cannot be a Trigger descendant | **Script-driven** (see Z5) or **Standalone PB with direct ref** |
| Share the same binding across multiple Triggers | **Linked preset** (auto-attach) |
| Compute the modulator from combined game state (thresholds, multi-value composition) | **Script-driven** |

Showcase Z3 is the canonical example of Linked preset; Z5 is the canonical example of script-driven. Reading both side by side helps develop intuition for which to use.

## Driving from Script (Imperative Pattern)

Instead of ParameterBinding, you can write directly to `HapbeatTriggerBase.GainMultiplier` (or `ActivePlayback.Gain`) from script.

Showcase reference examples:
- **Z4 Stream Console**: ParameterBinding (Slider → StreamGain / StreamPan) — declarative. Wiring is complete in the EventMap window
- **Z5 Charge Shooter**: calls `ApplyGainModulation(curve(chargeT))` every frame on the value returned by `StreamAudioClip(...)` — imperative. Works well with custom calculation logic (`AnimationCurve` evaluation) or mid-flow logic (threshold detection)

Decision guide:
- Game state is simple (Transform / Rigidbody / Slider) → ParameterBinding
- Combining multiple game states / want to write custom curve or threshold logic in script → Script

### How Gain Changes Are Kept Smooth

Regardless of which approach is used, the SDK's mixer thread **linearly interpolates gain per sample**, so even abrupt slider movements arrive at the device as a continuous change rather than a staircase every 16ms (one chunk). Without this, sudden gain jumps at chunk boundaries would disturb the ADPCM predictor and cause warbling/distortion.

In other words: whether you use ParameterBinding or write to `GainMultiplier` from script, **the perceived smoothness on the device is essentially the same**. Choose based on whether you prefer Inspector wiring or code.

## Reference

- [](/en/docs/sdk-integration/unity-sdk/showcase/wiring/#z3-fishing-rod) — Z3 wiring details
- [](/en/docs/sdk-integration/unity-sdk/showcase/method-choice/) — Component vs. script decision guide
- [](/en/docs/sdk-integration/unity-sdk/triggers/) — `HapbeatSequenceTrigger` details
