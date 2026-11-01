---
title: Showcase Sample
kind: explanation
sidebar:
  label: Showcase overview
  order: 100
description: A Unity sample that lays out the ways to add haptics with the SDK across 1 scene × 5 zones. What each zone contains, and a quick reference from what you want to do to the zone to look at.
---

Showcase is an implementation example that lays out the ways to add haptics with the Hapbeat SDK across **5 zones in one scene**. Each zone plays haptics in a different way — collisions, the Animator, scripts, and so on. No XR device is required; it runs with only a keyboard and mouse.

The wiring of each zone (which GameObject holds which component), its scripts, and modifications you can try are collected in [](/en/docs/sdk-integration/unity-sdk/showcase/zones/).

## Opening it

1. In the Unity Editor: **Window → Package Manager → Hapbeat SDK → Samples → Showcase → Import**
2. Open `Assets/Samples/Hapbeat SDK/<version>/Showcase/Showcase.unity`
3. Bring your Hapbeat device online via Studio or Helper, then hit **Play**

The EventMap, Kit, and AudioClips are bundled with the sample, so no extra preparation is needed. If you modify the sample, copy the Showcase folder to another location inside `Assets/` before editing, so that a re-import does not overwrite it.

:::note[Timing of sound and haptics]
Audio output latency differs per environment, so the haptics may be felt before the sound. This is expected. Under **Latency Compensation** in `Hapbeat → Open Settings`, raise **Haptic Delay (ms)** gradually to add delay to the haptics and line them up. For details, see <a href="/en/docs/sdk-integration/unity-sdk/getting-started/#align-the-timing-of-sound-and-haptics" target="_blank" rel="noopener noreferrer">Align the timing of sound and haptics</a>.
:::

## Zones

Switch zones with the 1–5 keys.

<div class="hb-card-grid">
<div>

![Z1 Bowling Lane](@assets/unity/showcase-z1-bowling.jpg)

**[Z1 Bowling Lane](/en/docs/sdk-integration/unity-sdk/showcase/zones/#z1-bowling-lane)** — Launch a ball at the pins. Plays at a strength that follows the collision speed (Collision Trigger)

</div>
<div>

![Z2 Swing Door](@assets/unity/showcase-z2-door.jpg)

**[Z2 Swing Door](/en/docs/sdk-integration/unity-sdk/showcase/zones/#z2-swing-door)** — Open / close, slam, and lock a door. Plays per Animator state (State Behaviour)

</div>
<div>

![Z3 Fishing Rod](@assets/unity/showcase-z3-fishing.jpg)

**[Z3 Fishing Rod](/en/docs/sdk-integration/unity-sdk/showcase/zones/#z3-fishing-rod)** — Hang an object on a fishing line and swing it. Loops while the object hangs, and the strength changes with the object's speed (Sequence Trigger + Parameter Binding + script)

</div>
<div>

![Z4 Stream Console](@assets/unity/showcase-z4-stream.jpg)

**[Z4 Stream Console](/en/docs/sdk-integration/unity-sdk/showcase/zones/#z4-stream-console)** — Start / stop loop playback, and change strength and left-right with sliders (UnityEvent Trigger + Parameter Binding + Tick Trigger + script)

</div>
<div>

![Z5 Charge & Shoot](@assets/unity/showcase-z5-charge.jpg)

**[Z5 Charge & Shoot](/en/docs/sdk-integration/unity-sdk/showcase/zones/#z5-charge--shoot)** — Charge, fire, and hit a target. The strength changes with the charge amount (an advanced example that calls HapbeatManager directly from a script + UnityEvent Trigger)

</div>
</div>

## Common controls

| Key | Action |
|---|---|
| `WASD` / Mouse | Move / look |
| `Tab` | Cursor lock / unlock (when operating the UI) |
| `1`–`5` | Switch zones |
| `Q` | Play a haptic once (`Z5_tar_hit_light`) |
| `P` | Ping (shows the round-trip time at the top right of the screen) |

For the controls of each zone, see [](/en/docs/sdk-integration/unity-sdk/showcase/zones/).

## What you want to do → zone to look at

| What you want to do | Zone | SDK elements used |
|---|---|---|
| Play on a physics collision | **Z1** | `HapbeatCollisionTrigger` (strength follows velocity) |
| Play in step with an Animator state | **Z2** | `HapbeatStateBehaviour` |
| Play / stop from your own script | **Z3** / **Z4** | `Fire()` / `Stop()` of `HapbeatSequenceTrigger` / `HapbeatUnityEventTrigger` |
| Change a loop's strength with an object's motion | **Z3** | `HapbeatParameterBinding` (Source = VelocityMagnitude) |
| Change strength and left-right with a slider | **Z4** | `HapbeatParameterBinding` (Source = SliderValue) |
| Play ticks as a value changes | **Z4** | `HapbeatTickEmitter` (Tick Trigger) |
| Play via a UnityEvent from your own hit detection | **Z5** | `TargetReceiver`'s UnityEvent → `HapbeatUnityEventTrigger.Fire()` |
| Connect key input to playback without code | Common controls | `HapbeatKeyDispatcher` → `HapbeatUnityEventTrigger.Fire()` |
| Call HapbeatManager directly without a Trigger | **Z5** | `HapbeatManager.StreamAudioClip(...)` |

For how to play from a script, see [](/en/docs/sdk-integration/unity-sdk/scripting/); for the component settings, see [](/en/docs/sdk-integration/unity-sdk/triggers/).
