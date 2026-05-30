---
title: Communication Model
description: Hapbeat's standard communication path (Wi-Fi UDP broadcast) and the upper-tier option (ESP-NOW) — when to use each and the design rationale.
kind: explanation
sidebar:
  order: 2
---

Hapbeat haptic events reach the device over the network. This page explains the design decisions behind the **standard path (Wi-Fi UDP broadcast)** and the **upper-tier option (ESP-NOW)**.

## Standard: Wi-Fi UDP Broadcast

```
SDK / app
  ↓ UDP broadcast (same subnet)
Hapbeat devices (each self-filters by group / player in the received target)
```

The SDK sends haptic events via **UDP broadcast** to all devices on the same subnet. Each device inspects the **target (group / player)** in the received packet and decides whether to play or ignore it.

### Why Broadcast?

| Design decision | Reason |
|---|---|
| **No device IP management** | No need to update address assignments when DHCP reassigns IPs |
| **Same send code for one or many devices** | No unicast vs. broadcast switching required |
| **Identical behavior on PC / Quest / smartphone** | Only a standard UDP socket API is needed on each platform |
| **No Bridge or relay server** | Haptic output works as soon as the app launches |

### Why No ACK?

UDP has no acknowledgement or retransmission. This is an intentional choice:

> **For haptics, a missed packet is better than a late one.**

In a game, a sound effect that drops for one frame is far less disruptive than one that arrives 200 ms late due to network delay. Adding ACK/retransmit would increase latency variance, so Hapbeat uses no-ACK for consistent, fixed latency.

### Constraints

- **Same subnet required** — broadcasts do not cross routers
- **2.4 GHz Wi-Fi only** (ESP32 limitation)
- **VR HMDs have no AP capability**, so in router-less environments **Hapbeat itself acts as a SoftAP** (see below)

## Connection Scenarios

| Scenario | Configuration | Use case |
|---|---|---|
| **A. Single-player LAN** (recommended) | Standard router, no Group specified | Home / office |
| **B. Multi-player LAN** | Router, unique group/player ID per player | Multiple players on the same LAN |
| **C. Mobile hotspot** | Smartphone / PC tethering (force 2.4 GHz) | On the go / travel |
| **D. Hapbeat SoftAP** | One Hapbeat acts as AP; HMD + other Hapbeats connect as STA | Router-less environments (Quest, etc.) |
| **E. Isolated booth** | Independent AP per booth, equivalent to B | Events / exhibitions |

Details: [](/en/docs/tools/studio/initial-setup/) / [](/en/docs/hardware/overview/#softap-mode)

## Upper-Tier Option: ESP-NOW Path

For scales that UDP broadcast cannot handle (dozens of simultaneous devices) or environments without Wi-Fi, an **ESP-NOW** routing option is available.

```
SDK / app
  ↓ UDP / OSC
hapbeat-bridge (PC / host)
  ↓ serial
hapbeat-transmitter-firmware (ESP32 transmitter)
  ↓ ESP-NOW (2.4 GHz radio, no AP required)
Hapbeat devices (multiple, simultaneously)
```

- The **Transmitter** broadcasts via ESP-NOW to multiple Hapbeat devices
- The **Bridge** handles the host-side control plane (UDP/OSC receive, device registry, time sync)
- No router or AP needed — uses only the raw ESP-NOW radio band

For typical use cases Wi-Fi UDP is sufficient, so the ESP-NOW path is used only for large-scale performances, Wi-Fi-free environments, or when a dedicated Hapbeat network is required.

## Why Not Use Bluetooth as the Primary Path?

Previous v1 hardware used Bluetooth, but it was replaced with Wi-Fi UDP for the following reasons:

- **Pairing management is cumbersome** — experience degrades across multiple devices and platforms
- **Poor at broadcasting** — BLE Advertising is inferior to UDP in bandwidth and packet rate
- **Fragmented APIs across PC / Quest / smartphone** — BLE implementation varies too much per OS
- **Limited concurrent connections** — Central-side link count ceiling

The current BT firmware (`hapbeat-bt-firmware`) is maintained for v1 compatibility, but new users are expected to use the Wi-Fi models (Duo WL / Band WL).

## Key to Low Latency: targetTime

Hapbeat supports a **targetTime (future fire timestamp)** to absorb latency. Instead of "fire now," the SDK sends "fire in 100 ms," and the device uses its time-synchronized clock to play back at exactly that moment.

This keeps fire timing stable even in the presence of network jitter. See [](/en/docs/concepts/contracts/overview/) for details.

## See Also

- [Architecture Overview](/en/docs/concepts/architecture/)
- [Address System](/en/docs/concepts/group-player-addressing/) (planned)
- [](/en/docs/tools/studio/initial-setup/)
