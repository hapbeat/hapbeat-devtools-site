---
title: Security & Behavior
kind: explanation
sidebar:
  order: 400
description: What happens to your PC and network when hapbeat-helper runs as a resident daemon, and a full overview of security risks when using Hapbeat and Helper together. Includes a public Wi-Fi usage guide.
---

This page covers **what happens to your PC and network when `hapbeat-helper` runs as a resident daemon**, and **security considerations when using it with Hapbeat**. For installation steps, see [Install Helper](../getting-started/).

## Impact on your PC

Despite running in the background, Helper is a lightweight local-only process. It has virtually no noticeable impact on everyday PC use.

| Aspect | Impact | Details |
|---|---|---|
| CPU | Near zero | When idle, WebSocket / mDNS / UDP listener wait in `select()`. Even when Studio is connected, Helper only relays haptic packets |
| Memory | 30–60 MB | One Python process. Much lighter than always-on apps like Slack or Discord |
| Network | LAN-local only | UDP 7700 / TCP 7701 / mDNS multicast stay within the **same LAN**. No outbound internet traffic |
| Port usage | 7700 / 7701 / 7703 | Will conflict with other processes using the same ports. Use `hapbeat-helper service-status` to check for duplicate instances |
| Firewall | One-time dialog only | macOS Firewall / Windows Defender Firewall prompts once on first run. Allowing LAN communication is recommended |
| Power / sleep | No impact | The Python process sleeps with the system and resumes automatically on wake |
| Admin privileges | Not required | macOS: user-scoped LaunchAgent / Windows: user-scoped Task Scheduler task |
| Terminal / console | Not visible | macOS: launchd redirects stdout to a log file. Windows: starts with `powershell -WindowStyle Hidden` |
| Crash behavior | No auto-restart | Restarts on next login. For high-availability scenarios, supplement with a foreground instance |

## Security risks

Helper is designed as a **local devtool**. Below is a code-referenced summary of risks when combined with Hapbeat.

### 1) Helper itself

| Aspect | Assessment | Notes |
|---|---|---|
| WebSocket 7703 | **Binds to localhost (127.0.0.1) only** | Not reachable from other PCs. Only the browser on the same machine can connect. `server.py:42` `HOST = "localhost"` |
| UDP 7700 | Listens on all interfaces | Required to receive response packets from Hapbeat. `udp_listener.py:64` `sock.bind(("0.0.0.0", self._port))`. Contents are only haptic packets (PLAY / STOP / PONG) — no PC files or credentials |
| TCP 7701 | Client-side only | Helper does not listen on TCP 7701. It connects *to* the device's TCP 7701 |
| mDNS | LAN multicast | Broadcasts `_hapbeat._udp.local.` for device discovery. Hapbeat device names and IPs are visible on the LAN |
| Write permissions | User home only | macOS: `~/Library/LaunchAgents/`. Windows: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\HapbeatHelper.vbs`. Does not write to OS-protected areas |
| Outbound traffic | None | No telemetry, self-diagnostics, or auto-update calls. Zero outbound traffic beyond the LAN |
| Code signing | Not implemented | Installed from PyPI via `pipx install`. Supply chain trust depends on PyPI and GitHub Releases. If this is a concern, build from source with `pipx install -e .` |
| Uninstall residue | None | `uninstall-service` removes the shim / plist; `pipx uninstall` removes the entire venv |

### 2) Hapbeat device risks (exist regardless of Helper)

Even without Helper running, **anyone on the same Wi-Fi LAN as a Hapbeat device** can send commands to its TCP 7701 port.

| Aspect | Assessment | Notes |
|---|---|---|
| TCP 7701 authentication | None | Any device on the same LAN can send commands to the Hapbeat TCP 7701 port |
| Wi-Fi password protection | **Write-only** | Passwords can only be written — they are never returned to any caller after storage (API-key style). `list_wifi_profiles` returns only the SSID and a `has_pass` flag |
| Haptic actuation | Possible | Anyone can send arbitrary vibration packets (UDP 7700). A third party could maliciously trigger vibrations |
| Firmware flashing | Requires physical access | OTA is delivered over TCP 7701, but the device can also be flashed via USB Serial. Someone with physical access to a PC running Helper could flash arbitrary firmware |

### 3) Recommended usage

| Environment | Helper resident | Hapbeat connected |
|---|---|---|
| Home / personal dev machine | ✅ OK | ✅ OK |
| Trusted office LAN | ✅ OK | ✅ OK |
| **Public Wi-Fi (café, hotel)** | ✅ OK (no data-leak path through Helper) | ⚠️ A third party could prank-trigger haptics, but Wi-Fi passwords and other credentials are not exposed |
| Shared PC / kiosk / exhibition booth | ⚠️ Physical access enables arbitrary firmware flashing. Avoid leaving Helper resident | ⚠️ Do not leave Hapbeat in a state where it can be physically accessed by strangers |
| Mobile tethering / hotspot | ✅ OK | ✅ OK |

Practical guidelines:
- ✅ For everyday development, use `install-service` to keep Helper resident for a seamless experience.
- ⚠️ Do not leave Hapbeat unattended in a location accessible to strangers (USB Serial allows arbitrary firmware flashing).

## How auto-start works

| OS | Mechanism | File / entry |
|---|---|---|
| macOS | launchd LaunchAgent | `~/Library/LaunchAgents/com.hapbeat.helper.plist` |
| Windows | Task Scheduler (user logon task) | Task name `HapbeatHelper`. Runs via `powershell.exe -WindowStyle Hidden` action |

Both are user-scoped, so **no admin privileges are required**.

> **Windows VBScript note**: VBScript is disabled by default on Windows 11 24H2 and later (Microsoft is phasing it out). Earlier versions of Helper used a VBS shim in the Startup folder. The current version uses Task Scheduler + PowerShell. If an old VBS shim is present, run `hapbeat-helper uninstall-service` → `hapbeat-helper install-service` to migrate.

`install-service` registers auto-start and **starts Helper immediately** — no need to wait for the next login.

### Management commands (cross-platform)

```bash
hapbeat-helper service-status    # "registered, running" / "registered, stopped" / "not registered"
hapbeat-helper logs              # log file path + last 50 lines
hapbeat-helper logs -f           # follow tail (Ctrl+C to exit)
hapbeat-helper logs -n 200       # last 200 lines
hapbeat-helper stop              # stop the running instance (macOS: effectively a restart — see below)
hapbeat-helper install-service   # register auto-start (also starts immediately)
hapbeat-helper uninstall-service # remove auto-start (also stops if running)
```

Log file locations:
- macOS: `~/Library/Logs/hapbeat-helper.log`
- Windows: `%LOCALAPPDATA%\hapbeat-helper\hapbeat-helper.log`

GUI inspection:
- macOS: Open `~/Library/LaunchAgents/` in Finder / `launchctl list | grep hapbeat` / view logs in Console.app
- Windows: `Win+R` → `shell:startup` to open the Startup folder / navigate directly to `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`

> **macOS behavior**: `hapbeat-helper stop` calls `launchctl bootout` to unload the job. The process stops immediately and `KeepAlive=true` does not trigger a respawn. The plist remains, so Helper restarts on the next login. To restart it now, run `hapbeat-helper install-service`. For a permanent stop, use `hapbeat-helper uninstall-service`.
> **Windows behavior**: `stop` calls taskkill. The Task Scheduler task remains, so Helper restarts on the next login. To restart it now, run `install-service` again (or re-login).

## Troubleshooting (security-related)

| Symptom | Fix |
|---|---|
| Defender / Firewall showed a warning after installing Helper | This is normal behavior for LAN communication. Allowing **Private network** access only is sufficient (`Public` is not needed) |
| Want to see which SSIDs are saved on the Hapbeat device | In Studio, go to the **Devices** tab → Wi-Fi profiles → click "⟳ Refresh" to list SSIDs. Individual profiles can also be deleted from the same screen (passwords are never displayed) |
