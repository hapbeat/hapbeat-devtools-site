---
title: Install the XRI Hand Demo APK
kind: howto
description: "How to install and run the prebuilt APK of the XRI Hands Interaction Demo with Hapbeat haptics on Quest 3 / 3S — three routes: adb for Unity users, SideQuest, and a release channel that needs no developer account."
sidebar:
  order: 200
---

We distribute a **prebuilt APK** of the XR Interaction Toolkit (XRI) **Hands Interaction Demo** with Hapbeat haptics added. Grabbing, poking, snapping into sockets and scrubbing all return haptics — without opening Unity.

:::caution[A Hapbeat device is required]
You cannot experience this demo without Hapbeat hardware. Connect the device to the **same Wi-Fi network** as the headset.
:::

If you want to build or modify it yourself as a Unity project, see [](/en/docs/sdk-integration/unity-sdk/xri-handdemo-quickstart/).

## Download

The APK is distributed via GitHub Releases.

<!-- TODO: replace this placeholder with the real GitHub Releases URL (and a download link) once the distribution repo is published -->

:::note[The distribution repository is not published yet]
Once it is, the APK will be available at:

```
https://github.com/hapbeat/<distribution-repo>/releases/latest
```

The file is named `hapbeat-handdemo.apk`.
:::

## What you need

- **Meta Quest 3 / 3S**
- **A Hapbeat device** (on the same Wi-Fi network as the headset)
- Additional requirements depending on the install route (A / B / C below)

## Installation

Pick the route that matches your situation.

### A. You have used Build and Run in Unity (fastest)

If Build and Run already works for you, **developer mode is already enabled**. You don't need SideQuest either — the `adb` bundled with Unity is enough.

Connect the headset to your PC over USB-C, then run:

```bash
adb install -r hapbeat-handdemo.apk
```

`adb` ships with Unity's Android Build Support (Android SDK). Example path: `<Unity install dir>/Editor/Data/PlaybackEngines/AndroidPlayer/SDK/platform-tools/adb.exe`

### B. You use VR but not Unity (SideQuest)

:::caution[A Meta developer account is required]
Enabling developer mode requires **Meta developer registration** (joining a developer organization plus identity verification). This is the first hurdle.
:::

**Enable developer mode**

1. Open the **Meta Horizon** app on your phone
2. Tap the headset icon and select your paired headset
3. Turn on **Headset Settings → Developer Mode**
4. Connect the headset to your PC over USB-C
5. Put the headset on and enable **MTP Notification** under Quick Control → Settings → Developer
6. When asked "Allow USB debugging?", choose **Always allow from this computer**

**Install with SideQuest**

1. Install **SideQuest (Advanced Installer)** on your PC
2. Connect the headset over USB and wait for the SideQuest connection indicator to turn **green**
3. **Drag and drop** the APK onto the SideQuest window (or use *Install APK file from folder*)

**Launch it**

In the headset library, switch the source filter to **Unknown Sources** to find the app.

### C. You would rather not register as a developer (release channel)

We upload the build to the **ALPHA channel** of the Meta Horizon Store and **invite you by email or URL**.

- All you need is a **Meta account** — no developer registration, no developer mode
- Once invited, the app appears under **My Preview Apps** and in your library, ready to install
- **ALPHA / BETA channels require no store review** (only Production is reviewed)
- Each channel holds 200 users by default (up to 2,500 on request)

If you want this route, reach out via GitHub Discussions ([](/en/docs/support/contact/)) and we will send you an invite.

## Using it (after launch)

The Hapbeat **player / group can be changed from the in-app settings panel** — no Unity required. For what player / group mean, see [](/en/docs/concepts/group-player-addressing/).

If you get no haptics, check the connectivity entries in [](/en/docs/support/faq/) and [](/en/docs/hardware/troubleshooting/).

## License notice

This demo includes sample assets from Unity's **XR Interaction Toolkit**.

- XR Interaction Toolkit copyright © Unity Technologies
- License: [Unity Companion License](http://www.unity3d.com/legal/licenses/Unity_Companion_License)
