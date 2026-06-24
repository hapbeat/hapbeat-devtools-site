---
title: Examples
kind: tutorial
description: リポジトリ同梱の動くサンプル（node-minimal → browser-minimal → games アーケード）の歩き方と、EventMap / kit-manifest / router パターンの実例。
sidebar:
  order: 8
  label: Examples
---

`@hapbeat/sdk` リポジトリの [`examples/`](https://github.com/hapbeat/hapbeat-js-sdk/tree/master/examples) には、小さいものから順に動くサンプルが入っています。コピーして自分のプロジェクトに持ち込むための土台です。

## 読む順

最小の発火から始めて、ブラウザ経路、最後に実アプリ規模のアーケードへ、と段階的に読むのがおすすめです。

1. <a href="https://github.com/hapbeat/hapbeat-js-sdk/blob/master/examples/node-minimal.mjs" target="_blank" rel="noopener noreferrer">`examples/node-minimal.mjs`</a> — Node から `connect()` → `play(id)` → `close()` を UDP で一往復。SDK の最小ループを把握する。
2. <a href="https://github.com/hapbeat/hapbeat-js-sdk/blob/master/examples/browser-minimal.html" target="_blank" rel="noopener noreferrer">`examples/browser-minimal.html`</a> — まったく同じ呼び出しを、ブラウザから helper の WebSocket 経由で送る。Node とブラウザで API が同一であることを確認する。
3. [`examples/games/`](#arcade)（Hapbeat Arcade） — EventMap + kit manifest +「ファイル優先 / 合成フォールバック」ルーターまで含む、実アプリ規模の構成。

transport の違い（Node = UDP 直送 / Browser = helper WS）は [](/docs/sdk-integration/js-sdk/transports/) を参照。

## サンプル表

| サンプル | 対象 | 何を示すか | kit 要否 |
|---|---|---|---|
| `node-minimal.mjs` | Node | `connect()` → `play(id)` → `close()` を UDP で | 触覚を鳴らすなら LAN 上の Hapbeat + 配備済み kit |
| `browser-minimal.html` | Browser | 同じ呼び出しを helper WebSocket 経由で | `hapbeat-helper` 起動 + HTTP 配信 |
| `games/`（Hapbeat Arcade） | Browser | EventMap + kit manifest + file/synth ルーターの実例（FPS + ミニゲーム） | HTTP 配信。触覚は helper + demo-kit |

最小 2 本は「LAN 上にデバイスが無くても起動はする」設計です（command モードの event を送るが、デバイスが居なければ無視されるだけ）。アーケードはデバイス／helper が無くても音と映像だけで試遊できます。

## 動かす（最小 2 本）

```bash
# Node — そのまま実行
node examples/node-minimal.mjs

# Browser — リポジトリルートから HTTP 配信（後述）
npm run dev
# → http://localhost:8170/examples/browser-minimal.html を開く
```

ブラウザ経路は **helper が必要**です（`pip install hapbeat-helper` → `hapbeat-helper` で `ws://localhost:7703` 待受）。詳細は [](/docs/sdk-integration/js-sdk/transports/) を参照。

## Hapbeat Arcade（`examples/games/`） {#arcade}

`examples/games/` は browser transport + helper で動く触覚デモアーケードです。展示会で 1〜2 分ずつ遊べるミニゲームを収録し、いずれも**触覚があることで体験が成立／変化する**ことを狙っています（見えない壁の迷路 / 触覚リズム / 宝探し / 反応速度）。各ゲームに音・映像・触覚を個別 ON/OFF できるモダリティスイッチがあり、「触覚だけ」での A/B 比較ができます。

### 構成

```
ブラウザ (このデモ)
   │  @hapbeat/sdk  →  ws://localhost:7703
   ▼
hapbeat-helper (pip install hapbeat-helper)
   │  UDP 7700 broadcast
   ▼
Hapbeat デバイス（demo-kit を配備済み）
```

`examples/games/demo-kit/`（`hapbeat-arcade-manifest.json` + `install-clips/*.wav`）が、デバイス側に配備する Kit です。**Hapbeat Studio** から対象デバイスへ Deploy しておくと、ゲームが送る event id（例 `hapbeat-arcade.maze_bump`）に対応する触覚が鳴ります。配備しなくてもゲームは動き、触覚だけが鳴りません（デバイス側に event が無いので無視される）。

### 動かし方

```bash
# 1. helper を起動（初回のみ install）
pip install hapbeat-helper
hapbeat-helper                 # ws://localhost:7703 で待受

# 2. デモを HTTP で配信（リポジトリルートから）
npm run dev                    # dist/ ビルド + tsc --watch + 静的配信 + 自動リロード
# → http://localhost:8170/examples/games/ を開く
#   （ポート変更は PORT=8080 npm run dev）
```

`src/*.ts` を編集すると `dist/` が再ビルドされてブラウザが自動リロードします。`npm run serve` はビルド済み `dist/` の静的配信のみ（watch なし）です。

### EventMap / manifest / router パターンの実例

アーケードは、このドキュメントで説明している考え方を実コードに落とした参照実装です。

- **kit manifest** を読んで per-event の既定 intensity を解決する（[](/docs/sdk-integration/js-sdk/event-map/)）。`demo-kit/hapbeat-arcade-manifest.json` が schema 2.0.0 の kit manifest。
- **command vs clip ルーター** — manifest の bucket（`events` = command / `stream_events` = clip）でモードが分かれ、ゲームコード側は `play(id)` を呼ぶだけで変わらない（[](/docs/sdk-integration/js-sdk/command-vs-clip/)）。
- **file-first / synth-fallback** — `shared/event-content.js` に各 event の触覚（合成 PCM）+ 音を 1 ファイルでまとめ、kit/WAV が無くても合成でフォールバックする。チューニングの起点（source of truth）はここ。

各イベントの clip / 強度は studio の `showcase-kit` から流用した**仮置き**で、最終調整はユーザーが行う前提です（対応表は <a href="https://github.com/hapbeat/hapbeat-js-sdk/blob/master/examples/games/TUNING.md" target="_blank" rel="noopener noreferrer">`TUNING.md`</a>）。

## 落とし穴

- **`file://` では動かない** — ES Modules + import map + WAV fetch はファイルシステムから読めません。必ず HTTP で配信してください（`npm run dev` / `npx serve .`）。ブランクページやモジュールエラーが出たら、まずこれを疑う。
- **ブラウザ経路は helper を起動する** — helper が無いと `connect()` が `ws://localhost:7703` に届かず reject します。アーケードは helper 無しでも音と映像だけで試遊できますが、触覚は出ません。
- **マルチホーム（複数 NIC）PC** — Wi-Fi と有線を同時接続していると UDP ブロードキャストが意図しない NIC から出て、デバイスに届かないことがあります。Hapbeat の LAN 側 NIC にルートがあることを確認するか、一方を切る。
- **音と映像は出るのに触覚が鳴らない** — event id が配備済み kit に無いのが最頻原因。`discover()` でデバイスが見えるか、event 名が manifest と一致するかを確認する（[](/docs/sdk-integration/js-sdk/getting-started/)）。

## 関連

- [](/docs/sdk-integration/js-sdk/event-map/) — kit manifest から既定強度を解決する
- [](/docs/sdk-integration/js-sdk/command-vs-clip/) — command と clip の使い分け
- [](/docs/sdk-integration/js-sdk/streaming-clips/) — clip ストリーミング
- [](/docs/sdk-integration/js-sdk/streaming-live/) — 連続ストリーム（`openStream`）
