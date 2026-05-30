---
title: Editor Menu Reference
kind: reference
sidebar:
  order: 300
description: Reference for Hapbeat menu items in the Unity Editor — covering Window tools, scene operations, sample generation, and diagnostics.
---

The Hapbeat SDK consolidates all operations under the top-level Unity Editor menu **`Hapbeat`**. It uses a flat structure separated by dividers based on purpose, with SDK developer items isolated in a `Developer/` submenu at the bottom (hidden in end-user installs).

```
Hapbeat/
  Open Event Map                           ← Window (main screen for Event ID + Wiring management)
  Open Batch Setup                         ← Window (bulk Trigger setup for multiple GameObjects)
  Open Settings                            ← Window (connection settings / Group / Bridge UI)
  ─────────────────────────────
  Create Event Router                      ← Place [Hapbeat Event Router] in the scene
  Create Event Map                         ← Create a standalone EventMap .asset
  ─────────────────────────────
  Initial Scene Setup                      ← Create Router + EventMap in one command (for new scenes)
  Create HapbeatSDK Folder                 ← Generate the standard Assets/HapbeatSDK/ layout
  ─────────────────────────────
  Export Event Map (Selected)              ← Export the selected EventMap as a Markdown summary
  Export Event Map (All in Project)        ← Bulk-export all EventMaps in the project to Markdown
  Normalize Audio Folder (16kHz · 2ch ...) ← Normalize WAVs in a folder to 16kHz / stereo / PCM16
  ─────────────────────────────
  Attach Event Logger to Selected          ← Add logging wiring to UnityEvents on selected GameObjects
  Remove Event Logger Wiring from Selected ← Remove the above wiring
  Logs/Start Recording                     ← Start recording Hapbeat logs to file
  Logs/Stop Recording                      ← Stop recording and save
  Logs/Reveal Current File                 ← Show the current log file in Explorer/Finder
  Logs/Open Logs Folder                    ← Open the log storage folder
  Logs/Dump Last Recording to Console      ← Print the most recent log to the Console
  Close Edit-mode Transport                ← Force-close the Edit-mode UDP connection
  Disable Verbose Log on All Hapbeat Components ← Bulk-disable _verboseLog / _debugLog
  ─────────────────────────────
  Developer/Build Basic Example            ← Scaffold the Basic Example sample (Local/Embedded install only)
  Developer/Sync HapbeatSDK → Samples~ (Showcase)
  Developer/Sync HapbeatSDK → Samples~ (BasicExample)
```

Section breakdown:

1. **Window** (top): Opens editor windows. Placed first because they are used frequently.
2. **Create**: Day-to-day authoring operations. Create Event Router or Event Map individually.
3. **Initial / One-time**: For initial setup or special cases. Initial Scene Setup is an all-in-one command (Router + EventMap + folder); Deploy Imported Sample deploys from the Samples folder to HapbeatSDK/.
4. **Authoring tools**: EventMap export / audio format conversion (asset processing).
5. **Diagnostics**: Wiring tests, log recording, emergency transport close, bulk verbose log disable. For debugging purposes.
6. **Developer** (gate hidden in UPM consumer installs): SDK developer only. Hidden in UPM Git URL / registry installs by `HapbeatDevModeMenuGate`.

Hapbeat entries also appear in the following menu locations:

- **GameObject → Hapbeat → Event Router** (including Hierarchy right-click) — same as Create Event Router
- **Assets → Create → Hapbeat → Config / Event Map** — ScriptableObject creation
- **Add Component → Hapbeat/...** — Add individual Trigger / Bridge / Helper components

---

## Window

### Settings

A window for editing connection settings.

| Setting | Purpose |
|---|---|
| Port | UDP port (default 7700) |
| Group | Group ID for target devices (0 = all devices) |
| App Name | Client app name displayed on the Hapbeat device's display. **Max 16 characters** (display grid width). The default `app_name` element (8×1) shows only the first 8 characters. If left blank, `Application.productName` is used automatically (truncated if over 16 characters) |
| Use Bridge | Enable only when using ESP-NOW routing (advanced setup) |
| Ping Interval | Keepalive send interval (seconds) |

Use this for ping testing with a physical device or editing settings outside a scene. The content is the same as the Inspector for a `HapbeatConfig` ScriptableObject created via `Assets/Create/Hapbeat/Config`.

### Event Map

**The main screen for Hapbeat integration work.** Manage all Event IDs in the scene, trigger wiring (which Trigger is attached to which GameObject), and ParameterBinding settings — all from one place.

Key features:

- Left pane: All entries in the EventMap.asset (displayed as cards showing mode / target / gain, etc.)
- Right pane: Detailed editing for the selected entry (Event ID / streamClip / target / gain / Notes / Bindings)
- Wiring section: Reverse-scan to find which Triggers fire the selected entry
- Test Play / Snapshot/Restore during Play mode (save and restore values when tuning against a physical device)

Details: [Event Map Window](./event-map.md)

### Batch Setup

A helper window for bulk-adding Trigger components to multiple GameObjects (e.g. 6 pins with the same tag). Drag and drop references to apply wiring to multiple targets at once.

Use cases:

- Adding the same `HapbeatCollisionTrigger` to 6 bowling pins
- Wiring `HapbeatUnityEventTrigger` to many XR interactables

---

## Scene Operations

### Initial Scene Setup

The recommended starting point for a new scene. Sets up the following in one command:

- `Assets/HapbeatSDK/` folder layout (Kits / Scenes / EventMaps)
- `[Hapbeat Event Router]` GameObject (contains the `HapbeatManager` singleton)
- `Assets/HapbeatSDK/EventMaps/<scene-name>-EventMap.asset`
- Opens the Event Map window with the new asset selected

Re-running is idempotent — if a Router or EventMap already exists, it is reused without duplication or overwriting.

### Create Event Router

Places only the `[Hapbeat Event Router]` GameObject in the scene. It contains the `HapbeatManager` singleton. Use this when you already have an EventMap and only need to add a Router to the scene.

> You can also use Hierarchy right-click → `Hapbeat → Event Router` for the same result.

### Create Event Map

Creates only `Assets/HapbeatSDK/EventMaps/...asset` without adding a Router to the scene. For advanced cases where you need multiple EventMaps (e.g. one per scene).

> `Assets → Create → Hapbeat → Event Map` creates the same asset but prompts for a save location (the standard HapbeatSDK path is not enforced).

---

## Setup / Asset Preparation

### Create HapbeatSDK Folder

Generates the standard layout under `Assets/HapbeatSDK/`:

```
Assets/HapbeatSDK/
├── Kits/        ← Haptic waveforms (deployed from Studio or placed manually)
├── Scenes/      ← Generated sample scenes
└── EventMaps/   ← EventMap.asset
```

`Initial Scene Setup` calls this internally, so you rarely need to run it explicitly. Useful when you want to set up the folder structure manually before doing anything else.

### Normalize Audio Folder (16kHz · 2ch · PCM16)

Normalizes all WAVs in the specified folder to the Hapbeat standard format (16kHz / stereo / PCM16). Use this to bulk-convert audio assets intended for StreamClip mode, such as Tutorial audio files.

---

## Export

### Export Event Map (Selected) / (All in Project)

Exports the contents of a `HapbeatEventMap.asset` as a Markdown summary. Intended for AI-assisted wiring discussions or pasting into design documents.

- `Selected` — Only the EventMap currently selected in the Project view
- `All in Project` — Bulk-exports all EventMaps found via `t:HapbeatEventMap`

Details: [AI-Assisted Workflow](./ai-assisted-workflow.md)

---

## Diagnostics / Debug

Diagnostic utilities available to users. The recommended flow for bug reports is to attach Logs to the issue.

### Attach Event Logger to Selected / Remove Event Logger Wiring from Selected

Adds or removes logging wiring that outputs UnityEvent invocations (e.g. `XRGrabInteractable.selectEntered`) on the selected GameObject to the Console.

Useful for visualizing what is happening before setting up Triggers, or for confirming fire timing. When building wiring with AI assistance, observing "which events fire when" first helps keep the design grounded. Details: [AI-Assisted Workflow](./ai-assisted-workflow.md).

### Logs/

A set of features for recording Hapbeat-related logs (Console output + runtime events) to a file.

| Menu | Purpose |
|---|---|
| Start Recording | Start writing filtered logs to a file |
| Stop Recording | Stop recording and reveal the file in Explorer/Finder |
| Reveal Current File | Show the current log file in Explorer/Finder (only active while recording) |
| Open Logs Folder | Open the folder where past logs are stored |
| Dump Last Recording to Console | Print the most recent log to the Console (for review after stopping) |

**Recommended bug reporting flow:**

1. Run `Logs/Start Recording`
2. Reproduce the issue (Play → trigger problem → Stop)
3. Run `Logs/Stop Recording` to save → attach the file to the issue or DM

### Close Edit-mode Transport

Force-closes any UDP / mDNS transport open in Edit mode. For rare cases such as "I want to test the connection before entering Play mode" or "the port is held open and I can't start Play."

Under normal circumstances you will not need this.

---

## Developer (Local / Embedded install only)

For SDK developers. Hidden in end-user UPM Git URL / registry / tarball installs by `HapbeatDevModeMenuGate` — the menu does not appear at all.

### Build Basic Example

Scaffolds the Basic Example sample set (Kit / EventMap / Scene) at `Assets/HapbeatSDK/SDK_Samples/BasicExample/`. Requires the Basic Example to be imported via Package Manager first.

End users can open the Scene directly from Package Manager's Sample Import, so this menu is not normally needed.

### Sync HapbeatSDK → Samples~ (Showcase) / (BasicExample)

Writes back Scenes / EventMaps / Animations edited under `Assets/HapbeatSDK/SDK_Samples/<sample>/` to the package's `Samples~/<sample>/`. A maintainer-only command for SDK developers.

---

## ScriptableObject Creation (`Assets/Create/Hapbeat/`)

Right-click in the Project view → `Create → Hapbeat`:

| Item | Purpose |
|---|---|
| Config | `HapbeatConfig.asset` (stores connection settings) |
| Event Map | `HapbeatEventMap.asset` (stores the Event ID list) |

Generated at the location you right-clicked. **One per project is sufficient** — recommended location is `Assets/HapbeatSDK/EventMaps/`.

---

## Components (`Add Component → Hapbeat/`)

In a GameObject's Inspector → Add Component → search for `Hapbeat`:

| Component | Purpose |
|---|---|
| Hapbeat Collision Trigger | Fires on physics collision / Trigger Enter / Exit |
| Hapbeat Sequence Trigger | Handles grab / hold / release in one component |
| Hapbeat Tick Emitter | Snap-fires based on the rate of change in a continuous value (e.g. Slider) |
| Hapbeat Unity Event Trigger | Fires from any UnityEvent via the `Fire()` method |
| Hapbeat Parameter Binding | Maps Transform / Rigidbody values to gain / pan in real time |
| Hapbeat Action Helper | Wrapper to call Stop / StopAll / Ping from a UnityEvent |
| Hapbeat Event Logger | Logs UnityEvent invocations to the Console (for debugging) |
| Hapbeat Key Dispatcher | Maps key presses to UnityEvents (for samples / prototypes) |
| Hapbeat Status Overlay | Displays connection state and logs on a Canvas |

> For firing from Animator states, use **`HapbeatStateBehaviour`**. Because it is a StateMachineBehaviour, it is added via the **Animator window: select a state → Inspector → Add Behaviour**, not through Add Component. Details: [Trigger Components](./triggers.md#hapbeatstatebehaviour).

Details: [Trigger Components](./triggers.md) / [Parameter Binding](./parameter-binding.md)
