---
title: Kit tab
kind: reference
sidebar:
  order: 301
description: "Complete reference for the Hapbeat Studio Kit tab (Vibration Clips): the Library and Kit Editor controls, actions, limitations, and persistence."
---

The **Kit tab** (*Vibration Clips*) is the primary Studio workspace. Manage WAV haptic assets in the **Library**, assemble them into a **Kit**, and deploy that Kit to a device.

This is a reference for every control. For a first Kit, see [Create your first Kit](/en/docs/tools/studio/getting-started/); for the authoring and deployment workflow, see [Create and distribute a Kit](/en/docs/tools/studio/kit-design/).

## At a glance

![Kit tab overview. Labels: tab selection, toolbar, Library, Kit Editor, mode help, mode rail, Deploy and Save Folder.](@assets/studio/kit-tab-overview.png)

1. **Tabs** — switch Kit / UI / Manage.
2. **Toolbar** — view layout, clip details (`i`), and interaction help (`?`).
3. **Library** — search, sort, import, and tune source clips.
4. **Kit Editor** — events in the selected Kit.
5. **Mode help** — compares FIRE / CLIP / BOTH.
6. **Mode rail** — chooses FIRE / CLIP / BOTH per Event.
7. **Deploy / Save Folder** — transfer to a device or export to a folder.

## Layout and common toolbar

The Kit tab has two panes: **Library** (left / top) and **Kit Editor** (right / bottom).

| Button | Mode | Layout |
| --- | --- | --- |
| `⊥` | side | Library left, Kit Editor right |
| `─` | stacked | Library above, Kit Editor below; drag the divider to resize |

The selected view persists. The toolbar also provides:

| Control | Purpose |
| --- | --- |
| view mode (`⊥` / `─`) | Places Library on the left or top. |
| `i` | Toggles clip metadata: duration, channels, sample rate, size, and Note. |
| `?` | Opens mouse / keyboard interaction help. |
| DevicePill | Shows the connected-device state. |
| Vol pill | Shows connected device volume as `Vol {wiper}/128 ({percent}%)`. |

## Library

![Library panel. Labels: Library folder, search, flat/tree, import, and Amp presets.](@assets/studio/kit-detail-library.png)

The Library lists source haptic WAV files. Studio imports them from the chosen Library folder.

### Folder and toolbar

- **Library folder**: choose the folder containing source files. Studio reads and writes `clips/` and metadata there. Use `+ Library` when it is unset; use `⇄` to change it or `×` to clear it.
- **Search**: filters by name, tag, or group.
- **Sort**: name ascending / descending, modified newest / oldest, or duration shortest / longest. The selection persists.
- **+ Import**: imports WAV, mp3, ogg, flac, aac, or m4a from the file picker. Multiple imports show progress.
- **Refresh**: rescans `clips/` for additions and removals. Studio also rescans when the window regains focus.
- **Flat / Tree**: switches between a flat list and grouping by the source-folder structure.

### Amp presets

The Amp preset bar saves and applies all Library `libraryIntensity` settings at once.

- Choose `(new)` to reset every clip to Amp 0.5, or choose a saved preset for immediate application.
- **Save as…** stores the current settings under a new preset name (default `amp-YYYYMMDD`; replacing an existing name asks first).
- **Delete** removes the selected preset after confirmation.

### Clip cards and Edit

| Element | Action |
| --- | --- |
| `▶` / `■` | Play / stop. With Helper and a device connected, this plays haptics; otherwise it previews browser audio. |
| Name | Click to rename. Allowed: lower-case English letters, digits, `-`, `_`. |
| Amp slider | Baseline haptic intensity, 0–100% in 5% steps; click the number for direct entry. |
| `+ Kit` | Adds to the active Kit; disabled with no active Kit. |
| Edit | Opens Name / Note / Group / Tags, Swap, and Archive. |
| `× Archive` | Moves the clip to `clips/archive/`; it is hidden in Studio and reappears if moved back. |
| `⇅ Swap` | Swaps clip name and Note; disabled when Note is empty. |

Turn on `i` to show duration, Mono/Stereo, sample rate, file size, and Note beneath each card. Drag a clip to the Kit Editor to add it.

The Edit dialog supports Name (max 64, lower-case / digits / `-` / `_`), free-form Note, Group, chip-style Tags, Swap, and Archive. Imported files use their original filename as Note; Notes appear on card hover.

## Kit Editor

![Kit Editor header. Labels: create Kit and capacity meter.](@assets/studio/kit-detail-kitmeta.png)

The Kit Editor lists events in the selected Kit.

- **Kit folder** is the output location for `manifest.json`, `install-clips/`, and `stream-clips/`. When unset, Studio creates `<kitId>/` under the Library. Choose a Unity `Assets/.../Kits/` folder when the Unity SDK should read the Kit directly.
- **Create** uses the entered Kit name. A Kit name is also its folder name, `manifest.name`, and Event ID prefix; it follows `^[a-z][a-z0-9-]*$`.
- **Name** is editable with the same rule; **Version** follows semver convention but is not enforced.
- **Target Device** is optional metadata: Board, minimum firmware, and baseline volume. `⟳ Import from device` reads the current connected-device value.
- The **Capacity meter** shows flash used by FIRE `install-clips/`. It warns in red above available capacity, but deployment remains possible. It is an estimate without a connected device.

### Events and playback mode

![Events and playback mode. Labels: mode help, bulk change, Event actions, mode rail.](@assets/studio/kit-detail-events.png)

The Events header shows count and Kit capacity. It adds insertion-order sorting to the Library sort choices, a `?` mode reference, and a bulk selector that changes every Event to FIRE, CLIP, or BOTH.

Each Kit Event is an independent copy of the Library clip card. Changing Name, Amp, or Note in Library later does not change the Event. Remove deletes only the Event, never the Library source.

| Display | Symbol | manifest value | Main use |
| --- | --- | --- | --- |
| **FIRE** | `>` | `['command']` | Short one-shots and production use. Plays device-installed WAV with low latency and offline support. |
| **CLIP** | `♪` | `['stream_clip']` | Long material, dynamic modulation, and prototyping. SDK streams WAV over UDP. |
| **BOTH** | `>♪` | `['command', 'stream_clip']` | Compare both during development. Same base Event ID exists in both `events` and `stream_events`. |

Changing a mode, including bulk change, stops any preview. The Event Edit dialog offers Name, Note, read-only derived Event ID (`<kit>.<clip>`), Swap, and Remove from kit.

## Deploy and Save Folder

![Deploy and Save Folder. Labels: Deploy and Save Folder.](@assets/studio/kit-detail-deploy.png)

| Button | Action | Requires |
| --- | --- | --- |
| **Save Folder** | Writes `manifest.json` and WAV files to the Kit folder; does not send to a device. | Library and Kit folders |
| **Deploy** | Builds the same output and transfers its zip through Helper. | Library / Kit folders, Helper, and an online playback device |

Unchanged audio skips WAV re-encoding, so Amp-only changes are fast. Status beside the buttons reports missing folders, invalid Kit name, saving, saved, and device readiness. With multiple devices, Studio transfers to each in turn and shows per-device progress.

Deployment is blocked until a Kit folder is selected, all Events have non-empty Event IDs, and IDs match the contracts form `category.name` using `[a-z0-9_-]`.

## Persistence and keyboard controls

| Data | Storage |
| --- | --- |
| Clip WAV and Kit output | Local Library / Kit folder (source of truth) |
| Clip audio and encoded WAV cache | Browser IndexedDB |
| Clip / Kit metadata and Amp presets | JSON in the Library folder (`clips-meta.json`, `kits-meta.json`, `amp-presets.json`) |
| View, sort, and info-toggle UI state | `localStorage` |

Disk changes require **Refresh** or returning focus to the window. Kit metadata auto-saves after edits; Kit-folder WAV / manifest change only after Save Folder or Deploy.

Keyboard controls work only while a pane has cursor / focus, not while editing text:

| Key | Library | Kit Editor |
| --- | --- | --- |
| ↑ / ↓ | Move selection | Move selection |
| ← / → | Amp − / + 5% | Amp − / + 5% |
| Space | Play / stop | Play / stop |
| Enter | Add selected clip to active Kit | — |
| Delete / Backspace | — | Remove selected Event from Kit |

## Related pages

- [Create your first Kit](/en/docs/tools/studio/getting-started/)
- [Create and distribute a Kit](/en/docs/tools/studio/kit-design/)
- [Switch modes](/en/docs/tools/studio/modes/)
- [Studio overview](/en/docs/tools/studio/ui-overview/)
