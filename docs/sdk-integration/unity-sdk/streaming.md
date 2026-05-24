---
title: Streaming buffer を調整する
kind: howto
sidebar:
  order: 200
description: StreamClip モードの送信バッファ (streamSendAheadSeconds) の意味、トレードオフ、設定指針。
---

`StreamClip` モードはホスト (Unity) からデバイスへ PCM オーディオを UDP で送り続ける送信です。`Command` モードと違い、デバイスはホストから届いたサンプルを再生するだけなので、ホスト側の **送信バッファ** がそのまま再生品質と停止遅延に影響します。

## オーディオインターフェイスとの類比

DAW でオーディオインターフェイスのバッファサイズ (samples / ms) を調整するのと同じトレードオフです:

| 項目 | DAW のバッファ | Hapbeat の `streamSendAheadSeconds` |
|---|---|---|
| 小さい | レイテンシ低い、CPU 過負荷で zipper / drop-out が起きやすい | 停止が速い、ネット遅延 / ジッタで途切れやすい |
| 大きい | レイテンシ高い、安定して途切れない | 停止が遅延する (押してから残響)、安定 |

DAW では「この曲では 64 sample で攻める / マスタリングでは 1024 sample で安定優先」のように使い分けますが、Hapbeat も用途に応じて調整します。

## 仕組み

`HapbeatManager.StreamAudioClip(clip, ...)` は coroutine を起動し、毎フレーム以下を行います:

1. AudioClip の次のチャンクを PCM16 に変換
2. UDP で送信
3. **送信済み総時間が「実時間 + sendAhead」を超えていれば次フレームまで wait**

これにより、SDK は常に「実時間より sendAhead 秒先まで」のサンプルを送信済みにキープします。デバイス側はその先送り分を内部バッファとして消費しながら再生する形です。

`StopStream()` を呼んだ時:
- SDK は coroutine を止めて即座に `STREAM_END` パケットを送る
- ただしデバイスは **既に届いた sendAhead 秒分のサンプルを再生し終えてから** 停止する
- つまり「Stop を押してから停止までの体感遅延 ≒ sendAhead の値」

## 設定方法

[HapbeatConfig](/docs/sdk-integration/unity-sdk/installation/) の `streamSendAheadSeconds` で変更できます:

```
HapbeatConfig
  Behavior
    streamSendAheadSeconds: 0.05  ← デフォルト 50ms
```

範囲: 10ms 〜 200ms。

## 推奨値

| 用途 / 環境 | 推奨値 | 理由 |
|---|---|---|
| LAN 直結 (有線、低ジッタ) | **20–30 ms** | UDP 遅延が極小なので攻めて OK。停止が機敏 |
| 通常の Wi-Fi | **40–60 ms** (default 50ms) | 一般的なジッタ範囲を吸収しつつ停止遅延も実用範囲 |
| 混雑 Wi-Fi / 複数台同時 | **80–120 ms** | パケットロスや遅延スパイクへの耐性優先 |
| ライブパフォーマンス | 用途次第 | 「途切れたら台無し」なら大きく、「即応性重要」なら小さく |

## 影響を受けるのは StreamClip だけ

| モード | Stop 遅延 |
|---|---|
| **Command** (FIRE) | 即時 (デバイスがローカル clip を停止) |
| **StreamClip** (CLIP) | sendAhead 分の遅延あり |

`HapbeatActionHelper.StopEverything()` は両方に対して停止指示を送るので、Command の音は瞬時に止まり、Stream の音だけ ~sendAhead 秒の残響があります。

## :warning: clip フォーマットの統一が必要 (StreamClip 同時再生)

Hapbeat の stream session は **単一フォーマットで固定** されます。つまり 1 つの session 中で **sample rate / channel count が同一の clip しか同時 stream できません**。フォーマットが違う 2 つ目以降の clip は SDK で reject されます:

```
[Hapbeat] StreamAudioClip: rate/channel mismatch with active session
(session=16000Hz/2ch, new=16000Hz/1ch). Rejecting new source.
```

### 推奨フォーマット: **16 kHz / 2ch (stereo) PCM16**

- 全 StreamClip 用 WAV を **`16 kHz / stereo / PCM 16-bit signed LE`** に揃えてください
- mono ソースは stereo に up-mix (L=R duplicate) する
- 異なる sample rate / channel count の clip を混ぜると同時再生不可

### Studio 経由なら自動 normalize (2026-05-24 以降)

- **Live streaming** (Studio Devices タブの再生): 送信時に **2ch / 16 kHz / PCM16 に auto-resample + up-mix**
- **Kit deploy** (Helper の `pack_normalize`): `ffmpeg -ar 16000 -ac 2 -acodec pcm_s16le` で同じく統一

つまり **Studio を経由している限りユーザは何もしなくて良い**。ソース WAV が mono / 22.05 kHz でも勝手に統一フォーマットに揃って配信される。

### Studio を経由しない場合は注意

以下のケースは Studio の auto-normalize を通らないので、**自分で WAV を 16 kHz / 2ch / PCM16 に揃える必要があります**:

- Unity AssetDatabase で直接 import した AudioClip を `HapbeatManager.StreamAudioClip` に渡す
- 外部ツールで生成した WAV を Kit に直接コピー (Studio 経由でなく)
- 自前 deploy スクリプト / CI で WAV を扱う

統一方法は 3 通り:

### 方法 1: SDK Editor メニュー (Unity 内で完結、推奨)

メニューバー → **`Hapbeat → Normalize Audio Folder (16kHz · 2ch · PCM16)`** を選択:

1. フォルダピッカーが開く → Assets 配下の WAV 群が入ったフォルダを選ぶ (例: `Assets/HapbeatSDK/Kits/.../clips/`)
2. 「**16kHz / 2ch / PCM16 に変換します。上書きされます**」と確認ダイアログ
3. 実行で再帰的に全 WAV を normalize、進捗バー表示
4. 既に統一済の WAV は skip、変換失敗は warning ログ + 完了 dialog でリスト表示

→ ffmpeg / Audacity 不要、Unity 内で完結。mono → stereo (L=R duplicate)、線形補間 resample、PCM16 で上書き。

### 方法 2: ffmpeg

```bash
ffmpeg -i input.wav -ar 16000 -ac 2 -acodec pcm_s16le output.wav
```

CI / シェルスクリプトで一括変換したい場合に。

### 方法 3: Audacity (GUI)

1. ファイル → 書き出し → WAV (Microsoft, 16-bit PCM)
2. 「サンプリング周波数」を 16000 Hz に
3. mono の場合: 「トラック → ステレオに変換」を先に実行

### 単一 clip のみ stream する用途なら format 不問

session 中に **1 つの stream しか動かさない** 場合 (例: BGM 的に 1 つの clip だけループ) は format 統一は不要。session の最初の clip がそのまま format を決めるので。複数 clip の **同時再生 / 短時間 sequential 再生** で初めて問題になります。

## 関連

- [Getting Started](/docs/sdk-integration/unity-sdk/getting-started/) — `Manager.StreamAudioClip` の基本
- [Triggers](/docs/sdk-integration/unity-sdk/triggers/) — StreamClip / Command の違い
- [Event Map](/docs/sdk-integration/unity-sdk/event-map/) — entry の mode 設定
