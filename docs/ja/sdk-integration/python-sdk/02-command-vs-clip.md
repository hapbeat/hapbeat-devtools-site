---
title: command と clip の使い分け
kind: explanation
description: play(id) が kit manifest の bucket で command（デバイス内蔵 clip）と clip（SDK が WAV をストリーム）を自動分岐。判断基準と書き方。
sidebar:
  order: 2
  label: command と clip
---

**同じ `play(id)` 呼び出しが、kit manifest の bucket に応じて 2 つの再生モードに
自動で分かれます**。呼ぶ側のコードはどちらでも 1 行です。

## 2 つのモード

| manifest の bucket | モード | 何が起きるか | 事前 deploy |
|---|---|---|---|
| `events` | **command** | SDK は PLAY を送り、**デバイス**が内蔵 clip を再生 | 必要（Studio で kit 書込） |
| `stream_events` | **clip** | SDK が kit の `stream-clips/` の WAV を読み **UDP ストリーム** | 不要 |

```python
import hapbeat
hb = hapbeat.connect(app_name="MyApp", kit="kits/my-kit")

hb.play("sample-kit.sine_100hz")   # command → デバイスが内蔵 clip を再生
hb.play("rain.loop")    # clip    → SDK が WAV をストリーム
hb.stop("rain.loop")    # clip は再生中のストリームを終了
```

分岐は EventMap（触覚ファイル）の情報で決まります。EventMap を渡していなければ、
すべて command として送られます。

## どちらを選ぶか

| | command | clip |
|---|---|---|
| 推奨 | 本番運用・短い one-shot | 試作・長尺・差し替えの多い段階 |
| 遅延 | 小・安定 | やや大きめ・環境依存 |
| 事前 deploy | 要（Studio で書込） | 不要（WAV を置くだけ） |
| 触覚の差し替え | kit 再 deploy | WAV を置き換えるだけ |

迷ったら **試作は clip、固まったら command** が基本です。

## gain の扱い（素材の強さに掛ける）

`gain` は kit manifest の `clip_gain`（素材の強さ）に掛ける倍率で、置き換えません。送る値は
`clamp(clip_gain × gain, 0, 1)` で、command では PLAY の `gain` として送り、clip では SDK が
source の PCM に掛けてから送ります（STREAM_BEGIN の `gain` は 1.0）。`gain` を省略すると 1
（kit の `clip_gain` どおり）です。

```python
hb.play("rain.loop")            # clip_gain（kit の値）どおり
hb.play("rain.loop", gain=0.3)  # clip_gain × 0.3
```

## 注意

- clip WAV は **16 kHz モノ PCM16** で用意してください（デバイスは 16 kHz 再生。
  SDK は resample しません。非 16 kHz は警告のみ）。
- 1 度に流せる clip は 1 本（session 単位）。新しい clip を流すと前の clip は
  自動的に終了します。
- 同じ id を `events` と `stream_events` の両方に書いた場合（Studio の BOTH）は
  clip 側が優先されます。
