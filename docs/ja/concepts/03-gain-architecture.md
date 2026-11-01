---
title: gain の乗算構造
description: Hapbeat の振動の強さは「素材の強さ（clip_gain）× アプリの倍率（app_gain）× 本体の音量」の乗算で決まる。Kit 設計者と SDK 利用者の責務を分離する設計判断。
kind: explanation
sidebar:
  order: 3
---

Hapbeat の振動の強さは、**「クリップ（素材）」「アプリ」「本体」の 3 つの枠の掛け算** で決まります。これは Kit 設計者（コンテンツ側）と SDK 利用者（アプリ側）の責務を分離するための意図的な設計です。

## 計算式

```text
output = clip × app_gain × device_volume
clip   = WAV × clip_gain
送る値 = clamp(clip_gain × app_gain, 0, 1)
```

- **クリップ（素材）** — WAV と **素材の強さ（`clip_gain`）** の 1 組。`clip_gain` は Studio で Kit の manifest（`parameters.clip_gain`）に書き込む値（0.0 〜 1.0、省略 = 1）
- **アプリ** — **アプリの倍率（`app_gain`）**。再生するアプリが掛ける倍率の積です。EventMap のエントリの `gain`、ParameterBinding の出力、呼ぶ時の `gain` 引数などは名前を変えず、これらを掛けたものが `app_gain` になります（0 以上、1 = 素材どおり）
- **本体** — Hapbeat 本体の音量。着ける人が決め、アプリは知りません

`clip_gain × app_gain` を掛けるのは送る側（SDK・Studio）だけで、本体は manifest の `clip_gain` を読みません。送る値は最後の積だけが 0〜1 で頭打ちになり、個々の倍率は 1 を超えてかまいません。

## なぜ乗算なのか

### 役割分担

| 立場 | 触る値 | 視点 |
|---|---|---|
| **Kit 設計者**（触覚アーティスト） | 素材の強さ（`clip_gain`） | 「銃声は強めに、足音は弱めに」 |
| **SDK 利用者**（ゲーム開発者） | アプリの倍率（EventMap の gain / コード上の gain） | 「銃と足音のバランスはアーティストに任せ、自分は『敵が遠いときは半分の強さ』を実装する」 |

両者が **同じパラメータを取り合わない** ことで、変更が独立します:

- アーティストが Kit を更新しても、ゲームコードは変更不要
- ゲームコードで距離減衰を入れても、Kit の基準値は壊れない

呼ぶ時の `gain` は `clip_gain` を **置き換えず、掛けます**。

### `gain = 1.0` の意味

SDK の世界では `gain = 1.0` がデフォルトです。これは「Kit 設計者が決めた素材の強さ（`clip_gain`）どおりに再生する」という意味になります。

- `0.5` → 半分の強さ
- `2.0` → 2 倍の強さ（`clip_gain` が 0.5 の素材を 1.0 で再生したいとき等）
- `0.0` → 無音（一時的にミュート）

## 具体例

Studio で `clip_gain: 0.8` に設定した銃声クリップ（`my-game.gunshot`）があるとします。

| ケース | EventMap gain | 呼ぶ時の gain | 送る値 |
|---|---|---|---|
| 通常の発火 | 1.0 | 1.0 | 0.8 |
| 「弱めに」（EventMap で調整） | 0.5 | 1.0 | 0.4 |
| 距離減衰（Parameter Binding） | 1.0 | 0.3（敵が遠い） | 0.24 |
| 演出ピーク（コードで一時ブースト） | 1.0 | 1.5 | 1.0（1.2 を頭打ち） |

送る値は送る側（SDK・Studio）で 0.0〜1.0 に頭打ちになります。実際の出力は、これに本体の音量が掛かります。

## ParameterBinding と組み合わせる

Unity SDK の `HapbeatParameterBinding` は、ゲーム中の値（速度・距離・体力等）を **アプリの倍率に動的マッピング** する仕組みです。これは上記の「アプリ」の枠（`app_gain`）に作用します。

```
clip_gain 0.8 (Kit 設計時の素材の強さ)
   × EventMap 1.0 (この Event の倍率)
   × Binding 出力 0.3 (敵との距離由来)
   = 送る値 0.24
```

Kit 側を触らずに、ランタイムの状況に応じた強弱だけ動的に変えられます。

## 何を変更すべきか

迷ったら以下の指針で:

| やりたいこと | 触る場所 |
|---|---|
| 「このクリップは全体的に強すぎる」 | Studio で素材の強さ（`clip_gain`）を下げる |
| 「この Event だけ少し弱く」 | EventMap の gain を下げる |
| 「ゲーム中の状況で強弱を変える」 | コード or ParameterBinding でアプリの倍率 |
| 「全 Event を一時的にミュート」 | `HapbeatManager.SetGlobalGain(0)` 相当（実装は SDK 次第） |

## 関連

- [](/docs/tools/studio/kit-design/) — Studio での素材の強さ（`clip_gain`）の決め方
- [](/docs/sdk-integration/unity-sdk/event-map/) — EventMap gain の編集
- [](/docs/sdk-integration/unity-sdk/parameter-binding/) — 動的 gain マッピング
- [Fire と Clip の違い](./fire-vs-clip/) — mode による gain の扱いの違い
