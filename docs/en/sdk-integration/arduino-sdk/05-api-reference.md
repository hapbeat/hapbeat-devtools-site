---
title: API reference
kind: reference
description: The public Hapbeat.h API — begin / play / playSine / beginSine / discover and more.
sidebar:
  order: 5
  label: API reference
---

The public methods of the `Hapbeat` class (`src/Hapbeat.h`). The code is the
source of truth.

## Connection

| Method | Description |
|---|---|
| `bool begin(uint16_t port = 7700, const char* appName = "")` | open the UDP socket; `appName` (≤16 chars) shows on the connected Hapbeat OLED. Call after Wi-Fi connects |
| `void end()` | announce the app is leaving (clears the OLED app name) |
| `void setGroup(uint8_t group)` | group id sent in CONNECT_STATUS (level-1 default 0) |

## command (fire)

| Method | Description |
|---|---|
| `void play(const char* eventId, float gain = 1.0f, const char* target = "")` | fire a kit event (`gain` 0..1). `eventId` is `<kit-name>.<file-name>` |
| `void stop(const char* eventId, const char* target = "")` | stop a specific event |
| `void stopAll(const char* target = "")` | stop everything |
| `void ping()` | keep-alive / RTT probe |

## Synthesized sine

| Method | Description |
|---|---|
| `void playSine(float freqHz, float intensity, uint32_t durationMs, const char* target = "")` | one-shot sine (blocks ~`durationMs`). `intensity` 0..1 |
| `void beginSine(float freqHz, float intensity, const char* target = "")` | start a continuous sine |
| `void pumpSine()` | keep the device ring filled (call often from `loop()`) |
| `void endSine()` | stop the continuous sine |
| `bool sineActive()` | is a continuous sine running |

## Discovery / addressing

| Method | Description |
|---|---|
| `bool discover(uint32_t timeoutMs = 1500)` | broadcast PING → PONG to learn the device IP; streaming then unicasts |
| `IPAddress deviceIp()` | the discovered device IP |
| `void setDeviceIp(IPAddress ip)` | set the device IP manually |

`target`: `""` (broadcast to all) / `"player_1/chest"` / `"*/chest"` / `"group_<N>"`.

## level-1 notes

This version has **no EventMap class**. Keep tuning (intensity / loop, etc.) in
the kit on the Hapbeat. Stored-WAV / clip streaming and ESP-NOW transport are not
supported yet (see [](/en/docs/sdk-integration/arduino-sdk/command-vs-sine/)).

For the byte-level wire format, see `docs/wire-format.md` and
`src/HapbeatProtocol.h` in the repo. It is byte-compatible with `hapbeat-contracts`
and the Python / Unity / JS SDKs.
