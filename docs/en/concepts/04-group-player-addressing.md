---
title: Address System
kind: explanation
description: Address design for running multiple Hapbeat devices on the same network simultaneously, and the roles of Group and Player.
sidebar:
  order: 4
---

Hapbeat communication is based on UDP broadcast. When multiple devices share the same network, the **address** determines which packets each device plays. This page explains how address strings are constructed and the design decisions behind them.

For the formal specification, see [Contracts: device-addressing](https://github.com/Hapbeat/hapbeat-contracts/blob/master/specs/device-addressing.md).

## Address Format

```
[prefix/] player_{N} / {position} [/group_{M}]
```

- `prefix` — optional (zero or more segments). Free-form string for team/app identification (e.g., `red/alpha`)
- `player_{N}` — **required**. `N` is 1..99
- `{position}` — **required**. Predefined vocabulary indicating the worn position (e.g., `chest` / `band` / `left_upper_arm`)
- `group_{M}` — optional (zero or one segment). Must appear **immediately after `{position}`**. `M` is 1..99

Segments are separated by `/` (slash). Allowed characters are `[a-zA-Z0-9_-]`. The maximum address length is 64 bytes (including null terminator).

### Address Examples

| Configuration | Address |
|---|---|
| Simple (1 player, 1 device) | `player_1/chest` |
| Multi-player | `player_1/chest`, `player_2/left_upper_arm` |
| Team-based | `red/player_1/chest` |
| Team + squad | `red/alpha/player_3/chest` |
| Group isolation | `player_1/chest/group_1`, `player_1/chest/group_2` |

An **address without `group_{M}` is received by all groups**. You can omit it when only one player is present.

## Roles of Player and Group

| Concept | Purpose | Range |
|---|---|---|
| **Player number** | Groups multiple devices belonging to the same "player." If one person wears both a neck-worn and waist device, both get the same player number. | 1..99 |
| **Group ID** | Separates players from one another. Prevents interference between different groups (different booths, different teams) on the same Wi-Fi network. | 1..99 |

To align with the OLED display (`Gr:01..99` / `P:01..99`), both Player and Group are fixed at **1..99** ([DEC-030](https://github.com/Hapbeat/hapbeat-sdk-workspace/blob/master/docs/decision-log.md#DEC-030)). Internally, `uint8_t` can hold up to 255, so the range can be expanded in the future if needed.

## Why Broadcast + Device-Side Filtering?

| Design decision | Reason |
|---|---|
| **No device IP management** | No need to update address assignments when DHCP reassigns IPs |
| **Same send code for one or many devices** | No unicast/broadcast switching or destination tables |
| **Identical behavior on PC / Quest / smartphone** | Only a standard UDP socket API is needed per platform |
| **No Bridge or relay server** | Haptic output works immediately on app launch, works offline |

This is why Hapbeat achieves a "no central server / no cloud" design. See [Communication Model](/en/docs/concepts/communication-model/) for details.

## Choosing Addresses for Connection Scenarios

| Scenario | Player | Group |
|---|---|---|
| Single-player LAN | 1 | (omit — all groups receive) |
| Multi-player LAN | Unique per player | Unique per player |
| Hapbeat SoftAP (HMD, etc.) | 1 | (omit) |
| Isolated exhibition booth | 1 | Unique per booth |

A simple mental model: **use Group to prevent interference between people**, and **use `{position}` to distinguish multiple worn devices for one person**.

## Historical Background

In earlier versions, a separate `target_group` (uint8) field existed in the wire protocol alongside the address. This was deprecated in [DEC-030](https://github.com/Hapbeat/hapbeat-sdk-workspace/blob/master/docs/decision-log.md#DEC-030) on 2026-05-09, and **Group was consolidated into the `/group_{M}` suffix at the end of the address**. A single string now covers everything, simplifying the spec and making it easier to keep firmware, SDK, and Studio in sync.

## See Also

- [Architecture Overview](/en/docs/concepts/architecture/)
- [Communication Model](/en/docs/concepts/communication-model/)
- [](/en/docs/concepts/contracts/overview/) / [device-addressing specification](https://github.com/Hapbeat/hapbeat-contracts/blob/master/specs/device-addressing.md)
