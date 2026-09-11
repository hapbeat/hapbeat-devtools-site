---
title: Targeting
kind: explanation
description: Shared guide to Target and Address Override, which decide which Hapbeat receives haptics.
sidebar:
  order: 5
---

Hapbeat commands reach devices on the same network. A command plays on a device when its **Target** matches the device's **Address**.

An Address has three canonical segments:

```text
player_<N> / <position> / group_<M>
    │            │             └ Unit for coordinated control (1–99)
    │            └ Wearing position, such as pos_neck or pos_r_arm
    └ Player number (1–99)
```

Target uses prefix matching; `*` matches any value for one segment. For example, `player_2` reaches every device for player 2, and `*/pos_neck` reaches neck devices for every player. See [Address format](/en/docs/concepts/group-player-addressing/) for the complete form.

## Choose an axis for your setup

| Setup | Axis to separate | Configuration |
| --- | --- | --- |
| One sender / one receiver type | none | Keep defaults. |
| One sender / one person wearing several devices | **position** | Set an Address per body position and select it with Target. |
| One sender / multiple players | **player** | Assign a player number to every device. |
| N senders / N one-to-one sender-receiver pairs | **group** + override | Assign the same Group to each pair. |
| Multiple senders / mixed receivers | **group** | Use separate Group ranges per sender. |

### One person wearing several devices

Use `position` to identify body placement. Configure each device position and use Targets such as `*/pos_neck` or `*/pos_r_arm`. Do not reuse player for this purpose if you expect to add players later.

### Send separately to multiple players

Assign each device a player number such as 1, 2, or 3, then use a Target such as `player_1`. Use Address Override when the sending player changes at runtime.

### Multiple one-to-one HMD and Hapbeat pairs

For LBE-style parallel pairs, use `group` as the pair identifier. Set the same group number in the HMD override and Hapbeat Address. Every terminal can use the same build and Event Map.

### Multiple senders on one network

Devices do not distinguish the sending application. When separate applications or PCs share a network, allocate different group ranges to each sender—for example, sender A uses groups 1–10 and sender B uses 11–20.

## Address Override

Address Override **replaces player / group in an Event Map Target immediately before sending**. Each axis is independent; an off axis keeps the Target authored in the Event Map.

This changes destination per runtime terminal without copying Event Maps, which is useful when distributing one build to multiple terminals.

| Scope | Use |
| --- | --- |
| **this build** | Override fixed for the whole build. Use when making a separate build per exhibit. |
| **this device** | Override stored per runtime terminal. Use when distributing one build to multiple terminals. |

See each SDK's targeting page for its configuration location and API.

## Operational tips

- When sharing an Event Map among terminals, leave the Target player axis as `*`: it reaches all players while override is off and the selected player when it is set.
- When using Group Override, set the same Group number on Hapbeat.
- Default Address is `player_1` / `group_1`. In an exhibit, start operational numbers at 2 or higher to make missed configuration easier to spot.

## Related

- [Address format](/en/docs/concepts/group-player-addressing/)
- [Transport and scale](/en/docs/concepts/communication-model/)
