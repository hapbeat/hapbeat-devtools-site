---
title: Architecture Overview
description: The roles of Studio, Helper, SDK, Firmware, and Contracts in the Hapbeat SDK ecosystem — an overview of the design flow and runtime flow.
kind: explanation
sidebar:
  order: 1
---

This page explains the **design decisions and role boundaries** across the Hapbeat SDK ecosystem. Understanding "what each component does *not* do" will help you identify which tools to use for your use case.

## System Diagram

![Hapbeat system diagram. Left side shows the setup/design flow (Studio → Helper → Hapbeat device, via PC); right side shows the game/app runtime flow (Unity SDK / Quest / PC / smartphone → Wi-Fi UDP broadcast → Hapbeat device, direct connection).](@assets/architecture/hapbeat-sdk-architecture.svg)

Hapbeat has **two independent flows**:

- **Setup/design flow** — Design Kits and UI on a PC, then write them to the device (via Studio + Helper)
- **Runtime flow** — A game or app fires haptic events to Hapbeat (SDK direct, no Helper required)

**Studio and Helper are not needed at runtime.** This is the fundamental design decision behind "no cloud dependency" and "offline capable."

## Components

| Component | Type | Role | Runtime Environment |
|---|---|---|---|
| **Hapbeat device** | Hardware | ESP32 fixed runtime. Wi-Fi STA/SoftAP / UDP receive / Kit local playback / OLED display | Self-contained |
| **hapbeat-device-firmware** | Firmware | Fixed runtime flashed onto the device. Users do not need to modify it (updated via OTA) | On-device |
| **hapbeat-contracts** | Specification | Single source of truth for protocol, Kit format, and addressing conventions | docs / spec |
| **Hapbeat Studio** | Web app | GUI for Kit design, UI configuration, Wi-Fi setup, and firmware flashing | Browser (Chrome/Edge) |
| **hapbeat-helper** | CLI daemon | Background daemon on the PC. Bridges Studio ↔ device via mDNS / UDP / TCP / Web Serial | PC (Mac/Win) |
| **hapbeat-unity-sdk** | UPM package | SDK for firing haptic events from Unity | Unity Editor / Runtime |
| **hapbeat-unreal-sdk** | Plugin | SDK for Unreal (planned) | — |
| **hapbeat-creative-kit** | Tools | Creative SDK for OSC / VJ and similar use cases (planned) | — |

## Role Boundaries (What Components Don't Do)

Explicitly defining what components *don't* do keeps responsibilities focused.

- **Studio / Helper do not participate in the runtime** — Hapbeat works fine during gameplay even if Studio is closed
- **Devices receive Wi-Fi UDP directly** — Bridge is not the standard path; it is an upper-tier option (via ESP-NOW)
- **SDKs do not define their own protocol** — everything follows hapbeat-contracts
- **Users do not modify the firmware** — content is swapped via Kit deployment (firmware updates are possible via OTA)
- **No cloud service dependency** — the design does not require App IDs, API keys, or a central server

## Dependency Graph

```
hapbeat-contracts (specification origin)
  ├─ hapbeat-device-firmware
  ├─ hapbeat-helper
  ├─ hapbeat-studio
  ├─ hapbeat-unity-sdk
  ├─ hapbeat-unreal-sdk (WIP)
  └─ hapbeat-creative-kit (WIP)
```

Specification changes go into contracts first, then propagate to each implementation repo.

## SDK Developer Perspective

For the typical game developer using only the runtime flow:

```
Your game / app
   └─ Unity SDK (or Unreal / Creative Kit)
       └─ Wi-Fi UDP broadcast
           └─ Hapbeat device (pre-configured in Studio)
```

Simply connect your PC, smartphone, or Quest to the same Wi-Fi network as the pre-configured Hapbeat device, and the SDK can send haptic events. No Helper or Studio needs to be running.

## See Also

- [Communication Model: Wi-Fi UDP / ESP-NOW](/en/docs/concepts/communication-model/) — Why UDP broadcast is the primary path
- [Event ID and Kit](/en/docs/concepts/event-id-and-kit/) — The unit of haptic assets
- [Gain Architecture](/en/docs/concepts/gain-architecture/) — Separation of responsibilities between Studio and SDK
