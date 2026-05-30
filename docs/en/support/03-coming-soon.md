---
title: Coming Soon
kind: reference
description: SDKs and tools in the Hapbeat ecosystem that are planned but not yet implemented.
sidebar:
  order: 100
---

This page lists **currently unimplemented** SDKs and tools that are planned for future releases. Items that reach completion will be moved to their own dedicated sections.

## Unreal SDK

A thin adapter SDK for controlling Hapbeat from Unreal Engine. It will use the same UDP protocol as the Unity SDK ([](/en/docs/concepts/contracts/overview/)), so the feature set is expected to closely mirror the Unity SDK.

**Planned features**

- Direct communication via Wi-Fi UDP broadcast
- Blueprint-compatible Trigger component
- C++ API (equivalent to `HapbeatBridge` / `HapbeatEventTrigger`)
- EventMap-style Editor tooling

**Alternative**: If you want to prototype now, you can implement the protocol directly using an OSC/UDP library by referencing [](/en/docs/concepts/contracts/overview/).

## Creative Kit (TouchDesigner / Max / Pure Data)

A collection of templates and samples for controlling Hapbeat from creative development environments.

**Planned content**

- OSC / UDP patch for TouchDesigner
- Max for Live device
- Pure Data abstraction
- Examples combining Hapbeat with Live Audio
- Best practices for event mapping

**Alternative**: You can already control Hapbeat today by sending OSC / UDP directly from any of these tools. See [](/en/docs/concepts/contracts/overview/).

---

For other roadmap items and progress discussions, visit [](/en/docs/support/contact/).
