---
title: gain の乗算構造
description: Hapbeat の振動強度は「Studio で決めた基準 intensity × SDK の gain」の乗算で決まる。Kit 設計者と SDK 利用者の責務を分離する設計判断。
kind: explanation
sidebar:
  order: 3
---

Hapbeat の振動強度は **複数の gain の乗算** で決まります。これは Kit 設計者（コンテンツ側）と SDK 利用者（アプリ側）の責務を分離するための意図的な設計です。

## 計算式

```
実際の振動強度 = manifest の intensity × EventMap の gain × SDK の gain
```

- **manifest の intensity** — Studio で Kit に書き込んだ基準強度（0.0 〜 1.0）
- **EventMap の gain** — Unity SDK 等の EventMap エントリで設定するオフセット
- **SDK の gain** — 実行時にコードや ParameterBinding で動的に与える倍率

## なぜ乗算なのか

### 役割分担

| 立場 | 触る gain | 視点 |
|---|---|---|
| **Kit 設計者**（触覚アーティスト） | manifest の intensity | 「銃声は強めに、足音は弱めに」 |
| **SDK 利用者**（ゲーム開発者） | EventMap の gain / コード上の gain | 「銃と足音のバランスはアーティストに任せ、自分は『敵が遠いときは半分の強さ』を実装する」 |

両者が **同じパラメータを取り合わない** ことで、変更が独立します:

- アーティストが Kit を更新しても、ゲームコードは変更不要
- ゲームコードで距離減衰を入れても、Kit の基準値は壊れない

### `gain = 1.0` の意味

SDK の世界では `gain = 1.0` がデフォルトです。これは「Kit 設計者が決めた標準の強さで再生する」という意味になります。

- `0.5` → 半分の強さ
- `2.0` → 2 倍の強さ（manifest が 0.5 の場合に 1.0 で再生したいとき等）
- `0.0` → 無音（一時的にミュート）

## 具体例

Studio で `intensity: 0.8` に設定した銃声クリップ（`my-game.gunshot`）があるとします。

| ケース | EventMap gain | SDK gain | 最終強度 |
|---|---|---|---|
| 通常の発火 | 1.0 | 1.0 | 0.8 |
| 「弱めに」（EventMap で調整） | 0.5 | 1.0 | 0.4 |
| 距離減衰（Parameter Binding） | 1.0 | 0.3（敵が遠い） | 0.24 |
| 演出ピーク（コードで一時ブースト） | 1.0 | 1.5 | 1.2（クリップ） |

最終強度はデバイス側で 0.0〜1.0 にクリップされます。

## ParameterBinding と組み合わせる

Unity SDK の `HapbeatParameterBinding` は、ゲーム中の値（速度・距離・体力等）を **SDK gain に動的マッピング** する仕組みです。これは上記の「SDK の gain」レイヤに作用します。

```
manifest 0.8 (Kit 設計時の標準)
   × EventMap 1.0 (この Event のオフセット)
   × Binding 出力 0.3 (敵との距離由来)
   = 実際の強度 0.24
```

Kit 側を触らずに、ランタイムの状況に応じた強弱だけ動的に変えられます。

## 何を変更すべきか

迷ったら以下の指針で:

| やりたいこと | 触る場所 |
|---|---|
| 「このクリップは全体的に強すぎる」 | Studio で manifest の intensity を下げる |
| 「この Event だけ少し弱く」 | EventMap の gain を下げる |
| 「ゲーム中の状況で強弱を変える」 | コード or ParameterBinding で SDK gain |
| 「全 Event を一時的にミュート」 | `HapbeatManager.SetGlobalGain(0)` 相当（実装は SDK 次第） |

## 関連

- [](/docs/tools/studio/kit-design/) — Studio での manifest intensity の決め方
- [](/docs/sdk-integration/unity-sdk/event-map/) — EventMap gain の編集
- [](/docs/sdk-integration/unity-sdk/parameter-binding/) — 動的 gain マッピング
- [Fire と Clip の違い](./fire-vs-clip/) — mode による gain の扱いの違い
