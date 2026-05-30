---
title: Fire vs. Clip — When to Use Each
kind: explanation
description: Decision criteria, development workflow impact, and implementation patterns for Fire (command) and Clip (stream_clip) from a Unity SDK perspective.
sidebar:
  order: 200
---

The `Mode` field on an EventMap entry (Fire / Clip) has a significant impact on your Unity integration approach, where haptic assets live, and the iteration loop. This page clarifies how to choose between the two and how to implement each — from a Unity developer's perspective.

For protocol / schema level details (manifest bucket, wire format, gain application timing, etc.), see **[](/en/docs/concepts/fire-vs-clip/)**.

## TL;DR

| | **Fire** (FIRE / command) | **Clip** (CLIP / stream_clip) |
|---|---|---|
| In one sentence | Play a device-stored clip by ID | Send a Unity AudioClip as PCM |
| Recommended for | Production use, short one-shots | Prototyping, long audio, dynamic modulation |
| Device deployment | Required (write Kit from Studio) | Not required |
| Latency | Low, stable | Higher, environment-dependent |
| Dynamic modulation | `gain` is fixed per fire | gain / pan can be modulated per-chunk during playback |

---

## 1. Which to choose

### 1-1. Impact on Unity development workflow

| | Using Fire | Using Clip |
|---|---|---|
| Where haptic assets live | Hapbeat Studio Kit (`install-clips/`) | Unity `AudioClip` |
| Iteration loop | Edit WAV → Studio → deploy to device → Unity Play | Swap AudioClip in Inspector → Play immediately |
| Trigger-side code | Mode-agnostic (Trigger / StateBehaviour do not need to know the mode) | Same |
| Dynamic modulation | Not supported (fixed gain only) | Supported (`Trigger.GainMultiplier` / `HapbeatParameterBinding`) |

**Trigger / StateBehaviour code is mode-agnostic, so switching later is possible.** Changing the `Mode` field on the EventMap entry is all it takes to change the wire format. This is a key feature of the Unity SDK's EventMap abstraction when comparing Fire and Clip.

### 1-2. Concrete example: mode choices in Showcase

| Showcase Zone | Mode chosen | Reason |
|---|---|---|
| Z1 Pin hit | Clip | Experimenting with different impact feels during development. Switching to Fire is natural for production. |
| Z2 Door open/close | Clip | Short one-shot tied to Animator state. Kept as Clip during the prototype stage. |
| Z3 Grab loop | Clip (loop) | Requires a long loop with dynamic modulation driven by object speed. |
| Z5 Charge release | Clip | Clip is required for gain modulation via `AnimationCurve` based on charge amount. |

### 1-3. Guidelines

- **Prototyping** → Clip (faster iteration)
- **Haptics finalized + shipping** → Switch to Fire (lower latency, stable)
- **Long audio / loops / dynamic modulation required** → Stay on Clip
- **Congested Wi-Fi or many simultaneous users** → Fire (lower bandwidth)
- **Same entry needs both modes** → BOTH representation in the manifest (details in [](/en/docs/concepts/fire-vs-clip/))

---

## 2. Switching mode in EventMap

Select `FIRE (Command)` / `CLIP (Stream Clip)` in the `Mode` field of the EventMap entry. Components and Behaviours are mode-agnostic and internally branch to the appropriate API (`HapbeatManager.Play` / `StreamAudioClip`).

| Mode | Required fields | Wire format |
|---|---|---|
| `FIRE (Command)` | Category + Event Name | PLAY / STOP packet (Event ID + parameters) |
| `CLIP (Stream Clip)` | Stream Clip (`AudioClip`) | STREAM_BEGIN / STREAM_DATA × N / STREAM_END |

Details: [](/en/docs/sdk-integration/unity-sdk/event-map/).

---

## 3. Implementation examples

Using the same classification as [](/en/docs/sdk-integration/unity-sdk/integration/). A and B are mode-agnostic so the Unity-side code is shared; only C uses mode-specific APIs.

### A. Wire in Inspector (mode-agnostic)

Attach a Hapbeat component (Collision / Sequence / UnityEvent / TickEmitter) to a GameObject, or attach `HapbeatStateBehaviour` to an AnimatorController state, then select the target EventMap entry in the Inspector. No code required.

Because the difference between Fire and Clip is absorbed by the `Mode` field and related fields on the EventMap entry, the Inspector workflow for components and Behaviours is identical:

```
GameObject Inspector
└─ HapbeatUnityEventTrigger
   Event Map : MyEventMap
   Event     : [▶ sword_hit]      ← entry.mode = FIRE
             : [♪ ambient_drone]  ← entry.mode = CLIP
```

Switching the `Mode` on the EventMap entry changes the wire format without touching the component or Behaviour at all.

### B. Call Trigger from script (mode-agnostic)

Hold a Trigger reference via `[SerializeField]` and call `Fire()` from game logic. The call is the same regardless of whether the entry mode is FIRE or CLIP.

```csharp
public class GunController : MonoBehaviour
{
    [SerializeField] private HapbeatUnityEventTrigger _shootTrigger;

    void OnShoot() {
        _shootTrigger.Fire();
    }
}
```

For Clip, writing to `GainMultiplier` every frame enables dynamic modulation during playback (for Fire, the setter itself works but does not affect the current waveform — it takes effect from the next `Fire()` call):

```csharp
void Update() {
    if (_isCharging)
        _shootTrigger.GainMultiplier = _gainCurve.Evaluate(_chargeT);
}
```

Reference implementation: Showcase **Z5 ChargeShooter** (`Samples~/Showcase/Scripts/ChargeShooter.cs`).

### C. Call Manager.Play() / StreamAudioClip() directly (mode-specific APIs, special cases)

When bypassing EventMap, choose the API based on mode.

**Fire**:
```csharp
HapbeatManager.Instance?.Play(
    eventId: "my-game.sword_hit",
    gain: 0.8f,
    target: "player_1/pos_r_arm"
);
```

**Clip**:
```csharp
[SerializeField] private AudioClip _footstepClip;

void OnFootstep() {
    var playback = HapbeatManager.Instance?.StreamAudioClip(
        clip: _footstepClip,
        gain: 0.7f
    );
    // optionally: playback.SetGain(0.5f) / playback.Stop()
}
```

Automatic corrections provided by EventMap (manifest intensity / latency offset / wiring list / Inspector tuning) are lost. For when to choose this path, see [](/en/docs/sdk-integration/unity-sdk/integration/).

---

## 4. Deploying a Kit to the device

Before using Fire mode, the Kit (WAV files + manifest.json) must be written to the device. See the Studio documentation:

- [](/en/docs/tools/studio/initial-setup/)
- [](/en/docs/tools/studio/kit-design/)

---

## 5. Helper's role (supplementary)

For both Fire and Clip, **the SDK sends UDP directly to the device at runtime** — Helper is not required. Helper is needed when:

- Deploying a Kit from Studio (mDNS discovery + WebSocket relay)
- Running playback tests or waveform previews in Studio

---

## Related links

- [](/en/docs/concepts/fire-vs-clip/) — Protocol / schema level details
- [](/en/docs/sdk-integration/unity-sdk/integration/) — Overview of the three wiring approaches
- [](/en/docs/sdk-integration/unity-sdk/triggers/) — Component and Behaviour reference
- [](/en/docs/sdk-integration/unity-sdk/event-map/) — The `Mode` switching UI
- [](/en/docs/sdk-integration/unity-sdk/streaming/) — Buffer tuning for Clip mode
