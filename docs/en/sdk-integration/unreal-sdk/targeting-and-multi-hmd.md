---
kind: explanation
sidebar:
  order: 6
  label: Targeting
---

# Targeting

<!-- hapbeat:include targeting-overview -->

## Configure in Unreal Engine

### Set an Event Map Target

Set the normal destination per Event Map entry. Open a `Hapbeat Event Map` in the Content Browser and edit an entry's `Target`. For example, `*/pos_neck` sends that entry only to Hapbeats at the neck, regardless of which Blueprint node or Trigger component plays it.

An Event Map Target belongs to the haptic effect itself. You do not need to duplicate the same Target on every Actor or component. The SDK unicast-sends to known devices, and the device also discards events whose Target does not match.

### Select an Address Override

Use Address Override when multiple HMDs or PCs share the same Event Map but only the destination should vary by device. The Event Map's Target remains unchanged; player / group are substituted only while sending.

- **this build** — Set `Forced Override Player` / `Forced Override Group` under **Project Settings → Plugins → Hapbeat → Addressing**. Use this to fix the destination for an exhibition build. `-1` is off.
- **this device** — Save and inspect the value in **Tools → Hapbeat → Hapbeat Runtime Status**. You can inspect the effective value during PIE. Use the API below or an Address Override Panel for an in-game UI.

Set Address Override on `Hapbeat Subsystem`.

```cpp
UHapbeatSubsystem* Hapbeat = GetGameInstance()->GetSubsystem<UHapbeatSubsystem>();
Hapbeat->SetAddressOverride(/* Player */ 1, /* Group */ -1, /* Persist */ true);
```

- Set `Player` / `Group` to `-1` to leave that axis unmodified.
- Enable `Persist` to restore the setting on the same device next time it starts.
- `Clear Saved Address Override (Hapbeat)` removes the saved value and turns non-forced axes off. An axis with `Forced Override Player / Group` remains fixed by the build and is not cleared.

In Blueprint, get `Hapbeat Subsystem` from `Get Game Instance Subsystem`, then use `Set Address Override (Hapbeat)`. Target construction and validation nodes are documented in [Blueprint nodes](./blueprint-nodes.md#7-target-nodes).

## When sending an event ID directly

Normally, play an Event Map entry. Only when an event ID must be constructed at runtime, use `Play Event (Hapbeat)` on `Hapbeat Subsystem`.

```cpp
UHapbeatSubsystem* Hapbeat = GetGameInstance()->GetSubsystem<UHapbeatSubsystem>();
Hapbeat->Play(TEXT("basic-exam-kit.sine_200hz_1s"), 0.8f,
    FString::Printf(TEXT("player_%d"), PlayerId));
```

This path does not use the Event Map's Clip, Gain, Target, or Delay. The target Kit event ID must already be deployed on the device.
