---
title: Specifications & Certifications
kind: reference
description: Hardware specifications for Hapbeat Duo WL / Band WL and wireless certification (TELEC) information.
sidebar:
  order: 3
---

This page summarizes the specifications for each Hapbeat model and the certification details for the built-in wireless module.

## Hardware Specifications

| Item | Duo WL (Necklace) | Band WL |
|---|---|---|
| MCU | ESP32-S3 (Wi-Fi 2.4 GHz / Bluetooth) | ESP32-S3 (Wi-Fi 2.4 GHz / Bluetooth) |
| Wireless Module | ESP32-S3-MINI-1 (Espressif) | ESP32-S3-MINI-1 (Espressif) |
| Communication | Wi-Fi UDP broadcast (primary) / ESP-NOW (optional) | Wi-Fi UDP broadcast (primary) / ESP-NOW (optional) |
| Haptic Output | 2 ch (left/right independent) / vibration actuators | 1 ch / vibration actuator |
| Display | OLED (128×32, SSD1306) + LED | OLED (128×32, SSD1306) + LED |
| Controls | 5 physical buttons + analog volume knob | 3 physical buttons |
| Battery | Lithium-ion (built-in, fixed) | Lithium-ion (built-in, fixed) |
| Battery Capacity | TBD mAh | TBD mAh |
| Continuous Use Time | TBD hours | TBD hours |
| Charging Port | USB Type-C | USB Type-C |
| Charge Time (est.) | TBD | TBD |
| Operating Temperature | 0°C to 35°C | 0°C to 35°C |
| Storage Temperature | 0°C to 35°C (recommended) | 0°C to 35°C (recommended) |
| Weight | TBD g | TBD g |
| Dimensions | TBD mm | TBD mm |

<small>* TBD fields will be updated when the shipping version is finalized. See the product page for the latest information.</small>

## Communication Specifications

| Item | Value |
|---|---|
| Wi-Fi Standard | IEEE 802.11 b/g/n (2.4 GHz band only — 5 GHz not supported) |
| Receive Ports | UDP 7700 (broadcast) / TCP 7701 (control / OTA) |
| Advertise | mDNS `_hapbeat._udp` |
| ESP-NOW | Channel configuration: synchronized with Bridge |
| Encryption | WPA2 (STA) / WPA2 or open (SoftAP) |

## Certification

### Wireless (Radio Law / TELEC)

Hapbeat contains the **ESP32-S3-MINI-1** Wi-Fi / Bluetooth module manufactured by Espressif. This module has obtained **Technical Conformity Certification (TELEC)** under Japan's Radio Law.

| Item | Value |
|---|---|
| Certification Number | **201-230385** |
| Certificate Holder | Espressif Systems (Shanghai) Co., Ltd. |
| Certification Date | 2023-06-13 |
| Certification Type | Construction Design Certification for Specified Radio Equipment |

Official certificate (PDF): [ESP32-S3-MINI-1 TELEC Certification (Espressif)](https://www.espressif.com/sites/default/files/ESP32-S3-MINI-1%20TELEC%20Certification.pdf)

Because Hapbeat incorporates this certified module **without modification**, no additional certification under the Radio Law is required for the finished Hapbeat product.

### Battery Safety

Hapbeat uses a fixed built-in lithium-ion battery. The following quality assurance measures are in place:

- Cells are sourced from partner factories that manufacture products **compliant with international safety standards (IEC 62133, etc.)**
- During Hapbeat assembly, **visual inspection and terminal voltage** of each battery is checked 100%
- Batteries are **not user-replaceable** and are permanently mounted

## Related Links

- [Hapbeat Overview](./overview/) — product lineup and button operations
- [Care Guide](./care/) — charging, handling precautions, disposal
- [Troubleshooting](./troubleshooting/) — known issues and improvement roadmap
- [](/en/docs/concepts/communication-model/) — design decisions behind Wi-Fi UDP / ESP-NOW
