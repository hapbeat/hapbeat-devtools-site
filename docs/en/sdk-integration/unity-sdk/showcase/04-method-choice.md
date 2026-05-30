---
title: BatchSetup vs Script
kind: explanation
sidebar:
  order: 400
description: How to decide between the component approach and the scripting approach for haptic wiring in the Hapbeat Unity SDK — decision criteria and design tips.
---

There are two main ways to integrate Hapbeat haptics in Unity:

1. **BatchSetup / Inspector components** — connect directly to UnityEvents, Animator states, or Collision callbacks
2. **Call `HapbeatBridge` / `HapbeatManager` from a script** — fire haptics actively from your own logic

Both are valid; choose based on the situation.

## Quick Reference

| Situation | Recommended approach |
|---|---|
| Applying the same Trigger to 3 or more objects | BatchSetup |
| Fire condition is simply "collision occurred / slider moved / state changed" | Component |
| Gain is either the EventMap entry default or velocity scaling alone | Component |
| Fire condition depends on multiple game states (charge level, item count, HP, etc.) | Script |
| Gain / pan / target need to be computed at runtime | Script |
| One fire point needs to branch into multiple Events | Script |
| The same event fires from many places (e.g. logic centralised in a custom Bridge) | Script |

> To see which approach each Showcase zone uses, refer to the [Wiring Reference](/en/docs/sdk-integration/unity-sdk/showcase/wiring/). The "Input type → Reference Zone" matrix is on the same page.

## Design Tips

### Create a Bridge subclass

Even when scripting, calling `HapbeatManager.Instance.Play()` directly everywhere is not recommended. Instead, **create one project-specific `HapbeatBridge` subclass** and centralise all fire logic there.

Why:
- Gain / target / curve tuning stays in one place
- Haptic logic is decoupled from game logic, making it easier to maintain
- Showcase's `ShowcaseBridge` follows this pattern ([Scripts/ShowcaseBridge.cs](https://github.com/yus988/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/ShowcaseBridge.cs))

### Combine both approaches

Z3 Fishing is a typical example of combining both:
- `HapbeatSequenceTrigger` (component) declares the Fire→Loop→Stop structure
- `FishingController` (script) calls `Sequence.Fire()` / `Stop()` in response to mouse input
- `HapbeatParameterBinding` (component) maps the object's motion to gain during the loop

"Use components for the parts you can express declaratively; use script only where logic is required" makes for readable, maintainable code.

## Summary

- First ask whether [](/en/docs/sdk-integration/unity-sdk/event-map/#batch-setup) can express what you need
- If not, use a custom Bridge subclass + script
- Mixing both approaches in the same scene is fine (Showcase does exactly this)
- For concrete examples, see the "Per-Zone Wiring Details" section in the [Wiring Reference](/en/docs/sdk-integration/unity-sdk/showcase/wiring/)
