---
title: Desktop app (Windows)
kind: howto
description: The Windows app of Hapbeat Studio with the Helper built in. Using Studio without Python or the command line, and what to know.
sidebar:
  order: 12
---

The Hapbeat Studio desktop app is a Windows app that shows Studio (web) with the Helper built in. No Python, pipx or command line is needed.

## Install

1. Get `HapbeatStudio-Setup-<ver>.exe` from the [download page](https://github.com/hapbeat/hapbeat-studio-desktop/releases/latest) and run it. It installs for the current user and starts (no administrator rights).
2. Next time, start "Hapbeat Studio" from the desktop or the Start menu.

## Things to know

- **First-run warning**: the app is not code-signed. If "Windows protected your PC" appears, choose More info → Run anyway.
- **Smart App Control**: on Windows 11 PCs where it is on, the app cannot run. Turn it off in Windows Security → App & browser control → Smart App Control settings.
- **Firewall**: if Windows Firewall asks on the first launch, choose Allow access. Otherwise devices cannot be found.
- **Tabs**: Kit, UI and Manage are shown. Turn on "Show all features" in the panel opened from "Connection" at the top right to add the editor and scene tabs.
- **Updates**: the screens are the same as Studio (web) and load the latest version at every launch. When a new version comes out while the app is open, "Reload to update" appears at the bottom right. The app itself (with its built-in Helper) checks for updates at launch.
- **Offline**: without a network the app opens the version it saved last. App updates and the firmware list are not available.
- **With a browser**: while the app runs, its built-in Helper also serves Studio opened in a browser on the same PC. If a Helper installed with pipx is already running, the app uses that one.
- **OS**: Windows only. On macOS, use Studio (web) with the [Helper](/docs/tools/helper/getting-started/).
