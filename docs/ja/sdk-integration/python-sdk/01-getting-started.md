---
title: Python SDK 入門
kind: tutorial
description: pip/pipx で入れて数行で Hapbeat を駆動する。起点(fire)と触覚編集(EventMap)を分離した Unity SDK と同型の設計。
sidebar:
  order: 1
  label: 入門
---

Python から Hapbeat を Wi-Fi UDP で駆動する SDK です。研究（PsychoPy / Jupyter /
ROS）・メディアアート・プロトタイピング向け。Unity / web SDK と同じく、
**起点（いつ・どこで鳴らすか）と触覚の編集（何を・どう鳴らすか）を分離**し、
event id だけで結びます。

## インストール

```bash
pip install hapbeat-python-sdk          # ライブラリ + CLI
pipx install hapbeat-python-sdk         # CLI / launchpad だけを隔離環境に
```

> `pipx` は CLI（`hapbeat scan` / `launchpad` 等）の隔離インストール向け。自分の
> スクリプトから `import hapbeat` するなら venv 内の `pip install` を使ってください。
> PyPI 公開前はソースから: `pip install -e .`。

## 最初のイベント

```python
import hapbeat

hb = hapbeat.connect(app_name="MyApp")
hb.play("impact.hit", gain=0.5)
hb.close()
```

- `connect()` が UDP ブロードキャストソケットを開き、keep-alive を送ってデバイス
  OLED にアプリ名を出します。
- `play(event_id, gain)` は再生指示を送ります。`gain` は 0..1、省略すると後述の
  EventMap が既定値（kit の intensity）を補います。

`"impact.hit"` は**デバイスに配備した kit**（[Hapbeat Studio](https://devtools.hapbeat.com)
で書き込み）に存在する event id である必要があります。SDK は*指示*を送るだけで、
波形はデバイス上の kit にあります（command モード。別経路の clip モードは
[](/docs/sdk-integration/python-sdk/command-vs-clip/) 参照）。

## デバイス検出

```python
with hapbeat.connect() as hb:
    for d in hb.discover(timeout=1.5):
        print(d.ip, d.address, d.firmware_version)
```

## 起点と編集の分離（EventMap）

強度などの「触覚の調整値」を発火コードに書かず、**触覚ファイル（kit manifest =
EventMap）**に置きます。`play("id")` がそこから既定値を解決します。

```python
em = hapbeat.EventMap.from_manifest("kits/my-kit/my-kit-manifest.json")
with hapbeat.connect(event_map=em) as hb:
    hb.play("impact.hit")     # kit manifest の intensity で発火
```

これにより「いつ鳴らすか（コード）」と「どれくらいの強さか（kit）」を独立して
差し替えられます。詳細は [](/docs/sdk-integration/python-sdk/event-map/) を参照。

## ターゲット指定

```python
hb.play("impact.hit", target="player_1/chest")  # 1 台
hb.play("impact.hit", target="*/chest")         # chest の全台
hb.play("impact.hit")                            # 全台ブロードキャスト
```

## 次に読む

- [](/docs/sdk-integration/python-sdk/command-vs-clip/) — command と clip の使い分け
- [](/docs/sdk-integration/python-sdk/project-structure/) — kit をプロジェクトに同梱する構成
- `hapbeat --help` — CLI（`scan` / `play` / `stop-all` / `osc-bridge` / `launchpad`）
