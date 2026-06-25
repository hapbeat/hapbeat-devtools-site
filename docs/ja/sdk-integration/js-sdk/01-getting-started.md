---
title: Getting Started
kind: tutorial
description: npm で入れて数行で Hapbeat を駆動する。Node は UDP 直送、Browser は helper 経由。起点（いつ鳴らすか）と触覚の編集（何を・どう鳴らすか）を分けて event id で結ぶ JS/TS SDK。
sidebar:
  order: 1
  label: Getting Started
---

:::tip[AI コーディングエージェントを使う方へ]
Hapbeat JS/TS SDK を AI に把握させるには、下記プロンプトを入力してください。

```text
Hapbeat JS/TS SDK を使います。https://raw.githubusercontent.com/hapbeat/hapbeat-js-sdk/master/AGENTS.md を読んで、その仕様とベストプラクティスに従ってください。
```
:::

JavaScript / TypeScript から Hapbeat を駆動する SDK です（npm `@hapbeat/sdk`）。
WebXR・three.js / Babylon.js・p5.js・jsPsych 実験・Electron・Node サーバーなど向け。
**起点（いつ・どこで鳴らすか）と触覚の編集（何を・どう鳴らすか）を分け**、event id
だけで結びます。

## 1 つの API、2 つのトランスポート

`connect()` は 1 つですが、実行環境に応じてトランスポートが自動で切り替わります
（パッケージの `exports` マップで判定）。

- **Node**（Electron / サーバー / CLI / クリエイティブコーディング）→ Wi-Fi **UDP**
  ブロードキャストを直接送ります。
- **Browser**（WebXR / three.js / p5.js / React / jsPsych）→ ブラウザは生の UDP
  ソケットを開けないため、ローカルで動く [hapbeat-helper](https://github.com/hapbeat/hapbeat-helper)
  に **WebSocket**（`ws://localhost:7703`）で中継します。

どちらでもコードは同じ（`connect()` → `play(id)`）です。トランスポートの違いと制約は
[](/docs/sdk-integration/js-sdk/transports/) を参照してください。

## インストール

```bash
npm install @hapbeat/sdk
```

ESM 専用（`"type": "module"`）です。**Browser パスを使う場合は helper デーモンが
必要**です。

```bash
pip install hapbeat-helper   # 一度入れて
hapbeat-helper               # 起動しておく
```

## 最初のイベント（Node）

```ts
import { connect } from "@hapbeat/sdk";

const hb = await connect({ appName: "MyApp" }); // UDP ブロードキャスト + keep-alive
hb.play("sample-kit.sine_100hz", { gain: 0.3 });           // event id で発火（gain は 0..1）
hb.play("sample-kit.sine_100hz");                          // gain 省略 → kit / EventMap の既定値
hb.stopAll();
await hb.close();
```

- `connect()` が UDP ブロードキャストソケットを開き、keep-alive を送ってデバイス
  OLED にアプリ名（`appName`、最大 16 文字）を表示します。
- `play(eventId, opts)` は再生指示を送る fire-and-forget な呼び出しです。`gain` は
  0..1（SDK 側で clamp）。省略すると後述の EventMap が既定値（kit の intensity）を
  補います。
- 終了時は必ず `await hb.close()`。アプリが離れたことをデバイスに伝え、再生中の
  ストリームをキャンセルします。

`"sample-kit.sine_100hz"` は、**デバイスに配備した kit**（[Hapbeat Studio](https://devtools.hapbeat.com)
で書き込み）に含まれる event id である必要があります。SDK は*指示*を送るだけで、
波形はデバイス上の kit にあります（command モード。波形を SDK から送る clip モードは
[](/docs/sdk-integration/js-sdk/command-vs-clip/) を参照）。

## 最初のイベント（Browser）

ブラウザでもコードは同じです。ただし **helper が起動している必要があります**
（`connect()` は `ws://localhost:7703` に届かないと reject します）。

```ts
import { connect } from "@hapbeat/sdk";

const hb = await connect({ appName: "MyWebXR" }); // → ws://localhost:7703 (helper)
hb.play("sample-kit.sine_100hz", { gain: 0.5 });
```

バンドラーが browser ビルドを自動で選び、UDP ブロードキャストは helper が代わりに
行います。helper が落ちたときに反応するには `onConnectionLost` を渡します。ブラウザ
固有の制約（clip 再生は helper が知る全台に届く・`targetTimeUs` は無視）は
[](/docs/sdk-integration/js-sdk/transports/) にまとめてあります。

React でも同じです。`connect()` を 1 回だけ呼び（effect やモジュールの singleton で）、
あとはイベントハンドラから `hb.play(...)` を呼ぶだけです。

## デバイスを探す

```ts
for (const d of await hb.discover(1500)) {
  console.log(d.ip, d.address, d.firmwareVersion);
}
```

`discover(timeoutMs = 1500)` はブロードキャスト PING / PONG でデバイスを集めます
（mDNS ではありません）。

## 起点と編集を分ける（EventMap）

強度などの「触覚の調整値」を発火コードに書かず、**kit manifest（= EventMap）**に
まとめます。`play("id")` がそこから既定値を解決します。

```ts
import { connect, EventMap } from "@hapbeat/sdk";

const manifest = await fetch("/my-kit/my-kit-manifest.json").then((r) => r.json());
const hb = await connect({ eventMap: EventMap.fromManifest(manifest) });
hb.play("sample-kit.sine_100hz"); // kit manifest の intensity で発火
```

「いつ鳴らすか（コード）」と「どれくらいの強さか（kit）」を独立して差し替えられます。
詳しくは [](/docs/sdk-integration/js-sdk/event-map/) を参照。

## ターゲットを指定する

```ts
hb.play("sample-kit.sine_100hz", { target: "player_1/chest" }); // 1 台
hb.play("sample-kit.sine_100hz", { target: "*/chest" });        // chest の全台
hb.play("sample-kit.sine_100hz", { target: "" });               // 全台ブロードキャスト（既定）
```

ターゲットの解決順は「呼び出し時の `target`」→「`connect()` の `defaultTarget`」。
`""` はブロードキャストです。記法（`player_1/chest` / `*/chest` / `group_<N>`）は
[](/docs/concepts/group-player-addressing/) を参照。

## 次に読む

- [](/docs/sdk-integration/js-sdk/transports/) — Node（UDP）と Browser（helper WS）の違い・制約
- [](/docs/sdk-integration/js-sdk/command-vs-clip/) — command と clip の使い分け（[](/docs/concepts/fire-vs-clip/)）
- [](/docs/sdk-integration/js-sdk/event-map/) — kit manifest から既定強度を解決する（[](/docs/concepts/event-id-and-kit/)）
- [](/docs/sdk-integration/js-sdk/project-structure/) — kit と clip をプロジェクトに置く構成
- [](/docs/sdk-integration/js-sdk/examples/) — 動くサンプルの歩き方
