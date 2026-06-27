---
title: Discovery & targeting
kind: howto
description: Discover a device to enable unicast streaming, and address devices with target / group.
sidebar:
  order: 4
  label: Discovery
---

By default the library broadcasts to every Hapbeat on the LAN. Use discovery and
targeting to narrow to one device or to make streaming smoother.

## Connect and app name

```cpp
hb.begin(7700, "MyDevice");   // open the UDP socket; app name (<=16 chars) shows on the OLED
```

When the app name appears on the Hapbeat OLED you are connected. On exit, call
`hb.end()` to announce leaving (clears the OLED app name).

## Discover, then unicast

```cpp
hb.begin(7700, "MyDevice");
hb.discover(1500);            // broadcast PING -> PONG to learn the device IP
```

On success, streaming **unicasts** to that device. Wi-Fi unicast has MAC-layer
ACK + retry, so it is far smoother than broadcast (a good fix for dropouts). If
no device replies, it falls back to broadcast.

- `hb.deviceIp()` — the discovered IP
- `hb.setDeviceIp(ip)` — set the IP manually (force unicast without discovery)

:::note
Unicast is one-to-one. For fan-out to several devices at once, stay on broadcast
(don't call `discover()`).
:::

## Narrowing with target

The `target` argument of `play` / `playSine` / etc. selects the destination.

| target | meaning |
|---|---|
| `""` | broadcast to all devices |
| `"player_1/chest"` | a specific position / role |
| `"*/chest"` | wildcard match |
| `"group_<N>"` | filter by group id |

```cpp
hb.play("sample-kit.sine_100hz", 0.6f, "player_1/chest");
hb.stopAll("group_2");
```

Set the group id with `hb.setGroup(n)`; it is announced in CONNECT_STATUS
(level-1 default 0).

The `target` string (application-level addressing) and `discover()` IP unicast
(a transport reliability optimization) are **separate**. The simple model:
broadcast + `target` by default; unicast when you need it smooth.
