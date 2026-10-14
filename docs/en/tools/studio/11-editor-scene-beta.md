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
| **Editor folder** | The waveform editor's workspace: clips, AI trials and ratings (`haptic-knowledge/`), exchanges with the agent (`hapbeat-agent/`), material adjustments (`adjust/`) | "Open folder" in the waveform editor |
| **Game project** | The cue table (each event's sound / haptic), the material WAVs, the recording (full replay and event times) | "Project" in the Scene tab |

`.hapbeat-editor/` is Studio's internal cache. Do not read or write it (it is rebuilt when missing).

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
- The list can be filtered by **project** and **type (sound / haptic)** at the top of the panel. The choice is remembered, so when the trials of a new project do not show up, check these filters first.
- "Save and next" confirms. Candidates rated ★4+ are added to the event's materials as **tentative**; ★3 go to the reserves. What you type is saved as a draft automatically.

## Events panel

Manage each cue's sound and haptic materials.

- **Material pool**: an event can have several materials. The first (★) is the **representative**, used for editor auditions and one-off moments.
- **Group or each variant**: for an event with variants (soft / hard, …), its sound and its haptics are each set either by the group (the parent event) or per variant. The side that does not hold one shows no state or buttons, only "Set by the group" / "Set per variant", with the switch: "Separate per variant" copies the parent's materials to every variant; "Share in the group" gathers the variants' materials on the parent (the first variant's starred ones play, the rest stay unstarred).
- **Events without a ★**: the last ★ can come off too. A sound or haptic without a ★ plays nothing in the game, and the event gets a ▲ in the Events list. When it should stay silent, press "Set to none" (a decision, so no ▲).
- **Tentative / OK**: an assigned material starts tentative; approve it once checked. Every cue table change is saved automatically.
- **Adjust**: adjust a material in place with effects (LPF, …) and the **strength slider**. Changes go straight to the event's WAV; the original audio and the effects stay in `adjust/` of the editor folder.
- Haptic auditions go only to devices at the cue's body positions (neck, wrists, …).

## Effects: clean-up

Effects for preparing found or generated audio ("Clean-up" in the add-effect menu). AI agents can use them in a trial's `effects` too.

- **Spectral denoise**: finds, per frequency, the level that is always there (the noise floor) and lowers only what stays near it. Unlike a low-pass, a hit keeps its highs; only steady hiss goes down. `thresholdK` (bins at or below this × the noise floor are lowered, default 2), `floorDb` (how far, default −24 dB), `percentile` (the low percentile used as the noise floor, default 20 %).
- **Isolate hit**: keeps only the loudest hit — cut where its tail has fallen `endDb` below the peak (default −50 dB) or just before a second attack (`riseDb` within 20 ms, default +9 dB), with a `fadeMs` fade-out (default 25 ms). Use it when one contact should sound once.

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
