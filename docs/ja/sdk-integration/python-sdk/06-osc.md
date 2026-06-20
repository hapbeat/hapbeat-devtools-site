---
title: OSC ブリッジ（スマホ触覚リモコン等）
kind: howto
description: OSC を話せる任意のツール(TouchOSC/Max/DAW)から Hapbeat を駆動。触覚ファイルを載せると OSC からも command/clip 分岐 + per-event target が効く。
sidebar:
  order: 6
  label: OSC ブリッジ
---

OSC ブリッジは「OSC を話せる任意のツール → Hapbeat」の中継です。**ツール側はコード不要**。
代表ユースケースは **スマホ（TouchOSC）をワイヤレス触覚リモコンにする**こと（ライブ演出・
展示・Wizard-of-Oz 実験）。他に Max/MSP・DAW（音楽同期）・他言語アプリからの駆動にも使えます。

```
TouchOSC (スマホ)  --/hapbeat/play "rain.loop"-->  hapbeat osc-bridge  --UDP-->  デバイス
   ボタン・コード不要        Wi-Fi                    (PC)                Wi-Fi
```

## 起動

```bash
pip install "hapbeat-python-sdk[osc]"

# 触覚ファイルを載せる（推奨）: OSC からも command/clip が分岐し、event id だけで
# 送信先(target)も触覚ファイルから決まる
hapbeat osc-bridge --listen 7702 --haptics haptics.json

# kit だけ（intensity/clip のみ・target なし）:  --kit kits/my-kit
# 何も載せない（command のみ・target は OSC 引数頼み）:  そのまま
```

## OSC アドレス

| アドレス | 引数 | 効果 |
|---|---|---|
| `/hapbeat/play` | `event_id` `[target]` `[target_time_us]` `[gain]` | イベント再生（target/gain 省略時は触覚ファイルが決定） |
| `/hapbeat/stop` | `event_id` `[target]` | 1 イベント停止 |
| `/hapbeat/stop-all` | `[target]` | 全停止 |
| `/hapbeat/ping` | — | 検出 / keep-alive |

`target` を省略すると触覚ファイルの per-event target が使われ、明示すればそのメッセージだけ上書きします。

## なぜ触覚ファイルが効くのか

スマホは **event id を送るだけ**（`/hapbeat/play rain.loop`）。どの端末/部位へ・どの強さ・
command か clip かは、ブリッジが読む**触覚ファイル**が決めます。狙いや強さの変更は
ファイル 1 つの編集で済み、スマホ側は触りません。

## TouchOSC レイアウト（例）

- ボタン "Rain" → `/hapbeat/play`（文字列 `rain.loop`）
- ボタン "Tap"  → `/hapbeat/play`（文字列 `impact.hit`）
- ボタン "Stop" → `/hapbeat/stop-all`
- 接続設定: ホスト = ブリッジを動かす PC の IP、ポート = `7702`

## スマホ無しで試す

キーボードから OSC を送る確認用デモが付属します（`/hapbeat/*` を送るだけなので
TouchOSC と等価）:

```bash
hapbeat osc-bridge --haptics examples/osc_remote/haptics.json   # 端末1
python examples/osc_remote/send_demo.py                          # 端末2（1/2 キーで送信）
```

完全な例: [`examples/osc_remote/`](https://github.com/hapbeat/hapbeat-python-sdk/tree/master/examples/osc_remote)。
