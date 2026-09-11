---
kind: explanation
sidebar:
  order: 4
  label: UE Editor notes
---

# Unreal Editor notes for Unity developers

This page is a supplement for developers moving from Unity to Unreal Engine 5 (UE5). For implementation examples, start with the [Showcase](./showcase-unreal.md).

## Editor terms and where data is saved

| Unity | UE5 | Purpose |
| --- | --- | --- |
| Scene | Level | File that stores placement, lighting, and GameMode. The Showcase uses `Showcase.umap`. |
| Hierarchy | World Outliner | Where to find Actors placed in a Level. |
| GameObject | Actor | A game object that can be placed in a Level. |
| MonoBehaviour | Actor / Actor Component | Game logic on an Actor, or a feature attached to an Actor. |
| Prefab | Actor Class / Child Actor | Reusable Actor class. It can be placed as a Child Actor inside a parent Actor. |
| Inspector | Details | Where to edit savable properties of the selected Actor / component. |
| Play | Play In Editor (PIE) | Execution mode that runs a copy of the Editor World. |

The Showcase places zone Actors such as `Z1_Bowling` in the Level. Pins, the Shark, and Targets are Child Actors owned by a zone. Adjust position, rotation, and scale primarily through the Child Actor slot Transform in the parent zone's Details, rather than on an internal mesh.

## Editor World and PIE World

UE5 PIE does not run the Level being edited directly. It creates and runs a **copy of the Editor World** (the PIE World).

```text
Edit and save the Level
  → Editor World
  → Start PIE
  → BeginPlay / physics / Tick run in the copied PIE World
  → Stop PIE
  → Return to the saved Editor World values
```

Objects knocked over by physics, spawned projectiles, and component values changed at runtime during PIE are not written back to the Level after it stops. To keep a placement change, stop PIE, select the Actor in the Outliner, edit it in Details, then save with `Ctrl+S`.

To inspect an Actor or component during PIE, change the World Outliner's world selector to **Play World**. You can inspect Child Actors and runtime values set by `BeginPlay` there. Press `Tab` in the Showcase to toggle mouse-cursor capture in PIE.

## C++ initialization timing

In Showcase C++, when a value is created affects what is visible in the Editor.

| Timing | Main purpose | Editor / PIE behavior |
| --- | --- | --- |
| constructor | Create default components and default properties | Always appears in the component tree. |
| `OnConstruction` | Build derived visuals from properties | Also runs when the Actor is placed or its properties change. |
| `BeginPlay` | Start input, physics, and runtime setup for Child Actors | Set only after PIE starts. |
| `Tick` | Per-frame motion and state updates | Runs only during PIE. |

Z1 Pins, the Z3 Shark, and Z5 Targets receive their Hapbeat Event Map / entry ID from the zone in `BeginPlay`. This ensures that Child Actors follow the zone's Event Map override. If you change the parent zone Actor's Event Map / entry in Details during PIE, the Showcase rewires existing Child Triggers so the change applies from the next fire.

Transforms calculated by `OnConstruction`, such as mesh corrections and previews, are derived values. Moving an internal mesh directly can be recalculated when a parent Actor property changes or when the asset reloads. The Showcase treats the public properties on the zone / Child Actor slot as the source of truth.

## After changing C++

Ordinary Details / Event Map edits apply after saving and restarting PIE. C++ changes require a build. In particular, changes to constructor-created components, default values, or the Class Default Object (CDO) may not reach existing Level instances through Live Coding alone. In that case, close the Editor, perform a normal build, and reopen it.
