---
kind: tutorial
sidebar:
  order: 3
  label: Showcase
---

# Showcase (sample level)

`Showcase` is a level included with the plugin. It contains five samples that connect in-game events to Hapbeat Event Map entries. Open a zone Actor's Details and `EM_Showcase` to inspect or change the haptic playback settings.

:::note[Audio and haptic timing]
Audio-output latency varies by environment, so haptics can be felt before sound. This is expected. Gradually raise `Plugins → Hapbeat → Behavior > Haptic Delay Seconds` in Project Settings to add haptic delay and align them. See [Getting Started](./getting-started.md) for details.
:::

| Zone | Implementation | Haptic wiring to inspect |
| --- | --- | --- |
| Z1 Bowling | C++ Actor + collision trigger | Fires <code class="hb-entry">z1_pin_hit</code> when a pin collides. |
| Z2 Swing Door | Blueprint Event Graph | Starts the door Timeline and `Play Event (Hapbeat)` from the same input branch. |
| Z3 Fishing | C++ Actor + Sequence / Parameter Binding | Connects hook start / loop / release and fish velocity to loop Gain. |
| Z4 Stream Console | Blueprint Event Graph + Widget Blueprint | Wires stream start / stop, UI Gain / Pan, ticks, and Address Override. |
| Z5 Target Range | C++ Actor + collision trigger | Direct SDK calls for charge / shot and light / heavy branches for target hits. |

## Where to look first

1. Enable <span class="hb-field">Show Plugin Content</span> in <span class="hb-location">Content Browser > Settings</span>.
2. Open <span class="hb-location">Plugins/HapbeatSDK/Content/HapbeatSamples/Showcase/Maps/Showcase</span>.
3. Select the target zone Actor in the <span class="hb-location">World Outliner</span>.
4. Open <span class="hb-location">Content Browser > HapbeatSamples/Showcase/EM_Showcase</span> and edit an entry's <span class="hb-field">Clip</span>, <span class="hb-field">Gain</span>, <span class="hb-field">Target</span>, or <span class="hb-field">Loop</span>.

```text
Game input / collision / state transition / UI
  → Hapbeat component or zone Actor
  → Event Map entry
  → Hapbeat SDK
```

## Z1 Bowling — pin collisions

```text
Ball hits pin
  → pin HitTrigger
  → Pin Hit Event
```

<span class="hb-field">Pin Hit Event</span> is the Event Map entry played when one of the six pins collides.

### Edit and try it

1. Select <code class="hb-asset">Z1_Bowling</code> in <span class="hb-location">Showcase map > World Outliner</span>.
2. Open <span class="hb-location">Details > Hapbeat > Bowling > Pin Hit</span>.
3. Change <span class="hb-field">Gain</span> in the <code class="hb-entry">z1_pin_hit</code> entry of <code class="hb-asset">EM_Showcase</code>.
   - Example: halve the current value.
   - **What you can observe:** ball and pin collisions remain unchanged; only haptic strength changes.
4. Change <span class="hb-field">Pin Hit Event</span>.
   - Example: switch from <code class="hb-entry">z1_pin_hit</code> to <code class="hb-entry">z2_door_slam</code>.
   - **What you can observe:** the same pin collision fires the haptic selected by that entry.

### Inspect the SDK connection (C++)

Choose **Tools → Open Visual Studio**, then open these SDK files:

```text
Plugins
└ HapbeatSDK
  └ Source
    └ HapbeatSDKSamples
      ├ Public
      │ └ HapbeatShowcaseZ1BowlingActor.h
      └ Private
        └ HapbeatShowcaseZ1BowlingActor.cpp
```

Open <code class="hb-cpp">Public/HapbeatShowcaseZ1BowlingActor.h</code> first, then the identically named <code class="hb-cpp">Private/HapbeatShowcaseZ1BowlingActor.cpp</code>.

<code class="hb-cpp">BuildEventMap</code> resolves the Details values <code class="hb-cpp">EventMapOverride</code> and <code class="hb-cpp">PinHitEvent</code>. <code class="hb-cpp">SetUpPins</code> passes that map and entry to each pin's <code class="hb-cpp">HitTrigger</code>.

These two lines in <code class="hb-cpp">SetUpPins</code> connect the Details selection to the pin-collision trigger:

```cpp
Pin->HitTrigger->EventMap = EventMap;
Pin->HitTrigger->EntryId = PinHitEntryId;
```

## Z2 Swing Door — fire an event from Blueprint

<code class="hb-asset">BP_Z2_Door</code> is a Blueprint-only example: each door-operation branch fires <span class="hb-bp-node">Play Event (Hapbeat)</span>.

### Edit and try it (PIE Details)

1. Start PIE and press `Shift + F1`.
2. Select <code class="hb-asset">Z2_Door</code> in <span class="hb-location">World Outliner > Play World</span>.
3. Change <span class="hb-field">Door Slam Event</span> in <span class="hb-location">Details > Hapbeat > Door Events</span>.
   - Example: switch from <code class="hb-entry">z2_door_slam</code> to <code class="hb-entry">z2_door_close</code>.
   - **What you can observe:** the `G` slam Timeline remains the same, while the selected entry's haptic is fired.

### Inspect the SDK connection (Blueprint)

Stop PIE, open `HapbeatSamples/Showcase/BP_Z2_Door` in the Content Browser, and select **Event Graph**. Follow the `F`, `G`, and `L` <span class="hb-bp-node">Input Key</span> nodes through <span class="hb-bp-node">Switch on Door State</span>, the applicable action lane, and <span class="hb-bp-node">Play Event (Hapbeat)</span>.

```text
F / G / L Pressed
  → Switch on Door State
  → DoorOpen / DoorClose / DoorSlam / DoorRattle / Lock / Unlock
  → Play Event (Hapbeat) for the corresponding z2_door_* entry
  → DoorHinge Timeline
```

Each lane's <span class="hb-bp-node">Play Event (Hapbeat)</span> receives Get nodes for <span class="hb-bp-node">Door Event Map</span> and its matching <span class="hb-bp-node">Door … Event</span>. This passes the PIE Details selection into the in-game action. Since the Timeline starts from the same lane, door motion and haptic playback share a start point.

## Z3 Fishing — sequence and gain binding

```text
Left mouse press / release
  → Shark.HookSequence
  → z3_hook_start / z3_hook_loop / z3_hook_release

Shark velocity
  → HookVelocityBinding
  → loop Gain
```

<span class="hb-field">Hook Start / Loop / Release Event</span> on <code class="hb-asset">Z3_Fishing</code> are entries played at the start, during, and release of left-click hooking.

### Edit and try it

1. Select <code class="hb-asset">Z3_Fishing</code> in <span class="hb-location">Showcase map > World Outliner</span>.
2. Open <span class="hb-location">Details > Hapbeat > Fishing > Hook</span> and inspect the Event Map and three entries.
3. Change <span class="hb-field">Hook Loop Event</span>.
   - Example: switch from <code class="hb-entry">z3_hook_loop</code> to <code class="hb-entry">z5_charge_loop</code>.
   - **What you can observe:** <span class="hb-field">Loop Entry Name</span> in <span class="hb-location">Hook Wiring</span> uses the selected entry and changes the loop while hooked.

### Inspect the SDK connection (C++)

Choose **Tools → Open Visual Studio**, then open:

```text
Plugins
└ HapbeatSDK
  └ Source
    └ HapbeatSDKSamples
      ├ Public
      │ └ HapbeatShowcaseZ3FishingActor.h
      └ Private
        └ HapbeatShowcaseZ3FishingActor.cpp
```

<code class="hb-cpp">BuildEventMapAndHaptics</code> passes the three selected values to the start / loop / stop entries of <code class="hb-cpp">HookSequence</code>. <code class="hb-cpp">SetHooked</code> calls the sequence's <code class="hb-cpp">Fire()</code> / <code class="hb-cpp">Stop()</code>. <code class="hb-cpp">HookVelocityBinding</code> applies the hooked fish's velocity to loop-playback Gain.

## Z4 Stream Console — loop and runtime parameters

<code class="hb-asset">BP_Z4_StreamConsole</code> is a Blueprint example that connects loop playback on Space with Gain / Pan updates from sliders.

```text
Space
  → Switch on Loop State
  → Stopped: LoopTrigger.Fire → Loop State = Running
  → Running: LoopTrigger.Stop → Loop State = Stopped

Gain / Pan slider
  → On Gain/Pan Slider Changed
  → BP_Z4_StreamConsole Event Graph
  → Set Binding Input (Hapbeat)
  → Update Stream Parameter (Hapbeat)
  → Fire Tick From Value (Hapbeat)
```

### Edit and try it (PIE Details)

1. Start PIE and press `Shift + F1`.
2. Select <code class="hb-asset">Z4_StreamConsole</code> in <span class="hb-location">World Outliner > Play World</span>.
3. Select <span class="hb-location">Details component tree > TickEmitter</span>, then change <span class="hb-field">Tick Threshold</span> in <span class="hb-location">Details > Hapbeat > Tick</span>.
   - Example: change `0.1` to `0.2`.
   - **What you can observe:** moving the Gain / Pan slider by the same distance produces half as many ticks.

`TickEmitter` reads `Tick Threshold` for every slider input while running, so PIE does not need restarting. If you edit Event Graph nodes or connections, stop PIE, compile, and start PIE again.

### Inspect the SDK connection (Blueprint)

Stop PIE, open `HapbeatSamples/Showcase/BP_Z4_StreamConsole` in the Content Browser, and select **Event Graph**.

1. Follow `Space Bar` to <span class="hb-bp-node">Switch on Loop State</span>. The Stopped <span class="hb-bp-node">Fire Trigger (Hapbeat)</span> starts <code class="hb-entry">z4_stream_loop</code>; the Running <span class="hb-bp-node">Stop Trigger (Hapbeat)</span> stops that same loop.
2. Follow <span class="hb-bp-node">On Gain Slider Changed</span> / <span class="hb-bp-node">On Pan Slider Changed</span> through <span class="hb-bp-node">Set Binding Input (Hapbeat)</span> → <span class="hb-bp-node">Update Stream Parameter (Hapbeat)</span>. The slider float is placed in `GainBinding` / `PanBinding`; both bindings update the Gain / Pan of the `LoopTrigger` stream while it plays.
3. The following <span class="hb-bp-node">Fire Tick From Value (Hapbeat)</span> plays <code class="hb-entry">z4_slider_tick</code> only when a slider crosses <span class="hb-field">Tick Threshold</span>.

Address Override is a runtime destination selection that sends only to Hapbeats matching Player / Group. It does not change Event Map entries or playback wiring. See [Targeting](./targeting-and-multi-hmd.md) for details.

## Z5 Target Range — charge / shot and target hit

```text
Charge begin / threshold / release
  → z5_charge_* / z5_shot_*

Projectile hits target
  → LightHitTrigger or HeavyHitTrigger
  → z5_tar_hit_light / z5_tar_hit_heavy
```

The six Event dropdowns on <code class="hb-asset">Z5_ChargeShot</code> select the entries played for charge, shot, and target hit.

### Edit and try it

1. Select <code class="hb-asset">Z5_ChargeShot</code> in <span class="hb-location">Showcase map > World Outliner</span>.
2. Open <span class="hb-location">Details > Hapbeat > Showcase</span>. Event Map entries are in <span class="hb-location">Haptic Events</span>; charge tuning is in <span class="hb-location">Charge</span>.
3. Change <span class="hb-field">Heavy Threshold</span>.
   - Example: change `0.7` to `0.4`.
   - **What you can observe:** the threshold entry and heavy shot activate earlier.
4. Lower the midpoint of <span class="hb-field">Charge Loop Gain Curve</span>.
   - Example: set Gain at `ChargeT = 0.5` to `0.2`.
   - **What you can observe:** the charge loop is weaker in the first half and rises more sharply later.
5. Change <span class="hb-field">Heavy Shot Event</span>.
   - Example: switch from <code class="hb-entry">z5_shot_heavy</code> to <code class="hb-entry">z1_pin_hit</code>.
   - **What you can observe:** releasing a heavy charge plays the selected entry.

### Inspect the SDK connection (C++)

Choose **Tools → Open Visual Studio**, then open:

```text
Plugins
└ HapbeatSDK
  └ Source
    └ HapbeatSDKSamples
      ├ Public
      │ └ HapbeatShowcaseZ5ChargeShotActor.h
      └ Private
        └ HapbeatShowcaseZ5ChargeShotActor.cpp
```

<code class="hb-cpp">BuildEventMap</code> resolves Details values <code class="hb-cpp">EventMapOverride</code> and six <code class="hb-cpp">*Event</code> values into entry IDs. <code class="hb-cpp">Tick</code> evaluates <span class="hb-field">Charge Loop Gain Curve</span> and updates Gain for the playing charge loop. <code class="hb-cpp">HandleChargeBegin</code>, <code class="hb-cpp">Tick</code>, and <code class="hb-cpp">FireShotAfterDelay</code> pass charge / shot IDs to <code class="hb-cpp">FireOneShotEntry</code>. <code class="hb-cpp">SetUpTarget</code> passes light / heavy target-hit IDs to collision triggers.

## Where to change things

| What to change | Where |
| --- | --- |
| Clip, Gain, Target, loop | An entry in <code class="hb-asset">EM_Showcase</code> |
| Z1 pin-hit entry | <span class="hb-field">Event Map / Pin Hit Event</span> on <code class="hb-asset">Z1_Bowling</code> |
| Z5 charge / shot / target-hit entries | <span class="hb-field">Haptic Events</span> on <code class="hb-asset">Z5_ChargeShot</code> |
| Runtime destination | Address Override |

`Target` is a logical destination filter. Address Override does not change Event Map or Actor wiring. See [Targeting](./targeting-and-multi-hmd.md) for details.

## SDK connection settings and diagnostics

Open the following from **Tools → Hapbeat** in the Editor toolbar:

- **Hapbeat Settings** — edit Port, App Name, Command Unicast, timing, and build-fixed Address Override.
- **Hapbeat Runtime Status** — inspect the Address Override stored for this PC, effective Player / Group and socket state during PIE. Values saved outside PIE apply to the next PIE / packaged launch; values saved during PIE apply immediately.

Event Map **Test Play** resolves the same saved Address Override and build-pinned override before sending. It sends when its button is pressed.

## Related material

- [Blueprint node reference](./blueprint-nodes.md)
- [Targeting](./targeting-and-multi-hmd.md)
