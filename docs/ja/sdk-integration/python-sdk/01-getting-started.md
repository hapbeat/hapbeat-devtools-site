---
title: Getting Started
kind: tutorial
description: pip / pipx で入れて数行で Hapbeat を駆動する。起点（いつ鳴らすか）と触覚の編集（何を・どう鳴らすか）を分けて event id で結ぶ Python SDK。
sidebar:
  order: 1
  label: Getting Started
---

:::tip[AI コーディングエージェントを使う方へ]
キュレーション済みの **AGENTS.md**（要点を 1 ファイルに凝縮・文脈も小さい）を渡すのが最も効率的です。

```text wrap
Hapbeat Python SDK を使います。https://raw.githubusercontent.com/hapbeat/hapbeat-python-sdk/master/AGENTS.md を読んで、その仕様とベストプラクティスに従ってください。
```

網羅的な仕様が必要なら `https://devtools.hapbeat.com/_llms-txt/python-sdk.txt` も渡せます。別の渡し方は[こちら](#ai-コーディングエージェントに渡す)。
:::

Python から Hapbeat を Wi-Fi UDP で駆動する SDK です。研究（PsychoPy / Jupyter /
ROS）・メディアアート・プロトタイピング向け。**起点（いつ・どこで鳴らすか）と
触覚の編集（何を・どう鳴らすか）を分け**、event id だけで結びます。

## インストール

```bash
pip install hapbeat-python-sdk          # ライブラリ + CLI
pipx install hapbeat-python-sdk         # CLI / launchpad だけを隔離環境に
```

> `pipx` は CLI（`hapbeat scan` / `launchpad` など）を隔離環境に入れる用途向けです。
> 自分のスクリプトから `import hapbeat` する場合は、venv の中で `pip install` を
> 使ってください。

## 最初のイベント

```python
import hapbeat

hb = hapbeat.connect(app_name="MyApp")
hb.play("impact.hit", gain=0.5)
hb.close()
```

- `connect()` が UDP ブロードキャストソケットを開き、keep-alive を送ってデバイス
  OLED にアプリ名を表示します。
- `play(event_id, gain)` は再生指示を送ります。`gain` は 0..1 で、省略すると後述の
  EventMap が既定値（kit の intensity）を補います。

`"impact.hit"` は、**デバイスに配備した kit**（[Hapbeat Studio](https://devtools.hapbeat.com)
で書き込み）に含まれる event id である必要があります。SDK は*指示*を送るだけで、
波形はデバイス上の kit にあります（command モード。別経路の clip モードは
[](/docs/sdk-integration/python-sdk/command-vs-clip/) を参照）。

## デバイスを探す

```python
with hapbeat.connect() as hb:
    for d in hb.discover(timeout=1.5):
        print(d.ip, d.address, d.firmware_version)
```

## 起点と編集を分ける（EventMap）

強度などの「触覚の調整値」を発火コードに書かず、**触覚ファイル（kit manifest =
EventMap）**にまとめます。`play("id")` がそこから既定値を解決します。

```python
em = hapbeat.EventMap.from_manifest("kits/my-kit/my-kit-manifest.json")
with hapbeat.connect(event_map=em) as hb:
    hb.play("impact.hit")     # kit manifest の intensity で発火
```

「いつ鳴らすか（コード）」と「どれくらいの強さか（kit）」を独立して差し替えられます。
詳しくは [](/docs/sdk-integration/python-sdk/event-map/) を参照。

## ターゲットを指定する

```python
hb.play("impact.hit", target="player_1/chest")  # 1 台
hb.play("impact.hit", target="*/chest")         # chest の全台
hb.play("impact.hit")                            # 全台ブロードキャスト
```

## AI コーディングエージェントに渡す

Claude / Cursor / Copilot などにこの SDK を使わせるなら、SDK に同梱の
**`AGENTS.md`** を渡してください。仕様・使い方・落とし穴を 1 ファイルにまとめてあり、
これだけで全体像を把握できます。

- 場所: SDK リポジトリ直下の <a href="https://github.com/hapbeat/hapbeat-python-sdk/blob/master/AGENTS.md" target="_blank" rel="noopener noreferrer">`AGENTS.md`</a>
- 渡し方の例（そのままエージェントへ）:

```text wrap
Hapbeat Python SDK を使います。AGENTS.md を読んで、その仕様とベストプラクティスに従ってください。
```

## 次に読む

- [](/docs/sdk-integration/python-sdk/command-vs-clip/) — command と clip の使い分け
- [](/docs/sdk-integration/python-sdk/project-structure/) — kit と触覚ファイルをプロジェクトに置く構成
- [](/docs/sdk-integration/python-sdk/examples/) — 動くサンプルの歩き方
- `hapbeat --help` — CLI（`scan` / `play` / `stop-all` / `osc-bridge` / `launchpad`）
