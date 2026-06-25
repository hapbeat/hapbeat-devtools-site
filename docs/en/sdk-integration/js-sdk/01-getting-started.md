---
title: Getting Started
kind: tutorial
description: Install from npm and drive Hapbeat in a few lines. Node sends UDP directly; Browser relays through the helper. A JS/TS SDK that separates the fire side (when to play) from the tuning side (what and how to play), tying them together by event id.
sidebar:
  order: 1
  label: Getting Started
---

:::tip[For those using an AI coding agent]
To get an AI up to speed on the Hapbeat JS/TS SDK, paste the prompt below.

```text
I'm using the Hapbeat JS/TS SDK. Read https://raw.githubusercontent.com/hapbeat/hapbeat-js-sdk/master/AGENTS.md and follow its spec and best practices.
```
:::

This is the SDK for driving Hapbeat from JavaScript / TypeScript (npm `@hapbeat/sdk`).
It targets WebXR, three.js / Babylon.js, p5.js, jsPsych experiments, Electron, Node servers, and more.
**It separates the fire side (when and where to play) from the tuning side (what and how to play)**,
tying them together by event id alone.

## One API, two transports

There is a single `connect()`, but the transport switches automatically depending on
the runtime (determined by the package's `exports` map).

- **Node** (Electron / server / CLI / creative coding) → sends Wi-Fi **UDP**
  broadcasts directly.
- **Browser** (WebXR / three.js / p5.js / React / jsPsych) → since browsers cannot open
  a raw UDP socket, it relays over **WebSocket** (`ws://localhost:7703`) to the locally
  running [hapbeat-helper](https://github.com/hapbeat/hapbeat-helper).

The code is the same either way (`connect()` → `play(id)`). For the differences and
constraints between transports, see [](/en/docs/sdk-integration/js-sdk/transports/).

## Installation

```bash
npm install @hapbeat/sdk
```

It is ESM-only (`"type": "module"`). **If you use the Browser path, the helper daemon
is required.**

```bash
pip install hapbeat-helper   # install once
hapbeat-helper               # and keep it running
```

## Your first event (Node)

```ts
import { connect } from "@hapbeat/sdk";

const hb = await connect({ appName: "MyApp" }); // UDP broadcast + keep-alive
hb.play("sample-kit.sine_100hz", { gain: 0.3 });           // fire by event id (gain is 0..1)
hb.play("sample-kit.sine_100hz");                          // gain omitted → kit / EventMap default
hb.stopAll();
await hb.close();
```

- `connect()` opens a UDP broadcast socket and sends keep-alives to show the app name
  (`appName`, up to 16 characters) on the device OLED.
- `play(eventId, opts)` is a fire-and-forget call that sends a playback instruction. `gain` is
  0..1 (clamped by the SDK). If omitted, the EventMap described below supplies the default
  (the kit's intensity).
- Always `await hb.close()` on shutdown. It tells the device the app has left and cancels
  any streams currently playing.

`"sample-kit.sine_100hz"` must be an event id contained in a **kit deployed to the device**
(written via [Hapbeat Studio](https://devtools.hapbeat.com)). The SDK only sends *instructions*;
the waveform lives in the kit on the device (command mode). For clip mode, where the waveform
is sent from the SDK, see [](/en/docs/sdk-integration/js-sdk/command-vs-clip/).

## Your first event (Browser)

The code is the same in the browser, but **the helper must be running**
(`connect()` rejects if it cannot reach `ws://localhost:7703`).

```ts
import { connect } from "@hapbeat/sdk";

const hb = await connect({ appName: "MyWebXR" }); // → ws://localhost:7703 (helper)
hb.play("sample-kit.sine_100hz", { gain: 0.5 });
```

The bundler picks the browser build automatically, and the helper performs the UDP broadcast
on your behalf. Pass `onConnectionLost` to react when the helper goes down. The browser-specific
constraints (clip playback reaches every device the helper knows about; `targetTimeUs` is ignored)
are summarized in [](/en/docs/sdk-integration/js-sdk/transports/).

It works the same in React. Call `connect()` exactly once (in an effect or a module-level
singleton), then just call `hb.play(...)` from your event handlers.

## Discovering devices

```ts
for (const d of await hb.discover(1500)) {
  console.log(d.ip, d.address, d.firmwareVersion);
}
```

`discover(timeoutMs = 1500)` collects devices via broadcast PING / PONG (not mDNS).

## Separating the fire side from the tuning side (EventMap)

Instead of writing "haptic tuning values" such as intensity into your firing code, collect
them in the **kit manifest (= EventMap)**. `play("id")` resolves the defaults from there.

```ts
import { connect, EventMap } from "@hapbeat/sdk";

const manifest = await fetch("/my-kit/my-kit-manifest.json").then((r) => r.json());
const hb = await connect({ eventMap: EventMap.fromManifest(manifest) });
hb.play("sample-kit.sine_100hz"); // fires with the intensity from the kit manifest
```

You can swap "when to play (code)" and "how strong (kit)" independently.
See [](/en/docs/sdk-integration/js-sdk/event-map/) for details.

## Specifying a target

```ts
hb.play("sample-kit.sine_100hz", { target: "player_1/chest" }); // one device
hb.play("sample-kit.sine_100hz", { target: "*/chest" });        // all chest devices
hb.play("sample-kit.sine_100hz", { target: "" });               // broadcast to all (default)
```

The target resolution order is "the `target` at call time" → "`connect()`'s `defaultTarget`".
`""` is a broadcast. For the notation (`player_1/chest` / `*/chest` / `group_<N>`), see
[](/en/docs/concepts/group-player-addressing/).

## Read next

- [](/en/docs/sdk-integration/js-sdk/transports/) — differences and constraints of Node (UDP) vs Browser (helper WS)
- [](/en/docs/sdk-integration/js-sdk/command-vs-clip/) — choosing between command and clip ([](/en/docs/concepts/fire-vs-clip/))
- [](/en/docs/sdk-integration/js-sdk/event-map/) — resolving default intensity from the kit manifest ([](/en/docs/concepts/event-id-and-kit/))
- [](/en/docs/sdk-integration/js-sdk/project-structure/) — how to lay out kits and clips in your project
- [](/en/docs/sdk-integration/js-sdk/examples/) — a walkthrough of working samples
