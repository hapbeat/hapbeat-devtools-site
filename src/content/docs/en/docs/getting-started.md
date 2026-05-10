---
title: Getting Started
description: Shortest path from unboxing to your first vibration — install Helper, open Studio, configure Wi-Fi, and play a waveform.
sidebar:
  order: 1
---

:::caution
Full English translation is in progress. Please refer to the [Japanese version](/docs/getting-started/) for the complete guide.
:::

This guide walks you through getting Hapbeat producing its first vibration.

## What you need

- **PC** (Windows or macOS)
- **Python 3.9+**
- **Chrome or Edge browser** (Web Serial / File System Access required)
- **USB-C cable** (data-capable — charging-only cables won't work)
- **2.4 GHz Wi-Fi** (Hapbeat is 2.4 GHz only)
- **Hapbeat device** (Necklace / Band)

## Step 1 — Install Helper

**macOS:**
```bash
brew install pipx && pipx ensurepath
pipx install hapbeat-helper
```

**Windows:**
```bash
py -m pip install --user pipx && py -m pipx ensurepath
pipx install hapbeat-helper
```

Then start it:

```bash
hapbeat-helper start
```

## Step 2 — Open Studio

Open [https://devtools.hapbeat.com/studio/](https://devtools.hapbeat.com/studio/) in your browser.

Confirm that **"Helper connected"** appears in green at the top of the page.

## Step 3 — Configure Wi-Fi and flash UI

1. Connect the Hapbeat device to your PC via USB-C.
2. Open the **Devices** tab in Studio and follow the on-screen onboarding wizard.
3. Open the **UI** tab, select the device, and click **Write to device**.

## Step 4 — Play a waveform

1. Select a working directory (first time only).
2. Choose a template waveform from the left panel library.
3. Press play and feel the vibration.

## Next steps

- **[Unity SDK Getting Started](/en/docs/unity-sdk/getting-started/)**
- [Architecture & concepts](/en/docs/concepts/)
- [FAQ](/en/faq/)
