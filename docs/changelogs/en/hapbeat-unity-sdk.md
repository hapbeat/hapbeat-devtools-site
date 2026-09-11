# Changelog

Hapbeat Unity SDK release notes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Breaking changes

- Removed `HapbeatManager.StopStreamWithFlush()`. Stop an individual source with returned `HapbeatStreamPlayback.Stop()`; use `StopStream()` for all sources.

### Changed

- Endpoint Stream sessions linger for at least 300 ms after their last source, so newly added sources can join without a BEGIN / END round trip. Re-BEGIN to the same endpoint also waits 300 ms after END.
- `HapbeatStreamPlayback` now has a stable lifetime `Id` and runtime-readable / writable `Loop`.

### Fixed

- Route / device-address changes migrate an endpoint session without crossing END / BEGIN routes or losing cursor position.
- Late-resolved endpoints start finite sources at frame 0 rather than sharing another endpoint's progress.

## [0.5.0] - 2026-08-27

### Breaking changes

- Removed legacy relay APIs (`HapbeatBridge`, `ConnectToBridge`, and bridge configuration). `WifiUdp` is the only command transport.

### Added

- Added simultaneous StreamClip output to multiple targets. Each PONG-resolved endpoint owns one wire stream; source Gain, Pan, Loop, and Stop remain independent.
- Added `HapbeatStreamPlayback.Status` / `DeferReason` for unresolved addresses.
- Added command-mode FIRE Pan (`-1` left, `0` center, `+1` right), requiring DEC-055-compatible device firmware for audible left/right change.

### Changed and fixed

- Standardized command transport as `WifiUdp`, removed legacy stream-unicast configuration, and fixed Unity 6000.0 LTS editor compatibility.

## [0.4.0] - 2026-08-06

- Improved unattended connection reliability, multi-homed-PC discovery, and Test Play delivery without requiring configuration changes.

## [0.3.0] - 2026-07-26

- Updated targeting and connection behavior for the current device-address model.

## [0.2.1] - 2026-05-30

- Maintenance release.

## [0.2.0] - 2026-05-26

- Added core SDK authoring and playback capabilities.

## [0.1.0] - 2026-05-11

- Initial public release.
