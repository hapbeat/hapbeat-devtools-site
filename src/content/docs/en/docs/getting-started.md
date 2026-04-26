---
title: Getting Started
description: 5-minute guide for first-time Hapbeat users — install Manager, flash firmware, create your first Kit, and verify it works.
---

:::caution
This page is a placeholder. Full English content is being prepared.
:::

This guide walks you through getting Hapbeat producing its first vibration.

1. Install Hapbeat Manager
2. Flash firmware to the device
3. Create your first Kit in Hapbeat Studio
4. Transfer the Kit to the device
5. Trigger an Event from the Unity sample or Studio's test playback

## Prerequisites

- Windows 10 / 11 (Windows-only at the moment)
- USB Type-C cable (with data lines)
- 2.4 GHz Wi-Fi (Hapbeat is 2.4 GHz only)

## Steps

### 1. Install Hapbeat Manager

Download the latest installer from the [Downloads page](/en/downloads/) or [GitHub Releases](https://github.com/Hapbeat/hapbeat-manager/releases/latest).

### 2. Flash firmware

Open the **Firmware** tab in Manager, select the device, and click flash.

Details: [Device Firmware](/en/docs/firmware/wifi-setup/)

### 3. Create your first Kit in Studio

Open [Hapbeat Studio](/studio/), load a sample waveform, and export it as a Kit.

Details: [Hapbeat Studio guide](/en/docs/studio/getting-started/)

### 4. Transfer the Kit

Click the Deploy button in Studio. It routes through Manager via WebSocket and transfers to the device.

### 5. Try it out

Use Studio's test playback or the [Unity SDK](/en/docs/unity-sdk/installation/) sample scenes to fire an Event and feel the vibration.

## Next steps

- [Architecture & concepts](/en/docs/concepts/)
- [Contracts overview (Event ID / Kit / Protocol)](/en/docs/contracts/overview/)
