---
title: Waveform editor and Scene tab (beta)
kind: reference
sidebar:
  order: 304
description: "How to use Hapbeat Studio's waveform editor (Events panel, AI trials) and the Scene tab: assign sounds and haptics to game events, check them against recorded scenes, and work with an AI agent."
---

:::caution[Beta]
The waveform editor's Events panel and AI trials, and the Scene tab, are **beta features**. Their controls and file formats (the cue table, the editor folder layout) may change.
:::

This page outlines how to assign **sound and haptic materials** to game events (footsteps, roars, …) and check them against a recording of the game. It also covers what an AI agent needs to know to make materials with you.

## Two folders

| Folder | Contents | Opened from |
|---|---|---|
| **Editor folder** | The waveform editor's workspace and records (below). One folder is shared by all projects; projects are kept apart by the clips' "project" name | "Open folder" in the waveform editor |
| **Game project** | The cue table (each event's sound / haptic), the material WAVs, the recording (full replay and event times) | "Project" in the Scene tab |

- Do not open a game project in the waveform editor: the folder you open there is set up as an editor folder (`.hapbeat-editor/` and others are created).
- Decided assignments and materials (the cue table and WAVs) are written to the **game project**, because the game reads them at run time. The editor folder keeps work in progress and records only.

### Inside the editor folder

| Path | Contents |
|---|---|
| `materials/<project>/` | Source material as obtained (sound effects, …) |
| `adjust/<project>/<sound\|haptic>/` | Effect settings of adjusted materials, and the audio before adjusting |
| `scene-overrides/<project>.json` | Changes made in the Scene tab (reassigned firings, …) |
| `haptic-knowledge/` | AI trials and ratings (the knowledge base), shared by all projects |
| `hapbeat-agent/` | Exchanges with the AI agent (trial requests, audio the agent made, requests from Studio) |
| `exports/` | Files you exported by hand |
| `.hapbeat-editor/` | Studio's internal cache and view settings. Do not read or write it (it is rebuilt when missing) |

### Where the recording lives

The recording is made in the game project's `Saved/HapticViewer/` (Unreal Engine): the full replay (`full_replay.mp4`), a short video per event, firing times and levels (`viewer-data.json`), and where the cue table and WAVs are (`viewer-lib.json`).

- It is made by replaying the game at a fixed frame rate (the record script of the authoring tool). Recording again gives the same result, so it is not version-controlled (`Saved/` holds Unreal Engine's generated files and is normally excluded from Git).
- The game does not read the recording. It sits in the game project so that the Scene tab reads and writes it from the same folder as the cue table and WAVs.

## Working with an AI agent (MCP)

Register `hapbeat-helper mcp` from [hapbeat-helper](/en/docs/tools/helper/getting-started/) as an MCP server. The agent then works with Studio like this:

1. `get_guide` — read the steps and formats (the same as `hapbeat-agent/GUIDE.md` in the editor folder)
2. `submit_trial` — submit candidates (a trial)
3. The user rates them in Studio and **saves** (saving is the signal; there is no separate "send")
4. `wait_for_rating` — receive the rating and make the next candidates

Requests from Studio to the agent (request a sound, remake, go to haptics, reassign a firing) are written to `hapbeat-agent/outbox/` in the editor folder.

## AI trials and ratings

- Give each candidate stars (1–5) and a comment, and comment on the trial as a whole. Comments are the main information.
- For events with a scene, the representative stretch of the full replay plays at the event's real firing times.
- "Save and next" confirms. Candidates rated ★4+ are added to the event's materials as **tentative**; ★3 go to the reserves. What you type is saved as a draft automatically.

## Events panel

Manage each cue's sound and haptic materials.

- **Material pool**: an event can have several materials. The first (★) is the **representative**, used for editor auditions and one-off moments.
- **Tentative / OK**: an assigned material starts tentative; approve it once checked. Every cue table change is saved automatically.
- **Adjust**: adjust a material in place with effects (LPF, …) and the **strength slider**. Changes go straight to the event's WAV; the original audio and the effects stay in `adjust/` of the editor folder.
- Haptic auditions go only to devices at the cue's body positions (neck, wrists, …).

## Scene tab

Check every firing of each cue against the recording.

- **Scene multipliers** (haptic route gain, sound sfx.volume) are edited only here (default 1).
- Edit **variation** (how materials are picked; strength / pitch / rate jitter) and **variants** (per-situation versions).
- **Pair sounds and haptics**: when the sounds differ in length, the haptic with the picked sound's index plays.
- "This firing should be another event" is sent to the agent as a request (the cue table holds no per-moment values).

## The cue table

The cue table (JSON) maps **events → sounds and haptics** and is read by the game at run time. Studio's Events panel and Scene tab edit it, and the game imports it when it is built. Changes made outside Studio (for example by an agent) are merged field by field.

## Three layers of strength

| Layer | Stored in | Edited in |
|---|---|---|
| **Shape** | The WAV (always full scale, peak about −0.5 dBFS) | Effects (Events panel "Adjust") |
| **Material strength** | Each material's intensity (0–1) | The strength slider (Events panel "Adjust") |
| **Scene multiplier** | Route gain / sfx.volume (default 1) | The Scene tab |

The final output is **WAV × intensity × scene multiplier × device volume**. Editor auditions play WAV × intensity (no scene multiplier); the Scene tab plays with the scene multipliers too.
