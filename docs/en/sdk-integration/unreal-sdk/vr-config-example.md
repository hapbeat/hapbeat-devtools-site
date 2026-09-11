---
kind: howto
sidebar:
  order: 5
  label: VR Config Example
---

# VR Config Example (sample level)

`VRConfigExample` is included with the plugin. It configures Address Override in VR and sends a 100 Hz test waveform to the selected Hapbeat.

## Open the level

1. Enable `OpenXR` and `Python Editor Script Plugin` under **Edit → Plugins**, then restart the Editor.
2. Run `Plugins/HapbeatSDK/Scripts/generate_vr_config_input_assets.py` through **Tools → Execute Python Script**, then restart the Editor after it completes. This first-run step adds the input assets and `DefaultInput.ini` to the project.
3. In the Content Browser, enable **Show Plugin Content** from Settings, then open `Plugins/HapbeatSDK/Content/HapbeatSamples/VRConfigExample/Maps/VRConfigExample`.
4. Connect the HMD to the PC through Quest Link / Air Link, then choose **VR Preview** from the Play menu.

When VR Preview starts, a roughly 1 m wide configuration panel appears about 1.9 m in front of the HMD.

:::note[Running on a standalone Quest]

Along with Android build settings, include `VRConfigExample` and the selected `Return Level` under Packaging's **Maps to Include**. Keep the generated `Content/HapbeatVRConfig/Input` and `Config/DefaultInput.ini` in the project. Connect the HMD and Hapbeat to the same network. A successful VR Preview does not verify an Android package.

:::

## Controls

The panel starts with a yellow selection cursor. It does not use the controller's position or a ray.

| Control | Result |
| --- | --- |
| Either controller's stick | Move the selection cursor in the tilted direction. Holding it repeats movement at a fixed interval. |
| Either controller's trigger | Confirm the current selection. |
| `Player` / `Group` | Select destination player / group. |
| `Apply` | Apply the selected values as Address Override. |
| `Play` | Play a 100 Hz StreamClip to the applied Target. No Kit installation is required. |
| `Exit` | If the Actor specifies `Return Level`, open that level. Otherwise, close the panel; press `P` to show it again. |
| Either controller's stick press | Return the panel to the front of the viewer. |

When installing the same build on multiple HMDs, choose a different `Player` or `Group` on each HMD and press `Apply`. See [Targeting](./targeting-and-multi-hmd.md) for Address Override behavior.

To play 100 Hz, select `Play` with a stick and pull either trigger. A trigger confirms the currently selected button, so it operates a different button when that is selected.
