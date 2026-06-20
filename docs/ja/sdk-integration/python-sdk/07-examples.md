---
title: サンプルの歩き方
kind: tutorial
description: examples をコピーして自分のアプリの土台にするための読み順・再利用方法・つまずきどころ。
sidebar:
  order: 7
  label: サンプル
---

SDK の <a href="https://github.com/hapbeat/hapbeat-python-sdk/tree/master/examples" target="_blank" rel="noopener noreferrer">`examples/`</a>
は、**読んでコピーして自分のものにする**ことを前提にした単体ファイル／フォルダ集です。
ここでは「どれを土台にすればよいか」と「コピーして使うときの注意」をまとめます。

## 読む順番

1. **minimal.py** — `connect → play → stop` の最小形。まずこれ。
2. **clip_project/** — kit をプロジェクトに同梱する構成。同じ `play(id)` が command と
   clip に自動で分かれることが分かる、いちばんのお手本。
3. **osc_remote/** — 触覚ファイルと、外部（スマホ等）からの起動。
4. 用途別の応用例（下表）。

## サンプル早見表

| サンプル | 向き | 何が学べる | 必要な kit |
|---|---|---|---|
| minimal.py | 全員 | discover / play / stop の最小形 | 短い one-shot 1 つ |
| clip_project/ | アプリ作成者 | プロジェクト構成、command/clip 自動分岐、`stream_pcm` | kit フォルダ |
| osc_remote/ | ライブ・展示 | 触覚ファイル、スマホ（TouchOSC）から起動 | kit + 触覚ファイル |
| task_notifier.py | 開発・ML | 任意コマンドの成否を触覚で通知 | 短い one-shot 1 つ |
| metronome.py | 音楽・ランニング | 触覚メトロノーム（テンポ操作・変拍子） | 短い one-shot 1 つ |
| breathing_pacer.py | ウェルビーイング | 呼吸ガイド（強度ランプ・計測ログ） | 短く柔らかい one-shot |
| psychophysics_experiment.py | 研究 | 検出実験（恒常法・階段法・CSV） | 短い one-shot 1 つ |
| morse_text.py | アクセシビリティ | テキスト → モールス（play/stop で長短） | ループ buzz（または 2 つの one-shot） |
| haptic_pad.py | ライブ・WoZ | キーボードのトリガーパッド（記録・再生） | マッピング元（下記） |

> 表の「既定の event id」（`impact.hit` など）は**プレースホルダ**で、必ず自分の kit に
> 含まれる id に置き換えてください。

## コピーして使うときの再利用性

- **単体ファイルの例**（minimal / task_notifier / metronome / breathing_pacer /
  psychophysics_experiment / morse_text / haptic_pad）はそのままコピーして使えます。
- **clip_project/** はフォルダごと丸ごとコピーできます。kit の場所を `__file__` 基準で
  解決するので、フォルダを移動しても自分の kit を見つけます。**`kits/` を自分の kit に
  差し替える**だけで土台になります。
- **osc_remote/** もフォルダごとコピーして使います。中の `kits/demo-kit/` を自分の kit に
  差し替え、`haptics.json` の `kit` をそのフォルダに向けてください。

## 起点（コード）と触覚設定（ファイル）の分離

サンプルは、この分離を段階的に見せています。

- minimal.py — コードに `gain` を直接書く最小形。
- clip_project/ — 強度や mode は **kit**（`connect(kit=...)`）に。
- osc_remote/ — target や強度は **触覚ファイル**（`connect(haptics=...)`）に。

詳しくは [](/docs/sdk-integration/python-sdk/project-structure/) と
[](/docs/sdk-integration/python-sdk/event-map/) を参照。

## つまずきどころ

- **scan では見えるのに鳴らない** — いちばん多い原因は、配備した kit に無い event id を
  指定していること。Studio で kit の id を確認。`task_notifier.py --test` で疎通を確認できます。
- **command の例が鳴らない** — command の波形は Studio でデバイスに書き込む必要があります
  （SDK は `install-clips/` を読みません）。clip の例（WAV を送る）は書き込み不要で動きます。
- **target が自分のデバイスと合っていない** — `target` が一致しないと鳴りません。まず空
  （全台ブロードキャスト）で確認し、その後デバイスのアドレスに合わせます。
- **clip の音がおかしい** — clip WAV は 16 kHz モノ PCM16 で用意してください（SDK は
  resample しません）。
- **gain が想定と違う** — gain は 0..1 の絶対値です。ただし `haptic_pad.py` の `--master`
  だけは各パッドへの倍率なので注意。
