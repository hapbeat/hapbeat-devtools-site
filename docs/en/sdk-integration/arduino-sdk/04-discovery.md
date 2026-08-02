---
title: Discovery & targeting
kind: howto
description: Discover devices for unicast sending, and address them with target.
sidebar:
  order: 4
  label: Discovery
---

Sending is **unicast** per device by default; broadcast is the fallback only
while no device has been found yet.

## Connect and app name

```cpp
hb.begin(7700, "MyDevice");   // open the UDP socket; app name (<=16 chars) shows on the OLED
```

When the app name appears on the Hapbeat OLED you are connected. On exit, call
`hb.end()` to announce leaving (clears the OLED app name).

## Discovery

```cpp
hb.begin(7700, "MyDevice");
hb.discover(1500);            // broadcast PING -> register every device that replies

void loop() {
  hb.ping();                  // every few seconds — keeps unicast destinations alive
  // ...
}
```

`discover()` waits out the whole timeout and registers **every** device that
replies (up to 8). From then on `play` / `stop` / `stopAll` and streaming
unicast to all of them. If nobody replies, sending falls back to broadcast as
before.

**Why broadcast is slow**: whenever a single power-saving client is associated
with the AP, the AP buffers group-addressed frames until its next DTIM beacon
(100–300 ms). Nothing on the Hapbeat can avoid it — the cause is an unrelated
client. Broadcast frames also get no MAC-layer ACK/retry and go out at the
lowest rate. Unicast avoids both.

Devices leave the table if they go quiet for longer than the liveness window
(15 s default), so call `ping()` every few seconds from `loop()`. Once the table
empties, sending returns to broadcast automatically.

| API | Purpose |
|---|---|
| `hb.deviceCount()` | live known devices (0 = sends broadcast) |
| `hb.deviceIp()` | first known device IP (single-device sketches) |
| `hb.setDeviceIp(ip)` | pin an IP (no discovery needed, never expires); `0.0.0.0` clears |
| `hb.poll()` | consume arrived PONGs (optional — sends do it too) |
| `hb.setDeviceTimeout(ms)` | liveness window (default 15000) |
| `hb.setBroadcastOnly(true)` | always broadcast |

:::note
For firing many devices in **lockstep**, broadcast is better: one send reaches
them all at once, while unicast goes out device by device, spreading the first
and last apart (~3–8 ms over 20 devices). Use `setBroadcastOnly(true)` there.
:::

## Narrowing with target

The `target` argument of `play` / `playSine` / etc. selects the destination.
The device applies the same check on receipt, so however the packet is routed, a
device the target excludes never fires.

Device addresses are always `player_<N>/<position>/group_<M>` (defaults
`player_1` / `group_1`). Matching is **positional**: segment *i* of the target is
compared only with segment *i* of the address.

| target | meaning |
|---|---|
| `""` | every device |
| `"player_1"` | every device of player 1 (front match) |
| `"player_1/pos_neck"` | just that position |
| `"*/pos_neck"` | that position on every player |
| `"*/*/group_2"` | devices in group 2 |

```cpp
hb.play("sample-kit.sine_100hz", 0.6f, "player_1/pos_neck");
hb.stopAll("*/*/group_2");
```

:::caution
- **`"group_2"` on its own does not work.** Positional matching compares it with
  the *player* slot, so it can never match. Fill the earlier slots with `*`:
  `"*/*/group_2"`.
- **Partial wildcards are not supported.** `*` only works as a whole segment
  (`"player_1/pos_*"` does not match; `"player_1/*"` does).
:::

`hb.setGroup(n)` is the sender's group id carried in CONNECT_STATUS — a
different thing from the `group_<N>` segment of a target.
