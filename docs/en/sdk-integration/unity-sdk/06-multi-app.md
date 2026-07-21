---
title: Running Multiple Apps Simultaneously
kind: howto
sidebar:
  order: 200
description: Operational guidance and workarounds for running multiple Unity apps (or an app alongside Hapbeat Studio) against a single Hapbeat device at the same time.
---

The Hapbeat SDK is designed with **one device = one app** as the baseline assumption. Connecting multiple client apps (App A and App B, or an app alongside Hapbeat Studio) to a single Hapbeat device **simultaneously** causes haptic commands to collide, the device display to switch back and forth frequently, and other unintended behavior.

This page is operational guidance for cases where you absolutely need multiple apps to coexist.

---

## Why collisions occur

Hapbeat devices process haptic commands received via UDP broadcast relying solely on the `group_id` filter. As of v0.1.0, there is no mechanism to distinguish the sending application.

As a result:

- App A fires `event_id=A.foo` → device vibrates
- Simultaneously, App B fires `event_id=B.bar` → the device vibrates for **both** (overlapping into unintended haptics)
- The `appName` carried in `CONNECT_STATUS` is overwritten by whichever app's packet arrives last, so the display flickers between A and B

---

## Recommended: physically separate the LAN (simplest)

The most reliable approach, and the simplest to configure.

### Pattern 1: Use separate routers / SSIDs

- App A PC + App A Hapbeat → Router A (SSID `studio-a`)
- App B PC + App B Hapbeat → Router B (SSID `studio-b`)

UDP broadcast is isolated within each LAN, so **packets from one side never reach the other's Hapbeat**. Complete isolation with no configuration required.

### Pattern 2: Use Hapbeat itself as a SoftAP

Connect the VR HMD or PC directly to Hapbeat's SoftAP. Running multiple Hapbeats as separate SoftAPs creates multiple independent small LANs.

- App A → connects to Hapbeat A's SoftAP `hapbeat-a-XXXX`
- App B → connects to Hapbeat B's SoftAP `hapbeat-b-XXXX`

> For detailed connection scenarios, see the Connection scenarios A–E section in the workspace CLAUDE.md.

---

## Second-best option: separate by group ID

When LAN separation is not possible (e.g. multiple apps and many Hapbeat devices in the same exhibition booth), **assigning non-overlapping group ID ranges** allows routing to be separated in practice.

### Example: split group ranges between A and B

| App | group ID range |
|---|---|
| App A | 0–10 (players 0–10) |
| App B | 11–20 (players 11–20) |

- Assign a **unique group ID to each Hapbeat device** in advance via Hapbeat Studio or Hapbeat Helper Settings (e.g. 1, 2, 3, ..., 11, 12, ...)
- App A sets `overrideGroup` in `HapbeatConfig`'s Addressing settings to a value within 1–10, or switches dynamically at runtime with `HapbeatManager.Instance.SetAddressOverride(player, group)`
- App B sets `overrideGroup` to a value within 11–20

Each Hapbeat only picks up packets matching its own group ID, so haptic collisions do not occur.

### Limitations of this approach

- **The app name shown on the display will be confused**: both App A and App B broadcast `CONNECT_STATUS` to the same network, so the `app_name` displayed on the device is overwritten by whichever app's packet arrives last.
  - Haptic behavior itself is correctly separated by the group filter, so functionality is unaffected.
  - If you need the display to confirm which app is connected, this approach is insufficient.
- Group ID range management must be enforced by operational rules (if App A accidentally sends group 15, it reaches App B's devices).

---

## Deploying the same build to multiple HMDs (Address Override)

The case above was "multiple apps targeting one Hapbeat." The opposite case is also common: **deploying the exact same Unity build to multiple HMDs, with each device paired 1:1 to its own Hapbeat** (a booth with several HMD/Hapbeat pairs side by side, rental hardware that always runs the same build, etc.).

For this use case you don't need to fork the build per HMD (baking a different `HapbeatConfig.group` into each). The SDK's **Address Override** feature lets you keep a single build and pick the player/group on each device instead.

- `HapbeatConfig` has an `Addressing` section with `overridePlayer` / `overrideGroup` fields. -1 = disabled (the EventMap entry's target is sent as-is); 1–99 forces every outgoing command (Play/Stop/StopAll/StreamBegin) to that value.
- To switch at runtime, call `HapbeatManager.Instance.SetAddressOverride(player, group, persist: true)`. With `persist: true`, the values are saved to PlayerPrefs and restored automatically on the next launch. The `AddressOverrideDemo` sample in Showcase (Z4_Stream) is a working example with a +/- stepper UI.
- No device-side changes are required — this works with no protocol or firmware changes. Set the player/group number on the Hapbeat itself via its physical buttons, and as long as it matches the SDK-side override, the 1:1 pairing just works.

```csharp
// Call this at startup, or whenever the user confirms the number chosen in a settings screen
HapbeatManager.Instance.SetAddressOverride(player: 3, group: -1, persist: true);
```

---

## If strict per-source-app filtering is needed

For use cases such as "same LAN, same group, want to exclusively switch between apps" (e.g. time-sharing a Hapbeat between App A and B, enterprise demos, etc.), **strict source filtering by app ID** is technically feasible:

- Each app carries a UUID / app_id
- The Hapbeat device pins the first app_id it receives and ignores all others
- A button press on the device releases the pin and allows a new app_id to be accepted

This is similar to the bHaptics enterprise design, but **implementing it requires simultaneous changes to contracts / device firmware / SDK** (a DEC-level design decision).

If you have a use case that requires this, please open a [GitHub Issue](https://github.com/Hapbeat/hapbeat-unity-sdk/issues) with details and we will consider implementing it.

---

## Summary

| Situation | Recommended approach |
|---|---|
| Normal operation (1 device = 1 app) | Default configuration — no changes needed |
| Multiple apps + multiple Hapbeats in the same room | **Physically separate LAN / SoftAP** (strongly recommended) |
| LAN separation not possible, only need haptic separation | **Split by group ID range** (display will be confused, but behavior is correct) |
| Strict per-source-app filtering required | Open an Issue (not implemented as of now) |
