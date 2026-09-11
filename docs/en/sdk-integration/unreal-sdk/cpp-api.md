---
kind: reference
sidebar:
  order: 3
  label: C++ API
---

# C++ API

Normally, play an Event Map entry: gameplay code selects *when* to play and which entry to use, while a Data Asset owns Clip, Gain, Target, and Loop.

## Choose a class first

- Play an Event Map entry: `UHapbeatBlueprintLibrary`.
- Reusable playback endpoint on an Actor: `UHapbeatTriggerComponent`.
- Send event ID / Clip directly: `UHapbeatSubsystem`.
- Adjust or stop one Stream: `UHapbeatStreamPlayback`.
- Convert an in-game continuous value to Gain / Pan: `UHapbeatParameterBinding`.
- Build or inspect Target: `UHapbeatTargetLibrary`.

`UHapbeatEventMap` is the Data Asset containing haptic entries; `FHapbeatEntryRef` references one entry in it. `FHapbeatEntryRef` stores a stable ID, so renaming or reordering entries does not change playback destination.

## Public classes

### Playback and connection

- `UHapbeatBlueprintLibrary` — static Event Map playback library: `PlayHapbeatEvent`, `StopHapbeatEvent`, `FireHapbeatTickFromValue`.
- `UHapbeatSubsystem` — per-GameInstance UDP, Command, and Stream execution: `Connect`, `Play`, `Stop`, `StopAll`, `PlayEntry`, `StopEntry`, `StreamClip`, `StopStream`, `Ping`.
- `UHapbeatStreamPlayback` — handle for one Stream source: `ApplyGainModulation`, `SetPan`, `SetLoop`, `Stop`, `GetStatus`.
- `UHapbeatTargetLibrary` — static Target-string and Address Override helpers: `BuildTarget`, `ParseTarget`, `ResolveTarget`, `ApplyAddressPlaceholders`, `AddressMatches`.

### Actor components

- `UHapbeatTriggerComponent` — base component that fires Event Map entries: `Fire`, `FireWithGain`, `FireScaled`, `FireWithCurve`, `Stop`, `SetGainMultiplier`, `SetStreamPan`.
- `UHapbeatCollisionTriggerComponent` — trigger from owner Hit / BeginOverlap: `TriggerEvent`, `GainMode`, `VelocityThreshold`, `VelocityCurve`, `bEnterOnly`.
- `UHapbeatSequenceComponent` — trigger for start shot, loop, and stop shot: inherited `Fire` / `Stop`, plus `StartEntryId`, `StopEntryId`, `StopShotDelay`.
- `UHapbeatTickEmitterComponent` — trigger that fires once per continuous-value threshold crossing: `FireFromValue`, `FireFromVector2D`, `FireNow`, `ResetReference`, `TickMode`, `TickThreshold`.
- `UHapbeatParameterBinding` — converts input to Stream Gain / Pan and writes it to Playback: `SetValue`, `EvaluateNow`, `GetCurrentInput`, `GetCurrentNormalized`, `GetCurrentOutput`.

### Assets, settings, and Animation Notifies

- `UHapbeatEventMap` — haptic-entry Data Asset: `Entries`, `FindById`.
- `FHapbeatEventEntry` — one Event Map entry: mode, event ID, Stream Clip, Gain, Pan, Target, Loop, delay.
- `FHapbeatEntryRef` — stable reference to an Event Map entry: `EntryId`, `IsSet`.
- `UHapbeatClip` — PCM16 Stream Clip Data Asset: `NumSamples`, `NumFrames`, `DurationSeconds`, `CreateFromWavBytes`.
- `UHapbeatConfig` — Project Settings: `Port`, `AppName`, `HapticDelaySeconds`, `bCommandUnicast`, `ForcedOverridePlayer`, `ForcedOverrideGroup`.
- `UHapbeatAnimNotify` — plays an entry on one animation frame: `EventMap`, `EntryId`, `GainMultiplier`.
- `UHapbeatAnimNotifyState` — plays at an animation range start and stops at its end: `EventMap`, `EntryId`, `GainMultiplier`.

`FHapbeatProtocol`, `FHapbeatStreamRunnable`, `FHapbeatStreamGainMirror`, and `HapbeatNetInterfaces` are internal transport implementation, not game-code APIs.

## Play an Event Map entry

`UHapbeatBlueprintLibrary::PlayHapbeatEvent` follows the same path as Blueprint `Play Event (Hapbeat)`. A Command entry sends a device event; a Stream Clip entry returns a `UHapbeatStreamPlayback` you can control at runtime.

```cpp
#include "HapbeatBlueprintLibrary.h"
#include "HapbeatEventMap.h"
#include "HapbeatStreamPlayback.h"

UHapbeatStreamPlayback* Playback = UHapbeatBlueprintLibrary::PlayHapbeatEvent(
    this,
    EventMap,
    Entry,
    /* GainMultiplier */ 1.0f,
    /* Pan */ 0.0f,
    /* DelaySeconds */ 0.0f);
```

- `EventMap`: `UHapbeatEventMap` asset.
- `Entry`: `FHapbeatEntryRef` inside that asset.
- `GainMultiplier`, `Pan`, `DelaySeconds`: per-call adjustments; authored asset values are unchanged.
- Return: `UHapbeatStreamPlayback` only for a Stream Clip entry. It is `nullptr` for Command entries and unresolved entries.

Stop a loop with the same Map and Entry:

```cpp
UHapbeatBlueprintLibrary::StopHapbeatEvent(this, EventMap, Entry);
```

## Adjust a Stream Clip at runtime

When `PlayHapbeatEvent` returns non-null, the entry is a Stream Clip. Keep the per-playback handle to change Gain, Pan, or loop without stopping other streams.

```cpp
if (Playback != nullptr)
{
    Playback->ApplyGainModulation(0.7f);
    Playback->SetPan(-0.25f);
    Playback->Stop();
}
```

This preserves baseline Gain, Target, and Clip authored in the Event Map. For continuous Gain / Pan updates, use `UHapbeatParameterBinding`.

## Give an Actor a Trigger

When an Actor repeatedly plays the same entry, add `UHapbeatTriggerComponent`. Set `EventMap` and `EntryId` in Details, then C++ only calls `Fire()` and `Stop()`.

```cpp
#include "HapbeatTriggerComponent.h"

HitTrigger->Fire();
HitTrigger->SetGainMultiplier(0.6f); // immediately updates Gain while a Stream plays
HitTrigger->Stop();
```

- `FireWithGain` multiplies authored entry Gain for this call.
- `FireScaled` normalizes velocity to 0–1 over a specified range and uses it as Gain.
- `FireWithCurve` uses a `UCurveFloat` value as the Gain multiplier.
- `GetActivePlayback` returns the `UHapbeatStreamPlayback` started by this Trigger, or `nullptr` for a Command entry.

Use `UHapbeatCollisionTriggerComponent` for collision firing and `UHapbeatSequenceComponent` for start / loop / stop. See [Blueprint nodes](./blueprint-nodes.md) for component Details and nodes.

## Send an event ID directly

Use `UHapbeatSubsystem` only when event ID or Target must be assembled at runtime. This path bypasses Event Map, so it does not use an entry's Clip, Gain, Target, Loop, or Delay.

```cpp
#include "HapbeatSubsystem.h"

UHapbeatSubsystem* Hapbeat = GetGameInstance()->GetSubsystem<UHapbeatSubsystem>();
Hapbeat->Play(TEXT("pickup"), 0.8f, TEXT("player_1/pos_chest"));
```

| Function | Purpose |
| --- | --- |
| `Connect(Port, AppName)` | Opens the UDP send socket. SDK initialization normally connects automatically; call explicitly only after changing connection settings. |
| `Play(EventId, Gain, Target, Pan)` | Plays an event ID already deployed to the device; bypasses Event Map. |
| `Stop(EventId, Target)` / `StopAll(Target)` | Stops directly played events. |
| `StreamClip(Clip, BaselineGain, InitialGain, Target, bLoop, InitialPan)` | Sends a PCM `UHapbeatClip` and returns a Playback handle for individual control. |
| `StopStream()` | Stops all running Stream sources. |
| `Ping()` | Requests PONG to discover reachable Hapbeats. |
| `IsConnected()` / `IsAlive()` / `GetAliveDeviceCount()` | Inspect socket state and presence / count of responsive devices. |

`IsConnected()` only means the UDP socket opened. After `Ping()`, use `IsAlive()` or `GetAliveDeviceCount()` to establish that a Hapbeat is reachable. See [Targeting](./targeting-and-multi-hmd.md) for Target format and Address Override.

## Switch destination at runtime

`SetAddressOverride(Player, Group, bPersist)` overrides player / group for later sends. Pass `UHapbeatSubsystem::AddressOverrideDisabled` (`-1`) for an axis to keep Target authored in Event Map or API.

```cpp
Hapbeat->SetAddressOverride(
    /* Player */ 2,
    /* Group */ UHapbeatSubsystem::AddressOverrideDisabled,
    /* bPersist */ true);
```

- `bPersist: true` saves to this machine for its next launch.
- `ClearPersistedAddressOverride()` removes saved values and turns off non-fixed axes. Config `ForcedOverridePlayer` / `ForcedOverrideGroup` take precedence over persisted and runtime values and remain after Clear.
- `GetOverridePlayer()` / `GetOverrideGroup()` return current runtime values.

| Target-library function | Effect |
| --- | --- |
| `BuildTarget(Player, Position, Group)` | Builds Target from player / position / group. All unspecified means an empty string (all devices). |
| `ParseTarget(Target, OutPlayer, OutPosition, OutGroup)` | Splits Target; unspecified axes are `-1` or empty. |
| `ResolveTarget(Target, OverridePlayer, OverrideGroup)` | Replaces only player / group in Target with override values. |
| `ApplyAddressPlaceholders(AppName, OverridePlayer, OverrideGroup)` | Replaces `<p>` / `<g>` in AppName with effective player / group or `-`. |
| `AddressMatches(Target, DeviceAddress)` | Tests whether a device Address matches Target. |

## Stream Playback handle

`UHapbeatStreamPlayback` is a handle for **only the one Stream playback** returned by `PlayHapbeatEvent` or `StreamClip`. It changes that source without stopping others.

| Function | Effect |
| --- | --- |
| `ApplyGainModulation(Value)` | Multiplies entry baseline Gain by `Value`, clamps it to 0–2, and applies it immediately. |
| `SetPan(Value)` | Sets left/right balance from `-1` to `1`. |
| `SetLoop(bLoop)` | Toggles loop. |
| `Stop()` | Stops only this handle's source. |
| `IsActive()` / `GetStatus()` / `GetDeferredReason()` | Inspect whether it is sending, waiting for a destination, or stopped. |

With `UHapbeatParameterBinding`, pass UI or game values with `SetValue()` and call `EvaluateNow()` once immediately after stream start. The input runs through configured range, curve, and output range, then applies to Gain or Pan on the Target Trigger's Playback.

## Project Settings class

`UHapbeatConfig` is the `UDeveloperSettings` backing `Project Settings → Plugins → Hapbeat`. Principal fields: UDP `Port`; device-display `AppName`; audio-sync `HapticDelaySeconds`; known-device unicast `bCommandUnicast`; build-fixed `ForcedOverridePlayer` / `ForcedOverrideGroup`. Do not normally change it from gameplay code; use Project Settings or `SetAddressOverride`.

## Playback contract and failure behavior

- Event Map identifiers are `FGuid`; Command device event IDs are `FString` (`category.eventName`). `FHapbeatEntryRef::EntryId` holds a GUID.
- `PlayHapbeatEvent` / `PlayEntry` return a handle only for Stream Clip. `nullptr` is normal for Command, but also occurs for unresolved entries or invalid Clips; validate before use.
- Before sending, Stream is normalized to 16 kHz / stereo PCM16 and mixed per destination. Mono materials can change Pan at runtime. Keep each source's returned handle to adjust or stop that source only.
- `Deferred` means sending has not begun, `Active` means sending, and `Stopped` means stopped. A handle remains valid even without a resolved destination. Do not interpret `IsActive() == false` as stopped; use `IsStopped()`.
- For Stream Clips, `StopEntry` stops **all sources in the Subsystem**. Stop one with `UHapbeatStreamPlayback::Stop()`. Command `StopAll(Target)` stops device events; use `StopStream()` for SDK Stream termination.
- Event Map delay is `max(0, HapticDelaySeconds + DelayOffsetSeconds + ExtraDelaySeconds)`. `StopEntry` uses global + entry delay but not per-call ExtraDelay. Direct `Play` / `StreamClip` do not use Event Map delay.
- Operate UObjects / components on the game thread. Hold Playback / asset references with `UPROPERTY()` and do not operate UObjects from the send worker thread.
- UDP fire requests and `OnFired` are not device playback-completion signals. Use PONG and device testing to verify delivery.

## C++-only helper APIs

`UHapbeatSubsystem` (`HapbeatSubsystem.h`):

```cpp
UHapbeatStreamPlayback* PlayEntry(UHapbeatEventMap* Map, FGuid EntryId,
    float GainMultiplier = 1.0f, bool bForceNonLoop = false,
    float Pan = 0.0f, float ExtraDelaySeconds = 0.0f);
void StopEntry(UHapbeatEventMap* Map, FGuid EntryId);
static bool TryGetPersistedAddressOverride(int32& OutPlayer, int32& OutGroup);
static void SavePersistedAddressOverride(int32 Player, int32 InGroup);
static void RemovePersistedAddressOverride();
static int32 NormalizeAddressOverride(int32 Value);
```

`bForceNonLoop` turns a Stream Clip into a one-shot. `TryGetPersistedAddressOverride` returns true if either stored key exists; an unset axis is `-1`. Save / Remove only change persisted data, not a running Subsystem; call `SetAddressOverride` / `ClearPersistedAddressOverride` for immediate effect. Normalize maps values outside `1..99` to `-1`.

`UHapbeatClip` (`HapbeatClip.h`):

```cpp
static bool ParseWav(const TArray<uint8>& WavBytes, int32& OutSampleRate,
    int32& OutChannels, TArray<uint8>& OutPcm16, FString& OutError);
static UHapbeatClip* CreateFromWavBytes(UObject* Outer, const TArray<uint8>& WavBytes);
```

These read RIFF/WAVE PCM16. `ParseWav` returns false and `OutError` on failure; `CreateFromWavBytes` returns `nullptr`. Created Clips are transient. `Pcm16` is little-endian interleaved data for all channels; `NumSamples()` is total sample count and `NumFrames()` divides it by channel count.

`FHapbeatEventEntry::GetEventId()` combines Category and EventName. `GetEffectiveGain()` multiplies authored Gain by stored manifest intensity (or uses Gain if intensity is unresolved). `UHapbeatStreamPlayback::GetStereoChannelGains(float& OutL, float& OutR)` returns linear-balance gains: center 1/1, left 1/0, right 0/1.

## Enumerations and conversions

- `EHapticMode`: `Command` / `StreamClip`.
- `EHapbeatStreamPlaybackStatus`: `Deferred` / `Active` / `Stopped`.
- `EHapbeatStreamDeferredReason`: `None` / `NoResolvedEndpoint`; not a delay duration or device error code.
- `EHapbeatCollisionEvent`: `Hit` / `BeginOverlap`; `EHapbeatGainMode`: `Fixed` / `VelocityScaled`. Velocity is cm/s; normalization is `clamp((speed - VelocityThreshold) / (MaxVelocity - VelocityThreshold), 0, 1)`, linear when no curve is set.
- `EHapbeatBindingSource`: `LocalPositionX` / `LocalPositionY` / `LocalPositionZ` (cm), `VelocityMagnitude` / `PositionDeltaMagnitude` (cm/s), `AngularVelocityMagnitude` (deg/s), `External` (`SetValue` input).
- `EHapbeatBindingCurve`: `Linear` is t, `EaseIn` is t², `EaseOut` is 1−(1−t)², `Exponential` is `(exp(3t)−1)/(exp(3)−1)`, `Custom` uses `CustomCurve` (linear if absent). t is input clamped from InputMin..InputMax to 0..1.
- `EHapbeatBindingOutput`: `StreamGain` / `StreamPan`. Curve result maps through OutputMin..OutputMax; Gain clamps baseline × output to 0..2, Pan clamps output to −1..1.
- `EHapbeatTickAxis`: `X` / `Y`; `EHapbeatTickMode`: `AbsolutePosition` crosses fixed marks, `AccumulatedMotion` measures motion from its last reference. TickThreshold shares the input's unit. 0 means every value change; one input produces at most 64 ticks. Cooldown can reduce fires.

## Header references

- [HapbeatBlueprintLibrary.h](https://github.com/hapbeat/hapbeat-unreal-sdk/blob/master/Source/HapbeatSDK/Public/HapbeatBlueprintLibrary.h)
- [HapbeatSubsystem.h](https://github.com/hapbeat/hapbeat-unreal-sdk/blob/master/Source/HapbeatSDK/Public/HapbeatSubsystem.h)
- [HapbeatStreamPlayback.h](https://github.com/hapbeat/hapbeat-unreal-sdk/blob/master/Source/HapbeatSDK/Public/HapbeatStreamPlayback.h)
- [HapbeatTriggerComponent.h](https://github.com/hapbeat/hapbeat-unreal-sdk/blob/master/Source/HapbeatSDK/Public/HapbeatTriggerComponent.h)
- [HapbeatParameterBinding.h](https://github.com/hapbeat/hapbeat-unreal-sdk/blob/master/Source/HapbeatSDK/Public/HapbeatParameterBinding.h)
- [HapbeatTargetLibrary.h](https://github.com/hapbeat/hapbeat-unreal-sdk/blob/master/Source/HapbeatSDK/Public/HapbeatTargetLibrary.h)
- [HapbeatConfig.h](https://github.com/hapbeat/hapbeat-unreal-sdk/blob/master/Source/HapbeatSDK/Public/HapbeatConfig.h)

## Public properties and function index

The tables list game-facing `UFUNCTION` plus editable or Blueprint-visible `UPROPERTY` declarations. For inherited members, refer to the base class. Internal network send-thread / packet-building APIs and Unreal lifecycle overrides are not included; the ordinary C++-only APIs are described above.

| Class | Header | Public properties | Public functions / events |
| --- | --- | --- | --- |
| `UHapbeatAnimNotify` | `HapbeatAnimNotify.h` | `EventMap`, `EntryId`, `GainMultiplier = 1.0f` (0–2) | — |
| `UHapbeatAnimNotifyState` | `HapbeatAnimNotify.h` | `EventMap`, `EntryId`, `GainMultiplier = 1.0f` (0–2) | — |
| `UHapbeatBlueprintLibrary` | `HapbeatBlueprintLibrary.h` | — | `PlayHapbeatEvent(WorldContextObject, Map, Entry, GainMultiplier = 1.0f, Pan = 0.0f, DelaySeconds = 0.0f) -> UHapbeatStreamPlayback*`; `StopHapbeatEvent(WorldContextObject, Map, Entry)`; `FireHapbeatTickFromValue(TickEmitter, Value)` |
| `UHapbeatClip` | `HapbeatClip.h` | `SampleRate`, `NumChannels` (Blueprint read-only) | `NumSamples() -> int32`; `NumFrames() -> int32`; `DurationSeconds() -> float` |
| `UHapbeatCollisionTriggerComponent` | `HapbeatCollisionTriggerComponent.h` | `TriggerEvent = Hit`, `GainMode = Fixed`, `TagFilter`, `VelocityThreshold = 0`, `MaxVelocity = 10`, `VelocityCurve`, `bEnterOnly = true`, `ContactSeparationSeconds = 0.2` | Inherits `UHapbeatTriggerComponent` |
| `UHapbeatConfig` | `HapbeatConfig.h` | `Port = 7700` (1–65535), `AppName`, `PingInterval = 5` (1–60), `StreamSendAheadSeconds = 0.05` (0.01–0.2), `bCommandUnicast = true`, `HapticDelaySeconds = 0` (0–0.5), `ForcedOverridePlayer = -1`, `ForcedOverrideGroup = -1` (both −1–99), `bEnableLogging = true`, `bVerboseLogging = false` | — |
| `FHapbeatEntryRef` | `HapbeatEntryRef.h` | `EntryId` | `IsSet()` |
| `FHapbeatEventEntry` | `HapbeatEventEntry.h` | `Id` (read-only), `Mode = Command`, `DisplayName`, `Category`, `EventName`, `Gain = 1` (0–2), `Pan = 0` (−1–1), `Target`, `bLoop = false`, `DelayOffsetSeconds = 0` (−0.2–0.2), `Notes`, `StreamClip`, `CachedManifestIntensity` (read-only) | `GetEventId()`; `GetEffectiveGain()` |
| `UHapbeatEventMap` | `HapbeatEventMap.h` | `Entries` | `FindById(Id, OutEntry) -> bool` |
| `UHapbeatParameterBinding` | `HapbeatParameterBinding.h` | `SourceProperty = External`, `InputMin = 0`, `InputMax = 1`, `CurveType = Linear`, `CustomCurve`, `OutputParameter = StreamGain`, `OutputMin = 0`, `OutputMax = 1`, `TargetTrigger` | `SetValue(Value)`; `EvaluateNow() -> float`; `GetCurrentInput() -> float`; `GetCurrentNormalized() -> float`; `GetCurrentOutput() -> float` |
| `UHapbeatSequenceComponent` | `HapbeatSequenceComponent.h` | `StartEntryId`, `StopEntryId`, `StopShotDelay = 0.05` (0–0.5) | Inherits Trigger `Fire` / `Stop` |
| `UHapbeatStreamPlayback` | `HapbeatStreamPlayback.h` | `Id`, `Status = Deferred`, `DeferredReason = NoResolvedEndpoint`, `BaselineGain = 1` (all read-only) | `ApplyGainModulation(Modulator)`; `SetPan(NewPan)`; `SetLoop(bNewLoop)`; `GetLoop() -> bool`; `Stop()`; `GetGain() -> float`; `GetPan() -> float`; `IsStopped() -> bool`; `IsActive() -> bool`; `GetStatus()`; `GetDeferredReason()` |
| `UHapbeatSubsystem` | `HapbeatSubsystem.h` | — | `Connect(InPort = 7700, InAppName = TEXT(""))`; `Play(EventId, Gain = 1, Target = TEXT(""), Pan = 0)`; `Stop(EventId, Target = TEXT(""))`; `StopAll(Target = TEXT(""))`; `Ping()`; `StreamClip(Clip, BaselineGain = 1, InitialGain = 1, Target = TEXT(""), bLoop = false, InitialPan = 0) -> UHapbeatStreamPlayback*`; `StopStream()`; override getters/setters; `IsConnected`; `GetAliveDeviceCount`; `IsAlive`; `IsStreaming`; `GetActivePlayback`; events `OnConnected`, `OnDisconnected`, `OnError`, `OnPong` |
| `UHapbeatTargetLibrary` | `HapbeatTargetLibrary.h` | — | `BuildTarget(Player = -1, Position = TEXT(""), Group = -1) -> FString`; `ParseTarget(Target, OutPlayer, OutPosition, OutGroup)`; `ResolveTarget(Target, OverridePlayer, OverrideGroup) -> FString`; `ApplyAddressPlaceholders(AppName, OverridePlayer, OverrideGroup) -> FString`; `AddressMatches(Target, DeviceAddress) -> bool` |
| `UHapbeatTickEmitterComponent` | `HapbeatTickEmitterComponent.h` | `TickMode = AbsolutePosition`, `TickThreshold = 0.1` (≥0), `Axis = Y`, `bEmitOnInitialValue = false` | `FireFromValue(Value)`; `FireFromVector2D(Value)`; `FireNow()`; `ResetReference()` |
| `UHapbeatTriggerComponent` | `HapbeatTriggerComponent.h` | `EventMap`, `EntryId`, `bTriggerEnabled = true`, `Cooldown = 0` (≥0), `GainMultiplier = 1` (0–2), `bVerboseLog = false`, event `OnFired` | `Fire()`; `FireWithGain(GainOverride)`; `FireScaled(Velocity, MinVelocity = 0, MaxVelocity = 10)`; `FireWithCurve(Value, Curve)`; `Stop()`; `SetGainMultiplier(NewMultiplier)`; `SetStreamPan(NewPan)`; `GetActivePlayback() -> UHapbeatStreamPlayback*` |
| `UHapbeatAddressOverridePanelComponent` | `HapbeatAddressOverridePanelComponent.h` | `bShowOnBeginPlay = false`, `bPersistOnApply = true`, `bShowCloseButton = true`, `bUseVRConfigLayout = false`, `TestEventId`, `ViewportHAlign`, `ViewportVAlign`, `ViewportPadding`, `ViewportSize` | `Show()`; `AttachToWidgetComponent(Target)`; `Hide()`; `Toggle()`; `IsShown() -> bool`; `MoveFocus(Horizontal, Vertical)`; `ActivateFocused()`; `ShowFocusHighlight()` |
| `UHapbeatEventLoggerComponent` | `HapbeatEventLoggerComponent.h` | `Label`, `bIncludeTimestamp = true`, `bAlsoDrawOnScreen = false` | `LogEvent(Tag)`; `LogBeginOverlap`; `LogEndOverlap`; `LogHit`; `LogClicked`; `LogReleased`; `LogBeginCursorOver`; `LogEndCursorOver`; `LogGrabbed`; `LogDropped`; `LogActivated`; `LogDeactivated` |
| `UHapbeatStatusOverlayComponent` | `HapbeatStatusOverlayComponent.h` | `MaxLogLines = 8` (≥1), `bShowOverlay = true` | `Log(Message)`; `ClearLog()` |
