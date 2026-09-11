---
kind: howto
sidebar:
  order: 2
  label: Event Maps and playback
---

# Event Maps and playback

An Event Map is a Data Asset that centralizes the parameters of a haptic stimulus: Clip, Gain, Target, and Loop. Game code only decides when to play which entry; the Event Map adjusts the haptic type, intensity, destination, and duration.

## Create an Event Map

1. In the Content Browser, select **Add → Hapbeat → Hapbeat Event Map**.
2. Open the asset and add an entry.
3. Set its `Display Name` and playback method. `Stream Clip` uses a Clip asset; `Command` uses the `Category` and `Event Name` of a deployed Kit. Adjust `Gain`, `Pan`, `Target`, and `Loop` as needed.

Each entry has the following values:

- `Id`: an automatically assigned GUID. It keeps references stable when entries are reordered; do not enter it manually.
- `Clip`: the haptic clip to play, or an event already deployed to the device.
- `Gain`: base intensity.
- `Pan`: left/right placement.
- `Target`: logical address of the Hapbeat that receives the event.
- `Loop`: whether to continuously play a Stream Clip. Repeating a Command depends on the Kit definition.

When `Target` is empty, every connected Hapbeat is eligible. See [Targeting](./targeting-and-multi-hmd.md) to separate destinations for multiple HMDs using player / group.

## Play from Blueprint

Add `Play Event (Hapbeat)` to the Event Graph and specify its `Map` and `Entry`.

```text
Game event
  → Play Event (Hapbeat)
      Map: DA_HapbeatEventMap
      Entry: pickup
```

`Gain Multiplier`, `Pan`, and `Delay Seconds` are advanced pins. They adjust this call only, without changing the entry. A `Stream Clip` entry returns a `Hapbeat Stream Playback`, which can adjust Gain / Pan or Stop at runtime.

For node inputs and return values, see [Blueprint nodes](./blueprint-nodes.md#1-play-an-event-map-entry).

## Play from C++

`UHapbeatBlueprintLibrary` exposes the same Event Map path as the Blueprint nodes to C++.

```cpp
#include "HapbeatBlueprintLibrary.h"

UHapbeatBlueprintLibrary::PlayHapbeatEvent(
    this,
    EventMap,
    Entry,
    /* GainMultiplier */ 1.0f,
    /* Pan */ 0.0f,
    /* DelaySeconds */ 0.0f);
```

`UHapbeatSubsystem::Play(EventId, Gain, Target, Pan)` sends directly without an Event Map. Use it only when the event ID must be assembled at runtime or cannot be managed by a Data Asset.

See [C++ API](./cpp-api.md) for the API reference and guidance on direct delivery.

## Choose a playback method

| Goal | Use |
| --- | --- |
| Play one entry from a button, UI, or custom game event | `Play Event (Hapbeat)` |
| Watch Hit / Overlap and play an entry | `Hapbeat Collision Trigger` component |
| Combine start, held loop, and end | `Hapbeat Sequence` component |
| Continuously change a Stream Clip's Gain / Pan from a value | `Hapbeat Parameter Binding` component |
| Play a one-shot at each step of a knob or slider | `Hapbeat Tick Emitter` component |
