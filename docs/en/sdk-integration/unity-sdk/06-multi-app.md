---
title: Running Multiple Apps Simultaneously
kind: howto
sidebar:
  order: 200
description: How to separate traffic when several Hapbeats or several apps share one network, plus Address Override for shipping one build to many HMDs.
---

The Hapbeat SDK assumes **one device = one app** as its baseline. When several apps share a network (App A and App B, or an app alongside Hapbeat Studio), **separate the destinations by player / group**.

## What happens if you don't

A device decides whether a command is for it based solely on the **target (player / group)** it received. There is no mechanism to distinguish the sending app.

- Both App A's and App B's fires play on the same device
- The `appName` in `CONNECT_STATUS` is overwritten by whichever arrived last, so the OLED display flickers

## Recommended: separate by player / group

Assign a player / group number to each Hapbeat, and have each app send only to its own numbers.

1. **Assign a number to each Hapbeat**
   - Set it from Hapbeat Studio or the device's buttons (1–99 each)

2. **Decide the number range each app uses**
   - Example: App A = players 1–10, App B = players 11–20

3. **Pin the override on the app side**
   - `HapbeatManager.Instance.SetAddressOverride(player, group, persist: true)`
   - To pin it for the whole build, use **Override Addressing (this build)** in `Hapbeat > Settings`

Each device only picks up commands addressed to its own number, so haptics never collide.

:::caution[The app name on the OLED cannot be separated]
Haptics are separated, but `appName` shows whichever arrived last. This approach is not suited to using the display to confirm "am I connected to my app?"
:::

## Deploying the same build to multiple HMDs (Address Override)

Lining up several HMD × Hapbeat pairs at a booth, or running rental hardware on one build — in these cases **you do not need a separate build per HMD**. Ship the same build to every device and pick the player / group on the device to establish a 1:1 pairing.

There are two scopes, and each axis (player / group) is independent.

| Scope | Where to set it | Use case |
|---|---|---|
| **this build** | Override Addressing in `Hapbeat > Settings` | Pinned for the whole build. When you fork the build per demo |
| **this device** | Runtime API / settings panel | Varies per device. When you ship a single build |

No device-side work is required. It works with no protocol or firmware changes.

### Number your demos from something other than 1

A device always stores its address in the canonical `player_<N>/<position>/group_<M>` form, and **the defaults are `player_1` / `group_1`**.

That means **every unit you forget to configure converges on "number 1."** Numbering your demos **from 2, 3, … rather than 1** makes an unconfigured unit obvious immediately, because it responds to none of the demos.

### Two ways to set it per device

**Call it from script**

```csharp
// Call at startup, or whenever the number is confirmed in a settings screen
HapbeatManager.Instance.SetAddressOverride(player: 3, group: HapbeatManager.AddressOverrideDisabled, persist: true);
```

- `player` / `group` are 1–99. Passing `AddressOverrideDisabled` (`-1`) leaves that axis un-overridden
- With `persist: true` the values are saved to PlayerPrefs and restored on the next launch
- When re-pairing, call `ClearPersistedAddressOverride()` (or the **Clear Saved Override** button on the `HapbeatManager` inspector while in Play mode)

**Attach one `HapbeatAddressOverridePanel`**

Just add it to a GameObject and it builds a runtime UI for picking player / group and pressing Apply. No UI hierarchy needs to be assembled in the scene.

- `Space` toggles between `ScreenSpaceOverlay` (fixed 2D HUD, default) and `WorldSpace` (a 3D panel for VR)
- In `WorldSpace`, `World Attach Mode` picks between `LazyFollow` (default — moves in front of the wearer only when it leaves their view) and `WorldFixed` (stays where it was placed)
- The `AddressOverrideDemo` in the Showcase sample is a thin subclass of this panel, readable as a starting point for your own UI

### Embed `<p>` / `<g>` in appName

If `HapbeatConfig.appName` contains `<p>` / `<g>`, they are substituted with the current override values right before sending and shown on the OLED (`-` when disabled).

```text
appName = "Booth <p>/<g>"
→ player=3, group disabled: "Booth 3/-"
```

On-site, you can confirm "is this HMD paired with the right Hapbeat?" from the device's screen alone.

### Operational tips

- **Leave the player portion of the EventMap target as `*`** — on devices with no override it reaches every device, and on configured devices only the paired one, so the same EventMap works everywhere
- **If you use group override, match the group number on the device too** — address matching is positional, so a send targeted at `group_5` only reaches group_5 devices
- **Do one final verification pass on the real deployment platform** — for Quest, verify PlayerPrefs persistence and the OLED display in an actual Quest build

### If text looks blurry only on the standalone headset

If it reads crisply in the Editor (over Air Link) but looks soft only in a Quest standalone build, the cause is that **Quality levels are per-platform**. Editor Play over Air Link uses the Standalone tier; a device build uses the Android tier.

- The VR template's default URP asset, `Mobile_RPAsset`, ships with **Render Scale 0.8**. Open the Android-side asset under `Project Settings > Quality` and set it to `1.0` to improve it
- Raising the panel's `World Pixel Density` (default `3`, range `1–8`) rasterizes at a higher resolution for the same physical size

Both are **settings in your own project** — the SDK cannot change them.

## If you need a strict source filter

For "same network, same number, exclusively switch between multiple apps," a strict source filter by sending app ID is technically feasible (the device pins the first app_id and ignores the rest). It is a design decision requiring simultaneous changes to contracts / firmware / SDK, so it is not implemented at this time.

Please reach out on [GitHub Issues](https://github.com/Hapbeat/hapbeat-unity-sdk/issues) with your use case.

## Summary

| Situation | Approach |
|---|---|
| Normal operation (1 device = 1 app) | Defaults are fine |
| Multiple apps + multiple Hapbeats on the same network | **Separate by player / group** |
| Same build deployed to multiple HMDs | **Address Override (this device)** |
| Strict source filter required | Open an Issue (not implemented) |
