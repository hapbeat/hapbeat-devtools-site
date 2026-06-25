---
title: Getting Started
kind: tutorial
description: Install with pip / pipx and drive Hapbeat in a few lines. A Python SDK that separates the fire side (when to play) from the tuning side (what and how to play), linked by event id.
sidebar:
  order: 1
  label: Getting Started
---

:::tip[For AI coding agents]
To have an AI understand the Hapbeat Python SDK, enter the prompt below.

```text
Use the Hapbeat Python SDK. Read https://raw.githubusercontent.com/hapbeat/hapbeat-python-sdk/master/AGENTS.md and follow its specification and best practices.
```
:::

A Python SDK to drive Hapbeat over Wi-Fi UDP. For research (PsychoPy / Jupyter /
ROS), media art, and prototyping. It **separates the fire side (when / where to
play) from the tuning side (what / how to play)**, linking them only by event id.

## Install

```bash
pip install hapbeat-python-sdk          # library + CLI
pipx install hapbeat-python-sdk         # CLI / launchpad only, in an isolated environment
```

> `pipx` is for installing the CLI (`hapbeat scan` / `launchpad`, etc.) in an
> isolated environment. To `import hapbeat` from your own scripts, use
> `pip install` inside a venv.

## Your first event

```python
import hapbeat

hb = hapbeat.connect(app_name="MyApp")
hb.play("sample-kit.sine_100hz", gain=0.5)
hb.close()
```

- `connect()` opens a UDP broadcast socket and sends a keep-alive so the app
  name appears on the device OLED.
- `play(event_id, gain)` sends a play instruction. `gain` is 0..1; if omitted, the
  EventMap described below supplies the default (the kit's intensity).

`"sample-kit.sine_100hz"` must be an event id present in the **kit deployed to the
device** (flashed via [Hapbeat Studio](https://devtools.hapbeat.com)). The SDK
sends only the *instruction*; the waveform lives in the kit on the device
(command mode; for the separate clip mode, see
[](/en/docs/sdk-integration/python-sdk/command-vs-clip/)).

## Find devices

```python
with hapbeat.connect() as hb:
    for d in hb.discover(timeout=1.5):
        print(d.ip, d.address, d.firmware_version)
```

## Separating the fire side from the tuning side (EventMap)

Instead of writing "haptic tuning values" such as intensity into your firing code,
collect them in a **haptic file (kit manifest = EventMap)**. `play("id")` resolves
the defaults from there.

```python
em = hapbeat.EventMap.from_manifest("kits/my-kit/my-kit-manifest.json")
with hapbeat.connect(event_map=em) as hb:
    hb.play("sample-kit.sine_100hz")     # fires at the kit manifest's intensity
```

This lets you swap "when to play (code)" and "how strong (kit)" independently.
For details, see [](/en/docs/sdk-integration/python-sdk/event-map/).

## Specify a target

```python
hb.play("sample-kit.sine_100hz", target="player_1/chest")  # one device
hb.play("sample-kit.sine_100hz", target="*/chest")         # all chest devices
hb.play("sample-kit.sine_100hz")                            # broadcast to all
```

## Hand it to an AI coding agent

To have Claude / Cursor / Copilot, etc. use this SDK, hand it the **`AGENTS.md`**
bundled with the SDK. It packs the specification, usage, and pitfalls into a
single file — enough on its own to grasp the whole picture.

- Location: <a href="https://github.com/hapbeat/hapbeat-python-sdk/blob/master/AGENTS.md" target="_blank" rel="noopener noreferrer">`AGENTS.md`</a> at the root of the SDK repository
- Example of what to hand over (paste as-is to the agent):

```text wrap
Use the Hapbeat Python SDK. Read AGENTS.md and follow its specification and best practices.
```

## What to read next

- [](/en/docs/sdk-integration/python-sdk/command-vs-clip/) — Choosing between command and clip
- [](/en/docs/sdk-integration/python-sdk/project-structure/) — Laying out the kit and haptic file in your project
- [](/en/docs/sdk-integration/python-sdk/examples/) — A walkthrough of the runnable samples
- `hapbeat --help` — CLI (`scan` / `play` / `stop-all` / `osc-bridge` / `launchpad`)
