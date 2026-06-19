---
title: プロジェクト構成（kit 同梱）
kind: explanation
description: Unity SDK と同じく kit をプロジェクト内に置き、コードは event id を呼ぶだけ。触覚の詳細は触覚ファイル(manifest)に、音声実体は stream-clips/ に。
sidebar:
  order: 3
  label: プロジェクト構成
---

推奨するプロジェクトの組み方は Unity SDK と同型です。**kit（触覚ファイル =
manifest ＋ 音声）をプロジェクト内に置き、コードは event id を呼ぶだけ**にします。
各イベントの詳細（強度・loop・command/clip・どの WAV か）は**触覚ファイル側**で
設定し、発火コードには持ち込みません。

## レイアウト

```
my-app/
  app.py                          ← 呼ぶ側（event id を play するだけ）
  kits/
    my-kit/
      my-kit-manifest.json        ← 触覚ファイル（→ EventMap の素）
      install-clips/              ← command clip（Studio でデバイスに書込）
      stream-clips/
        rain.wav                  ← clip モードで SDK がストリームする WAV
```

- **manifest**（`<kit>-manifest.json`, schema 2.0.0）が「触覚ファイル」。event id →
  intensity / loop / mode（command or clip）/ どの WAV、を持ちます。
- **install-clips/** は command モードのクリップ。SDK は読みません。Studio で
  デバイスに書き込まれ、デバイスが再生します。
- **stream-clips/** は clip モードの WAV。SDK が読んでストリームします。

この kit フォルダは **Hapbeat Studio が編集する成果物**で、それをそのまま
プロジェクトに同梱します。

## コードは event id を呼ぶだけ

```python
import hapbeat

hb = hapbeat.connect(app_name="MyApp", kit="kits/my-kit")
hb.play("impact.hit")     # 詳細は kit が知っている（強度・mode・WAV）
hb.play("rain.loop")
```

`connect(kit=...)` は kit フォルダから EventMap を読み込み（`EventMap.from_kit`）、
clip WAV のパスも `<kit>/stream-clips/` から解決します。**「いつ鳴らすか」だけが
コード、「何を・どれくらい」は kit** という分担です。

明示的に組み立てることもできます:

```python
em = hapbeat.EventMap.from_kit("kits/my-kit")
hb = hapbeat.connect(event_map=em)
# clip WAV の置き場を変えたいとき:
hb = hapbeat.connect(event_map=em, clip_base="assets/haptics/")
```

## オーサリングのフロー

1. [Hapbeat Studio](https://devtools.hapbeat.com) で kit を編集（クリップ追加・
   強度調整・command/clip 指定）。
2. kit フォルダをプロジェクトの `kits/` に置く（Studio の保存先をそこにする）。
3. コードは `play("event.id")` を呼ぶだけ。強度や差し替えは Studio 側で行い、
   コードは触らない。

完全に動く例は GitHub の
[`examples/clip_project/`](https://github.com/hapbeat/hapbeat-python-sdk/tree/master/examples/clip_project)
にあります。
