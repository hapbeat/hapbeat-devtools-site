# Changelog

## Unreleased

- Added `playSineSource(...)` and `tick()` for multiple simultaneous sine sources using fixed-capacity source / endpoint session hubs. Exact PONG addresses receive 16 kHz stereo PCM16 unicast; unresolved sources are `Deferred`; empty sessions linger 310 ms and END has a 310 ms cooldown.
- Removed the single-sine APIs `beginSine`, `pumpSine`, `endSine`, and `sineActive`.
- Added `pan` to `play()` (`-1` left, `0` center, `+1` right), serialized as float32 in PLAY.

## 0.2.0 — Multi-device tracking and command unicast

- PLAY / STOP / STOP_ALL now unicast to known PONG devices, with broadcast fallback when none is known. PING remains broadcast for discovery.
- Replaced the single-device address with a fixed-capacity table of up to eight devices, enabling multi-device command and stream delivery.
- `discover()` waits through the timeout to register every responder; stale devices expire from the table.
- Added `poll()`, `deviceCount()`, `setDeviceTimeout(ms)`, `setBroadcastOnly(bool)`, and persistent `setDeviceIp(ip)` semantics.
- Fixed PONG polling and route-change Stream continuity.

## 0.1.0 — Initial public release

- Initial Arduino library release.
