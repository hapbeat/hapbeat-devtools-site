---
title: Examples
kind: tutorial
description: A walkthrough of the runnable samples bundled in the repo (node-minimal → browser-minimal → React Native → games arcade) and worked instances of the EventMap / kit-manifest / router patterns.
sidebar:
  order: 8
  label: Examples
---

The `@hapbeat/sdk` repo's [`examples/`](https://github.com/hapbeat/hapbeat-js-sdk/tree/master/examples) contains runnable samples ordered from smallest to largest. They are a foundation to copy and bring into your own project.

## How to get the examples

:::note
The `examples/` folder is **not shipped in the npm package** (the npm `@hapbeat/sdk` only contains `dist`, the README, and LICENSE). Get the examples by cloning the GitHub repo:

```bash
git clone https://github.com/hapbeat/hapbeat-js-sdk
cd hapbeat-js-sdk/examples/<name>
```

(You can also download a repo tarball or use `degit`.)
:::

## Reading order

We recommend reading them progressively: start with the minimal fire, then the browser path, and finally the real-app-scale arcade.

1. <a href="https://github.com/hapbeat/hapbeat-js-sdk/blob/master/examples/node-minimal.mjs" target="_blank" rel="noopener noreferrer">`examples/node-minimal.mjs`</a> — one round trip of `connect()` → `play(id)` → `close()` over UDP from Node. Grasps the SDK's minimal loop.
2. <a href="https://github.com/hapbeat/hapbeat-js-sdk/blob/master/examples/browser-minimal.html" target="_blank" rel="noopener noreferrer">`examples/browser-minimal.html`</a> — the exact same calls, sent from the browser via the helper's WebSocket. Confirms that the API is identical in Node and the browser.
3. <a href="https://github.com/hapbeat/hapbeat-js-sdk/tree/master/examples/react-native" target="_blank" rel="noopener noreferrer">`examples/react-native/`</a> — a minimal Android demo where a button tap sends a command (play) plus a 1 s synthesized streaming buffer. A phone is not sandboxed like a browser, so it sends a **direct UDP broadcast** via `react-native-udp` (no helper needed).
4. [`examples/games/`](#arcade) (Hapbeat Arcade) — a real-app-scale setup that also includes EventMap + kit manifest + a "file-first / synth-fallback" router.

For the transport difference (Node = direct UDP / React Native = direct UDP via `react-native-udp` / Browser = helper WS), see [](/en/docs/sdk-integration/js-sdk/transports/).

## Sample table

| Sample | Target | What it shows | Kit needed? |
|---|---|---|---|
| `node-minimal.mjs` | Node | `connect()` → `play(id)` → `close()` over UDP | a Hapbeat on the LAN + a deployed kit, if you want haptics |
| `browser-minimal.html` | Browser | the same calls via the helper WebSocket | `hapbeat-helper` running + HTTP serving |
| `react-native/` | React Native (Android) | a button tap sends a command (play) + a 1 s synthesized stream over direct UDP (helper-free); verified on Android (RN 0.86) | a Hapbeat on the LAN + a deployed kit. Needs `react-native-udp` + the `fast-text-encoding` polyfill (see the example's README / [](/en/docs/sdk-integration/js-sdk/transports/)) |
| `games/` (Hapbeat Arcade) | Browser | a worked instance of EventMap + kit manifest + a file/synth router (FPS + mini-games) | HTTP serving. Haptics need helper + demo-kit |

The two minimal samples are designed to "launch even with no device on the LAN" (they send command-mode events, which are simply ignored if no device is present). The arcade can be tried with sound and visuals alone, even without a device or helper.

## Running (the two minimal samples)

```bash
# Node — run as is
node examples/node-minimal.mjs

# Browser — serve over HTTP from the repo root (see below)
npm run dev
# → open http://localhost:8170/examples/browser-minimal.html
```

The browser path **requires the helper** (`pip install hapbeat-helper` → run `hapbeat-helper` to listen on `ws://localhost:7703`). For details, see [](/en/docs/sdk-integration/js-sdk/transports/).

## Hapbeat Arcade (`examples/games/`) {#arcade}

`examples/games/` is a haptic demo arcade that runs on the browser transport + helper. It collects mini-games playable in 1–2 minutes each at an exhibition, all aiming for an experience that **only works / changes because the haptics are there** (an invisible-wall maze / a haptic rhythm game / a treasure hunt / a reaction-time game). Each game has a modality switch to toggle audio, visuals, and haptics individually, allowing an A/B comparison with "haptics only."

### Structure

```
Browser (this demo)
   │  @hapbeat/sdk  →  ws://localhost:7703
   ▼
hapbeat-helper (pip install hapbeat-helper)
   │  UDP 7700 broadcast
   ▼
Hapbeat device (demo-kit deployed)
```

`examples/games/demo-kit/` (`hapbeat-arcade-manifest.json` + `install-clips/*.wav`) is the Kit to deploy to the device. If you Deploy it to the target device from **Hapbeat Studio**, the haptics corresponding to the event ids the games send (e.g. `hapbeat-arcade.maze_bump`) will play. The games still run without deploying it — only the haptics are silent (the event isn't on the device, so it's ignored).

### How to run

```bash
# 1. Start the helper (install on first use only)
pip install hapbeat-helper
hapbeat-helper                 # listens on ws://localhost:7703

# 2. Serve the demo over HTTP (from the repo root)
npm run dev                    # builds dist/ + tsc --watch + static serving + auto-reload
# → open http://localhost:8170/examples/games/
#   (change the port with PORT=8080 npm run dev)
```

Editing `src/*.ts` rebuilds `dist/` and auto-reloads the browser. `npm run serve` only serves the built `dist/` statically (no watch).

### Worked instances of the EventMap / manifest / router patterns

The arcade is a reference implementation that translates the ideas explained in this documentation into real code.

- **kit manifest** — reads it to resolve per-event default intensity ([](/en/docs/sdk-integration/js-sdk/event-map/)). `demo-kit/hapbeat-arcade-manifest.json` is a schema 2.0.0 kit manifest.
- **command vs clip router** — the mode is split by the manifest bucket (`events` = command / `stream_events` = clip), and the game code just calls `play(id)`, unchanged ([](/en/docs/sdk-integration/js-sdk/command-vs-clip/)).
- **file-first / synth-fallback** — `shared/event-content.js` consolidates each event's haptic (synthesized PCM) + sound in one file, falling back to synthesis when the kit/WAV is absent. This is the starting point (source of truth) for tuning.

Each event's clip / intensity is a **placeholder** borrowed from Studio's `showcase-kit`, with final tuning expected to be done by the user (mapping table: <a href="https://github.com/hapbeat/hapbeat-js-sdk/blob/master/examples/games/TUNING.md" target="_blank" rel="noopener noreferrer">`TUNING.md`</a>).

## Pitfalls

- **Won't run from `file://`** — ES Modules + import map + WAV fetch cannot be read from the file system. Always serve over HTTP (`npm run dev` / `npx serve .`). If you get a blank page or a module error, suspect this first.
- **The browser path requires a running helper** — without the helper, `connect()` cannot reach `ws://localhost:7703` and rejects. The arcade can be tried with sound and visuals alone even without the helper, but no haptics come out.
- **Multi-homed (multiple NIC) PC** — if Wi-Fi and Ethernet are connected at the same time, the UDP broadcast may go out the unintended NIC and never reach the device. Make sure there is a route on the NIC on Hapbeat's LAN side, or disconnect one of them.
- **Sound and visuals come out but no haptics** — the most common cause is that the event id is not in the deployed kit. Check whether `discover()` sees the device and whether the event name matches the manifest ([](/en/docs/sdk-integration/js-sdk/getting-started/)).

## Related

- [](/en/docs/sdk-integration/js-sdk/event-map/) — resolving default intensity from a kit manifest
- [](/en/docs/sdk-integration/js-sdk/command-vs-clip/) — choosing between command and clip
- [](/en/docs/sdk-integration/js-sdk/streaming-clips/) — clip streaming
- [](/en/docs/sdk-integration/js-sdk/streaming-live/) — continuous streams (`openStream`)
