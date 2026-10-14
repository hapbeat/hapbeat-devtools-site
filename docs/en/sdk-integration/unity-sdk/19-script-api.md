---
title: Script API Reference
kind: reference
sidebar:
  order: 300
  label: Script API
description: A list of the public methods and properties of the Hapbeat Unity SDK that can be called from C# scripts (Trigger / HapbeatManager / HapbeatStreamPlayback / EventMap).
---

A list of the public members of the main classes used from C# scripts. For the overall flow of use, see [](/en/docs/sdk-integration/unity-sdk/scripting/).

- All namespaces are `Hapbeat` (`using Hapbeat;`)
- Target version: SDK 0.6.0
- For members not listed here, see the XML comments in the source ([Runtime/](https://github.com/hapbeat/hapbeat-unity-sdk/tree/master/Runtime))

## Which class to use

| What you want to do | What to use |
|---|---|
| Play / stop an EventMap entry | [HapbeatUnityEventTrigger](#hapbeatunityeventtrigger) |
| Three stages: grab → hold → release | [HapbeatSequenceTrigger](#hapbeatsequencetrigger) |
| Change the intensity / left-right balance of a CLIP while it plays | The Trigger's `GainMultiplier` / `Pan`, or [HapbeatStreamPlayback](#hapbeatstreamplayback) |
| Play without going through the EventMap, check connection state | [HapbeatManager](#hapbeatmanager) |
| Read an entry's settings from a script | [HapbeatEventMap / HapbeatEventEntry](#hapbeateventmap--hapbeatevententry) |

## Members common to all Triggers

`HapbeatUnityEventTrigger`, `HapbeatSequenceTrigger`, `HapbeatCollisionTrigger`, and `HapbeatTickEmitter` all inherit from the base class `HapbeatTriggerBase` and share the following members.

| Member | Type | Description |
|---|---|---|
| `GainMultiplier` | `float` (0–2) | A multiplier specific to this component. Final gain = entry Gain × Kit intensity × `GainMultiplier`. Rewriting it while a CLIP plays is reflected immediately |
| `Pan` | `float` (−1 to +1) | Left / right balance. −1 = left only, 0 = center, +1 = right only. Rewriting it while a CLIP plays is reflected immediately |
| `TriggerEnabled` | `bool` | While `false`, `Fire()` does not play |
| `ActivePlayback` | [`HapbeatStreamPlayback`](#hapbeatstreamplayback) | Handle of the CLIP this component is playing. `null` if nothing is playing |
| `EventMap` | `HapbeatEventMap` (read-only) | The EventMap assigned in the Inspector |
| `EntryId` | `string` (read-only) | ID (GUID) of the selected entry |
| `ResolveEntry()` | `HapbeatEventEntry` | Gets the settings of the selected entry. `null` if none is selected or it has been deleted |

Items set only in the Inspector (cannot be changed from a script): **Event Map**, **Event** (entry selection), **Cooldown** (minimum interval to prevent repeated firing, in seconds).

## HapbeatUnityEventTrigger

**Add Component → Hapbeat → Hapbeat UnityEvent Trigger**. A general-purpose Trigger for playing a single EventMap entry. This component is used both when calling from a script and when calling from a UnityEvent such as a Button's OnClick.

| Method | Description |
|---|---|
| `Fire()` | Plays the entry. For FIRE (Command), sends the Event ID; for CLIP (Stream), sends the AudioClip. A Loop entry keeps playing until `Stop()` |
| `Stop()` | Stops the haptics this component is playing |
| `FireWithGain(float gain)` | Plays with the given value as the final gain (the entry Gain, Kit intensity, and `GainMultiplier` are not applied). **For FIRE (Command) entries only**. To change the intensity of a CLIP entry, set `GainMultiplier` and then call `Fire()` |

In addition, the members of [Members common to all Triggers](#members-common-to-all-triggers) are available.

```csharp
[SerializeField] private HapbeatUnityEventTrigger _hit;

void OnHit(float power)
{
    _hit.GainMultiplier = power;   // 0–2
    _hit.Fire();
}
```

## HapbeatSequenceTrigger

**Add Component → Hapbeat → Hapbeat Sequence Trigger**. Handles "a one-shot at the start → a continuous loop → a one-shot at the end" in one component. In the Inspector, select **On Start** (the start one-shot), **Loop (hold)** (the continuous part, a CLIP entry with Loop enabled), and **On Stop** (the end one-shot). Set any stage you do not use to `(none)`.

| Member | Description |
|---|---|
| `Fire()` | Plays the On Start one-shot, then starts the Loop |
| `Stop()` | Stops the Loop and plays the On Stop one-shot |
| `FireWithStartGain(float gainMultiplier)` | Same as `Fire()`, but applies the multiplier only to the On Start one-shot (the Loop stays at the entry's gain) |
| `StartShotDelay` | Wait time from On Start to the start of the Loop (seconds). −1 = wait for the length of the On Start clip (default) |
| `StopShotDelay` | Wait time from the Loop stopping to On Stop (seconds, default 0.05) |

In addition, the members of [Members common to all Triggers](#members-common-to-all-triggers) are available (`GainMultiplier` / `Pan` / `ActivePlayback` act on the Loop).

## HapbeatCollisionTrigger / HapbeatTickEmitter

These normally work from Inspector settings alone, so there are few methods to call from a script. For the settings, see [](/en/docs/sdk-integration/unity-sdk/triggers/).

| Class | Member | Description |
|---|---|---|
| `HapbeatTickEmitter` | `Fire(float value)` / `Fire(Vector2 value)` | Passes a continuous value. Plays each time the change from the last value exceeds the threshold |
| | `FireNow()` | Plays once regardless of the threshold |
| | `TickThreshold` | How much the value must change before it plays |
| | `ResetReference()` | Resets the reference point of the change |
| `HapbeatParameterBinding` | `SetValue(float v)` | Passes an input value from a script when Source Property is `External` |

## HapbeatStreamPlayback

A handle for each CLIP (Stream) playback. You get it as a Trigger's `ActivePlayback` or as the return value of `HapbeatManager.StreamAudioClip()`.

| Member | Type | Description |
|---|---|---|
| `Gain` | `float` (0–2) | Intensity during playback. Rewriting it is reflected from the next data sent |
| `Pan` | `float` (−1 to +1) | Left / right balance |
| `Loop` | `bool` | Whether to loop. Can be switched during playback |
| `ApplyGainModulation(float m)` | — | Sets `Gain = BaselineGain × m`. `BaselineGain` is the reference gain at the start of playback (via a Trigger, the entry Gain × Kit intensity). A Trigger's `GainMultiplier` calls this internally as well |
| `Stop()` | — | Stops only this playback (does not stop other CLIPs playing on the same device) |
| `IsStopped` | `bool` | `true` once stopped or played to the end |
| `IsActive` | `bool` | `true` once sending to the device has started (`false` until a destination is found) |
| `Status` | `HapbeatStreamPlaybackStatus` | `Deferred` (waiting for a destination) / `Active` / `Stopped` |

## HapbeatManager

A singleton on `[Hapbeat Event Router]` that handles communication with devices. Get it with `HapbeatManager.Instance` (`null` if it is not in the scene).

### Play / stop

These send directly without going through the EventMap. The EventMap's Gain, Target, Kit intensity compensation, and latency compensation are not applied, so pass every value as an argument.

| Method | Description |
|---|---|
| `Play(string eventId, float gain = 1, string displayName = null, string target = null, float pan = 0)` | FIRE (Command). Plays `eventId` (`<kit name>.<event name>`) from the Kit deployed on the device. `target` is the destination (empty = all devices; format: [](/en/docs/sdk-integration/unity-sdk/targeting/)) |
| `Stop(string eventId, string displayName = null, string target = null)` | Stops playback of the given Event ID |
| `StopAll(string target = null)` | Stops everything playing on the device |
| `StreamAudioClip(AudioClip clip, float gain = 1, string target = null, bool loop = false)` | CLIP (Stream). Sends and plays an AudioClip, and returns a [`HapbeatStreamPlayback`](#hapbeatstreamplayback) (`null` if not connected or the clip is null) |
| `StopStream()` | Stops all CLIPs being sent |

### Connection state

| Member | Description |
|---|---|
| `IsConnected` | `true` when ready to send |
| `IsAlive` / `AliveDeviceCount` | Whether any device is responding / how many |
| `DiscoveredDevices` | List of discovered devices |
| `Ping()` | Sends a connectivity check to the devices. The response arrives via `OnPong` |
| `OnConnected` / `OnDisconnected` | Events on connect / disconnect (`Action`) |
| `OnPong` | Response to Ping (`Action<long>`, round-trip time in µs) |
| `OnError` | Errors (`Action<string>`) |

### Overriding the destination

| Method | Description |
|---|---|
| `SetAddressOverride(int player, int group, bool persist = false)` | Overrides the player / group of every subsequent send at runtime (−1 = do not override that axis). `persist: true` keeps it for the next launch. For details, see [](/en/docs/sdk-integration/unity-sdk/targeting/) |

## HapbeatEventMap / HapbeatEventEntry

Classes for reading the contents of an EventMap (`.asset`) from a script. Triggers normally read it, so you do not need to touch these directly. Use them when you want to call `HapbeatManager` without a Trigger while still making use of the EventMap settings (example: the Showcase's [`ChargeShooter.cs`](https://github.com/hapbeat/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/ChargeShooter.cs)).

| `HapbeatEventMap` method | Description |
|---|---|
| `FindByName(string displayName)` | Finds an entry by the Name in the EventMap window |
| `FindByEventId(string eventId)` | Finds an entry by Event ID (`<kit name>.<event name>`) |
| `FindById(string id)` | Finds an entry by its GUID |
| `entries` | List of all entries |

| `HapbeatEventEntry` member | Description |
|---|---|
| `mode` | `HapticMode.Command` (FIRE) / `HapticMode.StreamClip` (CLIP) |
| `eventId` | Event ID (the string sent in FIRE) |
| `streamClip` / `loop` | The AudioClip sent in CLIP / whether it loops |
| `GetEffectiveGain()` | Entry Gain × Kit intensity (the reference value of the intensity actually sent) |
| `target` / `HasTarget` | The destination / whether a destination is specified |

```csharp
// Play a CLIP directly from the Manager, using the EventMap's settings
var entry = _eventMap.FindByName("player_damage");
if (entry != null && entry.mode == HapticMode.StreamClip)
{
    HapbeatManager.Instance?.StreamAudioClip(
        entry.streamClip,
        entry.GetEffectiveGain(),
        entry.HasTarget ? entry.target : null,
        entry.loop);
}
```
