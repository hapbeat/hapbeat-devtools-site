---
title: clip ストリーミングの詳細
kind: reference
description: WAV（16kHz PCM16）の読み込み、ストリーミングのペーシング、stream_pcm によるアドホック送出、停止、現状の制限。
sidebar:
  order: 4
  label: ストリーミング詳細
---

clip モードの動作と、マニフェストを介さない PCM 送出の使い方です。

## WAV の要件

- **16 kHz・モノ・PCM16（非圧縮 16-bit）**で用意する。デバイスは 16 kHz で再生し、
  SDK は resample しません。非 16 kHz は警告のみ出して送出します（ピッチ/長さがずれる）。
- 読み込みは stdlib の `wave` ベース（`hapbeat.read_wav_pcm16`）。

## ペーシング（256 ms リング）

デバイスのリングバッファは約 256 ms（16 kHz で 4096 frame）しか持てないので、clip
全体を一度に送らず、**フレーム整列したチャンクを再生時刻の少し手前（既定
`stream_send_ahead=0.15` 秒）に送る**ことでバッファ溢れを防ぎます。送出は
`STREAM_BEGIN → STREAM_DATA×N → STREAM_END` で、END はクリップが再生し切ってから
送られます。専用のデーモンスレッドで進行し、**1 度に 1 ストリーム（session 単位）**。
新しい clip を流すと前の clip は確実に終了します。

```python
hb = hapbeat.connect(app_name="MyApp", kit="kits/my-kit", stream_send_ahead=0.15)
hb.play("rain.loop")     # clip イベント → ストリーム開始
hb.stop("rain.loop")     # ストリーム終了（STREAM_END）
```

## アドホック PCM 送出（manifest 不要）

合成した PCM をそのまま流せます。**ステレオ（`channels=2`）で左右の振幅差を付けると
L/R の方向手がかり**になります（PLAY コマンドには pan が無いため、方向は
ステレオ振幅で表現します）。

```python
import struct
sr = 16000
frames = bytearray()
for i in range(int(sr * 0.3)):
    env = 1.0 - i / (sr * 0.3)
    frames += struct.pack("<hh", int(2000 * env), int(8000 * env))  # 右寄り
hb.stream_pcm(bytes(frames), sample_rate=sr, channels=2)
```

任意の WAV ファイルを直接流すこともできます:

```python
hb.play_clip_file("assets/oneshot.wav", gain=0.6)
```

## キャッシュとプリロード

clip WAV は初回再生時に読み込まれ、以後はキャッシュされます。最初の再生の読み込み
遅延を避けたいときは事前にプリロードします:

```python
hb.preload_clips()       # clip モード全 event の WAV を先に読む
```

## gain は二重適用しない

SDK は PCM を加工せず、`gain` を **STREAM_BEGIN.gain にのみ**畳んで送り、デバイスが
一度だけ適用します。`gain` 省略時は kit manifest の `intensity`。

## 現状の制限

- 実装済み: **ファイルの clip ストリーミング**（`stream_events` の WAV を、一度に
  1 本ずつ UDP 送出）。
- 未対応: 再生中の **リアルタイムな gain / pan の変調**、**複数 clip の同時ミックス**、
  マイク等の**ライブ取り込み**ストリーミング。
