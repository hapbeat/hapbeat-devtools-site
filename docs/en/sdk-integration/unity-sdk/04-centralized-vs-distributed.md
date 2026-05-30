---
title: Centralized vs. Distributed Event Dispatch
kind: howto
sidebar:
  order: 200
description: When to use Trigger-first (distributed) vs. HapbeatManager.Play (centralized). The SDK supports both equally.
---

The Hapbeat SDK offers two patterns for **how haptic events are invoked**. There is no single correct answer — this is a **design decision based on your project's scale, team composition, and existing architecture**.

| Pattern | Who invokes | Typical use |
|---|---|---|
| **Trigger-first (distributed)** | Per-zone Trigger components wired in Inspector | Showcase / small-to-medium projects / designers assembling in Inspector |
| **Manager.Play (centralized)** | Any script calls `HapbeatManager.Instance.Play(eventId)` directly | Retrofitting an existing game / managing the event catalog centrally in script |

Combining both patterns in the same project is also fine.

## Trigger-first pattern (standard — used in Showcase)

Attach **`HapbeatXxxTrigger`** components to each zone; zone scripts hold the Trigger via `[SerializeField]` and call `.Fire()`.

```csharp
public class ChargeShooter : MonoBehaviour
{
    [SerializeField] private HapbeatUnityEventTrigger _trigger;
    [SerializeField] private AnimationCurve _gainCurve;

    private void Release(float chargeT)
    {
        _trigger.GainMultiplier = _gainCurve.Evaluate(chargeT);
        _trigger.Fire();
    }
}
```

### Pros
- **Inspector-complete** — EventMap entry selection is just a dropdown
- **Accessible to designers** — event IDs can be changed without writing script
- **All events are traceable from wiring** — which object fires what is visible in the Hierarchy

### Cons
- Inspector wiring becomes scattered as the event count grows
- Not suited for dynamically assembling event IDs in script

## Manager.Play pattern (centralized)

Call `HapbeatManager.Instance.Play(eventId, target, gain)` directly. No Trigger components required.

```csharp
public class GameHapticRouter : MonoBehaviour
{
    public static GameHapticRouter Instance { get; private set; }

    [SerializeField] private HapbeatEventMap _eventMap; // optional: for entry lookup
    private void Awake() => Instance = this;

    public void Play(string eventId, float gain = 1f, string target = null)
    {
        HapbeatManager.Instance.Play(eventId, target ?? "", gain);
    }

    public void OnEnemyHit() => Play("game.enemy_hit");
    public void OnPickup() => Play("game.pickup", gain: 0.6f);
}
```

Call site:
```csharp
GameHapticRouter.Instance.OnEnemyHit();
```

### Pros
- **Manage the event catalog in one file** — naming, gain, and target consolidated in one place
- **Dynamic construction is easy** — string assembly like `Play($"weapon.{weaponName}_fire")`
- **Easy to retrofit into an existing game** — introduce the SDK with a single singleton, no scattered Triggers

### Cons
- The Inspector gives no visibility into what is being called (you must read the script)
- EventMap integration is manual (runtime existence checks appear, but unused entries cannot be detected in Inspector)
- **Not covered by latency compensation**: `HapbeatConfig.hapticDelaySeconds` (audio delay compensation) is applied automatically only when going through Trigger / Bridge / Event / StateBehaviour. The `Manager.Instance.Play()` direct path bypasses EventMap entries, so if needed, the caller must add an equivalent delay using `Invoke` / `StartCoroutine`. Be mindful of this when adopting the centralized pattern.

## Guidance on choosing

- **Small–medium scale / designer collaboration / learning via Showcase** → Trigger-first
- **Large projects that already have a game manager / event bus** → Manager.Play centralized, or mixed
- **Prioritizing debuggability** → Trigger-first (wiring is visualized in the Hapbeat Event Logger menu)
- **Many dynamically named events** → Manager.Play

## Mixing is fine

For example, a natural split is "UI and scene objects use Trigger-first; systemic events fired deep in game logic use Manager.Play." Internally both paths go through `HapbeatManager`, so mixing them has no impact on behavior.

## See also

- [](/en/docs/sdk-integration/unity-sdk/triggers/) — Triggers available for the Trigger-first approach
- [](/en/docs/sdk-integration/unity-sdk/event-map/) — Entry management
- [](/en/docs/sdk-integration/unity-sdk/integration/) — Initial setup
