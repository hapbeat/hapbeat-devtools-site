---
title: Showcase Sample
kind: explanation
sidebar:
  label: Showcase
  order: 100
description: A Unity sample that covers haptic wiring patterns across 1 scene × 5 zones. Use it as a starting point for learning, copying, and extending real working implementations.
---

Showcase is a **collection of working implementation examples** showing what you can build with the Hapbeat SDK. Rather than a step-by-step tutorial, it packs **working structures, design intent, and use cases** into a single scene. Use it not just to read, but as a starting point to **explore, copy, and extend**.

No XR device required — keyboard and mouse only.

> **Design philosophy**: The idiomatic Hapbeat SDK approach is a declarative style where you **wire Trigger components in the Inspector**. Showcase follows this in every Zone. Scripts do nothing more than **call `Fire()` / `Stop()` on a Trigger, or write to `GainMultiplier`** — all haptic computation is delegated to the SDK.

## Structure

Five zones are packed into one scene, with **keys 1–5 switching between zones** (`ZoneSwitcher` calls `SetActive(false)` on all zones except the current one). Each zone demonstrates exactly one haptic registration pattern.

| Zone | Pattern | Description |
|---|---|---|
| **Z1 Bowling Lane** | Collision Trigger (velocity-scaled) | LMB launches a ball; hitting a pin triggers haptics |
| **Z2 Swing Door** | Animator State Behaviour | F key toggles Animator state Open / Close |
| **Z3 Fishing Rod** | Sequence Trigger + Parameter Binding | LMB hold attaches an object; swinging changes gain dynamically |
| **Z4 Stream Console** | UnityEvent Trigger (loop) + Tick Emitter | Space toggles streaming; Slider modulates gain / pan in real time |
| **Z5 Charge & Shoot** | UnityEvent Trigger + curve-driven GainMultiplier | LMB hold to charge, release to fire, hit triggers a separate event |

For wiring details of each zone (which GameObject holds which Trigger), see the [Wiring Reference](/en/docs/sdk-integration/unity-sdk/showcase/wiring/).

## Global Controls

| Key | Action |
|---|---|
| `WASD` / Mouse | Player movement / look |
| `Tab` | Cursor lock / unlock (release for UI interaction) |
| `1`–`5` | Switch zones |
| `Q` | Fire `manual_fire` event |
| `P` | Ping (displays RTT in HUD) |

## Getting Started

1. In the Unity Editor: **Window → Package Manager → Hapbeat SDK → Samples → Showcase → Import**
2. Open `Assets/Samples/Hapbeat SDK/<version>/Showcase/Scenes/Showcase.unity`
3. Bring your Hapbeat device online via Studio or Helper, then hit **Play**

You can open the scene immediately after import. The EventMap, kit manifest, audio clips, and other assets are all bundled in the sample folder — no separate generation steps needed.

## What to Read Next

- [Walkthrough](/en/docs/sdk-integration/unity-sdk/showcase/walkthrough/) — Tips for experimenting, switching to Command mode, handling WASD conflicts, and troubleshooting
- [Wiring Reference](/en/docs/sdk-integration/unity-sdk/showcase/wiring/) — Per-zone wiring details (which GameObjects hold which Triggers / Bindings)
- [BatchSetup vs Script](/en/docs/sdk-integration/unity-sdk/showcase/method-choice/) — When to use the component approach vs. the scripting approach
