---
title: Trigger Components
kind: reference
sidebar:
  order: 300
description: Types and use cases for trigger components that fire haptic Events — including Animator, Collision, Sequence, and others.
---

The Hapbeat SDK provides a variety of Trigger components that let you add haptics without writing code.

## Overview

| Component | When it fires | Primary use case | Showcase Zone |
|---------------|--------------|---------|---|
| **HapbeatUnityEventTrigger** | `Fire()` called from a UnityEvent | UI Button / XR Interactable / Animation Event, etc. | Z4 Stream / Z5 Target (TargetReceiver's OnHitLight / OnHitHeavy) |
| **HapbeatStateBehaviour** | Animator state Enter / Exit | Character actions, UI animations, door opening/closing, etc. | Z2 Door |
| **HapbeatCollisionTrigger** | OnCollision / OnTrigger | Collisions, hit detection, projectile impacts | Z1 Bowling |
| **HapbeatSequenceTrigger** | Three phases: grab / hold / release | XR Interaction (grab, hold, release) | Z3 Fishing |
| **HapbeatTickEmitter** | Snap-fires based on rate of change in a continuous value | Scroll haptics for Slider / ScrollRect, etc. | Z4 Stream Console |

## HapbeatUnityEventTrigger

Fires by wiring the `Fire()` method to a UnityEvent (Button.OnClick / XRI Activate / Animation Event, etc.). Lets you trigger haptics from any UnityEvent without writing code.

Setup:
- **Event Map**: Reference to an EventMap.asset
- **Event**: Select an entry from the EventMap via dropdown

Public methods callable from a UnityEvent:
- `Fire()` — fire the entry
- `FireWithGain(float)` — fire with a specified gain (for the float argument of an Animation Event)
- `Stop()` — stop the entry that is playing

```
On Activated:
  [Hapbeat Event Router] → HapbeatUnityEventTrigger.Fire()
```

To call it from a script, see [](/en/docs/sdk-integration/unity-sdk/scripting/) and [](/en/docs/sdk-integration/unity-sdk/script-api/).

## HapbeatStateBehaviour

A `StateMachineBehaviour` derivative that **attaches directly to states in an `AnimatorController`**. It is called directly by the Animator runtime at state Enter / Exit, making fire timing and conditions clearer than polling Animator parameters from a scene MonoBehaviour.

> Unlike regular Triggers, this does not appear in the Add Component menu. Add it via: **Animator window → select the target state → Inspector → Add Behaviour → Hapbeat State Behaviour**.

Setup:
- **Event Map**: EventMap.asset
- **On State Enter → Entry** / **On State Exit → Entry**: Fire a different entry for each state transition (one side alone is fine)
- **Transition Filter → Required Previous State**: If non-empty, Enter fires only when transitioning from the specified state (e.g. only play a rattle sound on `Closed → LockedRattle`)
- **Gain → Gain Multiplier**: Additional multiplier on top of entry gain × manifest intensity

Implementation notes:
- If a looping StreamClip is fired on Enter, it is **automatically stopped** on Exit — looped sounds tied to a state end cleanly
- Reference fields (EventMap, etc.) are saved on the AnimatorController asset (ScriptableObject-to-ScriptableObject reference — no scene dependency)
- Showcase **Z2 Door**: One instance attached to each of the `Open` and `Closed` states, firing `Z2_door_open` / `Z2_door_close`

## HapbeatCollisionTrigger

Fires on Collision / Trigger events. Supports **velocity-scaled gain (Gain Mode: VelocityScaled)**.

Setup:
- **Physics Mode**: Auto (default; detects 2D / 3D from this GameObject's Collider) / Force2D / Force3D
- **Trigger Event**: The physics event to respond to (CollisionEnter / CollisionExit / TriggerEnter / TriggerExit)
- **Tag Filter**: Tag of objects to respond to (empty = all)
- **Layer Mask**: Layer filter
- **Gain Mode**: Fixed / VelocityScaled
- **Velocity Threshold**: Does not fire below this speed (VelocityScaled only)
- **Velocity Curve**: Curve from normalized velocity (velocity / Max Velocity) to gain multiplier (VelocityScaled only)
- **Max Velocity**: The velocity at which the curve reaches its maximum (VelocityScaled only)
- **Cooldown**: Prevents repeated firing (seconds)

> Enables mappings like "harder impact → stronger haptic feedback."

## HapbeatSequenceTrigger

Designed for use with XR Interaction Toolkit or custom grab systems. **Manages 3 phases of events in a single component**.

Setup (Sequence Entries):
- **On Start**: One-shot played by `Fire()` (e.g. the moment of grabbing; `(none)` if not needed)
- **Loop (hold)**: Continuous event from `Fire()` until `Stop()` (a looping CLIP is recommended)
- **On Stop**: One-shot played by `Stop()` (e.g. the moment of release; `(none)` if not needed)

Timing / guards:
- **Start Shot Delay**: Delay from On Start to the start of the Loop (seconds). Default `-1` = wait for the length of the On Start clip / `0` = do not wait
- **Stop Shot Delay**: Delay from the Loop stopping to On Stop (seconds). Default `0.05`
- **Guard Reentry**: Ignore duplicate `Fire()` / `Stop()` calls when already in that state (ON by default; for cases where XRI socket attachment raises selectEntered twice)
- **Post Stop Fire Cooldown**: Ignore `Fire()` for this many seconds after `Stop()` (default 0 = disabled)

Import the XR Helpers sample (`Samples~/XriHelpers/`) to automatically set up integration with XRGrabInteractable / XRSocketInteractor (the scaffold itself does not break even if XRI is not installed in the project).

## HapbeatTickEmitter

Fires using a snap algorithm based on the rate of change in a continuous value such as a Slider or ScrollRect.

- No cooldown needed (the algorithm self-limits rapid firing)
- **Tick Mode**: `AbsolutePosition` (default; fires each time the value crosses a fixed grid of 0, threshold, 2×threshold…) / `AccumulatedMotion` (fires each time the value moves by threshold from the last firing position)
- **Tick Threshold**: Grid spacing (in input value units, default 0.1). 0 = fire every time the value changes
- **Axis**: Which component of a Vector2 input to watch (X / Y / Magnitude; ignored for float inputs)
- **Emit On Initial Value**: Whether to fire once on the first value received (default OFF)

## Combining with ParameterBinding

Pair with `HapbeatParameterBinding` to map Transform / Rigidbody values to StreamClip gain / pan every frame.

Examples: stronger haptic feedback as an object gets closer; vibration that intensifies with movement speed.

Details: [](/en/docs/sdk-integration/unity-sdk/parameter-binding/)

## Debugging

Menu bar → `Hapbeat` → `Attach Event Logger to Selected` logs UnityEvent invocations on the selected GameObject to the Console. Useful for visualizing XRI event firing order.

To record detailed logs: `Hapbeat → Logs → Start Recording`

## Next Steps

- [](/en/docs/sdk-integration/unity-sdk/event-map/)
- [](/en/docs/sdk-integration/unity-sdk/streaming/) — Stop latency and drop-out resilience tradeoffs for StreamClip mode
- [](/en/docs/sdk-integration/unity-sdk/showcase/overview/) — Real examples for each Trigger (Z1 Collision / Z2 Animator / Z3 Sequence + Binding / Z4 TickEmitter / Z5 UnityEvent + script)
- [](/en/docs/sdk-integration/unity-sdk/showcase/method-choice/)
