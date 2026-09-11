# Changelog

## [0.1.0] - 2026-09-10

- Replaced the single-stream runner with endpoint-scoped StreamHub sessions. Each exact PONG endpoint receives one unicast STREAM session, while logical sources on that endpoint mix independently with Gain, Pan, Loop, and Stop.
- Stream output is normalized to 16 kHz stereo PCM16. Unresolved sources remain `Deferred(NoResolvedEndpoint)` and never broadcast STREAM packets; empty endpoint sessions linger for 300 ms before END.
- An unambiguous logical-route change migrates its endpoint session in place, preserving runner and cursors without END / BEGIN. Exact endpoints sharing only an IP or address remain separate; ambiguous routes are not collapsed.
- Runtime `Playback.Loop` is authoritative for existing, late, and rejoined endpoints. An EOF source can rejoin at frame 0 when Loop is enabled.
- Removed remaining public runnable broadcast-fallback parameters. STREAM sessions accept exact unicast endpoints only.

### Fixed

- Test Play now collects PONG replies and unicasts to known devices, falling back to broadcast only when no device is known.
- SDK send failures are surfaced once per failure period and report recovery without flooding Output Log.
- Multi-homed-PC discovery now targets each local subnet instead of relying only on limited broadcast.
