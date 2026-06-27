---
title: 合成 sine ストリーミング
kind: howto
description: playSine の一発再生と、beginSine / pumpSine / endSine による連続・表現的な sine ストリーミングの使い方。途切れ対策も。
sidebar:
  order: 3
  label: Sine streaming
---

MCU 上で 16 kHz mono PCM16 の sine を合成して Hapbeat に流します。保存音源は不要で、
周波数・強さをライブに変えられます。

## 一発再生（one-shot）

```cpp
hb.playSine(160.0f, 0.7f, 400);   // 160Hz・強さ0.7・400ms
```

`playSine` は `durationMs` の間ブロックします。短い触覚フィードバックに向きます。

## 連続再生（hold / ライブ制御）

押している間ずっと振動させたい、センサ値で周波数を動かしたい、といった用途では
**beginSine / pumpSine / endSine** を使います。`pumpSine()` を `loop()` から頻繁に呼んで、
デバイスのリングバッファを満たし続けます。

```cpp
void onPressDown() {
  hb.beginSine(160.0f, 0.8f);   // 連続 sine を開始
}

void loop() {
  // ... 入力処理 ...
  if (hb.sineActive()) hb.pumpSine();   // 毎ループ呼ぶ（途切れ防止）
}

void onPressUp() {
  hb.endSine();                 // 停止
}
```

- `pumpSine()` は 1 回の呼び出しで送るチャンク数が**上限つき**なので、`loop()` を
  長時間（おおよそ 160ms 以上）ブロックしなければ自動でペース調整されます。
- 連続中に周波数・強さを変えたい場合は、一度 `endSine()` してから新しい値で
  `beginSine()` し直します。

## 途切れ（choppiness）を減らす

合成 sine は UDP で送るため、Wi-Fi の状況で途切れることがあります。対策:

- **`WiFi.setSleep(false)`** を WiFi 接続後に呼ぶ（ESP32 の modem-sleep ジッタを排除）。
- **unicast を使う**: ブロードキャスト UDP は MAC 層の ACK / 再送が無く、ロスがそのまま
  途切れになります。`discover()` で 1 台を見つけて unicast すると、MAC ACK + 再送で
  大幅に滑らかになります（[](/docs/sdk-integration/arduino-sdk/discovery/) 参照）。
- **`pumpSine()` を `loop()` で頻繁に呼ぶ**。重い処理で `loop()` が長く止まると、
  デバイス側のリング（約 256ms）が枯渇して途切れます。

:::note
送信側は約 160ms 先読みでバッファし、デバイス側の約 256ms リングと合わせて Wi-Fi の
ゆらぎ（jitter）を吸収します。unicast では再送がゆらぎに変換され、このバッファが吸収する
ため滑らかになります。ブロードキャストの「欠落」はバッファでは埋められません。
:::
