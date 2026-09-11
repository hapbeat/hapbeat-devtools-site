# Changelog

Hapbeat Studio release notes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/). The current site follows the version in `master`; versioned `/vX.Y/` URLs are created from release tags.

## [Unreleased]

### Added

- Shows a dismissible header notice when a newer Helper is available; it stays dismissed until a still newer version exists.
- Shows a firmware-update badge only when a newer firmware version can be determined unambiguously for the device board and transport.
- Shows a latest-version notice only on a versioned Studio URL.

## [0.7.0] - 2026-07-27

### Fixed

- Blocks Save Folder and Deploy when distinct Kit Events use the same Event ID, while continuing to allow one BOTH-mode Event.
- Makes continuous Kit edits update in-memory state immediately and coalesces disk metadata writes; Save Folder and Deploy snapshot the latest values.
- Reports stalled deployment, Save Folder causes and failed paths, rather than retrying silently.
- Avoids duplicate encoded WAV files for Events sharing the same audio and refreshes Kit lists from the selected working folder.
- Preserves user files: stale output is not deleted, archive removes only after a successful move, and incomplete sources block partial manifest / deploy.

## [0.6.0] - 2026-07-22

### Added

- DuoWL v4 audio-DSP controls, receiver haptic-EQ controls, SOLID48 runtime tuning, and additional button actions.

### Changed

- Firmware flashing targets only checked USB cards and resolves a race between USB configuration and auto-identification.

## [0.5.0] - 2026-07-12

- Added DuoWL v4 audio settings, I/O switching, USB connection-state indicators, auto-identification, card help, offline-card cleanup, and a device-safe demo mode.

## [0.4.0] - 2026-07-01

- Added Studio UI configuration workflows, device-management improvements, and deployment reliability fixes.

## [0.3.1] - 2026-06-29

- Improved Kit operations, device discovery, and user-facing error handling.

## [0.3.0] - 2026-06-26

- Added expanded device-management and Kit authoring capabilities.

## [0.2.1] - 2026-06-21

- Maintenance release for the initial Studio workflows.

## [0.2.0] - 2026-06-16

- Added core Kit, UI, and device-management functionality.

## [0.1.0] - 2026-06-16

- Initial public release of Hapbeat Studio.
