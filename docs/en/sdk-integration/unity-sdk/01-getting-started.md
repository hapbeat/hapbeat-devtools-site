---
title: Getting Started
kind: tutorial
description: The fastest path from a blank Unity project to Hapbeat vibration output — install the SDK and run BasicExample.
sidebar:
  order: 1
---

This guide takes you from a **new Unity project** through SDK installation and the Basic Example sample until you feel your first vibration from a Hapbeat device.

For adding the SDK to an existing project, see [](/en/docs/sdk-integration/unity-sdk/integration/).

## Prerequisites

- **Hapbeat** is connected to the same Wi-Fi LAN as the PC running Unity.

## 0. Install Unity Editor

> Skip this step if a supported version of the Editor is already installed.

**Supported versions**: Unity 2022.3 LTS or later (verified: **Unity 6.3 LTS 6000.3.15f1**)

Install a supported version from [Unity Hub](https://unity.com/download).

### Create a new project

Unity Hub → **New project** → any template (e.g. `3D (Core)`).
The SDK is render-pipeline-agnostic, so URP, HDRP, and Built-in all work.

### Install git

UPM requires **git** to fetch packages via Git URL.
Install it from [git-scm.com](https://git-scm.com/) and confirm it is on your PATH (`git --version` should work in a terminal).

## 1. Install the SDK and import samples

1. Unity Editor: `Window → Package Manager`
2. Click **`+`** in the top-left → **`Install package from git URL...`**
3. Paste the following URL and click **Install**:

```
https://github.com/Hapbeat/hapbeat-unity-sdk.git
```

4. Once import is complete, with **Hapbeat SDK** still selected in Package Manager, open the **Samples** tab in the right panel and **Import** the following:

| Sample | Recommended | Contents |
|---|---|---|
| **Basic Example** | **Required** | Minimal sample used in this tutorial (keyboard-driven event firing) |
| **Showcase** | **Strongly recommended** (optional) | An implementation catalog covering haptic wiring patterns across 5 zones in a single scene. Highly useful as a reference when integrating — import it alongside Basic Example |

The full sample set (Scene / EventMap / Kit) is placed under `Assets/HapbeatSDK/SDK_Samples/` and is **ready to Play immediately**. After import, the **`Hapbeat`** menu appears in the menu bar.

For version pinning, updates, and troubleshooting, see [](/en/docs/sdk-integration/unity-sdk/installation/).

## 2. Play and confirm vibration (Stream)

Open `Assets/HapbeatSDK/SDK_Samples/BasicExample/Scenes/BasicExample.unity` and press **Play** (the scene, EventMap, and Kit are all included in the sample — no extra setup required).

An on-screen key guide is displayed:

| Key | Action |
|---|---|
| Space | CLIP (Stream) one-shot — 100 Hz sine wave, 1 second |
| R | CLIP (Stream) loop — 100 Hz sine wave, looping |
| **F** | FIRE (Command) — 200 Hz sine wave (**Kit required**, see below) |
| S | Stop all |
| C | Ping |

If **Space** causes the device to vibrate, the SDK ↔ device communication is established.

> If the UI shows `Pong: RTT=...ms`, communication is working. If not, check that the device is online.

Stream mode (Space / R) sends PCM data to the device in real time — no Kit needs to be installed on the device side.

**F key produces no response** — this is expected. Command mode does not work until a Kit is installed on the device. The next step covers this.

## 3. Inspect the EventMap

Open the menu bar → **`Hapbeat → Open Event Map`**.

EventMap is the window that manages the list of haptic events the SDK fires and their settings. BasicExample has 3 entries registered:

| Event ID | Mode | Trigger key |
|---|---|---|
| basic-exam-kit.sine_100hz_1s | StreamClip | Space |
| basic-exam-kit.sine_100hz_1s_loop | StreamClip | R |
| basic-exam-kit.sine_200hz_1s | Fire (Command) | F |

Press the **▶ button (Test Play)** at the right end of each entry to fire directly to the device from the Editor without entering Play mode.

:::tip
Try the following with the **`[0] demo_stream_sine_100hz`** entry. After changing a setting, press ▶ Test Play to confirm.

**Adjust gain**
Lowering the gain reduces vibration intensity. The default `1.0` is fairly strong; starting around `0.3` is recommended.

**Narrow the target with player / group**
Setting player / group to **1–99** causes only devices whose OLED display shows the matching number to vibrate. **−1** (default) is a wildcard and vibrates all devices regardless of their number.
:::

EventMap details: [](/en/docs/sdk-integration/unity-sdk/event-map/)

## 4. Deploy a Kit from Studio to enable FIRE

To use Command mode (F key), install `basic-exam-kit` on the device. Deploying from Studio requires **hapbeat-helper** (see [](/en/docs/tools/studio/initial-setup/)).

1. Open **Hapbeat Studio** (`https://studio.hapbeat.com/`)
2. **Kit tab (right side)** → select a folder ("Open Folder") and point it at `Assets/HapbeatSDK/SDK_Samples/BasicExample/Kit/` in your Unity project
3. Select `basic-exam-kit` from the list
4. Confirm a device is selected (top-right of the page) → click **Deploy**

After deployment is complete, go back to Unity Play mode and press **F** — the device vibrates (200 Hz sine wave).

:::tip
You have now experienced both **Clip (Stream)** and **Fire (Command)** modes.

**Clip** requires no device deployment and is quick to iterate on, but it streams audio data wirelessly in real time, which can be less stable depending on your environment and may introduce a slight delay when stopping. It is the only option for playing back long audio waveforms.

**Fire** requires deployment but the device simply plays audio stored locally — it only receives a short command over the network. Lower latency and more stable, making it the recommended mode for production use with sound effects where immediacy matters.

For guidance on choosing between them, see [](/en/docs/sdk-integration/unity-sdk/fire-vs-clip/).

Also note that the Hapbeat SDK uses a **multiplicative gain structure**. The reference gain recorded in the manifest when designing a Kit in Studio represents the vibration intensity at 1.0×, and the gain values in the SDK and EventMap act as multipliers on top of it. The Kit design workflow and gain model are explained in [](/en/docs/tools/studio/kit-design/).
:::

## Next steps

- [](/en/docs/sdk-integration/unity-sdk/integration/) — How to add the SDK to your own scene, plus the Showcase sample walkthrough
- [](/en/docs/sdk-integration/unity-sdk/triggers/) — Collision / Sequence / UnityEvent / TickEmitter / StateBehaviour
- [](/en/docs/sdk-integration/unity-sdk/event-map/) — Manage Event ID ↔ waveform mappings in a GUI
- [](/en/docs/sdk-integration/unity-sdk/parameter-binding/) — Dynamically map game state to gain / pan
