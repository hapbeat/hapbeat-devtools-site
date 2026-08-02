---
title: デバイス検出と宛先指定
kind: howto
description: discover によるデバイス検出（unicast 化）と、target による宛先指定の使い方。
sidebar:
  order: 4
  label: Discovery
---

送信はデバイスごとの **unicast** が標準です。まだ 1 台も見つかっていない間だけ
ブロードキャストにフォールバックします。

## 接続と app 名

```cpp
hb.begin(7700, "MyDevice");   // UDP ソケットを開く。app 名（16 文字以内）は OLED に表示
```

app 名が Hapbeat の OLED に表示されれば接続成功の合図です。アプリ終了時は `hb.end()`
で離脱を通知します（OLED の app 名がクリアされます）。

## 検出

```cpp
hb.begin(7700, "MyDevice");
hb.discover(1500);            // ブロードキャスト PING → 応答した全デバイスを登録

void loop() {
  hb.ping();                  // 数秒おき。これで unicast 宛先が維持される
  // ...
}
```

`discover()` はタイムアウトいっぱい待って**応答した全デバイス**を宛先表に登録します
（最大 8 台）。以降 `play` / `stop` / `stopAll` とストリーミングはその全台へ unicast
されます。1 台も見つからなければ従来どおりブロードキャストで送ります。

**ブロードキャストが遅い理由**: Wi-Fi の AP は、同じ AP に省電力状態の端末が 1 台でも
いると group-addressed フレームを次の DTIM ビーコン（100〜300 ms 周期）まで保留します。
Hapbeat 側の設定では回避できません（原因は無関係な他端末のため）。加えてブロードキャストは
MAC 層の ACK / 再送が無く最低レートで送られるため落ちやすくなります。unicast はどちらの
影響も受けません。

宛先表のデバイスは、最後の PONG から一定時間（既定 15 秒）で外れます。`loop()` から
数秒おきに `ping()` を呼んでください。全部外れると自動でブロードキャストに戻ります。

| API | 用途 |
|---|---|
| `hb.deviceCount()` | 生存している既知デバイス数（0 ならブロードキャスト送信） |
| `hb.deviceIp()` | 最初の既知デバイス IP（1 台構成向け） |
| `hb.setDeviceIp(ip)` | IP を直接指定（検出不要・期限切れしない）。`0.0.0.0` で解除 |
| `hb.poll()` | 届いた PONG を取り込む（送信時にも自動で行うため任意） |
| `hb.setDeviceTimeout(ms)` | 生存判定の窓（既定 15000） |
| `hb.setBroadcastOnly(true)` | 常にブロードキャストで送る |

:::note
多数台を**厳密に同時発火**させたい場合はブロードキャストの方が有利です。1 回の送信で
全台に届くのに対し、unicast は台数分を順に送るため先頭と末尾に時間差が出ます
（20 台で 3〜8 ms 程度）。その場合は `setBroadcastOnly(true)` を使ってください。
:::

## 宛先を絞る（target）

`play` / `playSine` 等の `target` 引数で宛先を指定します。判定はデバイス側でも行われる
ため、送り先の選び方に関わらず「target に一致しないデバイスが鳴る」ことはありません。

デバイスのアドレスは常に `player_<N>/<position>/group_<M>` の正規形です（既定は
`player_1` / `group_1`）。照合は**位置ベース**で、i 番目のセグメント同士だけを比較します。

| target | 意味 |
|---|---|
| `""` | 全デバイス |
| `"player_1"` | player 1 のデバイス全部（前方一致） |
| `"player_1/pos_neck"` | その位置のデバイスだけ |
| `"*/pos_neck"` | 全 player の同じ位置 |
| `"*/*/group_2"` | group 2 のデバイス |

```cpp
hb.play("sample-kit.sine_100hz", 0.6f, "player_1/pos_neck");
hb.stopAll("*/*/group_2");
```

:::caution
- **`"group_2"` 単独は機能しません。** 位置ベース照合なので player スロットと比較され、
  絶対に一致しません。前のスロットを `*` で埋めて `"*/*/group_2"` と書きます。
- **部分ワイルドカードは使えません。** `*` はセグメント全体が `*` のときだけ有効です
  （`"player_1/pos_*"` は不一致、`"player_1/*"` は一致）。
:::

`hb.setGroup(n)` は CONNECT_STATUS に載せる送信側のグループ id で、宛先の
`group_<N>` とは別物です。
