---
kind: reference
sidebar:
  order: 300
  label: Editor menus
---

# Editor menus

Reference for the settings, asset creation, and diagnostics menus that the Hapbeat SDK adds to Unreal Editor.

## Tools

The **Hapbeat** section in the top-level `Tools` menu.

| Item | Purpose | Saved to / scope |
| --- | --- | --- |
| `Hapbeat Event Map` | List and edit Event Map entries. Import clips, test-play, and add or remove entries here. | The selected `UHapbeatEventMap` asset |
| `Hapbeat Settings` | Open `Plugins → Hapbeat` in Project Settings directly. | Whole project (`DefaultGame.ini`) |
| `Hapbeat Runtime Status` | Inspect and save this machine's Address Override. Also shows the effective value during PIE. | This machine (`GameUserSettings.ini`) |
| `Check for SDK Updates` | Check for an SDK update immediately. | Not saved |
| `Check for SDK Updates on Startup` | Toggle the update check made when the Editor starts. | Editor settings for this project |
| `Turn Off Verbose Log on All Triggers` | Turn off `Verbose Log` on every open-level Hapbeat Trigger. | Level asset |
| `Export Event Map to Markdown` | Select an Event Map after invoking it and export its entries as a Markdown table next to the asset. No Content Browser preselection is needed. | `<EventMapName>.md` |

### Hapbeat Settings

`Hapbeat Settings` opens the same screen as `Plugins → Hapbeat` in Project Settings.

| Category | Setting | Description |
| --- | --- | --- |
| Connection | `Port` | UDP port used to communicate with Hapbeat. Default: `7700`. |
| Connection | `App Name` | App name shown on Hapbeat's OLED. Up to 16 characters. Uses the project name when empty. |
| Behavior | `Ping Interval` | Interval, in seconds, for PING / CONNECT_STATUS. |
| Behavior | `Stream Send Ahead Seconds` | How far ahead to send streamed data. A smaller value stops sooner, but may drop out more easily on an unstable network. |
| Behavior | `Command Unicast` | Uses unicast for devices that have replied with PONG, and falls back to broadcast when no target is discovered. |
| Behavior | `Haptic Delay Seconds` | Haptic delay added to Event Map playback. Default: 0 seconds; range: 0–0.5 seconds. Does not apply to direct Play / StreamClip APIs. |
| Addressing | `Forced Override Player` / `Group` | Player / group fixed into the build. `-1` leaves that axis unfixed. |
| Logging | `Enable Logging` / `Verbose Logging` | Configure Output Log verbosity. |

Use `Haptic Delay Seconds` to compensate when haptics are out of sync with video or sound. See [Targeting](./targeting-and-multi-hmd.md) for Target and Address Override.

### Hapbeat Runtime Status

`Hapbeat Runtime Status` is the screen dedicated to per-machine Address Override.

| Item | Description |
| --- | --- |
| `Player` / `Group` | Override values to save and apply. `-1` does not override that axis. |
| `Save to This Machine` | Outside PIE, saves for the next launch. During PIE, applies immediately to the running Subsystem and saves for the next launch. |
| `Clear Saved Override` | Removes saved settings and turns off axes that are not fixed in the build. |
| Runtime status | Shows socket state and effective player / group during PIE. |
| `Open Project Settings` | Opens project-wide connection, delay, and build-fixed override settings. |

Defaults: empty `App Name`; `Ping Interval` 5 seconds (1–60); `Stream Send Ahead Seconds` 0.05 seconds (0.01–0.2); `Command Unicast` and `Enable Logging` on; `Verbose Logging` off; both `Forced Override` values −1 (off; valid range 1–99). Port range: 1–65535. Stop and restart PIE after changing connection settings.

## Content Browser

Right-click in the Content Browser and choose `Create → Hapbeat` to create these assets.

| Asset | Class | Purpose |
| --- | --- | --- |
| `Hapbeat Event Map` | `UHapbeatEventMap` | Stores Event ID, Stream Clip, Gain, Pan, Target, and Loop per entry. |
| `Hapbeat Clip` | `UHapbeatClip` | PCM16 clip for streaming. Usually created with `Import WAV...` in the Event Map window and assigned to an entry. |

Double-clicking `Hapbeat Event Map` opens its dedicated Event Map window.

## Add Component

Search for `Hapbeat` in an Actor's `Add Component` menu to add SDK components.

| Component | Purpose |
| --- | --- |
| `Hapbeat Trigger Component` | Basic component that fires or stops an Event Map entry at any time. |
| `Hapbeat Collision Trigger Component` | Fires from Hit or Begin Overlap. |
| `Hapbeat Sequence Component` | Handles three-stage haptics: start / loop / stop. |
| `Hapbeat Tick Emitter` | Fires a tick for each continuous-value threshold crossing. |
| `Hapbeat Parameter Binding` | Applies an Actor, UI, or external value to Stream Gain or Pan. |

See [Blueprint nodes](./blueprint-nodes.md) and [C++ API](./cpp-api.md) for component properties, Blueprint nodes, and C++ functions.
