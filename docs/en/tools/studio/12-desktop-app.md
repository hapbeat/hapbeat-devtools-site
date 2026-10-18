---
title: Desktop app (Windows)
kind: howto
description: The Windows app of Hapbeat Studio with the Helper built in. Installing, differences from the web version, updates and troubleshooting.
sidebar:
  order: 12
---

The Hapbeat Studio desktop app is a Windows app that shows Studio (web) with the Helper built in. No Python, pipx or command line is needed.

| | Desktop app | Web version |
|---|---|---|
| What you need | The app only | Chrome / Edge and the [Helper](/docs/tools/helper/getting-started/) (Python, pipx) |
| OS | Windows 10 / 11 | Windows / macOS |
| Opening without a network | Opens the version it saved last | Not possible |

## Requirements

- Windows 10 / 11 (64-bit)
- An internet connection (to load the latest version and updates; without one, the app opens the version it saved last)
- The PC on the same 2.4 GHz Wi-Fi as the Hapbeat
- For initial setup and firmware writing, a USB-C cable that carries data (not charge-only)

## Install

1. Get `HapbeatStudio-Setup-<ver>.exe` from the [download page](https://github.com/hapbeat/hapbeat-studio-desktop/releases/latest) and run it. It installs for the current user and starts (no administrator rights).
2. Next time, start "Hapbeat Studio" from the desktop or the Start menu.

### Prompts on the first run

- **"Windows protected your PC"**: shown because the app is not code-signed. Choose More info → Run anyway.
- **Windows Firewall**: choose Allow access. Otherwise devices on the Wi-Fi cannot be found.
- **The app does not start (Smart App Control)**: on Windows 11 PCs where Smart App Control is on, unsigned apps cannot run. Turn it off in Windows Security → App & browser control → Smart App Control settings.

## Differences from the web version

Every tab works the same as in the web version. The differences are:

- **Tabs shown**: Kit, UI and Manage. Turn on "Show all features" in the panel opened from "Connection" at the top right to add the editor and scene tabs.
- **"Connection" at the top right**: where the web version shows "Helper". It opens the app panel: built-in Helper status, Restart Helper, Open the log folder, Reset device discovery, Check for updates and the display switch.
- **USB**: with a single Hapbeat on USB, the port is chosen without a chooser. A port chosen once stays usable after restarting the app.
- **PC sound**: the PC sound block in the Manage tab's playback test plays what this PC plays (videos, games, music) as vibration on the chosen Hapbeats. In the app there is nothing to pick (in the web version, choose "Entire screen" and turn on sharing the system audio in the browser's share dialog).

## Updates

- **Studio screens**: loaded from the internet at every launch. When a new version comes out while the app is open, "Reload to update" appears at the bottom right (nothing changes until you press it).
- **The app itself** (with the built-in Helper): checks for a new version at launch, downloads it in the background and then shows "Restart and update". If you choose Later, it updates the next time you close the app.

## Offline

Without an internet connection the app opens the version saved at the last online launch (the version in the installer the first time) and says so at launch. Offline, these are not available:

- Studio and app updates
- The firmware list (firmware updates over Wi-Fi or USB)

## About the Helper

- The built-in Helper runs while the app runs and stops when the app closes.
- It uses a fixed local port (7703), so while the app runs, Studio opened in a browser on the same PC works too.
- On a PC where a [Helper installed with pipx](/docs/tools/helper/getting-started/) is already running, the app uses that one (the panel says it uses a separately installed Helper). To switch to the built-in Helper, run `hapbeat-helper stop` in a terminal; the built-in Helper takes over within seconds.

## Troubleshooting

| Symptom | What to do |
|---|---|
| Devices do not appear | Check that the PC and the Hapbeat are on the same 2.4 GHz Wi-Fi. If you did not allow the firewall prompt, allow `hapbeat-helper` in the Windows settings. Also try Reset device discovery in the panel. |
| "Connection" at the top right is red | Open the panel and press Restart Helper. If that does not help, check `helper.log` via Open the log folder. |
| A USB connection is not recognised | Use a cable that carries data, not a charge-only one. Try another USB port. |
| The app does not start | See Smart App Control above. |

Logs are in `%APPDATA%\Hapbeat Studio\logs`. Attach that folder when you contact us.

## Uninstall

Uninstall "Hapbeat Studio" from Windows Settings → Apps → Installed apps. Work folders where you saved kits are not deleted.

## OS

Windows only. On macOS, use Studio (web) with the [Helper](/docs/tools/helper/getting-started/).
