---
title: Targeting
kind: explanation
sidebar:
  order: 200
description: How Hapbeat decides which devices receive haptic feedback, and which of player / position / group to split by for each setup.
---

A Hapbeat command reaches the devices on the same network. Which devices react is decided by matching the **target string** carried in the command against the **address** each device holds.

A device address is a canonical form made of three segments.

```
player_<N> / <position> / group_<M>
    │            │             └ unit of collective control (1–99)
    │            └ wear location (pos_neck, pos_r_arm, …)
    └ player number (1–99)
```

The sender's target is matched as a prefix, and `*` matches any value for one segment. So `player_2` reaches every device of player 2, and `*/pos_neck` reaches only the necks of every player. For the full specification, see [](/en/docs/concepts/group-player-addressing/).

**Which segment to split by is decided by how many senders and receivers sit within one radio range (the same Wi-Fi / the same AP).**

## Guidance per setup

| Setup | Recommended axis | Configuration |
|---|---|---|
| 1 sender / 1 kind of receiver | none | leave the defaults |
| 1 sender / one person wearing several | **position** | set the wear location and fire per target |
| 1 sender / several players | **player** | assign player 1, 2, 3 … to each device |
| N senders / N receivers (N 1:1 pairs) | **group** + override | assign a group per pair and pin it on the sender |
| Several senders / mixed receivers | **group** | split the group range per sender |

### 1 sender / 1 kind of receiver

**However many receivers there are, nothing needs splitting as long as they may all vibrate with the same signal.** The override can stay disabled, and an empty or `*` target reaches every device. This covers one device per person, and equally an installation where several people share the same effect. It is the most common setup, and it needs no configuration.

:::note[Numbering from something other than 1 prevents mistakes]
A device address is always held in canonical form, and the defaults are `player_1` / `group_1`. There is no such state as "a device with no group set."

That means every unit you forget to configure converges on number 1. Numbering your demos or pairs from 2, 3, … rather than 1 makes an unconfigured unit immediately identifiable, because it reacts to nothing.
:::

### 1 sender / one person wearing several

When the same player wears several Hapbeats and each emits different haptics, split by **position**. The three axes are functionally equivalent, so player or group would work too, but identifying a body location is semantically natural for position, and it keeps the player axis free for adding players later.

- Set each device's position from Studio or the on-device buttons (a fixed vocabulary: `pos_neck` / `pos_r_arm` etc.)
- Specify targets as `*/pos_neck` and `*/pos_r_arm` to fire them separately

### 1 sender / several players

When one sender drives different haptics for three people, split by **player**.

- Assign player 1 / 2 / 3 to each device
- Either specify a target such as `player_1`, or switch the override per send

### N senders / N receivers (N 1:1 pairs)

In an LBE-style setup with five HMD-and-Hapbeat pairs, use **group as the pair identifier**.

Concretely, **assign the same number on both sides** as follows.

| Pair | HMD side (app override) | Hapbeat side (device address) |
|---|---|---|
| Pair 1 | group 1 | group 1 |
| Pair 2 | group 2 | group 2 |
| … | … | … |
| Pair 5 | group 5 | group 5 |

This way a send from HMD 1 only reaches the group 1 Hapbeat and does not affect the neighbouring pair. The device-side number is set from Studio or the on-device buttons, and the app-side number from the override (→ [Override targeting](#override-targeting)).

Since the EventMap stays shared across all five pairs, **you can ship the same build to every unit and run it as-is**. There is no need to split the build per pair.

### Several senders / mixed receivers

Devices do not distinguish between senders. When several senders (different apps, or different PCs / transmitters) sit on the same network, **split the group range per sender** (for example A = group 1–10, B = group 11–20). If you also need per-player control, the player axis can be left for that, which makes group the easier axis to spend on separating senders.

## Override targeting

A mechanism that **overwrites the target written on each EventMap entry from the app side, immediately before sending**. It can be specified independently per player / group axis, and an axis you do not overwrite keeps the EventMap's own value.

This means **you can switch the destination purely through runtime settings, without editing the EventMap**. It is what makes it viable to ship a single build to several units and pair each unit with a different Hapbeat. No device-side support is needed; this works without any protocol or firmware change.

The overwrite only happens at the moment a command is sent — not per frame, and not per stream chunk.

There are two units of pinning.

| Unit | Where to set it | Use case |
|---|---|---|
| **this build** | Override Addressing in `Hapbeat > Open Settings` | Pinned for the whole build. When you split builds per demo |
| **this device** | Runtime API / settings panel | Varies per unit. When you ship a single build |

### Setting it from a script

```csharp
// Call at startup, or when the number is confirmed on a settings screen
HapbeatManager.Instance.SetAddressOverride(player: 3, group: HapbeatManager.AddressOverrideDisabled, persist: true);
```

- `player` / `group` are 1–99. An axis passed `AddressOverrideDisabled` (`-1`) is not overwritten
- With `persist: true` the value is saved to PlayerPrefs and restored on the next launch
- When reassigning, call `ClearPersistedAddressOverride()` (in Play mode, the **Clear Saved Override** button on the `HapbeatManager` inspector)

The current values can be checked from `Hapbeat > Open Runtime Status` (→ [](/en/docs/sdk-integration/unity-sdk/editor-menus/)).

### Placing a settings panel

Adding a single `HapbeatAddressOverridePanel` to a GameObject generates a runtime UI for picking player / group and applying it. You do not need to build a UI hierarchy in the scene. It can sit as a screen-fixed HUD or as a 3D panel for VR.

For its settings and how it takes controller input, see [](/en/docs/sdk-integration/unity-sdk/components/).

### Examples

| Sample | Contents |
|---|---|
| **VR Config Example** | A scene dedicated to override settings. Reusable as-is as a VR-side settings screen |
| **Showcase / Z4 Stream Console** | `AddressOverrideDemo` is a thin class that just inherits the panel. Reads as a starting point for your own UI |

Both are imported from Samples in the Package Manager.

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
- [](/en/docs/sdk-integration/unity-sdk/editor-menus/) — where Settings / Runtime Status live
