---
title: 他フレームワークで使う（ESP-IDF 等）
kind: howto
description: Arduino 以外のフレームワーク（ESP-IDF / Mbed / Zephyr / ベアメタル）で Hapbeat を駆動する方法。プロトコルコアを流用した最小移植の手順とコード。
sidebar:
  order: 6
  label: 他フレームワーク
---

このライブラリは **2 層構造**です。これを利用すれば、Arduino 以外の環境でも
**フルの別 SDK を作らずに** Hapbeat を駆動できます。

- **`HapbeatProtocol.{h,cpp}`** — フレームワーク非依存の純 C++（include は `stdint.h` /
  `stddef.h` / `string.h` のみ・動的確保なし）。ワイヤのバイト列を生成するだけのコア。
- **`Hapbeat.{h,cpp}`** — Arduino の `WiFiUDP` を使うトランスポート層。

:::note
**別 MCU でも Arduino フレームワークなら、このページは不要です。** STM32duino / RP2040 /
UNO R4 WiFi など、Arduino フレームワーク上で `WiFiUDP` が使えるボードなら、`hapbeat/arduino`
をそのまま使えます（[](/docs/sdk-integration/arduino-sdk/getting-started/) 参照）。本ページは
**ESP-IDF など “Arduino ではない” フレームワーク**で使う場合の話です。
:::

## 方法 A: Arduino を component として取り込む（最短）

ESP-IDF は **arduino-esp32 を component** として取り込めます。PlatformIO なら
`platformio.ini` で両フレームワークを指定します。

```ini
[env:esp32-idf]
platform = espressif32
framework = arduino, espidf
board = esp32dev
lib_deps = hapbeat/arduino@^0.1.0
```

これで Arduino API（`WiFiUDP` 等）が IDF プロジェクト内で使え、ライブラリは**そのまま**動きます。
移植は不要です。

## 方法 B: ネイティブなトランスポートに移植する（きれい）

`HapbeatProtocol.{h,cpp}`（MIT・2 ファイル）を自分のプロジェクトに取り込み、**送信部だけ**
各 OS の UDP ソケットで書きます。ワイヤ仕様は contracts と **バイト互換**なので、デバイス側は
何も変えずに動きます。

### 最小例: ESP-IDF（lwIP ソケット）

`src/HapbeatProtocol.{h,cpp}` をプロジェクトに同梱し、C++（`.cpp`）から呼びます。Wi-Fi は
`esp_wifi`（例: `example_connect()`）で接続済みとします。

```cpp
#include "HapbeatProtocol.h"   // 2 ファイルを vendor する（フレームワーク非依存・MIT）
#include "lwip/sockets.h"
#include "lwip/inet.h"

static int      s_sock = -1;
static uint16_t s_seq  = 0;

void hapbeat_begin(void) {
  s_sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
  int on = 1;
  setsockopt(s_sock, SOL_SOCKET, SO_BROADCAST, &on, sizeof(on));  // broadcast を許可
}

// kit イベントを再生（command モード）。Wi-Fi 接続後に呼ぶ。
void hapbeat_play(const char *event_id, float gain) {
  uint8_t buf[256];
  size_t n = hapbeat::buildPlay(buf, sizeof(buf), ++s_seq,
                                event_id, /*target=*/"", /*targetTimeUs=*/0, gain);

  struct sockaddr_in dst = {};
  dst.sin_family      = AF_INET;
  dst.sin_port        = htons(7700);             // Hapbeat の UDP ポート
  dst.sin_addr.s_addr = htonl(INADDR_BROADCAST); // 255.255.255.255（全デバイス）

  sendto(s_sock, buf, n, 0, (struct sockaddr *)&dst, sizeof(dst));
}
```

```cpp
hapbeat_begin();
hapbeat_play("sample-kit.sine_100hz", 0.6f);   // ボタン等の契機で
```

合成 sine も同じ要領です。`buildStreamBegin` → `buildStreamData`（連続・running offset）→
`buildStreamEnd` を作って同じソケットで送り、約 160ms 先読みのペーシングを入れます
（[](/docs/sdk-integration/arduino-sdk/streaming/) と Arduino 実装 `Hapbeat.cpp` が参考）。

### Mbed / Zephyr / ベアメタル

同じ型です。`HapbeatProtocol` でパケットを作り、各プラットフォームの UDP API で
`<broadcast or 宛先 IP>:7700` へ送るだけ。

- **Mbed**: `UDPSocket sock; sock.open(net);` の後に
  `sock.sendto(SocketAddress("255.255.255.255", 7700), buf, n);`（送信前に
  ネットワークインターフェースで `open()` が必要。ブロードキャストは
  `set_broadcasting()` が要る場合があり、デバイス IP への unicast なら確実）。
- **Zephyr**: BSD ソケット（`zsock_socket` / `zsock_sendto`）。
- **ベアメタル**: 使用している TCP/IP スタック（lwIP raw 等）の UDP 送信。

## 要点

- **移植が要るのはトランスポート（送信）だけ**。プロトコル／ワイヤ仕様は `HapbeatProtocol`
  で共有され、デバイス側は不変。
- 送信先は **ブロードキャスト `255.255.255.255:7700`**（全機）か、`PING`→`PONG`（`buildPing`）
  で得たデバイス IP への **unicast**（1 台・低ロス）。
- これらは「Arduino ライブラリの代替 SDK」ではなく、**同じプロトコルコアを共有する
  トランスポート移植**です（将来 `hapbeat/espidf` 等として配布する場合も同じ核を使います）。
