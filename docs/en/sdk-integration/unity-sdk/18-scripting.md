---
title: Fire Haptics from a Script
kind: howto
sidebar:
  order: 3
  label: Fire from a script
description: The shortest path to firing Hapbeat haptics from your own C# script. Hold a reference to a Trigger component and just call Fire().
---

This page shows how to fire haptics from inside your own game logic (took damage, a bullet hit, picked up an item…).

**There are only three things to do.**

1. Create an entry in the EventMap for the haptic you want to play
2. Add a **Hapbeat UnityEvent Trigger** to a GameObject in the scene, and select the EventMap and entry in the Inspector
3. Hold a reference to that Trigger in your own script and call `Fire()` where you want the haptic to play

```csharp
using UnityEngine;
using Hapbeat;   // the SDK namespace

public class PlayerHealth : MonoBehaviour
{
    // Drag the Trigger from step 2 onto this field in the Inspector
    [SerializeField] private HapbeatUnityEventTrigger _damageHaptic;

    public void TakeDamage(int amount)
    {
        // ...reduce HP...
        _damageHaptic.Fire();   // play the haptic
    }
}
```

Which waveform to play, at what intensity, and on which device is decided not by the script but by **the EventMap entry**. The script only says "play now", so you do not need to rewrite code to change the intensity or destination.

:::note[Prerequisites]
You have finished [](/en/docs/sdk-integration/unity-sdk/getting-started/) and have run `Hapbeat → Initial Scene Setup` in the scene (so that `[Hapbeat Event Router]` and an EventMap exist).
:::

## How it works — where does the EventMap live?

The EventMap does not appear in the code because **the Trigger component holds the EventMap and entry selection**.

```text
PlayerHealth (your script)
  └ _damageHaptic ──reference──▶ HapbeatUnityEventTrigger (a component in the scene)
                               ├ Event Map : MyScene-EventMap.asset   ← chosen in the Inspector
                               └ Event     : player_damage            ← chosen in the Inspector
                                                │
                                                ▼
                                   EventMap entry (Mode / Clip / Gain / Target)
                                                │
                                                ▼
                                   HapbeatManager → Hapbeat device
```

- `HapbeatUnityEventTrigger` is a MonoBehaviour provided by the SDK. It has public methods such as `Fire()` / `Stop()` (list: [](/en/docs/sdk-integration/unity-sdk/script-api/#hapbeatunityeventtrigger)).
- "UnityEvent" is in its name because you can also call `Fire()` from a UnityEvent such as a Button's OnClick without code. The same component is used when calling from a script.
- Sending is done by the `HapbeatManager` on `[Hapbeat Event Router]`. You do not need to look up the Manager from your script or write any connection handling.

## Procedure

### 1. Create an entry in the EventMap

Open `Hapbeat → Open Event Map`, add an entry with the **`+`** button in the toolbar, and set the following.

| Item | Example setting |
|---|---|
| Name | `player_damage` (the name shown in the Inspector dropdown) |
| Mode | The easy way to start is `CLIP (Stream Clip)` with a WAV assigned to Clip (no Kit deploy needed) |
| Gain | Start around `0.5` |
| Targeting | Leave empty (all devices) |

For the meaning of each item, see [](/en/docs/sdk-integration/unity-sdk/event-map/). The ▶ button on a row lets you try it without entering Play mode.

### 2. Place the Trigger component

1. Select any GameObject in the Hierarchy (the player itself or `[Hapbeat Event Router]` both work)
2. **Add Component → Hapbeat → Hapbeat UnityEvent Trigger**
3. In the Inspector, select the EventMap from step 1 in **Event Map**, and `player_damage` in the **Event** dropdown

When you have several haptics to play, place **one Trigger per entry** (several can be on the same GameObject).

### 3. Call it from the script

Prepare a `[SerializeField]` field as in the code at the top, and drag the Trigger from step 2 onto it in the Inspector. After that, just call `Fire()` where you want it to play.

Press Play, and if the device vibrates when `TakeDamage()` is called, you are done.

## Common operations

### Fire with a different intensity

Put a multiplier (0–2) in `GainMultiplier` and then `Fire()`. The final intensity is "entry Gain × Kit intensity × `GainMultiplier`".

```csharp
// The more damage taken, the stronger
_damageHaptic.GainMultiplier = Mathf.Clamp01(amount / 50f);
_damageHaptic.Fire();
```

### Keep playing, then stop (loop)

Set the entry to `CLIP (Stream Clip)` + **Loop**, and call `Fire()` to start and `Stop()` to end.

```csharp
[SerializeField] private HapbeatUnityEventTrigger _engineHaptic;  // a Loop entry

void StartEngine() => _engineHaptic.Fire();
void StopEngine()  => _engineHaptic.Stop();
```

### Change intensity and left / right balance while it plays

Rewriting `GainMultiplier` or `Pan` (−1 = left to +1 = right) during the loop is reflected in the playing vibration immediately.

```csharp
void Update()
{
    // The faster the speed, the stronger
    _engineHaptic.GainMultiplier = Mathf.InverseLerp(0f, 30f, _speed);
}
```

The same can be done without code using **Parameter Binding** (→ [](/en/docs/sdk-integration/unity-sdk/parameter-binding/)).

### Grab → while held → release

To handle the three stages of a one-shot at the start, a continuous loop, and a one-shot at the end together, use the **Hapbeat Sequence Trigger**. From a script you again just call `Fire()` (grabbed) and `Stop()` (released).

```csharp
[SerializeField] private HapbeatSequenceTrigger _grabHaptic;

void OnGrab()    => _grabHaptic.Fire();   // On Start one-shot → Loop starts
void OnRelease() => _grabHaptic.Stop();   // Loop stops → On Stop one-shot
```

### Temporarily silence it

```csharp
_damageHaptic.TriggerEnabled = false;  // while false, Fire() does not play
```

## See real examples in the Showcase

The Showcase sample has three examples of calling haptics from a script. Reading them in order of difficulty is recommended.

| Example | Script | What it does |
|---|---|---|
| **Z3 Fishing** | [`FishingController.cs`](https://github.com/hapbeat/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/FishingController.cs) | `_sequence.Fire()` when the mouse is pressed, `_sequence.Stop()` when released. These two lines are all the haptics-related code |
| **Z4 Stream Console** | [`StreamDemoController.cs`](https://github.com/hapbeat/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/StreamDemoController.cs) | Toggles `Fire()` / `Stop()` of `HapbeatUnityEventTrigger` with the Space key, and uses `ActivePlayback` to tell whether it is playing |
| **Z5 Charge & Shoot** | [`ChargeShooter.cs`](https://github.com/hapbeat/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/ChargeShooter.cs) | An advanced example that reads EventMap entries and calls `HapbeatManager` directly, without a Trigger ([below](#firing-without-a-trigger)) |

To open the Showcase, see [](/en/docs/sdk-integration/unity-sdk/showcase/overview/).

## Firing without a Trigger

As an advanced method, you can also call `HapbeatManager` directly without placing a Trigger component.

```csharp
// On a device with a Kit already deployed, fire by Event ID (FIRE / Command)
HapbeatManager.Instance?.Play("my-kit.enemy_hit", gain: 0.8f);

// Send a Unity AudioClip as is and play it (CLIP / Stream)
HapbeatStreamPlayback pb = HapbeatManager.Instance?.StreamAudioClip(myClip, gain: 0.5f);
pb?.Stop();  // stop it / change its intensity with the returned handle
```

However, on this path **the Gain, Target, Kit intensity compensation, and latency compensation set in the EventMap do not apply** (you pass every value from code). As a rule of thumb, use it only in cases such as:

- Building the Event ID at runtime (e.g. a different ID per player like `$"heartbeat.player_{id}"`)
- There are too many entries to manage in the EventMap

For a way of calling the Manager directly while still making use of the EventMap settings, the Showcase's `ChargeShooter.cs` serves as a model as it is (it takes out an entry with `_eventMap.FindById(...)` and passes `entry.GetEffectiveGain()` / `entry.target` / `entry.streamClip` to the Manager).

## When it does not play

| Symptom | What to check |
|---|---|
| Nothing happens on `Fire()` | Whether `[Hapbeat] Fire rejected: no EventMap assigned` appears in the Console (no Event Map selected in step 2) |
| `entry id '...' not found` warning | The entry was deleted from the EventMap. Pick the entry again in the Trigger's Event field |
| Plays the first time but not when pressed repeatedly | The Trigger's **Cooldown** is greater than 0 |
| Exception because `_damageHaptic` is null | The Trigger was not assigned to the field in the Inspector |
| CLIP plays but FIRE does not | The Kit is not deployed to the device ([](/en/docs/sdk-integration/unity-sdk/fire-vs-clip/)) |

## Next

- [](/en/docs/sdk-integration/unity-sdk/script-api/) — List of methods and properties available from scripts
- [](/en/docs/sdk-integration/unity-sdk/triggers/) — Trigger components that play without code (collision, Animator, etc.)
- [](/en/docs/sdk-integration/unity-sdk/event-map/) — All settings of an entry
