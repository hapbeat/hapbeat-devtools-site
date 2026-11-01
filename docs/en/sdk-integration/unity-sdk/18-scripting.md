---
title: Play Haptics from a Script
kind: howto
sidebar:
  order: 3
  label: Play from a script
description: How to play Hapbeat haptics from your own C# script. Two ways — via a Trigger component (using the EventMap settings), or by calling HapbeatManager directly.
---

This page covers how to play haptics from inside your game logic, such as taking damage, a bullet hitting, or picking up an item.

There are two ways to play from a script.

| Method | EventMap | When to use |
|---|---|---|
| **A. Call a Trigger component** (the default) | Used. Which haptic to play, at what strength, and on which device are set in the EventMap | Most cases |
| **B. Call HapbeatManager directly** | Not used. The Kit Event ID or AudioClip, strength, and destination are specified in code | When the EventMap cannot manage it, e.g. the Event ID is built at runtime |

For playing directly from collisions, the Animator, UI, and so on without writing code (via components), see [](/en/docs/sdk-integration/unity-sdk/triggers/).

:::note[Prerequisites]
You have finished [](/en/docs/sdk-integration/unity-sdk/getting-started/) and have run `Hapbeat → Initial Scene Setup` in the scene (so that `[Hapbeat Event Router]` and an EventMap exist).
:::

## A. Call a Trigger component

### How it works

Your script holds only a reference to a Trigger component (`HapbeatUnityEventTrigger`). **Which entry of which EventMap to play is selected in the Trigger component's Inspector**, so the EventMap does not appear in the code.

```text
Your script (e.g. PlayerHealth)
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

- `HapbeatUnityEventTrigger` is a MonoBehaviour provided by the SDK, with public methods such as `Fire()` (play) / `Stop()` (stop). For the list, see [](/en/docs/sdk-integration/unity-sdk/script-api/#hapbeatunityeventtrigger).
- "UnityEvent" in its name means you can also call `Fire()` from a UnityEvent such as a Button's OnClick without code. The same component is used when calling from a script.
- To change the strength or destination, edit the EventMap. You do not need to rewrite the script.

### Setup flow

**1. Create an entry in the EventMap**

Open `Hapbeat → Open Event Map`, add an entry with the **`+`** button in the toolbar, and set the following.

| Item | Example setting |
|---|---|
| Name | `player_damage` (the name shown in the Trigger's Event dropdown) |
| Mode | Set `CLIP (Stream Clip)` and assign a WAV to Clip to try it without deploying a Kit |
| Gain | Around `0.5` |
| Targeting | Empty (all devices) |

For the meaning of each item, see [](/en/docs/sdk-integration/unity-sdk/event-map/). The ▶ button on a row lets you try playback without entering Play mode.

**2. Place a Trigger component and select the EventMap and entry**

1. Select any GameObject in the Hierarchy (the player itself or `[Hapbeat Event Router]` both work)
2. **Add Component → Hapbeat → Hapbeat UnityEvent Trigger**
3. In the Inspector, select the EventMap from step 1 in **Event Map**, and `player_damage` in the **Event** dropdown

When you have several haptics to play, place one Trigger per entry (several can be on the same GameObject).

**3. Call `Fire()` from the script**

```csharp
using UnityEngine;
using Hapbeat;   // the SDK namespace

public class PlayerHealth : MonoBehaviour
{
    // Drag the Trigger from step 2 onto this field in the Inspector.
    // The EventMap and entry to play are selected in that Trigger's Inspector.
    [SerializeField] private HapbeatUnityEventTrigger _damageHaptic;

    public void TakeDamage(int amount)
    {
        // ...reduce HP...
        _damageHaptic.Fire();   // play the EventMap entry player_damage
    }
}
```

Press Play, and if the device vibrates when `TakeDamage()` is called, the setup is complete.

### Common operations

**Play with a different strength** — Put a multiplier (0–2) in `GainMultiplier` and then `Fire()`. The sent value is "the Kit clip gain (`clip_gain`) × entry Gain × `GainMultiplier`", capped at 1.

```csharp
// The more damage taken, the stronger
_damageHaptic.GainMultiplier = Mathf.Clamp01(amount / 50f);
_damageHaptic.Fire();
```

**Loop playback, then stop** — Set the entry to `CLIP (Stream Clip)` + **Loop**, and call `Fire()` to start and `Stop()` to end.

```csharp
[SerializeField] private HapbeatUnityEventTrigger _engineHaptic;  // a Trigger with a Loop entry selected

void StartEngine() => _engineHaptic.Fire();
void StopEngine()  => _engineHaptic.Stop();
```

**Change strength and left / right while it plays** — Rewriting `GainMultiplier` or `Pan` (−1 = left to +1 = right) during the loop is reflected in the playing vibration immediately. The same can be done without code using [](/en/docs/sdk-integration/unity-sdk/parameter-binding/).

```csharp
void Update()
{
    // The faster the speed, the stronger
    _engineHaptic.GainMultiplier = Mathf.InverseLerp(0f, 30f, _speed);
}
```

**Grab → while held → release** — To handle the three stages of a one-shot at the start, a continuous loop, and a one-shot at the end together, use the **Hapbeat Sequence Trigger**. From a script, call `Fire()` (grabbed) and `Stop()` (released).

```csharp
[SerializeField] private HapbeatSequenceTrigger _grabHaptic;

void OnGrab()    => _grabHaptic.Fire();   // On Start one-shot → Loop starts
void OnRelease() => _grabHaptic.Stop();   // Loop stops → On Stop one-shot
```

**Temporarily disable playback** — While `TriggerEnabled` is `false`, calling `Fire()` does not play.

```csharp
_damageHaptic.TriggerEnabled = false;
```

## B. Call HapbeatManager directly

This method uses neither a Trigger component nor the EventMap, and passes everything about the playback to `HapbeatManager`.

```csharp
// FIRE (Command): play by Event ID from a Kit already deployed to the device
HapbeatManager.Instance?.Play("my-kit.enemy_hit", gain: 0.8f);

// CLIP (Stream): send a Unity AudioClip and play it. Stop or change strength with the returned handle
HapbeatStreamPlayback pb = HapbeatManager.Instance?.StreamAudioClip(myClip, gain: 0.5f);
pb?.Stop();
```

Because it does not go through the EventMap, the EventMap's Gain and Target, the Kit clip gain (`clip_gain`), and latency compensation do not apply. Use it in cases such as:

- Building the Event ID at runtime (e.g. `$"heartbeat.player_{id}"` per player)
- There are too many entries to manage in the EventMap

You can also call `HapbeatManager` directly while reading the EventMap settings. The Showcase's `ChargeShooter.cs` is an example: it passes `GetEffectiveGain()` / `target` / `streamClip` of an entry taken out with `_eventMap.FindById(...)` to the Manager.

## Showcase examples

The Showcase sample plays haptics from a script in these three places.

| Zone | Script | Method | What it does |
|---|---|---|---|
| **Z3 Fishing** | [`FishingController.cs`](https://github.com/hapbeat/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/FishingController.cs) | A | `_sequence.Fire()` when the mouse is pressed, `_sequence.Stop()` when released. These two lines are the only haptics-related code |
| **Z4 Stream Console** | [`StreamDemoController.cs`](https://github.com/hapbeat/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/StreamDemoController.cs) | A | Toggles `Fire()` / `Stop()` of `HapbeatUnityEventTrigger` with the Space key, and uses `ActivePlayback` to tell whether it is playing |
| **Z5 Charge & Shoot** | [`ChargeShooter.cs`](https://github.com/hapbeat/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/ChargeShooter.cs) | B | Reads EventMap entries, calls `HapbeatManager` directly, and changes the strength during playback according to the charge amount |

For what each zone contains, see [](/en/docs/sdk-integration/unity-sdk/showcase/overview/).

## When it does not play

| Symptom | What to check |
|---|---|
| Nothing happens on `Fire()` | Whether `[Hapbeat] Fire rejected: no EventMap assigned` appears in the Console (no Event Map selected in the Trigger) |
| `entry id '...' not found` warning | The entry was deleted from the EventMap. Pick the entry again in the Trigger's Event field |
| Plays the first time but not when called repeatedly | The Trigger's **Cooldown** is greater than 0 |
| Exception because `_damageHaptic` is null | The Trigger was not assigned to the script's field |
| CLIP plays but FIRE does not | The Kit is not deployed to the device ([](/en/docs/sdk-integration/unity-sdk/fire-vs-clip/)) |

## Next

- [](/en/docs/sdk-integration/unity-sdk/script-api/) — List of methods and properties available from scripts
- [](/en/docs/sdk-integration/unity-sdk/triggers/) — Trigger components that play without code (collision, Animator, etc.)
- [](/en/docs/sdk-integration/unity-sdk/event-map/) — All settings of an entry
