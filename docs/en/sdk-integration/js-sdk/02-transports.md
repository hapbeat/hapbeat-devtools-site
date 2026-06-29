---
title: Transports — Node UDP / React Native UDP / Browser helper
kind: explanation
description: One API, three transports. Node and React Native broadcast Wi-Fi UDP directly; the browser relays through hapbeat-helper over WebSocket. How the package's exports map switches automatically based on the runtime, and how the paths differ in capability.
sidebar:
  order: 2
  label: Transports
---

The JS/TS SDK has **one API and three transports (send paths)**.
Even though you call `connect()` the same way, the internal send method differs between
Node, React Native, and the browser.

- **Node** (Electron / server / CLI / creative coding) → sends a Wi-Fi
  **UDP broadcast** directly to the device.
- **React Native** (Android / iOS phone apps) → sends a Wi-Fi **UDP broadcast** directly
  from the phone via the optional `react-native-udp`. Because a phone is not sandboxed
  like a browser, it can open a real UDP socket, so **no hapbeat-helper is needed**.
- **Browser** (WebXR / three.js / p5.js / jsPsych, etc.) → relays over
  **WebSocket** (`ws://localhost:7703`) to the locally running **hapbeat-helper**.
  Since browsers cannot open a raw UDP socket, the helper broadcasts on its behalf.

You **don't need to choose** which one to use. The package's `exports` map looks at the
runtime / bundler and automatically picks the correct build.

## Why three builds are needed

Hapbeat devices receive **UDP broadcasts** on the LAN and self-filter
(details in [](/en/docs/concepts/group-player-addressing/)). Node can send UDP directly with
`node:dgram` and React Native with `react-native-udp`, but **the browser sandbox does not
permit raw UDP**.
So the browser side hands instructions to the local helper daemon over WebSocket, and the
helper performs the UDP broadcast in its place.

To absorb this difference, the SDK has three entry points with different internals.

| Build | Entry | Dependency | Send path |
|---|---|---|---|
| Node | `dist/node.js` | `node:dgram` | UDP broadcast (direct) |
| React Native | `dist/react-native.js` | `react-native-udp` | UDP broadcast (direct) |
| Browser | `dist/browser.js` | `WebSocket` | via hapbeat-helper |

The transport implementations are split per entry so that `node:dgram` does not leak into
the browser bundle.

## Automatic selection via the exports map

The `package.json` of `@hapbeat/sdk` selects builds via `exports` conditions.

```jsonc
"exports": {
  ".": {
    "node":         { "default": "./dist/node.js" },          // Node runtime
    "react-native": { "default": "./dist/react-native.js" },  // React Native runtime
    "browser":      { "default": "./dist/browser.js" },       // a bundler's browser condition
    "default":      { "default": "./dist/browser.js" }        // everything else (WebXR, etc.)
  }
}
```

- **Run in Node** → matches the `node` condition → UDP build.
- **Bundle with React Native (Metro)** → matches the `react-native` condition → RN UDP build.
- **Bundle with Vite / webpack / esbuild** → matches the `browser` condition → helper build.
- Any other runtime falls back to `default` (= browser build).

Your code stays the same either way.

```ts
import { connect } from "@hapbeat/sdk"; // exports decides which build
const hb = await connect({ appName: "MyApp" });
```

## Node — UDP broadcast

The Node build opens a UDP4 socket with `node:dgram` and broadcasts packets such as
`PLAY` / `STOP` / `CONNECT_STATUS` directly.

```ts
const hb = await connect({
  appName: "MyApp",          // OLED display name (up to 16 characters)
  port: 7700,                // default 7700 (command destination port)
  broadcastAddr: "255.255.255.255", // default
  keepalive: true,           // default true
  // bindPort: 7700,         // opt-in: bind the well-known receive port (default: ephemeral)
});
```

- **Sends go to port `7700`** (the device command port). The **receive socket binds
  an ephemeral (OS-assigned) port by default** (DEC-036): only the daemon
  (hapbeat-helper) binds the well-known 7700, so the SDK never steals it from the
  helper. PONGs come back to the ephemeral source port, so discovery still works.
- Pass `bindPort: 7700` to opt in to binding the well-known receive port (a
  daemon-style listener that wants unsolicited broadcasts); it falls back to an
  ephemeral port if 7700 is busy.
- Only when `keepalive` is enabled and `appName` is set does it send
  `CONNECT_STATUS` every 5 seconds to show the app name on the device OLED
  (`hb.close()` sends an "app has left" notification to clear it).

### Multi-NIC (multi-homed) caveat

If your PC has multiple network interfaces (wired + Wi-Fi, VPN, Docker virtual NICs, etc.),
a broadcast addressed to `255.255.255.255` may **go out through a different NIC than the
Hapbeat**. If devices are not found or do not fire, check that the NIC connected to the same
LAN as the Hapbeat has a route. To send to a specific segment, set `broadcastAddr` to that
subnet's broadcast address (e.g. `192.168.1.255`).

## React Native — UDP broadcast (helper-free)

The React Native build sends a **UDP broadcast directly** from the phone using the optional
peer dependency `react-native-udp`. A phone is not sandboxed like a browser, so it can open a
real UDP socket. That means **no hapbeat-helper is needed**, and the wire format is identical
to Node. The `react-native` condition in `exports` resolves `dist/react-native.js`.

```ts
const hb = await connect({ appName: "MyApp" });
hb.play("sample-kit.sine_100hz", { gain: 0.5 });
```

### Setup in the app

1. Install the dependencies.

   ```bash
   npm install react-native-udp fast-text-encoding
   ```

   - `react-native-udp` — the UDP native module (autolinked).
   - `fast-text-encoding` — a **required polyfill**. RN Hermes (including 0.86) ships
     `TextEncoder` but **not** `TextDecoder`, which the wire protocol needs to decode.

2. Add a `metro.config.js` resolver so `@hapbeat/sdk` resolves to its React Native build.

   ```js
   // metro.config.js
   config.resolver.unstable_enablePackageExports = true;
   config.resolver.unstable_conditionNames = ["react-native", "require", "default"];
   ```

3. Make **`import 'fast-text-encoding';` the first import** (before `@hapbeat/sdk`, at the top
   of `index.js` or `App.tsx`). Otherwise you get
   `ReferenceError: Property 'TextDecoder' doesn't exist`.

   ```ts
   import "fast-text-encoding"; // ← first, before @hapbeat/sdk
   import { connect } from "@hapbeat/sdk";
   ```

### Platform permission notes

- **Android**: the `INTERNET` permission is granted by default, and broadcast send works out
  of the box. Receiving discovery PONGs may need a multicast lock on some networks. AP /
  client isolation can block broadcast.
- **iOS 14+**: requires the Local Network permission
  (add `NSLocalNetworkUsageDescription` to `Info.plist`).

For a complete, runnable example, see [](/en/docs/sdk-integration/js-sdk/examples/).

## Browser — via hapbeat-helper

Because the browser build cannot send UDP, it hands instructions (`play_event` /
`stream_begin`, etc.) over WebSocket to the local **hapbeat-helper**, and the helper performs
the UDP broadcast.

### Installing and running the helper

```bash
pip install hapbeat-helper
hapbeat-helper            # listens on ws://localhost:7703
```

### Connecting

```ts
const hb = await connect({
  appName: "MyWebXR",
  helperUrl: "ws://localhost:7703", // default
  connectTimeoutMs: 4000,           // default. Time until reject when the helper is unresponsive
  onConnectionLost: () => {
    // called when the helper goes down / restarts after the connection was established
    console.warn("Lost connection to hapbeat-helper");
  },
});
```

- If the helper is unreachable or does not respond within `connectTimeoutMs`, `connect()`
  **rejects**. Guide the user to `pip install hapbeat-helper` and start it.
- `onConnectionLost` is only called when an already-established connection is later lost
  (the helper quits or restarts). An initial connection failure is handled by the reject
  side of `connect()`.

## Capability differences between transports

`play` / `stop` / `stopAll` (command mode) behave **the same on all transports**.
Node and React Native both send UDP directly and match in capability; only the browser
(via the helper) has some constraints around streaming (clip / live).

| Feature | Node (direct UDP) | React Native (direct UDP) | Browser (helper WS) |
|---|---|---|---|
| command playback `play(id)` | ✅ | ✅ | ✅ |
| `target` specification (command) | ✅ device self-filters | ✅ device self-filters | ✅ |
| `targetTimeUs` (synced playback) | ✅ carried in the packet | ✅ carried in the packet | ⚠️ **ignored** (immediate playback only) |
| clip / live streaming | ✅ | ✅ | ✅ |
| per-device targeting of clip / stream | ✅ scoped by in-packet address | ✅ scoped by in-packet address | ⚠️ reaches **every device** the helper knows |
| keep-alive (OLED app name display) | ✅ `CONNECT_STATUS` every 5 s | ✅ `CONNECT_STATUS` every 5 s | — |
| device discovery `discover()` | ✅ broadcast PING/PONG | ✅ broadcast PING/PONG | ✅ via the helper's `rescan` |

Why the browser-side constraints exist:

- **`targetTimeUs` ignored**: the helper WS level-1 protocol does not expose a scheduled
  playback time and only relays immediate playback.
- **clip reaches every device**: the helper is designed to resolve stream targets to the IPs
  of known devices, and per-device clip targeting via an address string (`player_1/chest`,
  etc.) is currently unsupported. Node clip streaming honors the in-packet address.

These relate to [](/en/docs/sdk-integration/js-sdk/command-vs-clip/) /
[](/en/docs/sdk-integration/js-sdk/streaming-clips/) /
[](/en/docs/sdk-integration/js-sdk/streaming-live/) as well.

## Bundlers and Electron

- **Vite / webpack / esbuild** automatically resolve the `browser` condition in `exports`,
  so no special configuration is needed (the browser build is selected at bundle time).
- **Electron** can use either depending on your setup. Even in the renderer process, you can
  use the **node build (direct UDP)** if Node integration is enabled. Because you can send
  directly to devices without standing up the helper separately, the node build is the more
  convenient choice for desktop apps.

## Summary

- One API, three transports. The selection is made automatically by the `exports` map.
- Node = direct UDP (sends to 7700; receive bind is ephemeral by default, `bindPort` to opt in; keep-alive; mind multi-NIC).
- React Native = direct UDP (requires `react-native-udp` + the `fast-text-encoding` polyfill,
  a `metro.config.js` resolver, polyfill as the first import; no helper needed).
- Browser = via hapbeat-helper (requires `pip install hapbeat-helper`; constraints on
  `targetTimeUs` and per-device clip targeting).
- Command-mode behavior matches across all paths, so starting with command lets you avoid
  worrying about the difference at first.

## Read next

- [](/en/docs/sdk-integration/js-sdk/getting-started/) — installation and your first event
- [](/en/docs/sdk-integration/js-sdk/command-vs-clip/) — choosing between command and clip
- [](/en/docs/sdk-integration/js-sdk/streaming-live/) — continuous streaming (`openStream`)
