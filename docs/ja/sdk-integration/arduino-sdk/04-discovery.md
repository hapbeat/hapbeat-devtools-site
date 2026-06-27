---
title: デバイス検出と宛先指定
kind: howto
description: discover によるデバイス検出（unicast 化）と、target / group による宛先指定の使い方。
sidebar:
  order: 4
  label: Discovery
---

標準ではブロードキャストで「LAN 上の全 Hapbeat」に送ります。1 台に絞ったり、
ストリーミングを滑らかにしたいときは検出と宛先指定を使います。

## 接続と app 名

```cpp
hb.begin(7700, "MyDevice");   // UDP ソケットを開く。app 名（16 文字以内）は OLED に表示
```

app 名が Hapbeat の OLED に表示されれば接続成功の合図です。アプリ終了時は `hb.end()`
で離脱を通知します（OLED の app 名がクリアされます）。

## 検出して unicast にする

```cpp
hb.begin(7700, "MyDevice");
hb.discover(1500);            // ブロードキャスト PING → PONG でデバイス IP を取得
```

`discover()` が成功すると、以降のストリーミングはそのデバイスへ **unicast** されます。
Wi-Fi unicast は MAC 層 ACK + 再送があり、ブロードキャストより大幅に滑らかです
（途切れ対策として有効）。見つからなければ自動でブロードキャストにフォールバックします。

- `hb.deviceIp()` — 検出した IP を取得
- `hb.setDeviceIp(ip)` — IP を手動指定（検出を介さず unicast を強制）

:::note
unicast は 1 台への送信です。複数台へ同時に送るファンアウト用途では、ブロードキャスト
（`discover()` を呼ばない）のままにします。
:::

## 宛先を絞る（target）

`play` / `playSine` 等の `target` 引数で宛先を指定できます。

| target | 意味 |
|---|---|
| `""` | 全デバイスにブロードキャスト |
| `"player_1/chest"` | 特定の位置/役割に一致するデバイス |
| `"*/chest"` | ワイルドカード一致 |
| `"group_<N>"` | グループ id で絞る |

```cpp
hb.play("sample-kit.sine_100hz", 0.6f, "player_1/chest");
hb.stopAll("group_2");
```

グループ id は `hb.setGroup(n)` で設定し、CONNECT_STATUS に載って通知されます（level-1 の既定は 0）。

宛先の `target` 文字列（アプリ層のアドレッシング）と、`discover()` による IP unicast
（トランスポートの信頼性最適化）は**別系統**です。基本はブロードキャスト + `target`、
滑らかさが要るときに unicast、と整理すると分かりやすいです。
