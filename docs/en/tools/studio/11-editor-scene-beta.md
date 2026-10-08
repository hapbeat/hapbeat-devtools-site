---
title: Waveform editor and Scene tab (beta)
kind: reference
sidebar:
  order: 304
description: "How to use Hapbeat Studio's waveform editor (Events panel, AI proposals) and the Scene tab: assign sounds and haptics to game events, check them against recorded scenes, and work with an AI agent."
---

:::caution[Beta]
The waveform editor's Events panel and AI proposals, and the Scene tab, are **beta features**. Their controls and file formats (the cue table, the editor folder layout) may change.
:::

This page outlines how to assign **sound and haptic materials** to game events (footsteps, roars, …) and check them against a recording of the game. It also covers the steps and what an AI agent needs to know to make materials with you.

## Using it with an AI agent (quick start)

1. **Install the helper with MCP and start it**

   ```bash
   pipx install "hapbeat-helper[mcp]"
   hapbeat-helper start
   ```

   If it is already installed, use `pipx install --force "hapbeat-helper[mcp]"`. For the helper in general, see [](/en/docs/tools/helper/getting-started/).

2. **Register the MCP server with your agent**
   - Claude Code: `claude mcp add hapbeat -s user -- hapbeat-helper mcp`
   - Codex: add the following to `~/.codex/config.toml` (add `--port N` to `args` if the daemon is not on 7703)

     ```toml
     [mcp_servers.hapbeat]
     command = "hapbeat-helper"
     args = ["mcp"]
     ```

3. **Open Studio**: open `https://studio.hapbeat.com` in Chrome or Edge and choose the **editor folder** with "Open folder" in the waveform editor. If you choose an empty folder, Studio asks "Make this folder the editor folder?"; answer yes to set it up. Keep this tab open while the agent works.
4. **To use the Scene tab too**: open the **game project** folder with "Project" in the Scene tab. It needs a cue table and a recording (`Saved/HapticViewer/`, made by the project's recording script; see "Where the recording lives" below).
5. **What the agent does first**: `status` to check that the helper and Studio are connected, and `get_guide` to read the steps and formats. The authoritative format of a trial (AI proposal) is what `get_guide` returns (the items on this page are an outline).

Example request:

```text
hapbeat MCP を使って、ゲームプロジェクト my-game の footstep（足音）の触覚を作ってください。
まず status と get_guide を確認し、get_knowledge を読んでから、作り方の違う候補を 3〜4 個 submit_trial してください。
音はすでに決まっています。scene に cue を入れ、評価は wait_for_rating で受け取って次の候補に反映してください。
```

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
| `haptic-knowledge/` | AI proposals and ratings (the knowledge base), shared by all projects |
| `hapbeat-agent/` | Exchanges with the AI agent (proposal requests, audio the agent made, requests from Studio) |
| `exports/` | Files you exported by hand |
| `.hapbeat-editor/` | Studio's internal cache and view settings. Do not read or write it (it is rebuilt when missing) |

### Where the recording lives

The recording is made in the game project's `Saved/HapticViewer/` (Unreal Engine): the full replay (`full_replay.mp4`), a short video per event, firing times and levels (`viewer-data.json`), and where the cue table and WAVs are (`viewer-lib.json`).

- It is made by replaying the game at a fixed frame rate (the project's recording script). Recording again gives the same result, so it is not version-controlled (`Saved/` holds Unreal Engine's generated files and is normally excluded from Git).
- The game does not read the recording. It sits in the game project so that the Scene tab reads and writes it from the same folder as the cue table and WAVs.

## Working with an AI agent (MCP)

Register `hapbeat-helper mcp` from [hapbeat-helper](/en/docs/tools/helper/getting-started/) as an MCP server. The agent then works with Studio like this:

1. `status` — check the connection; `get_guide` — read the steps and formats (the same as `hapbeat-agent/GUIDE.md` in the editor folder)
2. `get_knowledge` — read past ratings
3. `submit_trial` — submit candidates (an AI proposal)
4. The user rates them in Studio and **saves** (saving is the signal; there is no separate "send"). Only the user writes ratings
5. `wait_for_rating` — receive the rating and make the next candidates

Requests from Studio to the agent (request a sound, remake, go to haptics, reassign a firing) are written to `hapbeat-agent/outbox/` in the editor folder.

### Proposal format (key points for agents)

`get_guide` is authoritative. The main items used when making materials for a scene:

| Item | Meaning |
|---|---|
| `target` | `"sound"` (sound effect) or `"haptic"` (default). Decide each event's sound first, then make its haptic to match that sound |
| `scene.project` / `scene.cues` | The game project's name and the cues (a variant is allowed, as in `"footstep:approach"`). The first cue is the event the candidate is adopted into |
| `scene.context` | Cues that sound around the target in the game (e.g. loops that start with it). Auditions play their decided materials together with the candidate. Events grouped as firing at the same moment play without being listed |
| Candidate `sound` | The sound a haptic candidate was made to go with (the name of one of the cue's starred sounds, without `.wav`). Auditions play that sound with it |
| Candidate `intensity` | The starting value of the strength slider in the rating form (0 < x ≤ 1, absent = 1). Keep the WAV full scale; do not render it quieter |
| Candidate `method` | How the haptic is made (`synth` / `sfx` / `envelope` / `layered` / `onset` / `bandsplit`). The knowledge base counts results per method |

## AI proposals and ratings

- Give each candidate stars (1–5) and a comment, and comment on the proposal as a whole. Comments are the main information.
- For events with a scene, the representative stretch of the full replay plays at the event's real firing times. The `scene.context` cues and the events firing at the same moment play along ("Play the events around it" switches this).
- "Save and next" confirms. Candidates rated ★4+ are added automatically to the event's **unstarred candidates** (alternates), and are starred only when the event has no starred material yet. ★3 go to the **reserves**. What you type is saved as a draft automatically.

## Events panel

Manage each cue's sound and haptic materials.

- **Starred (played) materials and unstarred candidates**: the game and Studio play only starred materials (`sfx.sounds` / route `clips` in the cue table). The first starred one is the **representative**, used for editor auditions and one-off moments. With several starred, one plays each time (footsteps, …). Unstarred candidates (cue table `alternates`) stay in the event but never play. Click a row's ★ to toggle it (the last ★ cannot be taken off; to silence the event, set it to "None").
- **Reserves**: editor-side materials not in the cue table (★3 AI candidates, and materials taken off when the event is set to "Undecided"). They can be put back into the event.
- **Status**: each sound and haptic shows **Undecided / None tentative / None OK / Tentative / OK**. "None OK" means approved with no material. An assigned material starts tentative; approve it once checked. Every cue table change is saved automatically.
- **Events firing together**: events the recording fires at the same moment (within 0.2 s) are shown together (display only; the cue table is unchanged). Fix them by hand with "Put in a group" / "Take out of its group" in the ⋯ menu. Auditioning one also plays the others.
- **Adjust**: adjust a material in place with effects (LPF, …) and the **strength slider**. Changes go straight to the event's WAV; the original audio and the effects stay in `adjust/` of the editor folder.
- **Waveform panel**: by default it shows the material file once. Turn on "Place at the firings" to draw the audition at the scene timing (auditions play at the scene timing either way). Sound is drawn in blue, haptics in orange.
- Haptic auditions go only to devices at the cue's body positions (neck, wrists, …).

## Scene tab

Check every firing of each cue against the recording.

- **Scene multipliers** (haptic route gain, sound sfx.volume) are edited only here (default 1).
- Edit **variation** (how materials are picked; strength / pitch / rate jitter) and **variants** (per-situation versions). A variant is either "Multipliers only" (materials inherited from the parent) or "Own materials". A multipliers-only variant can also **change gradually** over a run of firings (shape: linear, late, early, S curve, steep S curve) or **set one by one**.
- **Distance falloff** (`distanceFalloff`): weakens sound and haptics by the distance to the player (×1 at near, the far gain at far). Firings without a recorded distance use ×1.
- **Pair sounds and haptics** (`paired`): when the sounds differ in length, the haptic with the picked sound's index plays.
- **Loop cue input → output** (`levelMap`): a function from the value the game gives the loop (the recorded level, e.g. feed speed) — the **input** — to a multiplier — the **output**. It joins (0, intercept) and the points in input order; choose the segment shape from linear, convex, concave, S curve and steep S curve (`linear` / `easeIn` / `easeOut` / `easeInOut` / `sigmoid`). Play to an input, set its output and press "Set point" (nothing is tied to time). Past the last point it continues with the last segment's slope; the output stays within 0–4. Input 0 (the loop is stopped) is always 0; without points the output is the input. The current input and the recording's maximum are shown.
- **Emitted by the game** (`emit`): the interval (s) and jitter (%) at which the game fires a one-shot cue by itself while a loop cue runs. This tab plays firings made by the same rule wherever the loop cue's input is above 0, not the recorded ones ("Draw again" remakes them).
- **Reassigning a firing**: "Change" on a row of the list on the left sends the agent a request to make that firing another event / situation (the cue table holds no per-moment values; a new variant name creates a multipliers-only variant at once).
- **Keys**: click on the timeline to seek, Ctrl + click (Cmd + click on Mac) to switch to that event. F goes back to the full replay and continues; O opens the selected event in the editor.

## The cue table

The cue table (JSON) maps **events → sounds and haptics** and is read by the game at run time. Studio's Events panel and Scene tab edit it, and the game imports it when it is built. Changes made outside Studio (for example by an agent) are merged field by field.

- No key = undecided; `"sfx": null` / `"haptics": []` = none (decided). The game plays neither.
- Starred materials are `sfx.sounds` / route `clips`; unstarred candidates are `sfx.alternates` / route `alternates`.

## Three layers of strength

| Layer | Stored in | Edited in |
|---|---|---|
| **Shape** | The WAV (always full scale, peak about −0.5 dBFS) | Effects (Events panel "Adjust") |
| **Material strength** | Each material's intensity (0–1) | The strength slider (Events panel "Adjust") |
| **Scene multiplier** | Route gain / sfx.volume (default 1) | The Scene tab |

The final output is **WAV × intensity × scene multiplier × device volume**. For loop cues, the input → output (levelMap) output is applied too. Editor auditions play WAV × intensity (no scene multiplier); the Scene tab plays with the scene multipliers too.
