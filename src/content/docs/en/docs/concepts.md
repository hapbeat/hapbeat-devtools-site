---
title: Architecture & key concepts
description: 4-layer model (fixed runtime + Kit + SDK), communication paths, Event ID, Group ID, and connection scenarios.
---

:::caution
This page is a placeholder. Full English content is being prepared.
:::

## 4-layer model

Hapbeat is built on a 3-way separation of "fixed runtime + Kit + SDK," with an optional Bridge layer for the control plane, forming a 4-layer architecture.

- **Layer 0: Common spec (hapbeat-contracts)** — the source of truth for all repos
- **Layer 1: Fixed runtime (hapbeat-device-firmware)** — the ESP32-S3 inside each device
- **Layer 2: Kit (content distribution) (hapbeat-kit-tools)** — packages haptic assets per Kit
- **Layer 3: Bridge (hapbeat-bridge, hapbeat-transmitter-firmware)** — control plane for the ESP-NOW path (optional)
- **Layer 4: Tools & SDKs (Studio / Manager / Unity SDK / Unreal SDK / Creative Kit)** — user-facing surfaces

## Communication paths

- **Standard**: SDK → Wi-Fi UDP broadcast → Hapbeat (no Bridge required; device filters by Group ID)
- **Advanced option**: SDK → Desktop Bridge → Transmitter → ESP-NOW → Hapbeat (for tens of devices, or Wi-Fi-unfriendly environments)

## Event ID

A lightweight string ID identifying haptic content. The SDK sends Event IDs; the Hapbeat device resolves them to clips from the installed Kit.

Details: [Contracts overview](/en/docs/contracts/overview/)

## Group ID

Used to logically separate devices when multiple players or exhibition booths share the same space, preventing crosstalk.

## Connection scenarios

- **A: Hapbeat SoftAP** (no router)
- **B: Single-player LAN**
- **C: Multi-player LAN** (per-player Group ID)
- **D: Mobile hotspot**
- **E: Exhibition booth isolation** (per-booth independent AP)

## Next steps

- [Contracts overview](/en/docs/contracts/overview/) — entry point to message format, addressing, display-layout, and other references
- [Device Firmware](/en/docs/firmware/wifi-setup/)
