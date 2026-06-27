---
title: command vs sine
kind: explanation
description: The two haptic modes in the Arduino SDK — firing a kit event (command) versus synthesizing a waveform on the MCU (sine) — and how to choose.
sidebar:
  order: 2
  label: command vs sine
---

This Arduino library (level-1) gives you **two** ways to make haptics. Neither
needs an audio file on the MCU.

## command (fire) mode

```cpp
hb.play("sample-kit.sine_100hz", 0.6f);
```

- The waveform lives in the **kit on the Hapbeat**. The MCU sends a ~30-byte trigger.
- Deploy the kit to the device first with [Hapbeat Studio](https://devtools.hapbeat.com).
- Event ids are `<kit-name>.<file-name>` and must exist in the deployed kit.
- **Good for**: pre-authored haptics (impacts, clicks) played by a fixed id.

## synthesized sine mode

```cpp
hb.playSine(160.0f, 0.7f, 400);     // frequency, intensity, duration
```

- The waveform is **synthesized on the MCU** in real time. No kit, no WAV, no Studio.
- Frequency and intensity are **live parameters** you can vary with input.
- **Good for**: the quickest check, sensor/UI-driven expression, no files to prepare.

## Choosing

| | command | sine |
|---|---|---|
| Kit on the Hapbeat | **required** (deploy via Studio) | not needed |
| Data on the MCU | none (trigger only) | none (synthesized live) |
| Expressiveness | whatever you authored in the kit | live frequency & intensity |
| First step | needs a deployed kit | **buzzes as-is (recommended)** |

When in doubt, verify connectivity with **sine** first, then put your authored
haptics on **command**.

## level-1 scope

Not included in this version (future work):

- Stored-WAV / clip streaming
- An EventMap (tuning layer)
- ESP-NOW transport (router-free path)

For the synthesized sine API, see [](/en/docs/sdk-integration/arduino-sdk/streaming/).
