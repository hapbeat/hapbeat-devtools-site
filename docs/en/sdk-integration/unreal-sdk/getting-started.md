---
kind: tutorial
sidebar:
  order: 1
  label: Getting Started
---

# Getting Started

This page enables the plugin and plays Hapbeat once from the included `BasicExample`. Creating Event Maps, implementing Blueprint / C++, and targeting multiple devices are covered separately.

:::tip[Tip: delegate the initial setup to an AI]

An AI that can work with files and run an Unreal build can be given the following request. Replace `<ProjectRoot>` with the absolute path to the target project.

```text
Add Hapbeat Unreal SDK to the Unreal Engine 5.4 C++ project at <ProjectRoot>.
Clone https://github.com/hapbeat/hapbeat-unreal-sdk.git into <ProjectRoot>/Plugins/HapbeatSDK, regenerate project files, and build the Editor target.
Enable Hapbeat SDK and open the BasicExample map under Plugin Content.
Do not start PIE, Test Play, or send haptics to a physical device.
```

:::

## 1. Add the plugin to the project

1. Put the **contents** of this repository in `Plugins/HapbeatSDK/` in a C++ project by either method:
   - Git: `git clone https://github.com/hapbeat/hapbeat-unreal-sdk.git <ProjectRoot>/Plugins/HapbeatSDK`
   - ZIP: download and extract the GitHub ZIP, then copy the contents of the extracted folder into `<ProjectRoot>/Plugins/HapbeatSDK/`.
2. Confirm that `Plugins/HapbeatSDK/HapbeatSDK.uplugin` exists. Do not leave the ZIP's parent folder in the path, such as `Plugins/HapbeatSDK/hapbeat-unreal-sdk-main/HapbeatSDK.uplugin`.
3. Regenerate project files and build the project's **Development Editor / Win64** target. See [Build the project](./unreal-build.md).

## 2. Enable the plugin

1. In Unreal Editor, enable `Hapbeat SDK` under **Edit → Plugins**.
2. Open **Tools → Hapbeat → Hapbeat Settings**. Under **Project Settings → Plugins → Hapbeat**, set `Connection > Port` to the UDP port used by Hapbeat on the same network. The default is `7700`.

:::note[Audio and haptics timing]

Audio-output latency differs by environment, so haptics can be felt before the corresponding sound. Add a small amount of `Haptic Delay Seconds` to align their timing.

:::

## 3. Play BasicExample

1. In the Content Browser, enable **Show Plugin Content** from Settings.
2. Open `Plugins/HapbeatSDK/Content/HapbeatSamples/BasicExample/Maps/BasicExample`.
3. Start PIE and press `Space`.

When the 100 Hz StreamClip plays, installation and network delivery are working. This path does not require a Kit deployment to the device.

### Try Fire (Command)

1. In Hapbeat Studio, open the Kit at `Plugins/HapbeatSDK/Content/HapbeatSamples/BasicExample/Kit/basic-exam-kit/`.
2. Select the connected Hapbeat and use **Deploy** to deploy `basic-exam-kit`. This installs `install-clips/sine_200hz_1s.wav` from the Kit on the device.
3. Return to BasicExample in PIE and press `F`.

`F` plays `basic-exam-kit.sine_200hz_1s` as a Fire (Command). Confirm Stream playback with `Space` first, then verify the installed clip included in the Kit.

If it does not respond, check Hapbeat power, the network, the UDP port, and whether the OS firewall allows Unreal Editor UDP traffic. Look for PONG messages and errors under `LogHapbeat` in the **Output Log**.

## Included samples

| Level | What it demonstrates |
| --- | --- |
| [BasicExample](./basic-example.md) | Minimal Stream / Fire (Command) playback |
| [Showcase](./showcase-unreal.md) | Z1–Z5 examples that connect in-game events to haptic playback |
| [VR Config Example](./vr-config-example.md) | Address Override configuration and test playback with VR controllers |

## Read next

- [Event Maps and playback](./event-map-and-playback.md) — create Event Maps and play them from Blueprint / C++
- [C++ API](./cpp-api.md) — call Event Map playback and direct delivery from C++
- [Blueprint nodes](./blueprint-nodes.md) — reference for all Blueprint nodes and components
- [Showcase](./showcase-unreal.md) — Z1–Z5 examples that connect in-game events to haptic playback
- [Targeting](./targeting-and-multi-hmd.md) — Target and Address Override
