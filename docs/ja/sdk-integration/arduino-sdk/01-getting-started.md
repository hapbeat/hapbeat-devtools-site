---
title: Getting Started
kind: tutorial
description: ESP32 / M5Stack から Hapbeat を Wi-Fi で駆動する Arduino ライブラリの導入。ボタンを押すと Hapbeat が振動するまでを最短で。
sidebar:
  order: 1
  label: Getting Started
---

ESP32 / M5Stack / Arduino 互換の Wi-Fi ボードから、Hapbeat を **Wi-Fi UDP** で駆動する
Arduino ライブラリです。ボタンを押す → Hapbeat が振動、を最短で実現します。

:::tip[AI コーディングエージェントを使う方へ]
Hapbeat Arduino ライブラリを AI に把握させるには、下記プロンプトを入力してください。

```text
Hapbeat Arduino ライブラリを使います。https://raw.githubusercontent.com/hapbeat/hapbeat-arduino/master/AGENTS.md を読んで、その仕様とベストプラクティスに従ってください。
```
:::

## 必要なもの

- ESP32 系・M5Stack・ESP8266 など **Wi-Fi が使えるボード**（`WiFiUDP` が動くもの）
- Hapbeat 本体（ファーム書込済み）と、それと **同じ Wi-Fi / LAN**
- Arduino IDE もしくは PlatformIO

ライブラリ本体は**依存ゼロ**です。サンプルのみ M5Unified を使います。

## インストール

- **Arduino IDE**: ライブラリマネージャで「Hapbeat」を検索（公開後）。または repo の
  ZIP を *スケッチ → ライブラリをインクルード → .ZIP 形式のライブラリをインストール*。
- **PlatformIO**: `lib_deps` に追加
  ```ini
  lib_deps = https://github.com/hapbeat/hapbeat-arduino.git
  ```

## まずは振動させる（kit 不要・最短）

最初の動作確認は **合成 sine** が最短です。Hapbeat 側に kit を入れる必要がなく、
電源の入った Hapbeat が同じ LAN にいれば、そのまま振動します。

```cpp
#include <WiFi.h>        // ESP8266 の場合は <ESP8266WiFi.h>
#include <Hapbeat.h>

Hapbeat hb;

void setup() {
  WiFi.begin("YOUR_SSID", "YOUR_PASS");
  while (WiFi.status() != WL_CONNECTED) delay(200);
  WiFi.setSleep(false);          // ストリーミング時は無線をスリープさせない
  hb.begin(7700, "MyDevice");    // app 名は Hapbeat の OLED に表示される
}

void loop() {
  // ボタン等の入力で:
  hb.playSine(160.0f, 0.7f, 400);   // 160Hz・強さ0.7・400ms の合成 sine（kit 不要）
}
```

`hb.begin()` で渡した app 名が **Hapbeat の OLED に表示**されれば、接続成功の合図です。

## kit のイベントを鳴らす（command モード）

波形を Hapbeat 側の **kit** に持たせ、MCU からは軽量なトリガーだけ送るのが command
モードです。先に [Hapbeat Studio](https://devtools.hapbeat.com) で kit をデバイスに
deploy しておく必要があります。

```cpp
hb.play("sample-kit.sine_100hz", 0.6f);   // イベント id は deploy 済み kit に存在すること
```

イベント id は `<kit 名>.<ファイル名>` 形式です。`play(...)` で振動しないときは、
まず kit が deploy されているか確認してください（kit 不要の `playSine` なら切り分けに使えます）。

## 次に読む

- [](/docs/sdk-integration/arduino-sdk/command-vs-sine/) — command と sine の使い分け
- [](/docs/sdk-integration/arduino-sdk/streaming/) — 合成 sine の連続再生・表現
- [](/docs/sdk-integration/arduino-sdk/discovery/) — デバイス検出と宛先指定
- [](/docs/sdk-integration/arduino-sdk/api-reference/) — API 一覧
