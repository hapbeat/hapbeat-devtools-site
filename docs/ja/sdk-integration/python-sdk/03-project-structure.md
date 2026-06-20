---
title: プロジェクト構成（kit + 触覚ファイル）
kind: explanation
description: kit(Studio 生成の内容) と 触覚ファイル(target 等を足す overlay) を分離。コードは event id を呼ぶだけ。Unity SDK の EventMap と同型。
sidebar:
  order: 3
  label: プロジェクト構成
---

推奨するプロジェクトの組み方は Unity SDK と同型です。**コードは event id を呼ぶだけ**で、
各イベントの詳細は 2 つのレイヤーに分かれます。

## 2 つのレイヤー

| | 何を持つ | 誰が作る |
|---|---|---|
| **kit manifest**（`<kit>-manifest.json`） | kit の内容: intensity / clip / command か clip か | **Hapbeat Studio が自動生成** |
| **触覚ファイル**（`haptics.json`, EventMap overlay） | アプリ側の指定: **target（どの端末/部位）** / gain 上書き | **開発者が書く（kit を参照）** |

manifest は「kit のコンテンツ記述」で、**targeting は持ちません**（どの端末に出すかは
アプリ/運用の都合なので kit に入れない）。それを足すのが**触覚ファイル**で、Unity SDK の
EventMap アセットに相当します。

## レイアウト

```
my-app/
  app.py                          ← 呼ぶ側（event id を play するだけ）
  haptics.json                    ← 触覚ファイル（kit を参照し target 等を足す）
  kits/
    my-kit/
      my-kit-manifest.json        ← kit の内容（Studio 生成）
      install-clips/              ← command clip（Studio でデバイスに書込）
      stream-clips/
        rain.wav                  ← clip モードで SDK がストリームする WAV
```

```json
// haptics.json
{
  "kit": "kits/my-kit",
  "events": {
    "impact.hit": { "target": "player_1/chest", "gain": 0.8 },
    "rain.loop":  { "target": "*/back" }
  }
}
```

## コードは event id を呼ぶだけ

```python
import hapbeat

hb = hapbeat.connect(app_name="MyApp", haptics="haptics.json")
hb.play("impact.hit")     # player_1/chest に gain 0.8 で（触覚ファイルが決める）
hb.play("rain.loop")      # */back に clip ストリーム
```

`connect(haptics=...)` は触覚ファイルを読み、その中の `kit` から manifest（intensity/clip）
を取り込み、overlay の target/gain を上乗せします。**「いつ鳴らすか」だけがコード、
「何を・どこへ・どれくらい」は触覚ファイル**という分担です。

targeting が要らない（全台ブロードキャストでよい）なら kit だけでも可:

```python
hb = hapbeat.connect(app_name="MyApp", kit="kits/my-kit")   # target は play(id, target=) で都度指定
```

## オーサリングのフロー

1. [Hapbeat Studio](https://devtools.hapbeat.com) で kit を編集（クリップ・強度・command/clip）。
2. kit フォルダをプロジェクトの `kits/` に置く。
3. `haptics.json` に各イベントの **target**（と必要なら gain）を書く。
4. コードは `play("event.id")` を呼ぶだけ。

完全に動く例: GitHub の
[`examples/clip_project/`](https://github.com/hapbeat/hapbeat-python-sdk/tree/master/examples/clip_project)
（kit）と
[`examples/osc_remote/`](https://github.com/hapbeat/hapbeat-python-sdk/tree/master/examples/osc_remote)
（触覚ファイル + OSC）。
