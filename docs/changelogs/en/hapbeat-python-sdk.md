# Changelog

## Unreleased

### Added

- Integrated WifiUdp streaming into `StreamHub`. Multiple PCM / Clip sources mix as 16 kHz stereo PCM16 at the same endpoint and use independent sessions at different endpoints. `stream_pcm` and Clip APIs return per-source `StreamPlayback` with status, Gain, Pan, Loop, and Stop.
- Unresolved targets use `Deferred(NoResolvedEndpoint)` and never broadcast STREAM packets. Finite sources begin at frame 0 after PONG resolution.
- Added `pan` to `play()` and the CLI / OSC pathways (`-1` left, `0` center, `+1` right).

## 0.3.0 — Multi-homed discovery and send routing

- Sends discovery to each local subnet, fixes command discovery before direct play / stop, and suppresses repetitive per-packet send errors.
- Adds `hapbeat.netif.local_ipv4_subnets()` for local IPv4 / prefix enumeration.

## 0.2.0 — Command unicast

- Tracks multiple devices and unicasts command playback to responsive PONG endpoints, with broadcast fallback when none is known.

## 0.1.0 — Initial public release

- Initial Python SDK release.
