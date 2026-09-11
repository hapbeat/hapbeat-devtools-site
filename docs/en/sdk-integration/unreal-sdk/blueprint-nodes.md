---
kind: reference
sidebar:
  order: 4
  label: Blueprint nodes
---

# Blueprint nodes

Hapbeat SDK nodes end in **`(Hapbeat)`**. Nodes without that suffix—such as `Create Widget`, `Add to Viewport`, and `Set Value`—are native Unreal Engine nodes. Operations UI and logging nodes supplied by the Samples module also use `(Hapbeat)`, but are not required product APIs.

## Choose a starting point

| Goal | Use |
| --- | --- |
| Play an entry once | `Play Event (Hapbeat)` |
| Watch for a Hit / Overlap | `Hapbeat Collision Trigger` component |
| Group start, loop, and stop | `Hapbeat Sequence` component |
| Modulate continuous playback with a slider / knob | `Hapbeat Parameter Binding` component |
| Play a one-shot for each control increment | `Hapbeat Tick Emitter` component |
| Choose an event ID, Clip, or target directly at runtime | `Hapbeat Subsystem` |

## 1. Nodes that play an Event Map

### Play Event (Hapbeat)

**Purpose:** Plays an Event Map entry. This is the usual entry point for a gameplay event.

- **Inputs:** `Map`, `Entry`; advanced pins are `Gain Multiplier`, `Pan`, and `Delay Seconds`.
- **Result:** A Command entry sends a device event. A Stream Clip entry returns a `Hapbeat Stream Playback` handle.
- **Effect on transmission:** Uses Clip / Gain / Target / Loop stored in the entry. `Gain Multiplier` multiplies authored Gain; `Pan` is added to authored Pan; `Delay Seconds` is added to Project Settings delay and the entry's Delay Offset.

```text
Gameplay event → Play Event (Hapbeat)
                 Map: DA_HapbeatEventMap
                 Entry: pickup
```

### Stop Event (Hapbeat)

**Purpose:** Stops an Event Map entry.

- **Inputs:** `Map`, `Entry`.
- **Result:** A Command entry sends STOP for its event / Target. A Stream Clip entry stops all Stream sources in this Subsystem. To stop only one playback, call `Stop Stream Playback (Hapbeat)` on the handle returned at play time.
- **Use it:** When the gameplay state that started a loop ends.

## 2. Components added to an Actor

Search for `Hapbeat` in Components **Add**. When `Event Map` is set, `Entry Id` becomes a picker for entries in that asset.

### Hapbeat Collision Trigger

**Purpose:** Fires an entry from Hit or Begin Overlap on the owner's Primitive Component. No Event Graph wiring is needed.

- `Trigger Event`: `Hit` or `Begin Overlap`.
- `Gain Mode`: fixed Gain or velocity-dependent `Velocity Scaled`.
- `Tag Filter`: limits the other collision participant by tag.
- `Velocity Threshold` / `Max Velocity` / `Velocity Curve`: convert collision velocity to Gain.
- `bEnterOnly`: treats sustained contact as one contact.

For Hit, enable **Simulation Generates Hit Events** on the colliding Primitive Component. For Overlap, enable **Generate Overlap Events**.

### Hapbeat Sequence

**Purpose:** Manages a start one-shot, held loop, and end one-shot as one component.

- `Start Entry Id`: start event played by `Fire`.
- `Entry Id`: loop Stream Clip started by `Fire`.
- `Stop Entry Id`: end event played after `Stop`.
- `Stop Shot Delay`: interval between stopping the loop and sending the end event.

Call `Fire Trigger (Hapbeat)` and `Stop Trigger (Hapbeat)` from gameplay events such as grab start and end.

## 3. Nodes shared by triggers

Collision / Sequence / Tick Emitter derive from `Hapbeat Trigger Component`. Drag a component reference into the Event Graph and call these nodes.

| Node | Input | Result / use |
| --- | --- | --- |
| `Fire Trigger (Hapbeat)` | none | Plays the configured entry unchanged. |
| `Fire Trigger With Gain (Hapbeat)` | `Gain Multiplier` | Multiplies the entry's Gain for this call. |
| `Fire Trigger Scaled (Hapbeat)` | input value, input min / max | Normalizes a value to 0–1 for Gain; useful for collision speed. |
| `Fire Trigger With Curve (Hapbeat)` | input value, `Curve Float` | Uses Curve output as Gain for a custom response curve. |
| `Stop Trigger (Hapbeat)` | none | Stops the entry started by this trigger. |
| `Set Trigger Gain Multiplier (Hapbeat)` | `Gain Multiplier` | Immediately updates Gain of the playing Stream Clip held by the trigger. |
| `Set Trigger Stream Pan (Hapbeat)` | `Pan` | Immediately updates Pan of the playing Stream Clip held by the trigger. |
| `Get Trigger Playback (Hapbeat)` | none | Returns the Stream Playback handle started by the component. |

`On Trigger Fired (Hapbeat)` occurs for a fire request that passed enabled-state, entry-resolution, and cooldown checks. Use it to connect matching SFX / VFX, but it does not guarantee device arrival or successful playback.

## 4. Stream Playback nodes

Store the return value from `Play Event (Hapbeat)` for a Stream Clip entry, or from `Play Stream Clip (Hapbeat)`, in a variable. Each handle represents one logical stream source.

| Node | Input | Result / use |
| --- | --- | --- |
| `Apply Stream Gain Modulation (Hapbeat)` | `Modulator` | Multiplies authored baseline Gain. `0` is silent, `1` is authored Gain, maximum `2`. |
| `Set Stream Pan (Hapbeat)` | `New Pan` | Sets `-1` left, `0` center, or `+1` right. Mono Clips are made stereo before sending, so this can change during playback. |
| `Set Stream Loop (Hapbeat)` | `Loop` | Changes loop on the playing stream. |
| `Get Stream Loop (Hapbeat)` | none | Returns current loop setting. |
| `Stop Stream Playback (Hapbeat)` | none | Stops only this handle's stream. |
| `Get Stream Gain (Hapbeat)` | none | Returns current final Gain. |
| `Get Stream Pan (Hapbeat)` | none | Returns current Pan. |
| `Is Stream Playback Active (Hapbeat)` | none | True while stream chunks are being sent. |
| `Is Stream Playback Stopped (Hapbeat)` | none | True after a stop request or after a one-shot finishes. |
| `Get Stream Playback Status (Hapbeat)` | none | Returns a state such as `Active`, `Deferred`, or `Stopped`. |
| `Get Stream Deferred Reason (Hapbeat)` | none | Returns `None` or `NoResolvedEndpoint`; it is not a delay duration. |

Store a separate return value per simultaneously playing source. Z4 stores one loop handle and updates that handle's Gain / Pan from sliders.

## 5. Continuous values and ticks

### Hapbeat Parameter Binding

**Purpose:** Normalizes an input to `0..1`, applies a curve and output range, then updates Gain or Pan of a playing stream.

- `Source Property = External`: accepts a value from Blueprint; use it for UMG Sliders.
- `Input Min` / `Input Max`: input range.
- `Curve Type` / `Custom Curve`: input-to-output transformation.
- `Output Parameter`: `Stream Gain` or `Stream Pan`.
- `Output Min` / `Output Max`: output range.
- `Target Trigger`: Stream Clip trigger to update; select it when an Actor has multiple streams.

| Node | Input | Result / use |
| --- | --- | --- |
| `Set Binding Input (Hapbeat)` | `Value` | Stores the current External-source value. Connect a Slider's `On Value Changed` here. |
| `Update Stream Parameter (Hapbeat)` | none | Reads input immediately, normalizes it, transforms it through the curve and output range, then writes to the target stream. Its return value is the calculation result even with no target stream, so it is not a transmission-success signal. |
| `Get Binding Input (Hapbeat)` | none | Returns the last raw input. |
| `Get Binding Normalized Input (Hapbeat)` | none | Returns the `0..1` value after input range processing. |
| `Get Binding Output (Hapbeat)` | none | Returns the last calculated output, not device state or send completion. |

### Hapbeat Tick Emitter

**Purpose:** Fires an entry once each time an input crosses `Tick Threshold`. It is based on movement amount rather than time: faster movement creates more ticks.

- `Tick Mode`: `Absolute Position` uses fixed marks; `Accumulated Motion` sums each movement.
- `Tick Threshold`: input delta required for one tick. `0.1` means one tick per 0.1.
- `Axis`: X / Y used with Vector2D input.
- `bEmitOnInitialValue`: whether the first input produces a tick.

| Node | Input | Result / use |
| --- | --- | --- |
| `Fire Tick From Value (Hapbeat)` | `Value` | Supplies a one-dimensional slider / knob value. |
| `Fire Tick From Vector2D (Hapbeat)` | `Value` | Uses the configured axis of a Vector2D. |
| `Fire Tick Now (Hapbeat)` | none | Fires once without threshold testing. |
| `Reset Tick Reference (Hapbeat)` | none | Prevents unwanted consecutive ticks after code jumps a UI value. |

Parameter Binding changes a continuous stream value; Tick Emitter plays one-shots that communicate control movement. They can be used on the same slider.

## 6. Hapbeat Subsystem

Use `Get Game Instance Subsystem` to get `Hapbeat Subsystem`. Use it only when event ID, Clip, or Target must be chosen at runtime rather than through an Event Map.

### Connection and direct playback

| Node | Input | Result / use |
| --- | --- | --- |
| `Connect (Hapbeat)` | `Port`, `App Name` | Opens the UDP socket and makes the app able to receive PONG. |
| `Play Event (Hapbeat)` | `Event Id`, `Gain`, `Target`, `Pan` | Sends a Kit event ID directly; does not use an Event Map. |
| `Stop Event (Hapbeat)` | `Event Id`, `Target` | Stops the specified event. |
| `Stop All Events (Hapbeat)` | `Target` | Stops events on devices matching Target. |
| `Play Stream Clip (Hapbeat)` | `Clip`, baseline / initial Gain, `Target`, `Loop`, initial Pan | Streams a Clip directly and returns a source handle. |
| `Stop Streams (Hapbeat)` | none | Stops every stream source held by this Subsystem. |

### Connection state and diagnostics

| Node / event | Value | Use |
| --- | --- | --- |
| `Ping (Hapbeat)` | none | Discovers reachable devices and requests PONG. |
| `On Connected (Hapbeat)` | none | Fires when responsive device count changes from 0 to 1 or more. |
| `On Disconnected (Hapbeat)` | none | Fires when responsive device count changes from 1 or more to 0. |
| `On Error (Hapbeat)` | `Message` | Fires when a device returns an ERROR packet. |
| `On Pong (Hapbeat)` | endpoint, RTT, device name, address, firmware | Fires for every PONG; use for a device list or RTT display. |
| `Is Connected (Hapbeat)` | bool | Whether the UDP socket is open; does not guarantee a device exists. |
| `Get Alive Device Count (Hapbeat)` | int | Number of devices responding to PONG. |
| `Is Device Alive (Hapbeat)` | bool | Whether at least one device is responding to PONG. |
| `Is Streaming (Hapbeat)` | bool | Whether at least one endpoint stream session is operating. |
| `Get Active Stream Playback (Hapbeat)` | handle | Returns the first active source; store a play return value for source-specific control. |

## 7. Target nodes

Target is a logical filter for device addressing. Usually create it by editing an Event Map entry's `Target`; use these nodes when generating or validating it at runtime.

| Node | Input | Output / use |
| --- | --- | --- |
| `Build Target (Hapbeat)` | `Player`, `Position`, `Group` | Builds `player_1/pos_chest/group_2`; empty when all are unspecified. Use to assemble from UI or game state. |
| `Parse Target (Hapbeat)` | Target string | Outputs `Player`, `Position`, `Group`; missing numeric axes are `-1`, Position is empty. Use to return a Target to separate UI fields. |
| `Resolve Target (Hapbeat)` | authored `Target`, override `Player` / `Group` | Replaces only specified axes. Use to show or verify the effective Target under Address Override; Target is unchanged when both overrides are `-1`. |
| `Apply Address Placeholders (Hapbeat)` | app name with `<p>` / `<g>`, override `Player` / `Group` | Replaces placeholders with effective numbers; inactive axes become `-`. Use to display HMD numbers on the device OLED at connection. |
| `Does Address Match (Hapbeat)` | resolved `Target`, PONG `Device Address` | Returns whether a device matches Target. Empty Target matches every device. |

## 8. Address Override nodes

Address Override replaces only player / group axes of the Target for all sends. It does not change Event Map or Trigger component settings. For one build across multiple HMDs, see [Targeting](./targeting-and-multi-hmd.md).

| Node | Input / output | Result / use |
| --- | --- | --- |
| `Set Address Override (Hapbeat)` | `Player`, `Group`, `Persist` | Replaces effective Target for subsequent Command / Stream sends. `-1` turns off that axis; `Persist` saves for the next launch. |
| `Clear Saved Address Override (Hapbeat)` | none | Removes saved settings and turns off player / group that are not build-fixed. Keeps Forced Override in the build. |
| `Get Override Player (Hapbeat)` | int | Returns current effective player, or `-1` when off. |
| `Get Override Group (Hapbeat)` | int | Returns current effective group, or `-1` when off. |

## 9. Operations and diagnostics nodes in Samples

These are helper components in the Samples module. A production UI can implement only needed behavior with native Unreal UI and `Hapbeat Subsystem`.

### Hapbeat Address Override Panel

| Node | Input / output | Result / use |
| --- | --- | --- |
| `Show Address Panel (Hapbeat)` | none | Shows the Address Override panel in the viewport. |
| `Attach Address Panel (Hapbeat)` | `Widget Component` | Shows the same panel in a world-space Widget Component for VR. |
| `Hide Address Panel (Hapbeat)` | none | Closes the viewport / world-space panel. |
| `Toggle Address Panel (Hapbeat)` | none | Toggles viewport-panel visibility. |
| `Is Address Panel Shown (Hapbeat)` | bool | Returns whether the panel is visible. |

Panel `Apply` calls `Set Address Override (Hapbeat)`, `Clear` calls `Clear Saved Address Override (Hapbeat)`, and `Test` sends a sample event to the current effective Target. See [VR Config Example](./vr-config-example.md) for VR use.

### Hapbeat Status Overlay

| Node | Input / output | Result / use |
| --- | --- | --- |
| `Log Status Message (Hapbeat)` | `Message` | Adds one line to the on-screen status log. |
| `Clear Status Log (Hapbeat)` | none | Clears the status log. |

This component also automatically displays connected / disconnected / PONG / error / stream transitions. It is for development-time state checks, not a replacement for shipping UI.

### Hapbeat Event Logger

| Node | Logged game event |
| --- | --- |
| `Log Event (Hapbeat)` | arbitrary event name |
| `Log Begin Overlap (Hapbeat)` / `Log End Overlap (Hapbeat)` | overlap start / end |
| `Log Hit (Hapbeat)` | hit |
| `Log Clicked (Hapbeat)` / `Log Released (Hapbeat)` | click / release |
| `Log Begin Cursor Over (Hapbeat)` / `Log End Cursor Over (Hapbeat)` | cursor-hover start / end |
| `Log Grabbed (Hapbeat)` / `Log Dropped (Hapbeat)` | grab / drop |
| `Log Activated (Hapbeat)` / `Log Deactivated (Hapbeat)` | activate / deactivate |

These nodes only record to Output Log and the sample display; they do not send haptics. Use them to isolate whether the game event occurred first.

## 10. Data Asset helper nodes

| Asset | Node | Result |
| --- | --- | --- |
| `Hapbeat Event Map` | `Find Event Entry (Hapbeat)` | Returns a copy of `Hapbeat Event Entry` from its GUID in `Out Entry`. The bool return value indicates lookup success. It is not an Entry Ref, so edits to the copy do not change the asset. |
| `Hapbeat Clip` | `Get Clip Sample Count (Hapbeat)` | Returns PCM sample count. |
| `Hapbeat Clip` | `Get Clip Frame Count (Hapbeat)` | Returns frame count. |
| `Hapbeat Clip` | `Get Clip Duration (Hapbeat)` | Returns duration in seconds. |

Normally use the Event Map Editor entry picker; call these from an Event Graph only when selecting assets dynamically.

## Implementation references

- [Blueprint Library](https://github.com/hapbeat/hapbeat-unreal-sdk/blob/master/Source/HapbeatSDK/Public/HapbeatBlueprintLibrary.h)
- [Trigger / Collision / Sequence](https://github.com/hapbeat/hapbeat-unreal-sdk/tree/master/Source/HapbeatSDK/Public)
- [Stream Playback](https://github.com/hapbeat/hapbeat-unreal-sdk/blob/master/Source/HapbeatSDK/Public/HapbeatStreamPlayback.h)
- [Parameter Binding](https://github.com/hapbeat/hapbeat-unreal-sdk/blob/master/Source/HapbeatSDK/Public/HapbeatParameterBinding.h)
- [Tick Emitter](https://github.com/hapbeat/hapbeat-unreal-sdk/blob/master/Source/HapbeatSDK/Public/HapbeatTickEmitterComponent.h)
- [Hapbeat Subsystem](https://github.com/hapbeat/hapbeat-unreal-sdk/blob/master/Source/HapbeatSDK/Public/HapbeatSubsystem.h)

## Node declaration index

All public `BlueprintCallable` / `BlueprintPure` functions. Nodes with the same title are distinguished by owning class. Argument types, defaults, and return types match their declarations. Non-const reference arguments are output pins; `WorldContextObject` is normally populated automatically. Component member functions take that component as Target. See the functional sections above for use and operational constraints.

| Node | Owner | Declaration |
| --- | --- | --- |
| `Play Event (Hapbeat)` | `UHapbeatBlueprintLibrary` | `PlayHapbeatEvent(WorldContextObject, Map, Entry, GainMultiplier = 1.0f, Pan = 0.0f, DelaySeconds = 0.0f) -> UHapbeatStreamPlayback*` |
| `Stop Event (Hapbeat)` | `UHapbeatBlueprintLibrary` | `StopHapbeatEvent(WorldContextObject, Map, Entry)` |
| `Fire Tick From Value (Hapbeat)` | `UHapbeatBlueprintLibrary` | `FireHapbeatTickFromValue(TickEmitter, Value)` |
| `Get Clip Sample Count (Hapbeat)` | `UHapbeatClip` | `NumSamples() -> int32` |
| `Get Clip Frame Count (Hapbeat)` | `UHapbeatClip` | `NumFrames() -> int32` |
| `Get Clip Duration (Hapbeat)` | `UHapbeatClip` | `DurationSeconds() -> float` |
| `Find Event Entry (Hapbeat)` | `UHapbeatEventMap` | `FindById(Id, OutEntry) -> bool` |
| `Set Binding Input (Hapbeat)` | `UHapbeatParameterBinding` | `SetValue(Value)` |
| `Update Stream Parameter (Hapbeat)` | `UHapbeatParameterBinding` | `EvaluateNow() -> float` |
| `Get Binding Input (Hapbeat)` | `UHapbeatParameterBinding` | `GetCurrentInput() -> float` |
| `Get Binding Normalized Input (Hapbeat)` | `UHapbeatParameterBinding` | `GetCurrentNormalized() -> float` |
| `Get Binding Output (Hapbeat)` | `UHapbeatParameterBinding` | `GetCurrentOutput() -> float` |
| `Apply Stream Gain Modulation (Hapbeat)` | `UHapbeatStreamPlayback` | `ApplyGainModulation(Modulator)` |
| `Set Stream Pan (Hapbeat)` | `UHapbeatStreamPlayback` | `SetPan(NewPan)` |
| `Set Stream Loop (Hapbeat)` | `UHapbeatStreamPlayback` | `SetLoop(bNewLoop)` |
| `Get Stream Loop (Hapbeat)` | `UHapbeatStreamPlayback` | `GetLoop() -> bool` |
| `Stop Stream Playback (Hapbeat)` | `UHapbeatStreamPlayback` | `Stop()` |
| `Get Stream Gain (Hapbeat)` | `UHapbeatStreamPlayback` | `GetGain() -> float` |
| `Get Stream Pan (Hapbeat)` | `UHapbeatStreamPlayback` | `GetPan() -> float` |
| `Is Stream Playback Stopped (Hapbeat)` | `UHapbeatStreamPlayback` | `IsStopped() -> bool` |
| `Is Stream Playback Active (Hapbeat)` | `UHapbeatStreamPlayback` | `IsActive() -> bool` |
| `Get Stream Playback Status (Hapbeat)` | `UHapbeatStreamPlayback` | `GetStatus() -> EHapbeatStreamPlaybackStatus` |
| `Get Stream Deferred Reason (Hapbeat)` | `UHapbeatStreamPlayback` | `GetDeferredReason() -> EHapbeatStreamDeferredReason` |
| `Connect (Hapbeat)` | `UHapbeatSubsystem` | `Connect(InPort = 7700, InAppName = TEXT(""))` |
| `Play Event (Hapbeat)` | `UHapbeatSubsystem` | `Play(EventId, Gain = 1.0f, Target = TEXT(""), Pan = 0.0f)` |
| `Stop Event (Hapbeat)` | `UHapbeatSubsystem` | `Stop(EventId, Target = TEXT(""))` |
| `Stop All Events (Hapbeat)` | `UHapbeatSubsystem` | `StopAll(Target = TEXT(""))` |
| `Ping (Hapbeat)` | `UHapbeatSubsystem` | `Ping()` |
| `Play Stream Clip (Hapbeat)` | `UHapbeatSubsystem` | `StreamClip(Clip, BaselineGain = 1.0f, InitialGain = 1.0f, Target = TEXT(""), bLoop = false, InitialPan = 0.0f) -> UHapbeatStreamPlayback*` |
| `Stop Streams (Hapbeat)` | `UHapbeatSubsystem` | `StopStream()` |
| `Set Address Override (Hapbeat)` | `UHapbeatSubsystem` | `SetAddressOverride(Player, InGroup, bPersist = false)` |
| `Clear Saved Address Override (Hapbeat)` | `UHapbeatSubsystem` | `ClearPersistedAddressOverride()` |
| `Get Override Player (Hapbeat)` | `UHapbeatSubsystem` | `GetOverridePlayer() -> int32` |
| `Get Override Group (Hapbeat)` | `UHapbeatSubsystem` | `GetOverrideGroup() -> int32` |
| `Is Connected (Hapbeat)` | `UHapbeatSubsystem` | `IsConnected() -> bool` |
| `Get Alive Device Count (Hapbeat)` | `UHapbeatSubsystem` | `GetAliveDeviceCount() -> int32` |
| `Is Device Alive (Hapbeat)` | `UHapbeatSubsystem` | `IsAlive() -> bool` |
| `Is Streaming (Hapbeat)` | `UHapbeatSubsystem` | `IsStreaming() -> bool` |
| `Get Active Stream Playback (Hapbeat)` | `UHapbeatSubsystem` | `GetActivePlayback() -> UHapbeatStreamPlayback*` |
| `Build Target (Hapbeat)` | `UHapbeatTargetLibrary` | `BuildTarget(Player = -1, Position = TEXT(""), Group = -1) -> FString` |
| `Parse Target (Hapbeat)` | `UHapbeatTargetLibrary` | `ParseTarget(Target, OutPlayer, OutPosition, OutGroup)` |
| `Resolve Target (Hapbeat)` | `UHapbeatTargetLibrary` | `ResolveTarget(Target, OverridePlayer, OverrideGroup) -> FString` |
| `Apply Address Placeholders (Hapbeat)` | `UHapbeatTargetLibrary` | `ApplyAddressPlaceholders(AppName, OverridePlayer, OverrideGroup) -> FString` |
| `Does Address Match (Hapbeat)` | `UHapbeatTargetLibrary` | `AddressMatches(Target, DeviceAddress) -> bool` |
| `Fire Tick From Value (Hapbeat)` | `UHapbeatTickEmitterComponent` | `FireFromValue(Value)` |
| `Fire Tick From Vector2D (Hapbeat)` | `UHapbeatTickEmitterComponent` | `FireFromVector2D(Value)` |
| `Fire Tick Now (Hapbeat)` | `UHapbeatTickEmitterComponent` | `FireNow()` |
| `Reset Tick Reference (Hapbeat)` | `UHapbeatTickEmitterComponent` | `ResetReference()` |
| `Fire Trigger (Hapbeat)` | `UHapbeatTriggerComponent` | `Fire()` |
| `Fire Trigger With Gain (Hapbeat)` | `UHapbeatTriggerComponent` | `FireWithGain(GainOverride)` |
| `Fire Trigger Scaled (Hapbeat)` | `UHapbeatTriggerComponent` | `FireScaled(Velocity, MinVelocity = 0.0f, MaxVelocity = 10.0f)` |
| `Fire Trigger With Curve (Hapbeat)` | `UHapbeatTriggerComponent` | `FireWithCurve(Value, Curve)` |
| `Stop Trigger (Hapbeat)` | `UHapbeatTriggerComponent` | `Stop()` |
| `Set Trigger Gain Multiplier (Hapbeat)` | `UHapbeatTriggerComponent` | `SetGainMultiplier(NewMultiplier)` |
| `Set Trigger Stream Pan (Hapbeat)` | `UHapbeatTriggerComponent` | `SetStreamPan(NewPan)` |
| `Get Trigger Playback (Hapbeat)` | `UHapbeatTriggerComponent` | `GetActivePlayback() -> UHapbeatStreamPlayback*` |
| `Show Address Panel (Hapbeat)` | `UHapbeatAddressOverridePanelComponent` | `Show()` |
| `Attach Address Panel (Hapbeat)` | `UHapbeatAddressOverridePanelComponent` | `AttachToWidgetComponent(Target)` |
| `Hide Address Panel (Hapbeat)` | `UHapbeatAddressOverridePanelComponent` | `Hide()` |
| `Toggle Address Panel (Hapbeat)` | `UHapbeatAddressOverridePanelComponent` | `Toggle()` |
| `Is Address Panel Shown (Hapbeat)` | `UHapbeatAddressOverridePanelComponent` | `IsShown() -> bool` |
| `Move Address Panel Focus (Hapbeat)` | `UHapbeatAddressOverridePanelComponent` | `MoveFocus(Horizontal, Vertical)` |
| `Activate Address Panel Focus (Hapbeat)` | `UHapbeatAddressOverridePanelComponent` | `ActivateFocused()` |
| `Show Address Panel Focus (Hapbeat)` | `UHapbeatAddressOverridePanelComponent` | `ShowFocusHighlight()` |
| `Log Event (Hapbeat)` | `UHapbeatEventLoggerComponent` | `LogEvent(Tag)` |
| `Log Begin Overlap (Hapbeat)` | `UHapbeatEventLoggerComponent` | `LogBeginOverlap()` |
| `Log End Overlap (Hapbeat)` | `UHapbeatEventLoggerComponent` | `LogEndOverlap()` |
| `Log Hit (Hapbeat)` | `UHapbeatEventLoggerComponent` | `LogHit()` |
| `Log Clicked (Hapbeat)` | `UHapbeatEventLoggerComponent` | `LogClicked()` |
| `Log Released (Hapbeat)` | `UHapbeatEventLoggerComponent` | `LogReleased()` |
| `Log Begin Cursor Over (Hapbeat)` | `UHapbeatEventLoggerComponent` | `LogBeginCursorOver()` |
| `Log End Cursor Over (Hapbeat)` | `UHapbeatEventLoggerComponent` | `LogEndCursorOver()` |
| `Log Grabbed (Hapbeat)` | `UHapbeatEventLoggerComponent` | `LogGrabbed()` |
| `Log Dropped (Hapbeat)` | `UHapbeatEventLoggerComponent` | `LogDropped()` |
| `Log Activated (Hapbeat)` | `UHapbeatEventLoggerComponent` | `LogActivated()` |
| `Log Deactivated (Hapbeat)` | `UHapbeatEventLoggerComponent` | `LogDeactivated()` |
| `Log Status Message (Hapbeat)` | `UHapbeatStatusOverlayComponent` | `Log(Message)` |
| `Clear Status Log (Hapbeat)` | `UHapbeatStatusOverlayComponent` | `ClearLog()` |
