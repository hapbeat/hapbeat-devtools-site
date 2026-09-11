# Changelog

Firmware version is generated from git state. Tagged releases have no suffix; development builds use `<NEXT_RELEASE_VERSION>d<N>`.

## 0.4.1 (unreleased)

### Fixed — do not wait for periodic PING after Address Override changes

- Successful `set_address`, player / group button, device-name, and volume changes emit unsolicited PONG, allowing SDKs to resolve active Stream endpoints immediately.
- PONG is sent by UDP 7700 broadcast and exact unicast to up to eight recent PING senders, including SDKs using ephemeral receive ports.
- Existing PING replies and device-side Target filtering for PLAY / STOP / STOP_ALL are unchanged.

## 0.4.0 (2026-08-22)

### Added — FIRE PLAY Pan support (DEC-055)

- PLAY accepts optional little-endian float32 Pan: `-1` left, `0` center, `+1` right. Older SDK packets without Pan remain centered; values clamp to ±1.
- Stereo mixers apply linear left / right balance; mono material is duplicated before balance. Single-channel `band_v4_pwm` ignores Pan.
- Updated HIL wire-format tests. Verified Unreal SDK FIRE Pan left / center / right on DuoWL v3.

## 0.3.1 (2026-07-28)

- Updated Arduino-ESP32 to fix ESP32-S3 USB Serial identification and configuration after reconnect on Windows.

## 0.3.0 (2026-07-26)

- Canonicalized device addresses and consolidated Group into the address model (DEC-048).

## 0.2.0 (2026-06-18)

- Expanded production device transport and configuration behavior.

## 0.1.1 (2026-05-10)

- Maintenance release for the first production firmware line.

## 0.0.1–0.0.21 (2026-05)

- Pre-release hardware bring-up, board variants, transport, and initial device capabilities.
