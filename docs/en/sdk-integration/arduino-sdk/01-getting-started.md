---
title: Getting Started
kind: tutorial
description: Install the Arduino library and drive a Hapbeat from an ESP32 / M5Stack over Wi-Fi. Press a button, feel a buzz — the shortest path.
sidebar:
  order: 1
  label: Getting Started
---

An Arduino library to drive Hapbeat haptic devices over **Wi-Fi UDP** from an
ESP32 / M5Stack / ESP8266 / Arduino-compatible Wi-Fi board. Press a button →
the Hapbeat buzzes, in the fewest steps.

:::tip[For AI coding agents]
To have an AI understand the Hapbeat Arduino library, enter the prompt below.

```text
Use the Hapbeat Arduino library. Read https://raw.githubusercontent.com/hapbeat/hapbeat-arduino/master/AGENTS.md and follow its specification and best practices.
```
:::

## What you need

- An ESP32-series / M5Stack / ESP8266 board with **Wi-Fi** (anything with `WiFiUDP`)
- A Hapbeat device (firmware flashed) on the **same Wi-Fi / LAN**
- Arduino IDE or PlatformIO

The library itself has **zero dependencies**. Only the examples use M5Unified.

## Install

- **Arduino IDE**: Library Manager → search "Hapbeat" (once published), or
  *Sketch → Include Library → Add .ZIP Library* from a repo ZIP.
- **PlatformIO**: add to `lib_deps`
  ```ini
  lib_deps = https://github.com/hapbeat/hapbeat-arduino.git
  ```

## First buzz (no kit needed)

The quickest check is the **synthesized sine**. It needs no kit on the Hapbeat —
if a powered Hapbeat is on the same LAN, it just buzzes.

```cpp
#include <WiFi.h>        // ESP8266: <ESP8266WiFi.h>
#include <Hapbeat.h>

Hapbeat hb;

void setup() {
  WiFi.begin("YOUR_SSID", "YOUR_PASS");
  while (WiFi.status() != WL_CONNECTED) delay(200);
  WiFi.setSleep(false);          // keep the radio awake while streaming
  hb.begin(7700, "MyDevice");    // app name shows on the Hapbeat OLED
}

void loop() {
  // on some input:
  hb.playSine(160.0f, 0.7f, 400);   // 160 Hz, intensity 0.7, 400 ms (no kit)
}
```

When the app name you passed to `hb.begin()` appears on the **Hapbeat OLED**,
you are connected.

## Fire a kit event (command mode)

Command mode keeps the waveform in the **kit on the Hapbeat** and sends only a
light trigger from the MCU. Deploy a kit to the device first with
[Hapbeat Studio](https://devtools.hapbeat.com).

```cpp
hb.play("sample-kit.sine_100hz", 0.6f);   // the id must exist in the deployed kit
```

Event ids are `<kit-name>.<file-name>`. If `play(...)` does nothing, check the
kit is deployed (use the kit-free `playSine` to isolate the problem).

## What to read next

- [](/en/docs/sdk-integration/arduino-sdk/command-vs-sine/) — command vs sine
- [](/en/docs/sdk-integration/arduino-sdk/streaming/) — continuous, expressive sine
- [](/en/docs/sdk-integration/arduino-sdk/discovery/) — device discovery & targeting
- [](/en/docs/sdk-integration/arduino-sdk/api-reference/) — the API surface
