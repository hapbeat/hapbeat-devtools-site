---
title: Keyboard Shortcuts
kind: reference
sidebar:
  order: 300
description: Keyboard shortcuts and mouse operations available in the Studio Kit Manager.
---

Click the **"?"** (Controls) button at the top of the Kit tab to display an up-to-date cheat sheet as a popover inside Studio. This page is the reference version of that cheat sheet.

## Library Panel (When a Clip Is Selected)

| Key | Action |
|------|--------|
| `↑` / `↓` | Move to previous / next clip |
| `←` / `→` | Adjust Library Amp (libraryIntensity) by ±5% |
| `Space` | Play / stop the selected clip |
| `Enter` | Add the selected clip to the active Kit |

## Kit Editor Panel (When an Event Is Selected)

| Key | Action |
|------|--------|
| `↑` / `↓` | Move to previous / next Kit Event |
| `←` / `→` | Adjust Event intensity by ±5% |
| `Space` | Play / stop the selected Event |
| `Delete` / `Backspace` | Remove the selected Event from the Kit |

> 💡 To prevent `←` / `→` from also triggering native slider value changes, move focus away from the slider with `↓` / `↑` before switching cards.

## Edit Modal

| Key | Action |
|------|--------|
| `Tab` | Move focus to the next field |
| `Enter` | Confirm and close |
| `Esc` | Cancel and close |

## Mouse Operations (Library)

| Action | Result |
|---|---|
| Click card | Select the card |
| `▶` button | Play / stop |
| `+ Kit` button | Add to the active Kit |
| Drag | Drop into the Kit panel to add |
| `Edit` button | Open name / Note / tag edit modal |
| `Swap` button | Swap Name ↔ Note |
| `×` button | Move to `clips/archive/` (the file itself is retained) |

## Mouse Operations (Kit)

| Action | Result |
|---|---|
| Click card | Select the card |
| `> FIRE` / `♪ CLIP` / `>♪ BOTH` | Switch mode (see "Mode info" in the Kit header) |
| `Edit` button | Open Event details modal |
| `Swap` button | Swap clipName ↔ Note (also re-generates the eventId and renames the file) |
| `×` button | Remove from the Kit |

Card order within a Kit is controlled by the **Sort select in the Kit header** (name / last modified / duration / date added). The setting is persisted in `localStorage`.

## Bulk Operations

| Location | Action |
|---|---|
| Library | **Amp Preset bar**: save and load Amp presets for the entire Library |
| Kit header | **Bulk edit…** select: switch all Events in the Kit to FIRE / CLIP / BOTH at once |

## Notes

Shortcuts cannot be customized.
- Shortcuts respond only when the cursor is inside or focused on the panel.
- Shortcuts are disabled while a text field is being edited.
- On the Amp slider, `←` / `→` controls the slider value; use `↑` / `↓` to move between cards.
