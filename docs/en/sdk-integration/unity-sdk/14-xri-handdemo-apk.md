---
title: Install the XRI Hand Demo APK
kind: howto
description: "How to install and run the prebuilt APK of the XRI Hands Interaction Demo with Hapbeat haptics on Quest 3 / 3S — three routes: release channel, CLI, and SideQuest."
sidebar:
  order: 200
  label: Try the XRI demo APK
---

A **prebuilt APK** of the XR Interaction Toolkit **Hands Interaction Demo** with Hapbeat haptics added is available. You can try it without opening Unity.

:::caution[A Hapbeat device is required]
Nothing happens in this demo without a Hapbeat. Connect the device to the **same Wi-Fi** as the Quest.
:::

To reproduce or modify it in your own Unity project, see [](/en/docs/sdk-integration/unity-sdk/xri-handdemo-quickstart/).

## What you need

- **Meta Quest 3 / 3S**
- **A Hapbeat device** — on the same Wi-Fi as the Quest

## Which route to pick

| | Route | Requires | Getting the APK |
|---|---|---|---|
| **A** | Release channel | A Meta account | Not needed |
| **B** | CLI (adb) | PC, USB cable, developer mode | Needed |
| **C** | App (SideQuest) | Same as B + SideQuest | Needed |

If you are not a registered developer, **A** is the easiest. It installs from the store like any other app.

## A. Release channel

You are invited to the **ALPHA channel** on the Meta Horizon Store. No APK download and no USB connection — all you need is a Meta account. Neither developer registration nor developer mode is required.

Invitations are sent individually, so get in touch via [](/en/docs/support/contact/).

1. **Receive the invitation and accept it**
   - Accepting is done entirely in a browser

2. **Install it from the headset library**
   - Apps on invite-only channels **do not appear in store search**. They show up in your library

## Downloading the APK (for B / C)

<a href="https://github.com/hapbeat/hapbeat-demos/releases/latest" download>hapbeat-handdemo_all.apk</a>

Run the commands below **in the directory where you put this APK**.

## B. CLI (adb)

1. **Enable developer mode**
   - For the procedure, see [Meta official: Set up development environment](https://developers.meta.com/horizon/documentation/native/android/mobile-device-setup/)
   - If Build and Run already works in Unity it is already enabled, so you can skip this

2. **Connect the Quest to your PC over USB-C and allow USB debugging inside the headset**
   - The dialog only appears inside the headset. Put it on and choose **Always allow from this computer**

3. **Run this in the directory where you put the APK**

   ```bash
   adb install -r hapbeat-handdemo_all.apk
   ```

   - `adb` ships with the [Android SDK Platform Tools](https://developer.android.com/tools/releases/platform-tools). If you have Unity's Android Build Support installed, it is also at `<Unity install dir>/Editor/Data/PlaybackEngines/AndroidPlayer/SDK/platform-tools/`
   - For command details, see the [official adb documentation](https://developer.android.com/tools/adb)
   - If you get `INSTALL_FAILED_UPDATE_INCOMPATIBLE` (signature mismatch), run `adb uninstall com.Hapbeat.HapticHandDemo` first

4. **Launch it from Unknown Sources in the library**
   - It does not appear under the default filter. You have to switch it

## C. App (SideQuest)

1. **Enable developer mode**
   - For the procedure, see [Meta official: Set up development environment](https://developers.meta.com/horizon/documentation/native/android/mobile-device-setup/)

2. **Install SideQuest on your PC**
   - [SideQuest official: Get SideQuest](https://sidequestvr.com/setup-howto) (Advanced Installer edition)

3. **Connect the Quest over USB and confirm the SideQuest connection indicator turns green**

4. **Drag and drop the APK onto the SideQuest window**

5. **Launch it from Unknown Sources in the library**

## When it doesn't work

- Check that the Hapbeat and the Quest are on the **same Wi-Fi** (same subnet)
- This build does not pin an address, so **every Hapbeat on the same network fires**. There is no setting to narrow it down to a single unit
- If that does not resolve it, see the connectivity entries in [](/en/docs/support/faq/) and [](/en/docs/hardware/troubleshooting/)

## License notice

This demo includes sample assets from Unity's **XR Interaction Toolkit**.

- XR Interaction Toolkit copyright © Unity Technologies
- License: [Unity Companion License](http://www.unity3d.com/legal/licenses/Unity_Companion_License)
