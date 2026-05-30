---
title: AI-Assisted Integration
kind: howto
sidebar:
  order: 200
description: A practical workflow for retrofitting Hapbeat haptic feedback onto an existing Unity scene using AI coding tools such as Claude Code — includes copy-paste prompts.
---

The Hapbeat SDK's straightforward structure — GameObjects / Triggers / EventMap — **works well with AI coding assistants (Claude Code / Cursor / Codex / GitHub Copilot Workspace, etc.)**.

This page presents a four-step workflow for having an AI read an existing scene, design the haptic feedback, and implement it — along with recommended prompts for each step.

> This is a cleaned-up version of the workflow the SDK author used with Claude Code when implementing the `Showcase` / `XriHandDemoAugment` samples.

---

## Prerequisites

- Your **Unity project** is readable by the AI (Claude Code / Cursor etc. launched at the project root)
- **Hapbeat SDK** is installed ([installation guide](./installation.md))
- The **existing scene** you want to add haptics to is saved under `Assets/`
- The AI has permission to read `.unity` scene files (YAML) and the SDK Trigger / EventMap definitions

> AI tools generally cannot perform Editor operations directly. The recommended approach is to **have the AI generate an Editor C# script that you run from a Unity menu**, or to **have it output step-by-step instructions for manual Inspector placement**.

---

## Workflow overview

```
Step 1: Scene analysis (identify haptic candidates)
   ↓
Step 2: EventMap design (decide Event ID / gain / mode)
   ↓
Step 3: Wiring proposal (which GameObject gets which Trigger)
   ↓
Step 4: Implementation (bulk wiring via Editor script, or manual placement)
```

Rather than completing everything in one prompt, **interact with the AI one step at a time**. The AI has no ground truth for haptic design, so plan to review and correct the output at each step.

---

## Step 1: Scene analysis prompt

Have the AI read the target scene and surface a list of events where haptic feedback would be effective.

**Example prompt:**

````
Look at the entire Unity project and list 5–15 events in
`Assets/Scenes/<target-scene-name>.unity` where adding Hapbeat
haptic feedback would be effective.

Output each candidate in the following table format:

| # | Event | Target GameObject | Detection method | Recommended Trigger | Intensity (low/mid/high) | Notes |

Choose the detection method from:
- Physics collision (OnCollisionEnter / OnTriggerEnter)
- Animator state Enter / Exit (per state in AnimatorController)
- UnityEvent (UI Button / XR Interactable Select / Activate / Hover)
- Public method call from script
- Magnitude of change in a continuous value (Slider, etc.)

Choose the recommended Trigger from:
- HapbeatCollisionTrigger
- HapbeatStateBehaviour (StateMachineBehaviour attached directly to an Animator state)
- HapbeatUnityEventTrigger
- HapbeatSequenceTrigger (grab/hold/release in one component)
- HapbeatTickEmitter (continuous-value snap)

Reference: read `Packages/com.hapbeat.sdk/Runtime/Hapbeat*Trigger.cs`
and `HapbeatStateBehaviour.cs` before making your decision.
````

**Expected output example:**

```
| # | Event | Target | Detection | Trigger | Intensity |
|---|---|---|---|---|---|
| 1 | Ball landing | Ball | OnCollisionEnter | HapbeatCollisionTrigger | mid |
| 2 | Pin knocked over | Pin × 6 | OnCollisionEnter | HapbeatCollisionTrigger | high |
| 3 | Door open/close | Door | Animator state Open / Closed Enter | HapbeatStateBehaviour | low |
| ... |
```

---

## Step 2: EventMap design prompt

Once you have reviewed the Step 1 output, have the AI design the EventMap (the Event ID list).

**Example prompt:**

````
Using the candidate list above, design an EventMap (HapbeatEventMap.asset).

Each entry follows this schema:
- displayName: a human-readable label visible in the scene (e.g. "Ball Landing")
- category + eventName: the Event ID is formed as "<category>.<eventName>"
  - category: scene/zone name or kit name (e.g. "bowling")
  - eventName: haptic event name (e.g. "ball_landing")
- mode: Command or StreamClip
  - Simple on/off is sufficient → Command
  - Need to control start/stop/duration from Unity, or stream a WAV → StreamClip
- gain: 0.0–1.0 (use 0.5 as a starting point during touch design)
- target: haptic device target (empty string = all groups / "neck" / "arm", etc.)

Reference: read the spec in `Packages/com.hapbeat.sdk/docs/event-map.md`
before deciding.

Output as a C# array literal for embedding in an Editor script:

```csharp
new[] {
    new Entry { displayName = "...", category = "...", eventName = "...",
                mode = HapticMode.Command, gain = 0.5f, target = "" },
    ...
}
```
````

---

## Step 3: Wiring proposal prompt

Once the EventMap is finalized, have the AI design which Trigger to attach to which GameObject in the scene.

**Example prompt:**

````
Based on the EventMap above, propose scene wiring for each entry.

Output each wiring as the following table:

| Event ID | scene path | Trigger | source event | Additional settings |

scene path is the absolute GameObject path (e.g. "Z1_Bowling/Pins/Pin01").
source event is the specific configuration for how that Trigger is fired:
- HapbeatCollisionTrigger: triggerEvent (CollisionEnter etc.) + tagFilter
- HapbeatStateBehaviour: AnimatorController asset + state name + OnStateEnter/Exit
  (the Trigger is attached to the state, not to a GameObject)
- HapbeatUnityEventTrigger: the source UnityEvent (e.g. XRGrabInteractable.selectEntered)

Include cooldown, gainMode (VelocityScaled/Fixed), thresholds, etc.
in the Additional settings column.
````

After reviewing the output, proceed to Step 4 for implementation.

---

## Step 4: Implementation prompt

Here you have the AI generate a runnable Editor script so that wiring can be completed in Unity with a single menu execution.

**Example prompt (bulk wiring via Editor script):**

````
Based on the EventMap and wiring table above, create
`Assets/Editor/<SceneName>HapbeatAugmentor.cs`. Requirements:

1. Menu: runs from `Hapbeat/Augment <SceneName>`
2. What it does:
   - Generate or update HapbeatEventMap.asset (add Event IDs idempotently)
   - Open the target scene (prompt to save if the current scene is dirty)
   - For each entry in the wiring table:
     - Add the Trigger component to the target GameObject via `Undo.AddComponent`
     - Wire _eventMap / _entryId via SerializedObject
     - Set Trigger-specific fields (tagFilter / cooldown / gainMode, etc.)
   - Show a completion report dialog (applied count / skipped count / warnings)

3. Idempotency: skip + warn if the same Trigger already exists on a GameObject
4. Undo: the entire wiring should be reversible with a single Ctrl+Z
5. Do not auto-save the scene after running, so the user can review and
   manually adjust before saving

Reference: read BasicExampleSceneBuilder.cs / ShowcaseSceneBuilder.cs from
the existing samples to match the API and namespaces.
````

**Benefits:**

- Because AI cannot modify the scene directly, the generated C# run in Unity becomes **configuration as code that can be redone**
- You can loop: run menu → review → adjust → run menu again
- To apply to a different scene later, just replace `<SceneName>`

---

## Manual placement prompt (without an Editor script)

For simple scenes or cases where the scope does not warrant an Editor script, **generating step-by-step instructions and operating the Inspector yourself** is also effective.

**Example prompt:**

````
Output numbered instructions for manually placing the EventMap and wiring
above in the Unity Editor.

Each step in the following format:

1. Select `<scene path>` in the Hierarchy
2. In the Inspector, Add Component → `Hapbeat/<Trigger name>`
3. Drag `<map asset name>` to Event Map
4. Choose `<displayName>` from the Event dropdown
5. <Trigger-specific settings>
6. (Continue to next wiring)

Also output a checklist at the end to verify all wiring is complete.
````

---

## Tips and caveats

### Context to give the AI

Pointing the AI at `Packages/com.hapbeat.sdk/` lets it understand the SDK correctly. **Precision improves notably when you include the following:**

- Each Trigger implementation in `Runtime/Hapbeat*Trigger.cs`
- `Runtime/HapbeatEventMap.cs` / `HapbeatEventEntry.cs`
- `docs/triggers.md` / `docs/event-map.md`
- `Samples~/Showcase/Editor/ShowcaseSceneBuilder.cs` (a good implementation pattern example)

### Do not fully delegate haptic design to AI

AI is good at pattern-matching like "vibrate on collision", but **cannot judge how pleasant or immersive a haptic sensation is**. Make sure a human reviews and corrects the output in Steps 1 and 2.

In particular:
- **Intensity (gain)**: AI assigns high/mid/low mechanically — adjust on real hardware each time
- **Frequency / cooldown**: candidates that fire too often need a stronger cooldown
- **Target (device selection)**: choose `arm` / `neck` / all based on the scene context

### "Blank" scenes still need some content

It is difficult for AI to propose haptics from a completely empty scene. Step 1 works best when at least the following are present:

- Physics objects (Rigidbody + Collider)
- GameObjects with Animators
- UI Buttons / Sliders, etc.
- XR Interactors / XRI Interactables

The most efficient time to add Hapbeat is once the skeleton of the game (things that move and things you can touch) is in place.

### Make Editor scripts re-runnable

Include idempotency in the requirements for any Augmentor you have generated in Step 4. Explicitly asking the AI to "check with `GetComponent<Trigger>()` before `AddComponent` and skip if it already exists" is safer.

### Always require Undo

AI tends to omit `Undo.AddComponent` / `Undo.RecordObject`. **State "reversible with a single Ctrl+Z" explicitly as a requirement.** With that in place, mistakes can be safely rolled back.

---

## Reference: prompts used during Hapbeat SDK development

The detailed instruction documents (test criteria / scene path tables / Undo requirements / environment checks) passed to Claude Code when implementing the `Showcase` / `XriHandDemoAugment` samples are located under `instructions/later/` in the SDK repository:

- [`instructions-xri-handdemo-augment-202605051200.md`](https://github.com/Hapbeat/hapbeat-unity-sdk/blob/master/instructions/later/instructions-xri-handdemo-augment-202605051200.md) — Design specification for an Augmentor that retrofits haptics onto XRI HandDemo with a single Editor menu click

Use these as a reference for how thoroughly to write a haptic augmentation Editor tool.
