---
title: Getting Started
kind: tutorial
sidebar:
  order: 1
description: The fastest path to your first haptic output with Hapbeat. Install Helper → open Studio → configure Wi-Fi → play from the library.
---

This page walks you through **playing vibration from a wireless Hapbeat (Duo WL / Band WL) via Studio over Wi-Fi UDP**.

## Hapbeat SDK Overview

The Hapbeat SDK has two flows: the **Setup & Design flow** (Studio + Helper) and the **Game / App Runtime flow** (direct SDK connection).

![Hapbeat architecture diagram. Left side: Setup & Design flow (Studio → Helper → Hapbeat device, via PC). Right side: Game / App Runtime flow (Unity SDK / Quest / PC / smartphone → Wi-Fi UDP broadcast → Hapbeat device, direct).](@assets/architecture/hapbeat-sdk-architecture.svg)

### Setup & Design Flow (this page)

- **Hapbeat Studio** (browser + local files): A web app for designing vibration waveforms, display settings, Wi-Fi configuration, and firmware flashing.
- **hapbeat-helper** (CLI daemon): A PC daemon installed via `pipx install hapbeat-helper`. Relays communication between Studio ↔ TCP, device ↔ UDP, and handles mDNS discovery.
- **Hapbeat** (Duo WL / Band WL): ESP32 fixed runtime. Manages the Kit library, haptic output, Wi-Fi SoftAP/STA, and UDP reception.

### Game / App Runtime Flow

- SDKs such as the **Unity SDK** send haptic events from Quest / PC / smartphone to Hapbeat over Wi-Fi UDP broadcast.
- Simply bind events like `onClick` or `OnCollisionEnter` to haptics — no extra configuration needed at runtime.
- Studio and Helper are **not required** during app execution.

### What You Need

- **PC** (Windows / macOS)
- **Python 3.9 or later** (verify it is installed before proceeding)
  - If not installed, download from: https://www.python.org/downloads/
- **Chrome or Edge browser** (Web Serial / File System Access APIs required)
- **USB-C cable** (data-capable — charging-only cables will not work)
- **2.4 GHz Wi-Fi LAN** (Hapbeat supports 2.4 GHz only)
- **Hapbeat** (Duo WL / Band WL)

---

## Step 1 — Install Helper

Open Command Prompt / PowerShell (Windows) or Terminal (macOS) and run the commands below. **The working directory does not matter.**

**Windows:**
```bash
py -m pip install --user pipx && py -m pipx ensurepath
pipx install hapbeat-helper
```

**macOS:**
```bash
brew install pipx && pipx ensurepath
pipx install hapbeat-helper
```

After installation, start Helper with:

```bash
hapbeat-helper start
```

For detailed OS-specific instructions and troubleshooting, see **[](/en/docs/tools/helper/getting-started/)**.

:::tip[Auto-start (run in background)]
You can configure Helper to start automatically at login so you never need to run the command manually.
See [](/en/docs/tools/helper/getting-started/) for details.
:::

---

## Step 2 — Open Studio

Open [https://devtools.hapbeat.com/studio/](https://devtools.hapbeat.com/studio/) in your browser.

Confirm that **"Helper connected"** appears in green at the top of the page. If it does not appear, Helper is not running or port 7703 is blocked (see [](/en/docs/tools/helper/getting-started/#troubleshooting)).

:::note[Chrome / Edge only]
Safari and Firefox do not support the Web Serial or File System Access APIs, so device writing is not available. Please use Chrome or Edge.
:::

---

## Step 3 — Configure Wi-Fi and Write UI to Hapbeat

Connect Hapbeat to the same Wi-Fi network as your PC and write the display UI.

1. **Connect Hapbeat to your PC with a USB-C cable.**

2. **Open the Manage tab in Studio and follow the on-screen instructions.**
   Click [Connect via USB Serial] in Studio to establish a serial connection to Hapbeat. Follow the prompts to join Hapbeat to the same Wi-Fi network as the PC running Studio.

   <small>If there is no response after connecting via serial, flash the firmware first: [](/en/docs/tools/studio/initial-setup/)</small>

3. **Open the UI tab, select your device, and click "Write to device".**
   This writes the display UI to Hapbeat. Note: writing is not possible over a serial connection alone.

![gs-step3](@assets/getting-started/gs-step3.png)

:::note
After this step, the USB cable is generally no longer needed. All SDKs assume Hapbeat is connected to Wi-Fi; USB is only used for the initial Wi-Fi setup.
:::

---

## Step 4 — Play from the Library to Verify

Confirm that Studio can trigger vibration on Hapbeat over Wi-Fi UDP. You do not need to create or deploy a Kit at this stage.

1. **Select a working directory** (first time only)
   Click [Choose Folder] in the left panel and select any folder on your PC. This will be the location where Kits are created and saved.

2. **Select a template waveform from the library in the left panel.**
   A list of built-in sample waveforms will appear.

3. **Play it and confirm that Hapbeat vibrates.**

**If Hapbeat vibrates, setup is complete.** You can now proceed to the Unity SDK.

![gs-step4](@assets/getting-started/gs-step4.jpg)

:::note
Studio only reads from and writes to the working directory you selected here. No other files or directories are accessed (the browser's File System Access API physically prevents access to paths you have not granted permission to).
:::

:::caution[Noticeable delay between playback and vibration]
The delay between triggering a waveform and feeling the vibration should be a few milliseconds — **vibration should arrive almost simultaneously with the click**. This is the normal behavior.

If you experience a clear 0.5–several second delay, or vibration occasionally fails to arrive, **this is not normal**. This can happen in specific situations such as after the PC wakes from sleep while Helper is running. To recover:

1. Quit Helper from the system tray (or run `hapbeat-helper stop`)
2. Restart it (`hapbeat-helper start`)
3. Reload Studio in your browser
:::

---

## Next Steps — Integrate with Your App via SDK

Your Hapbeat playback environment is ready. Next, trigger vibration from your application (game / VR / installation) through an SDK.

:::tip[➡ Get started with the Unity SDK]
**[](/en/docs/sdk-integration/unity-sdk/getting-started/)**

The fastest guide to installing the SDK in a new Unity project and playing vibration from a sample scene.
:::

For Unreal SDK, Creative Kit, and other upcoming integrations, see [](/en/docs/support/coming-soon/).

## Further Reading

For a deeper understanding of the architecture:

- [](/en/docs/concepts/architecture/) — Roles of Studio / Helper / SDK / Firmware
- [](/en/docs/concepts/communication-model/) — Wi-Fi UDP broadcast and ESP-NOW
- [](/en/docs/concepts/gain-architecture/) — Responsibility split between Studio and SDK

Reference & troubleshooting:

- [](/en/docs/concepts/contracts/overview/) — Protocol details
- [](/en/docs/support/faq/)
