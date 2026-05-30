---
title: UI Overview
kind: reference
sidebar:
  order: 300
description: Layout of Studio's Kit, UI, and Manage tabs and their panels.
---

## Overall Layout

Studio's functionality is organized across three tabs in the header.

| Tab | Subtitle | Purpose |
|------|----------|---------|
| **Kit** | Vibration Clips | Library and Kit Editor, Save Folder / Deploy |
| **UI** | Display etc. | OLED display layout, LED settings, UI settings |
| **Manage** | Config | Device discovery, Wi-Fi settings, firmware OTA, Kit deploy management, Streaming Test |

The header right side shows a **Docs link** and a **Helper connection status pill**. The pill states are:

- 🟢 **Helper connected**: green badge. Click to open the [Helper Manage modal](#helper-manage-modal), which shows version info and restart commands.
- 🟡 **Helper needs update**: shown when the Helper version is below `MIN_HELPER_VERSION` (`0.1.3`). A dismissible amber banner also appears below the header.
- 🔴 **Helper disconnected**: click to open the onboarding modal (installation instructions + auto-start command).

---

## Kit Tab

The most frequently used tab. It is split into two panes (left/right or top/bottom). Toggle the layout with the button at the far left of the toolbar (`┃` = side-by-side / `━` = stacked).

### Common Toolbar (Top)

- **View mode toggle** (`┃` / `━`): place Library on the left or top
- **i (info toggle)**: show/hide clip details (duration, channels, sample rate, file size)
- **? Controls**: display a mouse/keyboard cheat sheet as a popover
- **DevicePill**: shows the status of the connected device
- **Vol pill**: displays the device volume (MCP4018 wiper, 0–127; visible only when connected)

### Library Panel (Left / Top)

A list of WAV / haptic clip files, automatically imported from the Library folder.

- **+ Library** chip: select, change, or clear the Library folder
- **Flat list (`=`) / Tree view (`▸`)** toggle: collapse or expand the folder structure
- **Search box**: filter by name / Note
- **Sort select**: name / last modified / duration × ascending or descending (persisted in `localStorage`)
- **+ Import**: add WAV files via file dialog
- **Refresh**: re-scan for changes on disk
- **Amp Preset bar**: save and load bulk Amp (libraryIntensity) presets for the Library
- Each clip card has **+ Kit** (add to active Kit) / **Edit** (details modal) / **×** (move to `clips/archive/`) / **Swap** (swap Name ↔ Note)

### Kit Editor Panel (Right / Bottom)

A list of Events in the selected Kit.

- **Kit name input + Create** to create a new Kit
- **+ Kit** chip: select or clear the Kit output folder (defaults to a subfolder inside the Library folder)
- Each Kit row is displayed in a **3-column grid card** layout:
  - Name / Note / Mode pill (`> FIRE` / `♪ CLIP` / `>♪ BOTH`)
  - Amp slider / Edit / Swap / × (remove from Kit)
- **Events header**: count / capacity / sort select / "Mode info" / "Bulk edit…" select (apply FIRE / CLIP / BOTH to the entire Kit)
- **Target Device** section (details): bakes board / firmware_version_min / volume_level / volume_wiper / volume_steps into the manifest
- **Capacity gauge**: visualizes the flash storage used by FIRE-mode clips
- **Deploy** and **Save Folder** buttons at the bottom (see [Build and Distribute a Kit](./kit-design/))

### Helper Manage Modal

Opened by clicking the **Helper connected / needs update** badge in the header. Shows Helper version info, OS-specific start commands, and auto-start setup instructions. When an outdated version is detected, the upgrade command (`pipx upgrade hapbeat-helper`) is also displayed in a copy-paste-ready format.

---

## UI Tab

### Display Editor (OLED Layout)

A block-placement editor for the OLED (128×64) display.

- Place text, icons, battery gauge, `app_name`, and other blocks on a grid
- Define multiple pages with button-based navigation
- Inline page renaming supported
- Deploy button writes the layout to the selected device (USB / OTA flashing is done from the Manage tab)

### UI Settings Modal

Adjust per-device settings including OLED brightness, Hold feedback timing / color / brightness, and Hold indicator LED configuration.

### LED Config Modal

Edit LED idle color, pattern, and connection-state indicator colors.

---

## Manage Tab

The central hub for device management. Select a device in the left sidebar to see details in the right pane.

### Sidebar (Device List)

Devices discovered via mDNS + UDP broadcast are displayed automatically.

- Online / offline status is visually distinguished (offline devices are dimmed)
- **Refresh** button (Helper rescan) triggers immediate re-discovery
- Multi-select supported (for bulk Wi-Fi / OTA operations)
- Connected app name (`app_name`) shown as a pill

### Onboarding Wizard

Displayed in the right pane when the sidebar is empty. A 3-step wizard guiding you through USB Serial → firmware flash → Wi-Fi setup ([Initial Setup](./initial-setup/)).

### Settings Subtab

Wi-Fi profile management for the selected device, device identity (name / group / reboot), and a link to the UI Settings modal.

### Kit Subtab

Lists Kits installed on the device and allows firing test events (`> FIRE` / `♪ CLIP`) for each Event. A warning is displayed if `manifest.target_device.board` does not match the device's board revision.

### Firmware Subtab

Firmware flashing and OTA updates.

- **Two-tier structure**: select device type (Necklace / Band) → select version
- **USB Serial**: for initial setup / downgrade
- **OTA**: update to the latest version wirelessly via Helper
- Latest firmware is fetched automatically from GitHub Releases (production environment)
- Multiple selected devices are updated sequentially

### Streaming Test Subtab

Streaming tests for WAV / Live Audio (system audio, microphone).

---

## Data Persistence

| Data | Location |
|---|---|
| Library / Kit metadata (equivalent to `kits-meta.json`) | Browser **IndexedDB** |
| Library WAVs / Kit output (`install-clips/`, `stream-clips/`, `manifest.json`) | User-specified Library / Kit **local folder** |
| UI settings such as sort order and view mode | `localStorage` |

Nothing is stored on any server. Studio is **fully client-side**.

Migrating to another machine only requires sharing the Library folder.

## Keyboard Shortcuts

See [](/en/docs/tools/studio/shortcuts/) for details.
