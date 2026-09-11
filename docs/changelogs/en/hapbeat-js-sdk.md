# Changelog

`@hapbeat/sdk` follows [Keep a Changelog](https://keepachangelog.com/) and [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Added `play(id, { pan })` (`-1` left only, `0` center, `+1` right). Command events serialize pan in PLAY; Clip events apply it in the source mixer.
- Added endpoint-scoped `StreamHub`: sources at one endpoint normalize and mix as 16 kHz stereo PCM16, while different endpoints use independent sessions and cursors.
- `streamPcm()` and `openStream()` return source-level `StreamPlayback` with Gain, Pan, Loop, Status, and idempotent `stop()`.
- Added `playStream(eventId, opts)` for manifest Clips with a synchronous proxy handle during initial WAV loading.

### Changed

- Stream never broadcasts as a fallback. Finite unresolved sources are `Deferred`; live input drops rather than accumulating delayed data.
- Browser Helper stream messages now contain exact endpoint IP and full address target. Empty sessions linger 300 ms; route-only endpoint changes preserve session / offset.
- Removed legacy single-session `ClipStreamer` / `LiveStream` implementations.

### Validation

- `npm run build` and 52 transport / multi-stream / broadcast tests passed. Device and React Native hardware verification remains pending.

## [0.4.0] - 2026-08-09

- Ported multi-homed PC discovery and connection-routing fixes for Node / React Native direct UDP transport.

## [0.3.0] - 2026-08-03

- Added SDK transport and playback improvements.

## [0.2.1] - 2026-06-29

- Maintenance release.

## [0.2.0] - 2026-06-29

- Expanded JavaScript SDK capabilities.

## [0.1.0] - 2026-06-25

- Initial public release.
