---
title: Running Multiple Apps Simultaneously
kind: howto
sidebar:
  order: 200
description: Operational guidance and workarounds for running multiple Unity apps (or an app alongside Hapbeat Studio) against a single Hapbeat device at the same time.
---

The Hapbeat SDK is designed with **one device = one app** as the baseline assumption. Connecting multiple client apps (App A and App B, or an app alongside Hapbeat Studio) to a single Hapbeat device **simultaneously** causes haptic commands to collide, the device display to switch back and forth frequently, and other unintended behavior.

This page is operational guidance for cases where you absolutely need multiple apps to coexist.

---

## Why collisions occur

Hapbeat devices process haptic commands received via UDP broadcast relying solely on the `group_id` filter. As of v0.1.0, there is no mechanism to distinguish the sending application.

As a result:

- App A fires `event_id=A.foo` → device vibrates
- Simultaneously, App B fires `event_id=B.bar` → the device vibrates for **both** (overlapping into unintended haptics)
- The `appName` carried in `CONNECT_STATUS` is overwritten by whichever app's packet arrives last, so the display flickers between A and B

---

## Recommended: physically separate the LAN (simplest)

The most reliable approach, and the simplest to configure.

### Pattern 1: Use separate routers / SSIDs

- App A PC + App A Hapbeat → Router A (SSID `studio-a`)
- App B PC + App B Hapbeat → Router B (SSID `studio-b`)

UDP broadcast is isolated within each LAN, so **packets from one side never reach the other's Hapbeat**. Complete isolation with no configuration required.

### Pattern 2: Use Hapbeat itself as a SoftAP

Connect the VR HMD or PC directly to Hapbeat's SoftAP. Running multiple Hapbeats as separate SoftAPs creates multiple independent small LANs.

- App A → connects to Hapbeat A's SoftAP `hapbeat-a-XXXX`
- App B → connects to Hapbeat B's SoftAP `hapbeat-b-XXXX`

> For detailed connection scenarios, see the Connection scenarios A–E section in the workspace CLAUDE.md.

---

## Second-best option: separate by group ID

When LAN separation is not possible (e.g. multiple apps and many Hapbeat devices in the same exhibition booth), **assigning non-overlapping group ID ranges** allows routing to be separated in practice.

### Example: split group ranges between A and B

| App | group ID range |
|---|---|
| App A | 0–10 (players 0–10) |
| App B | 11–20 (players 11–20) |

- Assign a **unique group ID to each Hapbeat device** in advance via Hapbeat Studio or Hapbeat Helper Settings (e.g. 1, 2, 3, ..., 11, 12, ...)
- App A calls `HapbeatManager.Instance.SetAddressOverride(player, group, persist: true)` at runtime, pinning group to a value within 1–10
- App B does the same, pinning group to a value within 11–20

Each Hapbeat only picks up packets matching its own group ID, so haptic collisions do not occur.

### Limitations of this approach

- **The app name shown on the display will be confused**: both App A and App B broadcast `CONNECT_STATUS` to the same network, so the `app_name` displayed on the device is overwritten by whichever app's packet arrives last.
  - Haptic behavior itself is correctly separated by the group filter, so functionality is unaffected.
  - If you need the display to confirm which app is connected, this approach is insufficient.
- Group ID range management must be enforced by operational rules (if App A accidentally sends group 15, it reaches App B's devices).

---

## Deploying the same build to multiple HMDs (Address Override)

The case above was "multiple apps targeting one Hapbeat." The opposite case is also common: **deploying the exact same Unity build to multiple HMDs, with each device paired 1:1 to its own Hapbeat** (a booth with several HMD/Hapbeat pairs side by side, rental hardware that always runs the same build, etc.).

For this use case you don't need to fork the build per HMD. The SDK's **Address Override** feature lets you keep a single build for every device and pick the player/group on each device instead.

There are two scopes, and their names are deliberately paired. To pin a value for the whole build, use **Override Addressing (this build)** in `Hapbeat > Settings` (`HapbeatConfig.buildOverridePlayer` / `buildOverrideGroup`). To vary it per device, use the runtime API / settings panel — **Override Addressing (this device)**. Each axis is independent; see below for details.

### The defaults are player_1 / group_1 — number your demos from 2 up

A device always stores its address in the canonical `player_<N>/<position>/group_<M>` form, and **the defaults are `player_1` / `group_1`** (since firmware DEC-048 the group segment is never omitted).

That means **any unit you forget to configure joins player_1 / group_1 — i.e. "demo number 1."** When you split demos apart, number them **from 2 upward instead of 1**, so an unconfigured unit stands out immediately by responding to none of the demos.

### Two ways to set it

1. **Call it directly from script**: `HapbeatManager.Instance.SetAddressOverride(player, group, persist: true)`.
   `player` / `group` are 1–99, or pass `HapbeatManager.AddressOverrideDisabled` (`-1`) to leave that axis alone (the EventMap entry's target is sent as-is).
   With `persist: true`, the values are saved to PlayerPrefs and restored automatically on the next launch — **this is the basic flow for "one identical build deployed to many HMDs, each bound to its own Hapbeat."**
2. **Attach the `HapbeatAddressOverridePanel` component**: add it to any GameObject and it builds a runtime UI with +/- steppers for player/group and an Apply button — no scene wiring required.
   - `Space` (Inspector) toggles between `ScreenSpaceOverlay` (fixed 2D HUD, default) and `WorldSpace` (a 3D panel for VR controllers or spatial attachment).
   - In `WorldSpace`, `World Attach Mode` picks how the panel is anchored. Placement is tuned with `Follow Distance` / `Follow Vertical Offset` in every mode.
     - `LazyFollow` (default) — stays world-fixed while it is within `Follow Deadzone Degrees` of the view center, and glides to a new resting spot in front of the wearer once they look further away. It deliberately **does not** parent the Canvas to the camera Transform: the XR compositor's reprojection (TimeWarp) is applied on top of a surface that already moved with the head, so a hard head-lock visibly swims on every head turn.
     - `WorldFixed` — stays where it was placed.
     - `CompositionLayer` (opt-in) — for a genuinely view-fixed, sharper panel. See "CompositionLayer mode" below.
   - The `AddressOverrideDemo` sample in Showcase (Z4_Stream) is just a thin subclass of `HapbeatAddressOverridePanel` — a minimal starting point if you want to build your own UI on top of it.

```csharp
// Call this at startup, or whenever the user confirms the number chosen in a settings screen
HapbeatManager.Instance.SetAddressOverride(player: 3, group: HapbeatManager.AddressOverrideDisabled, persist: true);
```

No device-side changes are required — this works with no protocol or firmware changes. Set the player/group number on the Hapbeat itself via its physical buttons, and as long as it matches the SDK-side override, the 1:1 pairing just works.

### CompositionLayer mode (view-fixed and sharper)

Setting `World Attach Mode` = `CompositionLayer` on `HapbeatAddressOverridePanel` renders the panel into a RenderTexture and hands it to the XR compositor as an **OpenXR quad composition layer** — the same mechanism as the Quest boot logo. Because it never passes through the application's eye buffer:

- **It doesn't swim** — the layer is composited *after* reprojection (TimeWarp), so fixing it to the view is stable by construction.
- **It stays sharp** — the compositor samples the source texture directly, so the project's Render Scale no longer softens the text.

Three things are required in your own project:

1. Add the `com.unity.xr.compositionlayers` package via Package Manager.
2. Enable the **Composition Layers** feature under `Project Settings > XR Plug-in Management > OpenXR` (the Android tab for Android builds).
3. **Enable `XR > Enable Composition Layer Support` in the Hapbeat Settings window** (off by default).

**Step 2 alone is not enough.** The OpenXR Composition Layers feature assigns its layer provider exactly once, when the XR session begins, and only if a composition layer manager is already running at that instant. XR is initialized and the session begins before the first scene loads, so a layer created by a scene component is always too late. Step 3 makes the SDK start that manager before XR initializes (at subsystem registration), which is what allows the assignment to happen. It is off by default because it keeps one layer resident for the whole run.

If any of them is missing — or if no layer provider comes up at runtime — the panel logs one warning and **falls back to `LazyFollow`**. The SDK still compiles without the package (this is an opt-in via the asmdef's `versionDefines`; no dependency was added to the SDK's `package.json`).

The `VRConfigExample` sample scene still defaults to `LazyFollow`, since the two prerequisites above are project-side — switch it over explicitly if you want this mode.

Limitations: the Canvas is parked out of the scene to be captured, so pointer (mouse / ray) interaction with the panel no longer works — drive it with the controller focus grid (`MoveFocus` / `ActivateFocused`). Only content inside the panel's own Canvas rect is captured, so UI parented to `PanelCanvasTransform` and offset outside that rect is framed out.

### Embedding \<p\>/\<g\> in appName makes pairing easy to verify on-site

If `HapbeatConfig.appName` contains `<p>` / `<g>`, they are substituted with the current override values right before sending, and shown on the device's OLED (`app_name` element). When an axis is disabled, it's replaced with `-`.

```text
appName = "Booth <p>/<g>"
→ player=3, group disabled: "Booth 3/-"
→ override disabled:        "Booth -/-"
```

This lets you confirm "is this HMD paired with the right Hapbeat?" directly from the device's screen, on-site.

### If text looks blurry only on the standalone headset (render resolution)

If the panel reads crisply in the Editor's Play mode (e.g. over Air Link) but looks soft only in a Quest standalone build, the usual cause is that **Unity's Quality levels are per-platform**. Editor Play over Air Link uses the Standalone (PC) level; a Quest build uses the Android (Mobile) level.

- **Raise Render Scale to 1.0**: the VR template's default URP asset, `Mobile_RPAsset`, ships with **Render Scale 0.8**. Only the device build renders at 80% resolution, so the same panel comes out blurrier there. Open the render pipeline asset the Android tier references under `Project Settings > Quality` and set Render Scale to `1.0`.
- **Fine-tune with the panel's World Pixel Density**: raising `World Pixel Density` on `HapbeatAddressOverridePanel` (default `3`, range `1–8`) rasterizes glyphs at a higher resolution for the same physical size. It trades font atlas memory for sharpness, so raise it only as far as you need.

Both are **settings in your own project** — the SDK cannot change them, since Quality tiers and URP assets are project assets.

### Best practices

- **Ship one build for every device; keep per-device identity on the device**: `SetAddressOverride(..., persist: true)` is saved to PlayerPrefs (local to that device), so a single build can be deployed to any number of HMDs. Assign player/group once per device after deployment.
- **Author EventMap targets to be device-agnostic**: leave the player portion of the target as `*` (wildcard). On devices with no override set, everything still reaches every device; on devices with an override set, it reaches only the paired Hapbeat — the same EventMap works for both without changes.
- **Treat group as a separate axis from the override**: keep the 1:1 player pairing distinct from group-based use cases like "trigger for the whole team at once."
- **When you use group override, always match the group number on the device**: address matching is positional, prefix-based (only the i-th segment on each side is compared), so a send targeted at `group_5` only reaches devices on group_5. A device defaults to `group_1`, so **an unconfigured unit only ever receives group_1 sends**. If you enable group override on the SDK side, set the same group number (1–99) on the paired Hapbeat device as well.
- **Clear explicitly when re-pairing a device**: when moving a device to a different Hapbeat, call `HapbeatManager.Instance.ClearPersistedAddressOverride()`, or click **Clear Saved Override** in the `HapbeatManager` inspector while in Play mode. After clearing, the override reverts to disabled — there is no config-level default to fall back to.
- **Do one final verification pass on the real target platform**: beyond checking in the Editor's Play mode, verify at least once on the actual deployment platform (e.g. an actual Quest build) that PlayerPrefs persistence, OLED display, and pairing all work end-to-end.

---

## If strict per-source-app filtering is needed

For use cases such as "same LAN, same group, want to exclusively switch between apps" (e.g. time-sharing a Hapbeat between App A and B, enterprise demos, etc.), **strict source filtering by app ID** is technically feasible:

- Each app carries a UUID / app_id
- The Hapbeat device pins the first app_id it receives and ignores all others
- A button press on the device releases the pin and allows a new app_id to be accepted

This is similar to the bHaptics enterprise design, but **implementing it requires simultaneous changes to contracts / device firmware / SDK** (a DEC-level design decision).

If you have a use case that requires this, please open a [GitHub Issue](https://github.com/Hapbeat/hapbeat-unity-sdk/issues) with details and we will consider implementing it.

---

## Summary

| Situation | Recommended approach |
|---|---|
| Normal operation (1 device = 1 app) | Default configuration — no changes needed |
| Multiple apps + multiple Hapbeats in the same room | **Physically separate LAN / SoftAP** (strongly recommended) |
| LAN separation not possible, only need haptic separation | **Split by group ID range** (display will be confused, but behavior is correct) |
| Strict per-source-app filtering required | Open an Issue (not implemented as of now) |
