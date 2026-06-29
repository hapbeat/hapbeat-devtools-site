---
title: Other frameworks (ESP-IDF, etc.)
kind: howto
description: Drive Hapbeat from non-Arduino frameworks (ESP-IDF / Mbed / Zephyr / bare-metal) by reusing the portable protocol core. Minimal porting steps and code.
sidebar:
  order: 6
  label: Other frameworks
---

The library is **two layers**, so you can drive Hapbeat from non-Arduino
environments **without writing a whole separate SDK**.

- **`HapbeatProtocol.{h,cpp}`** — framework-agnostic C++ (includes only `stdint.h` /
  `stddef.h` / `string.h`, no dynamic allocation). It just builds the wire bytes.
- **`Hapbeat.{h,cpp}`** — the transport layer that uses Arduino's `WiFiUDP`.

:::note
**If your board runs the Arduino framework, you don't need this page.** On
STM32duino / RP2040 / UNO R4 WiFi and any Arduino-framework board with a `WiFiUDP`,
just use `hapbeat/arduino` as-is (see
[](/en/docs/sdk-integration/arduino-sdk/getting-started/)). This page is for
frameworks that are **not Arduino**, such as ESP-IDF.
:::

## Option A: pull in Arduino as a component (quickest)

ESP-IDF can include **arduino-esp32 as a component**. With PlatformIO, name both
frameworks in `platformio.ini`:

```ini
[env:esp32-idf]
platform = espressif32
framework = arduino, espidf
board = esp32dev
lib_deps = hapbeat/arduino@^0.1.0
```

Arduino APIs (`WiFiUDP`, etc.) are then available inside the IDF project and the
library works **unchanged** — no porting needed.

## Option B: port to a native transport (clean)

Vendor `HapbeatProtocol.{h,cpp}` (MIT, two files) into your project and write
**only the send path** with your platform's UDP socket. The wire format is
**byte-compatible** with contracts, so the device needs no changes.

### Minimal example: ESP-IDF (lwIP sockets)

Bundle `src/HapbeatProtocol.{h,cpp}` and call it from C++ (`.cpp`). Wi-Fi is
assumed already connected via `esp_wifi` (e.g. `example_connect()`).

```cpp
#include "HapbeatProtocol.h"   // vendor the 2 files (framework-agnostic, MIT)
#include "lwip/sockets.h"
#include "lwip/inet.h"

static int      s_sock = -1;
static uint16_t s_seq  = 0;

void hapbeat_begin(void) {
  s_sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
  int on = 1;
  setsockopt(s_sock, SOL_SOCKET, SO_BROADCAST, &on, sizeof(on));  // allow broadcast
}

// Fire a kit event (command mode). Call after Wi-Fi is connected.
void hapbeat_play(const char *event_id, float gain) {
  uint8_t buf[256];
  size_t n = hapbeat::buildPlay(buf, sizeof(buf), ++s_seq,
                                event_id, /*target=*/"", /*targetTimeUs=*/0, gain);

  struct sockaddr_in dst = {};
  dst.sin_family      = AF_INET;
  dst.sin_port        = htons(7700);             // Hapbeat UDP port
  dst.sin_addr.s_addr = htonl(INADDR_BROADCAST); // 255.255.255.255 (all devices)

  sendto(s_sock, buf, n, 0, (struct sockaddr *)&dst, sizeof(dst));
}
```

```cpp
hapbeat_begin();
hapbeat_play("sample-kit.sine_100hz", 0.6f);   // on some input
```

Synthesized sine is the same idea: build `buildStreamBegin` → `buildStreamData`
(continuous, running offset) → `buildStreamEnd`, send them on the same socket, and
keep ~160 ms of lead-buffer pacing (see
[](/en/docs/sdk-integration/arduino-sdk/streaming/) and the Arduino `Hapbeat.cpp`).

### Mbed / Zephyr / bare-metal

Same shape: build the packet with `HapbeatProtocol`, send to
`<broadcast or device IP>:7700` with your platform's UDP API.

- **Mbed**: `UDPSocket sock; sock.open(net);` then
  `sock.sendto(SocketAddress("255.255.255.255", 7700), buf, n);` (call `open()`
  with your network interface before sending; broadcast may need
  `set_broadcasting()`, while unicast to a device IP always works).
- **Zephyr**: BSD sockets (`zsock_socket` / `zsock_sendto`).
- **Bare-metal**: the UDP send of whatever TCP/IP stack you use (e.g. raw lwIP).

## Key points

- **Only the transport (send path) is ported.** The protocol / wire format is
  shared via `HapbeatProtocol`, and the device is unchanged.
- Send to **broadcast `255.255.255.255:7700`** (all devices), or to a device IP
  learned via `PING` → `PONG` (`buildPing`) for low-loss **unicast** (one device).
- This is not a separate SDK — it is a **transport port that shares the same
  protocol core** (a future `hapbeat/espidf`, etc. would use the very same core).
