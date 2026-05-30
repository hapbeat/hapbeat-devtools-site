---
title: CLI Reference
kind: reference
sidebar:
  order: 300
---

Full list of `hapbeat-helper` commands and examples. Current as of version 0.1.1.

All commands follow the form `hapbeat-helper <subcommand> [options]`.  
Running without arguments prints help.

## Quick reference

| Command | Purpose |
|---|---|
| [`start`](#start) | Start in foreground (logs stream to the terminal) |
| [`stop`](#stop) | Stop a running Helper (macOS: effectively a restart — see below) |
| [`status`](#status) | Check whether port 7703 is responding |
| [`version`](#version) | Print the installed version |
| [`logs`](#logs) | View / follow the auto-start Helper log file |
| [`install-service`](#install-service) | Register OS login auto-start (also starts immediately) |
| [`uninstall-service`](#uninstall-service) | Remove auto-start registration |
| [`service-status`](#service-status) | Check auto-start registration state |
| [`config show`](#config-show) | Show config file path and contents |

`--verbose` / `-v` is available at the top level and with `start` (enables DEBUG logging).

---

## Command details

### `start`

Start Helper in the foreground. Logs stream directly to the terminal. Press `Ctrl+C` to stop.

```powershell
hapbeat-helper start
hapbeat-helper start --port 7703    # specify port (default: 7703)
hapbeat-helper start --verbose      # DEBUG logging
```

Example output:
```
hapbeat-helper 0.1.1 starting on ws://localhost:7703
Press Ctrl+C to stop.
20:48:09 INFO hapbeat_helper.udp_listener: UDP listener started on 0.0.0.0:7700
20:48:09 INFO hapbeat_helper.mdns_scanner: mDNS browsing started for _hapbeat._udp.local.
20:48:09 INFO websockets.server: server listening on 127.0.0.1:7703
```

> **Note**: If a background Helper started via auto-start is already using the same port, there will be a conflict. Run `stop` first.

---

### `stop`

Stop the running Helper. Behavior differs by OS.

```powershell
hapbeat-helper stop
```

| OS | Behavior |
|---|---|
| **Windows** | Kills the `hapbeat-helper` process via taskkill. Applies to both auto-start and foreground instances |
| **macOS (auto-start registered)** | Unloads the job via `launchctl bootout`. The process stops immediately with no respawn. The plist remains, so **Helper restarts on the next login**. To restart it now, run `install-service` |
| **macOS (no auto-start)** | Kills the foreground process via `pkill -f hapbeat-helper` |

> To stop a foreground process started with `start`, pressing `Ctrl+C` in that terminal is the most reliable method.

---

### `status`

A lightweight connectivity check — verifies that a TCP connection to `localhost:7703` can be established.

```powershell
hapbeat-helper status
hapbeat-helper status --port 7703
```

Example output:
```
hapbeat-helper: reachable on ws://localhost:7703
```
or:
```
hapbeat-helper: not running (no listener on 7703)
```

---

### `version`

```powershell
hapbeat-helper version
# → hapbeat-helper 0.1.1
```

---

### `logs`

Displays the log file written by the **auto-start** Helper's stdout/stderr. Not related to foreground `start` sessions (those stream directly to the terminal).

```powershell
hapbeat-helper logs              # last 50 lines
hapbeat-helper logs -n 200       # last 200 lines
hapbeat-helper logs -f           # follow tail (Ctrl+C to stop)
hapbeat-helper logs -n 200 -f    # print last 200 lines then follow
```

Log file location:

| OS | Path |
|---|---|
| Windows | `%LOCALAPPDATA%\hapbeat-helper\hapbeat-helper.log` |
| macOS | `~/Library/Logs/hapbeat-helper.log` |

---

### `install-service`

Registers Helper with the OS login auto-start and **starts it immediately** (no re-login required).

| OS | Mechanism |
|---|---|
| Windows | Registers a `HapbeatHelper` task in Task Scheduler with a `powershell.exe -WindowStyle Hidden` action. No VBScript — works on Windows 11 24H2+ |
| macOS | `~/Library/LaunchAgents/com.hapbeat.helper.plist` (launchd, `KeepAlive=true`) |

```powershell
hapbeat-helper install-service
```

Example output (Windows):
```
hapbeat-helper auto-start installed.
  shim: C:\Users\<you>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\HapbeatHelper.vbs
  exe:  C:\pipx\bin\hapbeat-helper.exe
  log:  C:\Users\<you>\AppData\Local\hapbeat-helper\hapbeat-helper.log
  next logon: Helper starts automatically (hidden).
```

> ⚠️ Always run `uninstall-service` **before** running `pipx uninstall hapbeat-helper`. Leaving a stale entry behind causes "command not found" errors on the next login.

---

### `uninstall-service`

Removes the auto-start registration and stops Helper if it is running. Does not remove the Helper binary itself (use `pipx uninstall` for that).

```powershell
hapbeat-helper uninstall-service
```

---

### `service-status`

Check the auto-start registration state.

```powershell
hapbeat-helper service-status
```

Example output (exit code reflects state):
| Output | Exit code | Meaning |
|---|---|---|
| `hapbeat-helper service: not registered` | 1 | `install-service` has not been run |
| `hapbeat-helper service: registered, stopped` | 1 | Registered but currently not running |
| `hapbeat-helper service: registered, running` | 0 | Registered and running |

---

### `config show`

Prints the config file path and its contents. In the current version, if no config file exists it shows `(no config file yet — defaults are in use)`.

```powershell
hapbeat-helper config show
```

Config file location:
| OS | Path |
|---|---|
| Windows | `%APPDATA%\hapbeat-helper\config.toml` |
| macOS | `~/.config/hapbeat-helper/config.toml` |

---

## Common workflows

### A. Initial setup (auto-start + verify)

```powershell
pipx install hapbeat-helper
hapbeat-helper install-service     # starts immediately, no re-login needed
hapbeat-helper service-status      # → hapbeat-helper service: registered, running
hapbeat-helper status              # → reachable
```

### B. Update

```powershell
hapbeat-helper stop                # stop if running (macOS: effectively restarts, overwritten by next step)
pipx upgrade hapbeat-helper        # or: pipx install --force hapbeat-helper
hapbeat-helper version             # confirm the version bumped
hapbeat-helper install-service     # if using auto-start: re-register and start immediately
# or: hapbeat-helper start         # if you want to verify in foreground first
```

> **macOS**: Since `stop` is effectively a restart, for a clean update run `uninstall-service` → upgrade → `install-service`.

### C. Debugging OTA / connectivity issues

```powershell
# 1. Stop auto-start to avoid port conflicts
hapbeat-helper stop
# Windows — if the process persists:
tasklist | findstr python          # find PID
# taskkill /F /PID <number>

# 2. Start in foreground → logs stream in real time
hapbeat-helper start

# 3. Trigger OTA from Studio or another terminal and observe logs
#    During OTA streaming, a progress line appears every 5%:
#      INFO OTA <ip>: sent=N% device=M% (X/Y bytes)
#    If stuck, within 8 s you will see:
#      ERROR ... phase=stall: 8s elapsed since chunk send started but device is still at 0%
```

### D. Follow auto-start Helper logs only

```powershell
hapbeat-helper logs -f
```

### E. Full uninstall

```powershell
hapbeat-helper uninstall-service   # always first
pipx uninstall hapbeat-helper
```

---

## Troubleshooting

| Symptom | Check |
|---|---|
| `start` exits immediately | Run `status` to see if port 7703 is taken by another process, or if an auto-start Helper is already running |
| `status` shows unreachable | Check `service-status` for running state / Windows: `netstat -ano \| findstr :7703` to confirm listening |
| `logs` shows "log file does not exist" | Auto-start has not started (`service-status` to confirm) / Foreground `start` output is not written to the log file |
| Studio does not show "Helper connected" | Helper is not running, or port 7703 is blocked by a firewall |
| `stop` on macOS does not stop Helper | Intended behavior due to `KeepAlive=true` (effectively a restart). For a permanent stop, use `uninstall-service` |

See also [Getting Started](./getting-started.md) for more detail.
