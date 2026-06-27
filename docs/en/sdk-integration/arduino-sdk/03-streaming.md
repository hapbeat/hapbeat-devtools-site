---
title: Synthesized sine streaming
kind: howto
description: One-shot playSine and the continuous beginSine / pumpSine / endSine loop for expressive, hold-to-play haptics — plus how to keep it smooth.
sidebar:
  order: 3
  label: Sine streaming
---

Synthesize a 16 kHz mono PCM16 sine on the MCU and stream it to the Hapbeat. No
stored audio, and frequency / intensity are live.

## One-shot

```cpp
hb.playSine(160.0f, 0.7f, 400);   // 160 Hz, intensity 0.7, 400 ms
```

`playSine` blocks for `durationMs`. Good for short haptic feedback.

## Continuous (hold / live control)

To buzz while a button is held, or to drive frequency from a sensor, use
**beginSine / pumpSine / endSine**. Call `pumpSine()` often from `loop()` to keep
the device ring buffer filled.

```cpp
void onPressDown() {
  hb.beginSine(160.0f, 0.8f);   // start a continuous sine
}

void loop() {
  // ... handle input ...
  if (hb.sineActive()) hb.pumpSine();   // call every loop (prevents dropouts)
}

void onPressUp() {
  hb.endSine();                 // stop
}
```

- `pumpSine()` sends a **bounded** number of chunks per call, so as long as you
  don't block `loop()` for ~160 ms+, it self-paces.
- To change frequency / intensity mid-stream, call `endSine()` and then
  `beginSine()` again with the new values.

## Reducing choppiness

Synthesized sine is sent over UDP, so Wi-Fi conditions can cause dropouts. To fix:

- Call **`WiFi.setSleep(false)`** after connecting (kills ESP32 modem-sleep jitter).
- **Use unicast**: broadcast UDP has no MAC-layer ACK / retry, so loss becomes
  audible gaps. `discover()` a single device and unicast to it, and the radio's
  MAC ACK + retry makes it far smoother (see
  [](/en/docs/sdk-integration/arduino-sdk/discovery/)).
- **Call `pumpSine()` frequently** from `loop()`. If heavy work stalls `loop()`,
  the device ring (~256 ms) starves and you hear gaps.

:::note
The sender keeps ~160 ms of audio buffered ahead, and combined with the device's
~256 ms ring this absorbs Wi-Fi jitter. With unicast, a retransmit turns a would-be
loss into a few ms of jitter the buffer absorbs; a broadcast "loss" is a true gap
the buffer cannot fill.
:::
