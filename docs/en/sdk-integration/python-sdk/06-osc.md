---
title: OSC Bridge
kind: howto
description: Drive Hapbeat from any OSC-capable tool such as a smartphone (TouchOSC). Pass a haptic file and the OSC side gets command/clip branching and per-event targeting too.
sidebar:
  order: 6
  label: OSC Bridge
---

The OSC bridge is a relay from "any OSC-capable tool → Hapbeat". **No code is
needed on the tool side.** The headline use case is **turning a smartphone
(TouchOSC) into a wireless haptic remote** (live shows, exhibitions,
Wizard-of-Oz experiments). It also works for driving Hapbeat from Max/MSP, a DAW
(music sync), or apps written in other languages.

```
TouchOSC (phone)  --/hapbeat/play "rain.loop"-->  hapbeat osc-bridge  --UDP-->  device
   buttons, no code        Wi-Fi                      (PC)               Wi-Fi
```

## Launch

```bash
pip install "hapbeat-python-sdk[osc]"

# Pass a haptic file (recommended): the OSC side branches command/clip, and the
# destination (target) is resolved from the haptic file by event id alone
hapbeat osc-bridge --listen 7702 --haptics haptics.json

# Kit only (intensity/clip only; no target):  --kit kits/my-kit
# Nothing (command only; pass target as an OSC argument):  no flag
```

## OSC addresses

| Address | Arguments | Effect |
|---|---|---|
| `/hapbeat/play` | `event_id` `[target]` `[target_time_us]` `[gain]` | Play an event (target/gain default to the haptic file when omitted) |
| `/hapbeat/stop` | `event_id` `[target]` | Stop one event |
| `/hapbeat/stop-all` | `[target]` | Stop everything |
| `/hapbeat/ping` | — | Discovery / keep-alive |

Omit `target` to use the haptic file's per-event target; specify it to override
just that one message.

## What the haptic file decides

The phone **only sends an event id** (`/hapbeat/play rain.loop`). Which device /
body part, at what intensity, and command vs clip — all of that is decided by
the **haptic file** the bridge reads. To change the destination or intensity you
edit a single file; the phone side is never touched.

## Getting it running on a smartphone (TouchOSC)

The path to actually turning a phone into a remote (for detailed settings-screen
operations, refer to the TouchOSC documentation):

1. **Put them on the same Wi-Fi** — keep the phone and the PC running the bridge
   on the same network.
2. **Start the bridge on the PC** — `hapbeat osc-bridge --listen 7702 --haptics haptics.json`.
   The startup log prints the listening port (7702).
3. **Allow inbound UDP 7702 in the PC firewall** — the allow dialog appears the
   first time.
4. **Install TouchOSC on the phone and set the destination** — set the
   connection (OSC) destination host to the **PC's IP** and the port to **7702**.
5. **Assign OSC messages to buttons** — set each button's send address to
   `/hapbeat/play` and the argument (string) to an **event id** such as
   `rain.loop`. The stop button is `/hapbeat/stop-all`.
6. **Press and confirm** — pressing a button plays at the device and intensity
   the haptic file decided.

> Port note: the phone targets **the bridge's 7702** (`--listen`). This is
> separate from the device's listening UDP 7700 — do not confuse them.

## TouchOSC layout (example)

- Button "Rain" → `/hapbeat/play` (string `rain.loop`)
- Button "Tap"  → `/hapbeat/play` (string `sample-kit.sine_100hz`)
- Button "Stop" → `/hapbeat/stop-all`
- Connection: host = the IP of the PC running the bridge, port = `7702`

## Trying it without a phone

A keyboard-driven demo for sending OSC is included for verification (it just
sends `/hapbeat/*`, so it is equivalent to TouchOSC):

```bash
hapbeat osc-bridge --haptics examples/osc_remote/haptics.json   # terminal 1
python examples/osc_remote/send_demo.py                          # terminal 2 (1/2 keys to send)
```

Full example: [`examples/osc_remote/`](https://github.com/hapbeat/hapbeat-python-sdk/tree/master/examples/osc_remote).
