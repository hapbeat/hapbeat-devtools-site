---
title: Install Helper
kind: tutorial
sidebar:
  order: 99
description: OS-specific installation guide for `hapbeat-helper`, the CLI daemon that bridges Hapbeat Studio and your devices. Works on macOS and Windows.
---

`hapbeat-helper` is a local daemon that bridges **Hapbeat Studio (Web)** and **Hapbeat devices (Wi-Fi LAN)**. It relays mDNS discovery, UDP broadcast, and raw TCP — operations a browser cannot perform on its own.

```
Browser (https://studio.hapbeat.com/)
        │  ws://localhost:7703 (JSON)
        ▼
hapbeat-helper                  ← this CLI
        │  UDP 7700 (PLAY / STOP / PING / streaming)
        │  TCP 7701 (config / kit deploy)
        │  mDNS (_hapbeat._udp.local.)
        ▼
   Hapbeat device (same LAN)
```

> If the Studio does not show "Helper connected" (green badge), Helper is either not running or port 7703 is blocked.

## Quick start (3 minutes)

If Studio shows "Helper not connected", follow these 3 steps:

```bash
# 1. Install pipx if you haven't already (one-time setup)
#    macOS:   brew install pipx && pipx ensurepath
#    Windows: py -m pip install --user pipx && py -m pipx ensurepath
#    ↑ Then open a new terminal

# 2. Install Helper
pipx install hapbeat-helper

# 3. Register auto-start on login (also starts Helper immediately)
hapbeat-helper install-service
```

That's it. Reload Studio and the badge will turn green ("Helper connected").

---

## Requirements

- **Python 3.10 or later** (installed into an isolated venv via `pipx`, so the system Python version does not matter)
- **A PC on the same Wi-Fi LAN as your Hapbeat device** (Windows / macOS)
- **Chrome or Edge** (Studio uses Web Serial and File System Access APIs)

## Installation

Install via `pipx`, the standard tool for isolating Python CLIs in their own venvs.

### macOS

```bash
# 1. Install Homebrew if needed:
#    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install pipx
brew install pipx
pipx ensurepath

# 3. Open a new terminal (to apply PATH changes)

# 4. Install Helper
pipx install hapbeat-helper

# 5. Verify
hapbeat-helper version
```

> If a macOS Firewall dialog appears at startup, click **Allow** (Helper needs to listen on UDP/TCP/mDNS).

### Windows

```powershell
# 1. Install pipx
py -m pip install --user pipx
py -m pipx ensurepath

# 2. Open a new terminal (to apply PATH changes)
pipx --version

# 3. Install Helper
pipx install hapbeat-helper
```

> **`pipx` not recognized** — even after restarting the terminal, use `py -m pipx install hapbeat-helper` as an equivalent alternative.
>
> **OneDrive-synced home directory** (`C:\Users\<you>\` synced by OneDrive) may cause `pipx install` to fail with `WinError 448 untrusted mount point`. In that case, move pipx's storage outside OneDrive:
>
> ```powershell
> [Environment]::SetEnvironmentVariable('PIPX_HOME',    'C:\pipx\home', 'User')
> [Environment]::SetEnvironmentVariable('PIPX_BIN_DIR', 'C:\pipx\bin',  'User')
> # After restarting the terminal:
> py -m pipx ensurepath
> py -m pipx install hapbeat-helper
> ```
>
> If a **Windows Defender Firewall** dialog appears at startup, click "Allow access".

## Starting Helper

### Auto-start on login (recommended)

Run this command once and Helper starts **immediately** — then restarts automatically every time you log in. Studio will be connected as soon as you open it.

```bash
hapbeat-helper install-service
```

You will see output like this right away (no re-login needed):

```
hapbeat-helper auto-start installed.
  shim: C:\Users\<you>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\HapbeatHelper.vbs
  exe:  C:\pipx\bin\hapbeat-helper.exe
  log:  C:\Users\<you>\AppData\Local\hapbeat-helper\hapbeat-helper.log
  next logon: Helper starts automatically (hidden).
```

| OS | Mechanism |
|---|---|
| macOS | `~/Library/LaunchAgents/com.hapbeat.helper.plist` (launchd, `KeepAlive=true`) |
| Windows | **Task Scheduler** (`HapbeatHelper` task) with a `powershell.exe -WindowStyle Hidden` action. No VBScript — works on Windows 11 24H2+. stdout/stderr → `%LOCALAPPDATA%\hapbeat-helper\hapbeat-helper.log` |

To check the registration status:

```bash
hapbeat-helper service-status
```

To remove auto-start:

```bash
hapbeat-helper uninstall-service
```

> ⚠️ Always run `hapbeat-helper uninstall-service` **before** running `pipx uninstall hapbeat-helper`. If the entry is left behind after the binary is removed, you will get a "command not found" error on the next login.

> For details on how auto-start behaves, PC impact, and security risks, see **[Security & Behavior](./security.md)**. Read it before using Helper on a public Wi-Fi network.

### Foreground mode (development / debugging)

You can also start Helper manually in a separate terminal:

```bash
hapbeat-helper start
```

When running successfully, you will see:

```
hapbeat-helper 0.1.1 starting on ws://localhost:7703
Press Ctrl+C to stop.
20:48:09 INFO hapbeat_helper.udp_listener: UDP listener started on 0.0.0.0:7700
20:48:09 INFO hapbeat_helper.mdns_scanner: mDNS browsing started for _hapbeat._udp.local.
20:48:09 INFO websockets.server: server listening on 127.0.0.1:7703
```

Keep this terminal open. Press `Ctrl+C` to stop when you are done with Studio.

> **If an auto-start Helper is already running**, there will be a port conflict and startup will fail. Run `hapbeat-helper stop` first, then `start`.

## Verifying the connection

Open <https://studio.hapbeat.com/> in your browser. If the Helper connection status at the top of Studio shows **green "Helper connected"**, the connection is working.

To verify from the command line:

```bash
hapbeat-helper status     # checks if a daemon is responding on port 7703
hapbeat-helper version    # shows the installed version
```

## Updating

To update a running auto-start Helper:

```bash
# 1. Stop the current Helper  ← required (see "forgot to stop" section below)
hapbeat-helper stop

# 2. Upgrade to the new version
pipx upgrade hapbeat-helper

# 3. Verify the version
hapbeat-helper version

# 4-a. If using auto-start: re-register to start immediately
hapbeat-helper install-service

# 4-b. If you want to verify in foreground first
hapbeat-helper start
```

> **macOS note**: `hapbeat-helper stop` uses `KeepAlive=true`, so sending SIGTERM causes launchd to respawn immediately (effectively a restart). For a clean update, use `hapbeat-helper uninstall-service` → upgrade → `hapbeat-helper install-service`.

> If Studio's log drawer shows `ERROR: unknown type: <message>`, Helper is out of sync with Studio. Update using the steps above.

### If you forgot to stop before upgrade / uninstall

Running `pipx upgrade` / `pipx uninstall` while the auto-start Helper is still resident behaves differently per OS. Follow the OS-specific recovery steps below.

#### Windows: fails with `PermissionError: Access is denied`

The `.pyd` files inside site-packages (e.g. `websockets/speedups.cp312-win_amd64.pyd`) are locked by the helper process, so `pipx`'s uninstall (which renames files to trash) fails. This leaves pipx in a half-uninstalled state with the process still alive.

**Recovery (run in PowerShell):**

```powershell
# 1. End the helper task in Task Scheduler
schtasks /End /TN HapbeatHelper

# 2. Kill any remaining process by name
Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -match 'hapbeat[-_]helper' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

# 3. Clean up the half-removed trash directory left by pipx
Remove-Item -Recurse -Force C:\pipx\home\.trash -ErrorAction SilentlyContinue

# 4. Check pipx state → uninstall if still present (no .pyd lock this time)
pipx list
pipx uninstall hapbeat-helper      # if still listed

# 5. Reinstall
pipx install hapbeat-helper        # or: pipx upgrade hapbeat-helper

# 6. Re-register auto-start pointing to the new venv path
hapbeat-helper install-service
```

> If `Stop-Process` reports `Cannot find a process with the process identifier <PID>`, it simply means the task already died from `schtasks /End` before `Stop-Process` ran. This is a harmless race condition.

#### macOS: pipx succeeds but the old daemon keeps running

On Unix, a running executable can be deleted (the inode lives until the process closes it), so `pipx uninstall` / `pipx upgrade` **completes without errors**. However, the launchd job holding the old code keeps running, leaving Studio in a state where **the version was updated but behavior is still from the old binary**.

**Recovery:**

```bash
# 1. Unload the launchd job (also stops the process, no respawn)
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.hapbeat.helper.plist

# 2. Kill any remaining foreground process
pkill -f 'hapbeat[-_]helper'

# 3. Reinstall if fully removed
pipx install hapbeat-helper        # if it was uninstalled

# 4. Re-register auto-start
hapbeat-helper install-service
```

## Viewing logs

Logs from the auto-start Helper are written to a file:

```bash
hapbeat-helper logs          # last 50 lines
hapbeat-helper logs -n 200   # last 200 lines
hapbeat-helper logs -f       # follow in real time (Ctrl+C to stop)
```

Log file location:

| OS | Path |
|---|---|
| Windows | `%LOCALAPPDATA%\hapbeat-helper\hapbeat-helper.log` |
| macOS | `~/Library/Logs/hapbeat-helper.log` |

> Foreground (`hapbeat-helper start`) logs go directly to the terminal and are not written to the log file.

## Uninstalling

```bash
hapbeat-helper uninstall-service   # always do this first (removes auto-start)
pipx uninstall hapbeat-helper
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| Studio does not show "Helper connected" | Run `hapbeat-helper install-service` for auto-start, or run `hapbeat-helper start` in a terminal. Check whether port 7703 is in use by another process (`lsof -i :7703` / Windows: `netstat -ano \| findstr :7703`) |
| Cannot connect to `ws://localhost:7703` (Firefox) | Go to `about:config` → set `network.websocket.allowInsecureFromHTTPS` to `true`. Not needed in Chrome / Edge |
| Device does not appear in the sidebar | Confirm Helper and Hapbeat are on the same Wi-Fi LAN. Some hotspot / AP modes block UDP broadcast and mDNS |
| Port 7700 or 7703 already in use | Check for a duplicate Helper instance. Run `hapbeat-helper service-status`; if running, stop with `hapbeat-helper stop` and restart. If another process owns the port, use `lsof -i :7703` (macOS) or `netstat -ano \| findstr :7703` (Windows) to find its PID and close that app |
| **Windows: Helper does not auto-start after login** | On Windows 11 24H2+, VBScript is disabled by default, so old VBS shims in the Startup folder do not run. Run `hapbeat-helper uninstall-service` → `hapbeat-helper install-service` to switch to the Task Scheduler method |
| **Windows: `pipx uninstall` / `pipx upgrade` fails with `PermissionError`** | The auto-start Helper process is locking `.pyd` files. Always run `hapbeat-helper stop` before updating. For recovery after forgetting to stop, see the "[Forgot to stop before upgrade / uninstall](#if-you-forgot-to-stop-before-upgrade--uninstall)" section above |
| **macOS 14 (Sonoma) or later: Wi-Fi scan returns nothing** | `airport -s` has been deprecated, so Helper's SSID auto-detection may not work. Enter the SSID **manually** in Studio's Wi-Fi settings (the password field works normally) |
| USB Serial write does not work on Mac | Confirm the device appears as `/dev/cu.usbmodem*` (`ls /dev/cu.*`). If it does not appear, check that your USB-C cable supports data transfer (charge-only cables will not work) |
| `Ctrl+C` has no effect on macOS | The Helper registered with `install-service` runs in the background; there is no foreground process in your terminal. Use `hapbeat-helper stop` to stop it |
| `hapbeat-helper stop` on macOS caused an immediate restart (old version) | Old versions used `kickstart -k` (SIGTERM → immediate respawn). The current version uses `bootout` for a proper stop. Run `pipx upgrade hapbeat-helper` to update |

## Next steps

- [CLI Reference](./cli-reference.md) — full list of subcommands (`start` / `stop` / `logs` / `status` / `service-status`, and more) with examples
- [](/en/docs/tools/studio/initial-setup/) — how to connect a Hapbeat device to Wi-Fi for the first time (Studio onboarding wizard)
- [](/en/docs/tools/studio/getting-started/) — designing haptic content in Studio
