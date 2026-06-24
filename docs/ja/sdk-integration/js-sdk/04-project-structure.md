---
title: Project Structure
kind: explanation
description: kit / manifest / WAV を JS アプリのどこに置くか。web は静的配信 + fetch、node はディレクトリ + fs.readFile。コードは event id を play するだけ。
sidebar:
  order: 4
  label: Project Structure
---

kit（Studio が作る内容）とアプリのコードを分けると、**コードは event id を
play するだけ**になります。この分担をどうファイルに落とすか、web と node それぞれの
構成を示します。

## 2 つのレイヤー

| | 何を持つ | 誰が作る |
|---|---|---|
| **kit manifest**（`<kit>-manifest.json`） | kit の内容: intensity / clip / command か clip か | **Hapbeat Studio が自動生成** |
| **アプリのコード** | いつ・どこで発火するか（`play(id)` / `target`） | **開発者が書く** |

manifest は「kit の中身の記述」であり、**どの端末/部位に出すか（target）は持ちません**。
発火タイミングと target はアプリの都合なので、コード側で決めます。詳しくは
[](/docs/sdk-integration/js-sdk/event-map/) を参照。

## JS には Python の触覚ファイル overlay は無い

Python SDK には `haptics.json`（kit を参照して target/gain を上乗せする overlay）が
ありますが、**JS SDK にはありません**。JS の `EventMap` は **manifest 専用**で、
各イベントの intensity / clip を運ぶだけです。target の決め方は次の 2 つです。

- **呼び出し側で指定**: `hb.play("impact.hit", { target: "player_1/chest" })`
- **既定値**: `connect({ defaultTarget: "*/chest" })`（呼び出し側 `target` が優先）

target を省略すると `""`（全台ブロードキャスト）になります。

## web レイアウト（静的配信 + fetch）

manifest と clip WAV を**静的アセットとして配信**し、`clipBase` を URL prefix として
fetch します。ブラウザ既定の `clipLoader` は `fetch` です。

```
my-web-app/
├── src/
│   └── main.ts                     ← 呼ぶ側（connect() + play(id)）
└── public/
    └── my-kit/
        ├── my-kit-manifest.json    ← Studio 生成。fetch → EventMap.fromManifest
        └── stream-clips/
            └── rain.wav            ← clip モードで SDK がストリームする WAV（16 kHz PCM16）
```

```ts
import { connect, EventMap } from "@hapbeat/sdk";

const manifest = await fetch("/my-kit/my-kit-manifest.json").then((r) => r.json());

const hb = await connect({
  appName: "MyWebXR",
  eventMap: EventMap.fromManifest(manifest),
  clipBase: "/my-kit/stream-clips/", // clip 参照は clipBase + manifest 内のファイル名
});

hb.play("impact.hit");  // command モード（デバイス上のクリップを再生）
hb.play("rain.loop");   // clip モード（public 配下の WAV を fetch してストリーム）
```

> clip 参照は `clipBase + <manifest の clip フィールド>` の単純連結で解決します。
> `clipBase` の末尾スラッシュに注意してください。

## node レイアウト（ディレクトリ + fs.readFile）

`clipBase` は**ディレクトリパス**です。node 既定の `clipLoader` は `fs.readFile` で、
ディスクから WAV を読み込みます。

```
my-node-app/
├── index.mjs                       ← 呼ぶ側（connect() + play(id)）
└── kits/
    └── my-kit/
        ├── my-kit-manifest.json    ← Studio 生成
        └── stream-clips/
            └── rain.wav            ← clip モード WAV（16 kHz PCM16）
```

```ts
import { readFile } from "node:fs/promises";
import { connect, EventMap } from "@hapbeat/sdk";

const manifest = JSON.parse(
  await readFile("kits/my-kit/my-kit-manifest.json", "utf8"),
);

const hb = await connect({
  appName: "MyApp",
  eventMap: EventMap.fromManifest(manifest),
  clipBase: "kits/my-kit/stream-clips/", // ディレクトリパス
});

hb.play("impact.hit");  // command モード
hb.play("rain.loop");   // clip モード（kits 配下の WAV を fs.readFile でストリーム）
```

## カスタム clipLoader

`clipBase` + 既定ローダーで足りない場合（バンドル済みアセット・IndexedDB・CDN など）は
`clipLoader` を差し替えます。`clipBase + def.clip` を引数 `ref` として受け取り、
`ArrayBuffer | Uint8Array` を返す関数です。

```ts
// IndexedDB から clip を読む例（Browser）
const hb = await connect({
  eventMap: EventMap.fromManifest(manifest),
  clipBase: "",                       // キー前置が不要なら空でよい
  clipLoader: async (ref) => {
    const buf = await idbGet(ref);    // ref は clipBase + 'rain.wav' 等
    return buf;                       // ArrayBuffer
  },
});
```

```ts
// バンドラ経由でインポートした WAV を使う例
import rainWavUrl from "./kits/my-kit/stream-clips/rain.wav?url";

const hb = await connect({
  eventMap: EventMap.fromManifest(manifest),
  clipBase: "",
  clipLoader: async (ref) => {
    const url = ref === "rain.wav" ? rainWavUrl : ref;
    return fetch(url).then((r) => r.arrayBuffer());
  },
});
```

clip モードの WAV は **16 kHz PCM16** が必要です。SDK はリサンプルしません（非 16 kHz は
警告）。clip モードの詳細は [](/docs/sdk-integration/js-sdk/command-vs-clip/) を参照。

## オーサリングのフロー

1. [Hapbeat Studio](https://devtools.hapbeat.com) で kit を編集（クリップ・強度・command/clip）。
2. kit フォルダ（manifest + `stream-clips/`）をアプリに置く（web: `public/`、node: 任意の dir）。
3. manifest を `fetch`（web）/ `readFile`（node）で読み、`EventMap.fromManifest(manifest)` を `connect` に渡す。
4. clip モードを使うなら `clipBase` を WAV の置き場所（URL prefix / dir）に向ける。
5. コードは `hb.play("event.id")` を呼ぶだけ。target は呼び出し側か `defaultTarget` で。

## 次に読む

- [](/docs/sdk-integration/js-sdk/event-map/) — EventMap と manifest の対応
- [](/docs/sdk-integration/js-sdk/command-vs-clip/) — command と clip の使い分け
- [](/docs/concepts/event-id-and-kit/) — event id と kit の関係
