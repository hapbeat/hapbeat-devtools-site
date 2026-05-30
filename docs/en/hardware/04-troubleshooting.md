---
title: Troubleshooting
kind: howto
description: Solutions for Hapbeat issues such as the device not starting, Wi-Fi connection failures, no vibration, or rapid battery drain — plus known issues and the improvement roadmap.
sidebar:
  order: 4
---

This page covers remedies for common Hapbeat problems and documents known issues in current hardware along with planned improvements.

## Device Won't Start (no OLED display)

### Dead Battery

- Charge via USB Type-C (red LED while charging → green LED when complete)
- Due to the LDO dropout voltage, an extremely depleted battery may prevent startup. Charge for 15–30 minutes and try again.

### Corrupted Firmware

- Connect via USB, then reflash firmware from Studio → Manage tab → Firmware
- If flashing fails, verify that the PC recognizes the ESP32 USB CDC device (Device Manager → Ports)

### Hardware Failure

- If the above steps do not resolve the issue, hardware failure is possible. Contact support.

## Wi-Fi Not Connecting

### Connecting to a 5 GHz Network

Hapbeat supports **2.4 GHz only**. It cannot connect to a 5 GHz-only SSID.

- Configure your router to use separate SSIDs for 2.4 GHz and 5 GHz
- Set smartphone hotspots to 2.4 GHz fixed mode

### Incorrect SSID / Password

Reconfigure from Studio → Manage tab → Wi-Fi, or via serial connection:

```
wifi set <SSID> <PASSWORD>
reboot
```

Details: [](/en/docs/tools/studio/initial-setup/)

### Weak Signal

- Instability often occurs when more than 10 m from the router
- Check RSSI on the OLED (below -70 dBm is weak)
- Retry closer to the router

## Device Not Appearing in Studio Manage Tab

If Wi-Fi is connected but the device doesn't appear in Studio:

- Confirm `hapbeat-helper` is running (check the connection status in the Studio header)
- Press the Refresh button in the Manage tab (triggers a Helper rescan)
- Verify that the PC and Hapbeat are on the same subnet
- Check that your firewall is not blocking UDP 7700 / TCP 7701
- In environments where mDNS is unavailable (e.g., corporate LAN), specify the device IP directly in Studio

## No Vibration

### Volume Is Set to 0

Check and raise the volume in Studio → Manage tab → Kit tab, or via serial:

```
vol set 64
```

### Kit Not Transferred

In Studio → Manage tab → Kit tab, confirm that a Kit containing the target Event ID is installed.

### Incorrect Event ID

Verify that the Event ID fired from the SDK / Studio matches the Event ID in the Kit. Event IDs are case-sensitive.

### Physical Actuator Failure

Run a direct vibration test via serial:

```
test vibe 100   # vibrate at intensity 100/128 for 1 second
```

If there is no output, suspect a wiring issue or failure in the vibration actuator (VCM / motor).

## Battery Drains Quickly / Inaccurate Battery Level

### BQ27220 Gauge Calibration

On a new board or after a battery replacement, DesignCapacity may not be set. Run via serial:

```
battery recover
```

## Error During OTA Update

- Connection dropped mid-update → reboot the device and retry from Studio
- Insufficient partition space → delete Kit files to free space, then retry
- Check the LogDrawer in Studio's Manage tab for detailed error messages

## Stuck in SoftAP Mode

After switching to AP mode with the button combo, to return to STA:

- Hold the same button combo (Duo: `btn_2` + `btn_5` / Band: `btn_c` + `btn_r`) for **3 seconds**
- Alternatively, **STA mode is automatically restored after 10 minutes** with no client connected
- If you can no longer connect via Studio + Helper, use USB Serial: `wifi mode sta` → `reboot`

For details, see [Hapbeat Overview - Switching SoftAP Mode](./overview/#switching-softap-mode).

---

## Known Issues and Improvement Roadmap

The following are recognized defects and limitations in current hardware, along with planned improvements in future revisions.

### Audio / Vibration Distortion at Low Battery

| Item | Details |
|---|---|
| Affected Model | Duo WL (current revision) |
| Symptom | When battery drops below 60%, strong haptic signals cause audio / vibration distortion |
| Cause | LDO regulator dropout voltage insufficient — power supply to the vibration actuators momentarily drops at low battery |
| Workaround | Keep battery above 60% / use while charging |
| Improvement Plan | Planned replacement with **TPS63802 (buck-boost converter)** in the next board revision for stable power delivery at low battery |

### No 5 GHz Wi-Fi Support

| Item | Details |
|---|---|
| Affected Model | All models |
| Symptom | Cannot connect to 5 GHz-only SSIDs |
| Cause | Physical specification of the built-in module (ESP32-S3-MINI-1) — only 2.4 GHz supported |
| Workaround | Configure router with separate 2.4 GHz / 5 GHz SSIDs, or set up a dedicated 2.4 GHz SSID |
| Improvement Plan | Considering migration to a dual-band module in a future model. No fix planned for current hardware. |

### Slow Reconnection After Long Uptime + Sleep Resume

| Item | Details |
|---|---|
| Affected Model | All models (also related to Helper behavior) |
| Symptom | After extended operation (several hours+), reconnection between Studio and the device can be slow immediately after the PC wakes from sleep |
| Cause | Under investigation (possibly multiple factors: DHCP lease renewal, mDNS cache, Helper timeout settings) |
| Workaround | Press the **Refresh button** in Studio's Manage tab to trigger a Helper rescan |
| Improvement Plan | Investigating log collection and improved auto-reconnect logic in `hapbeat-helper` |

### Battery Calibration Inaccuracy

| Item | Details |
|---|---|
| Affected Model | Newly shipped units / immediately after battery replacement |
| Symptom | Displayed battery level deviates from actual charge |
| Cause | BQ27220 gauge DesignCapacity not configured |
| Workaround | Run `battery recover` command via serial |
| Improvement Plan | Rolling out pre-flashing of DesignCapacity during the shipping process |

## Related Links

- [Hapbeat Overview](./overview/) — button operations, OLED display, SoftAP switching
- [Care Guide](./care/) — charging, cleaning, handling precautions
- [Specifications & Certifications](./specifications/) — hardware specifications
- [](/en/docs/tools/studio/initial-setup/) — initial setup
