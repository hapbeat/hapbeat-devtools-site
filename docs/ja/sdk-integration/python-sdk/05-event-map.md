---
title: EventMap（触覚ファイル）リファレンス
kind: reference
description: EventMap / EventDef の API。kit manifest の events/stream_events から intensity・loop・clip・mode を解決する調整側カタログ。
sidebar:
  order: 5
  label: EventMap
---

`EventMap` は SDK の**調整側（触覚ファイル）**で、発火側（`play`/`stop`）と直交し、
event id だけで結ばれます。kit manifest（schema 2.0.0）を読み、各イベントの既定値を
持ちます。

## 構築

```python
import hapbeat

# 触覚ファイル（overlay）から（推奨。target/gain を per-event で持てる）
em = hapbeat.EventMap.from_file("haptics.json")

# kit フォルダから（intensity/clip のみ。targeting なし）
em = hapbeat.EventMap.from_kit("kits/my-kit")

# manifest を直接指定
em = hapbeat.EventMap.from_manifest("kits/my-kit/my-kit-manifest.json")
em = hapbeat.EventMap.from_manifest(parsed_dict)        # dict でも可

# 手書き（command のみ・gain だけ）
em = hapbeat.EventMap.from_dict({"impact.hit": 0.5})
```

`from_file` は **触覚ファイル**（kit を参照する overlay）を読み、manifest の
intensity/clip に **target / gain 上書き**を重ねます（[](/docs/sdk-integration/python-sdk/project-structure/)）。
`from_kit` / `from_manifest`(path) は **kit_dir** を覚え、clip モードの WAV を
`<kit_dir>/stream-clips/<clip>` から解決します。

## EventDef のフィールド

`em.get(event_id)` が返す `EventDef`:

| フィールド | 意味 |
|---|---|
| `event_id` | イベント id |
| `intensity` | 既定 gain（manifest の `parameters.intensity`、既定 1.0） |
| `loop` | ループ再生か |
| `device_wiper` | デバイス側ワイパー値（任意） |
| `streaming` | `True` なら clip モード（`stream_events` 由来） |
| `clip` | clip モードの WAV ファイル名（`stream-clips/` 相対） |
| `target` | 送信先アドレス（触覚ファイルで指定）。`""` = ブロードキャスト |
| `mode` | `"clip"`（streaming）/ `"command"` |
| `note` | メモ |

`play(id)` の送信先は **呼び出し側 `target=` > `EventDef.target`（触覚ファイル）>
接続の `default_target`** の順で解決されます。

## 主なメソッド

```python
em.get("impact.hit")          # EventDef | None
em.gain_for("impact.hit")     # 既定 gain（無ければ 1.0）
em.ids()                      # 全 event id
"impact.hit" in em            # 存在判定
len(em)                       # 件数
em.kit_dir                    # kit フォルダ（from_kit/path 由来）or None
```

## manifest の対応関係

```json
{
  "schema_version": "2.0.0",
  "name": "my-kit",
  "events": {
    "impact.hit": { "clip": "hit.wav", "parameters": { "intensity": 0.8 } }
  },
  "stream_events": {
    "rain.loop": { "clip": "rain.wav", "parameters": { "intensity": 0.3, "loop": true } }
  }
}
```

- `events` → `EventDef(streaming=False, mode="command")`
- `stream_events` → `EventDef(streaming=True, mode="clip", clip="rain.wav")`

発火側での使われ方は [](/docs/sdk-integration/python-sdk/command-vs-clip/) を参照。
