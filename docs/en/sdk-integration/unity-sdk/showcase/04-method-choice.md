---
title: BatchSetup vs Script
kind: explanation
sidebar:
  order: 400
description: How to decide between the component approach and the scripting approach for haptic wiring in the Hapbeat Unity SDK — decision criteria and design tips.
---

There are two main ways to integrate Hapbeat haptics in Unity:

1. **BatchSetup / Inspector components** — connect directly to UnityEvents, Animator states, or Collision callbacks
2. **Call a Trigger's `Fire()` / `Stop()` from a script** — fire haptics actively from your own logic (procedure: [](/en/docs/sdk-integration/unity-sdk/scripting/))

Both are valid; choose based on the situation. With either approach, the waveform, intensity, and destination are determined by the EventMap entry.

## Quick Reference

| Situation | Recommended approach |
|---|---|
| Applying the same Trigger to 3 or more objects | BatchSetup |
| Fire condition is simply "collision occurred / slider moved / state changed" | Component |
| Gain is either the EventMap entry default or velocity scaling alone | Component |
| Fire condition depends on multiple game states (charge level, item count, HP, etc.) | Script |
| Gain / pan need to be computed at runtime | Script (`GainMultiplier` / `Pan`) |
| One fire point needs to branch into multiple Events | Script (prepare a Trigger per entry and call them separately) |

> To see which approach each Showcase zone uses, refer to the [Wiring Reference](/en/docs/sdk-integration/unity-sdk/showcase/wiring/#when-to-use-each-approach). The "Input type → Reference Zone" matrix is on the same page.

## Design Tips

### Have the script only call a Trigger

Even when scripting, calling `HapbeatManager.Instance.Play()` directly is not recommended. Instead, **hold a reference to a Trigger component and call `Fire()`**.

Why:
- Gain / target / clip can be adjusted in the EventMap window without rewriting code
- Kit intensity compensation and latency compensation apply automatically
- The EventMap window shows "where it is called from"

Calling `HapbeatManager` directly is limited to cases such as building the Event ID at runtime (→ [](/en/docs/sdk-integration/unity-sdk/scripting/#firing-without-a-trigger)).

### Combine both approaches

Z3 Fishing is a typical example of combining both:
- `HapbeatSequenceTrigger` (component) declares the Fire→Loop→Stop structure
- `FishingController` (script) calls `Fire()` / `Stop()` in response to mouse input
- `HapbeatParameterBinding` (component) maps the object's velocity to gain during the loop

"Use components for the parts you can express declaratively; use script only where logic is required" makes for readable, maintainable code.

## Summary

- First ask whether [](/en/docs/sdk-integration/unity-sdk/editor-menus/#batch-setup) can express what you need
- If not, call a Trigger's `Fire()` / `Stop()` from a script
- Mixing both approaches in the same scene is fine (Showcase does exactly this)
- For concrete examples, see the "Per-Zone Wiring Details" section in the [Wiring Reference](/en/docs/sdk-integration/unity-sdk/showcase/wiring/)
