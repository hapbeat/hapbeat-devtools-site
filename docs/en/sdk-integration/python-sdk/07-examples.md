---
title: Navigating the Examples
kind: tutorial
description: A reading order, reuse guide, and gotchas for copying the examples as the foundation of your own app.
sidebar:
  order: 7
  label: Examples
---

The SDK's <a href="https://github.com/hapbeat/hapbeat-python-sdk/tree/master/examples" target="_blank" rel="noopener noreferrer">`examples/`</a>
are a collection of single files / folders meant to be **read, copied, and made
your own**. This page sums up "which one to build on" and "what to watch out for
when copying".

## Reading order

1. **minimal.py** — the smallest `connect → play → stop`. Start here.
2. **clip_project/** — a layout that bundles a kit into the project. The best
   model for seeing how the same `play(id)` automatically branches into command
   and clip.
3. **osc_remote/** — the haptic file, and firing from outside (a phone, etc.).
4. Use-case examples (table below).

## Example cheat sheet

| Example | For | What you learn | Kit needed |
|---|---|---|---|
| minimal.py | Everyone | The smallest discover / play / stop | 1 short one-shot |
| clip_project/ | App builders | Project layout, automatic command/clip branching, `stream_pcm` | A kit folder |
| osc_remote/ | Live / exhibitions | The haptic file, firing from a phone (TouchOSC) | Kit + haptic file |
| task_notifier.py | Dev / ML | Notify success/failure of an arbitrary command via haptics | 1 short one-shot |
| metronome.py | Music / running | A haptic metronome (tempo control, odd time signatures) | 1 short one-shot |
| breathing_pacer.py | Well-being | A breathing guide (intensity ramp, measurement log) | A short, soft one-shot |
| psychophysics_experiment.py | Research | A detection experiment (method of constants, staircase, CSV) | 1 short one-shot |
| morse_text.py | Accessibility | Text → Morse (long/short via play/stop) | A looping buzz (or two one-shots) |
| haptic_pad.py | Live / WoZ | A keyboard trigger pad (record / replay) | Mapping sources (below) |

> The "default event ids" in the table (`sample-kit.sine_100hz`, etc.) are
> **placeholders** — always replace them with ids that exist in your own kit.

## Reusability when copying

- **The single-file examples** (minimal / task_notifier / metronome /
  breathing_pacer / psychophysics_experiment / morse_text / haptic_pad) can be
  copied and used as-is.
- **clip_project/** can be copied as a whole folder. It resolves the kit
  location relative to `__file__`, so it finds your kit even after the folder is
  moved. Just **swap `kits/` for your own kit** and it becomes a foundation.
- **osc_remote/** is also copied as a whole folder. Swap the inner
  `kits/demo-kit/` for your own kit and point `haptics.json`'s `kit` at that
  folder.

## Separating the fire side (code) from the haptic settings (file)

The examples show this separation in stages.

- minimal.py — the smallest form, writing `gain` directly in code.
- clip_project/ — intensity and mode go into the **kit** (`connect(kit=...)`).
- osc_remote/ — target and intensity go into the **haptic file**
  (`connect(haptics=...)`).

For details, see [](/en/docs/sdk-integration/python-sdk/project-structure/) and
[](/en/docs/sdk-integration/python-sdk/event-map/).

## Gotchas

- **It shows up in scan but nothing fires** — the most common cause is
  specifying an event id that isn't in the deployed kit. Check the kit's ids in
  Studio. You can verify connectivity with `task_notifier.py --test`.
- **The command examples don't fire** — command waveforms must be flashed to the
  device in Studio (the SDK does not read `install-clips/`). The clip examples
  (which send WAV) work without flashing.
- **The target doesn't match your device** — nothing fires if `target` doesn't
  match. First verify with an empty target (broadcast to all), then narrow it to
  the device's address.
- **The clip audio sounds wrong** — prepare clip WAVs as 16 kHz mono PCM16 (the
  SDK does not resample).
- **gain isn't what you expect** — gain is an absolute value in 0..1. The one
  exception is `haptic_pad.py`'s `--master`, which is a multiplier applied to
  each pad, so be careful.
