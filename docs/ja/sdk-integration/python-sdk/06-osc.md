---
title: OSC ブリッジ
kind: howto
description: スマホ（TouchOSC）など OSC に対応したツールから Hapbeat を駆動する。触覚ファイルを指定すると OSC からも command/clip の分岐とイベントごとの target が反映される。
sidebar:
  order: 6
  label: OSC ブリッジ
---

OSC ブリッジは「OSC に対応したツール → Hapbeat」の中継です。**ツール側はコード不要**。
代表的な使い方は **スマホ（TouchOSC）をワイヤレス触覚リモコンにする**ことです（ライブ演出・
展示・Wizard-of-Oz 実験）。他に Max/MSP・DAW（音楽同期）・他言語アプリからの駆動にも使えます。

```
TouchOSC (スマホ)  --/hapbeat/play "rain.loop"-->  hapbeat osc-bridge  --UDP-->  デバイス
   ボタン・コード不要        Wi-Fi                    (PC)                Wi-Fi
```

## 起動

```bash
pip install "hapbeat-python-sdk[osc]"

# 触覚ファイルを指定する（推奨）: OSC からも command/clip が分かれ、event id だけで
# 送信先(target)も触覚ファイルから決まる
hapbeat osc-bridge --listen 7702 --haptics haptics.json

# kit だけ（intensity/clip のみ・target なし）:  --kit kits/my-kit
# 何も指定しない（command のみ・target は OSC 引数で渡す）:  そのまま
```

## OSC アドレス

| アドレス | 引数 | 効果 |
|---|---|---|
| `/hapbeat/play` | `event_id` `[target]` `[target_time_us]` `[gain]` | イベント再生（target/gain 省略時は触覚ファイルが決定） |
| `/hapbeat/stop` | `event_id` `[target]` | 1 イベント停止 |
| `/hapbeat/stop-all` | `[target]` | 全停止 |
| `/hapbeat/ping` | — | 検出 / keep-alive |

`target` を省略すると触覚ファイルのイベントごとの target が使われ、明示すれば
そのメッセージだけ上書きします。

## 触覚ファイルで何が決まるか

スマホは **event id を送るだけ**です（`/hapbeat/play rain.loop`）。どの端末/部位へ・
どの強さで・command か clip かは、ブリッジが読む**触覚ファイル**が決めます。狙いや
強さを変えるときはファイル 1 つを直すだけで、スマホ側は触りません。

## スマホ（TouchOSC）で動かすまでの流れ

実際にスマホをリモコンにする手順の道筋です（詳細な設定画面の操作は TouchOSC 側の
ドキュメントを参照）。

1. **同じ Wi-Fi に乗せる** — スマホと、ブリッジを動かす PC を同一ネットワークに置く。
2. **PC でブリッジを起動** — `hapbeat osc-bridge --listen 7702 --haptics haptics.json`。
   起動ログに待受ポート（7702）が出る。
3. **PC のファイアウォールで UDP 7702 の受信を許可** — 初回は許可ダイアログが出る。
4. **スマホに TouchOSC を入れ、送信先を設定** — 接続（OSC）の宛先ホストを **PC の IP**、
   ポートを **7702** にする。
5. **ボタンに OSC メッセージを割り当てる** — 各ボタンの送信アドレスを `/hapbeat/play`、
   引数（文字列）に `rain.loop` などの **event id** を入れる。停止ボタンは
   `/hapbeat/stop-all`。
6. **押して確認** — ボタンを押すと、触覚ファイルが決めた端末・強さで再生される。

> ポート整理: スマホが狙うのは**ブリッジの 7702**（`--listen`）です。デバイスが
> 待ち受ける UDP 7700 とは別物なので混同しないでください。

## TouchOSC レイアウト（例）

- ボタン "Rain" → `/hapbeat/play`（文字列 `rain.loop`）
- ボタン "Tap"  → `/hapbeat/play`（文字列 `sample-kit.sine_100hz`）
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
