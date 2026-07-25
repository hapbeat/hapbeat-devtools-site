---
title: Targeting
kind: explanation
sidebar:
  order: 200
description: How Hapbeat decides which devices fire, and which of player / position / group to split by for each setup.
---

A Hapbeat command reaches every device on the same network. Which devices react is decided by matching the **target string** in the command against the **address** each device holds.

A device address is a canonical form made of three segments.

```
player_<N> / <position> / group_<M>
    │            │             └ unit of collective control (1–99)
    │            └ wear location (pos_neck, pos_r_arm, …)
    └ player number (1–99)
```

The sender's target is matched as a prefix, and `*` matches any value for one segment. So `player_2` reaches every device of player 2, and `*/pos_neck` reaches only the necks of every player.

**Which segment to split by is decided by how many senders and receivers sit within one radio range (the same Wi-Fi / the same AP).**

## Guidance per setup

| Setup | Axis to split by | Configuration |
|---|---|---|
| 1 sender : 1 receiver | none | leave the defaults |
| 1 sender : one person wearing several | **position** | set the wear location and fire per target in the EventMap |
| 1 sender : several players | **player** | assign player 1, 2, 3 … to each device |
| Several 1:1 pairs (LBE etc.) | **group** | assign group 1–N per pair and pin it from the app with an override |
| Several apps coexisting | **player / group** | decide the number range each app uses |

### 1 sender : 1 receiver

Nothing needs splitting. The override can stay disabled, and an empty or `*` target in the EventMap reaches everything. **This is the most common setup, and it needs no configuration.**

### 1 sender : one person wearing several

To fire the neck and the right arm of the same player separately, use **position**. The player and group can stay shared.

- Set each device's position from Studio or the on-device buttons (a fixed vocabulary: `pos_neck` / `pos_r_arm` etc.)
- Specify the target per EventMap entry as `*/pos_neck` or `*/pos_r_arm`

### 1 sender : several players

When one app drives different haptics for three people, split by **player**.

- Assign player 1 / 2 / 3 to each device
- Either set the EventMap target to something like `player_1`, or switch the override per send

### Several 1:1 pairs

In an LBE-style setup with five HMD-and-Hapbeat pairs, use **group as the pair identifier**.

- Assign group 1–5 on the device side
- Pin the same number as an override in the app on each HMD
- The EventMap stays shared across all five pairs

The advantage of this approach is that **you can ship the same build to every unit** and run it as-is. There is no need to split the build per pair.

### Several apps coexisting

Devices do not distinguish between source apps. When several apps sit on the same network, **decide the player / group range each app uses** (for example App A = player 1–10, App B = player 11–20).

:::caution[The app name on the OLED cannot be separated]
The haptics are separated, but `appName` in `CONNECT_STATUS` is overwritten by whichever arrived last. It is not suited to checking "am I connected to my app" from the display.
:::

## Number from something other than 1

A device address is always held in canonical form, and **the defaults are `player_1` / `group_1`**. There is no such state as "a device with no group set."

That means **every unit you forget to configure converges on number 1**. Numbering your demos or pairs from **2, 3, … rather than 1** makes an unconfigured unit immediately identifiable, because it reacts to nothing.

## Two units of pinning

There are two ways to pin an address from the app, and they can be specified independently per player / group axis.

| Unit | Where to set it | Use case |
|---|---|---|
| **this build** | Override Addressing in `Hapbeat > Settings` | Pinned for the whole build. When you split builds per demo |
| **this device** | Runtime API / settings panel | Varies per unit. When you ship a single build |

No device-side support is needed; this works without any protocol or firmware change.

### Ways to set it per unit

**Call it from a script**

```csharp
// Call at startup, or when the number is confirmed on a settings screen
HapbeatManager.Instance.SetAddressOverride(player: 3, group: HapbeatManager.AddressOverrideDisabled, persist: true);
```

- `player` / `group` are 1–99. An axis passed `AddressOverrideDisabled` (`-1`) is not overridden
- With `persist: true` the value is saved to PlayerPrefs and restored on the next launch
- When reassigning, call `ClearPersistedAddressOverride()` (in Play mode, the **Clear Saved Override** button on the `HapbeatManager` inspector)

**Attach `HapbeatAddressOverridePanel`**

Adding one component to a GameObject generates a runtime UI for picking player / group and applying it. You do not need to build a UI hierarchy in the scene.

- `Space` switches between `ScreenSpaceOverlay` (screen-fixed HUD, the default) and `WorldSpace` (a 3D panel for VR)
- In `WorldSpace`, `World Attach Mode` offers `LazyFollow` (the default — moves in front of you only when it leaves your view) and `WorldFixed` (stays where you put it)
- If text blurs only on device, raise the Render Scale of the Android-side URP asset (0.8 by default in the VR template) and the panel's `World Pixel Density` (3 by default)
- `AddressOverrideDemo` in the Showcase sample is a thin class that just inherits this panel, so it reads as a starting point for your own UI

## Checking it on site

Include `<p>` / `<g>` in `HapbeatConfig.appName` and they are replaced with the current override values just before sending, then shown on the OLED (`-` when disabled).

```text
appName = "Booth <p>/<g>"
→ player=3, group disabled: "Booth 3/-"
```

This lets you confirm "is this HMD paired with the right Hapbeat" from the device screen alone.

## Operational notes

- **Leave the player part of the EventMap target as `*`** — on units with the override disabled it reaches every device, on configured units only its pair, so the same EventMap can be reused
- **If you use a group override, match the group number on the device side too** — matching is positional, so a `group_5` target only reaches group_5 devices
- **Per-source-app exclusive control is not implemented** — switching exclusively between several apps that use the same number (a scheme where the device pins the first app_id) requires simultaneous changes across contracts / firmware / SDK, so it does not exist today. If you need it, file it with your use case at [GitHub Issues](https://github.com/Hapbeat/hapbeat-unity-sdk/issues)

## See also

- [](/en/docs/concepts/group-player-addressing/) — the address specification
- [](/en/docs/concepts/communication-model/) — transmission paths and device-count guidance
