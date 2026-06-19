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

# kit フォルダから（推奨。clip WAV の解決もこれで効く）
em = hapbeat.EventMap.from_kit("kits/my-kit")

# manifest を直接指定
em = hapbeat.EventMap.from_manifest("kits/my-kit/my-kit-manifest.json")
em = hapbeat.EventMap.from_manifest(parsed_dict)        # dict でも可

# 手書き（command のみ・gain だけ）
em = hapbeat.EventMap.from_dict({"impact.hit": 0.5})
```

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
| `mode` | `"clip"`（streaming）/ `"command"` |
| `note` | メモ |

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
