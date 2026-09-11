# Changelog

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `hapbeat-helper ota <target> <bin>` for CLI OTA of a development firmware build. It validates the app image, coordinates with a running Helper when present, and returns distinct error exit codes.
- PLAY `pan` support: `preview_event` accepts optional `pan`, clamps it to `[-1, 1]`, and transmits it with PLAY. STOP and STOP_ALL are unchanged.

### Fixed

- `python -m hapbeat_helper` now retains the CLI exit code.
- Console output on Japanese Windows code pages no longer fails on unsupported characters.
- Discovery on multi-homed PCs now sends PING to every local subnet and pins future discovery broadcasts to the subnet that replied with PONG. Playback continues to use a single route, avoiding duplicate haptic fire on older firmware.

### Changed

- For browser SDK endpoint-scoped multi-stream, `stream_begin` forwards the exact device address target to UDP STREAM_BEGIN.
- Declares `ifaddr` explicitly for local network-mask discovery.

## [0.3.1] - 2026-08-01

- Maintenance release for Helper discovery and deployment stability.

## [0.3.0] - 2026-07-22

- Added device-management and network-routing improvements used by Studio.

## [0.2.0] - 2026-07-02

- Added Helper workflows for discovery, configuration, and deployment.

## [0.1.4] - 2026-06-17

- Reliability maintenance release.

## [0.1.3] - 2026-05-26

- Added the capabilities required by current Studio management workflows.

## Earlier versions

- Initial local bridge and device-discovery releases.
