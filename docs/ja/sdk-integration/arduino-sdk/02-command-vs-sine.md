---
title: command と sine の使い分け
kind: explanation
description: Arduino SDK の 2 つの触覚生成モード — kit イベントを鳴らす command と、MCU で波形を合成する sine の違いと選び方。
sidebar:
  order: 2
  label: command と sine
---

この Arduino ライブラリ（level-1）では、触覚の出し方が **2 つ**あります。
どちらも MCU 側に音声ファイルを持つ必要はありません。

## command（fire）モード

```cpp
hb.play("sample-kit.sine_100hz", 0.6f);
```

- 波形は **Hapbeat 側の kit** に入っている。MCU は約 30 バイトのトリガーを送るだけ。
- 事前に [Hapbeat Studio](https://devtools.hapbeat.com) で kit をデバイスに deploy しておく。
- イベント id は `<kit 名>.<ファイル名>`。id は deploy 済み kit に存在する必要がある。
- **向くケース**: あらかじめ作り込んだ触覚（衝撃・クリック等）を、決まった id で再生したいとき。

## 合成 sine モード

```cpp
hb.playSine(160.0f, 0.7f, 400);     // 周波数・強さ・長さ
```

- 波形を **MCU 上でリアルタイム合成**して送る。kit も WAV も Studio も不要。
- 周波数と強さが**ライブなパラメータ**なので、入力に応じて連続的に変えられる。
- **向くケース**: 最短の動作確認、センサ値や UI に連動した表現、ファイルを用意したくないとき。

## 選び方

| | command | sine |
|---|---|---|
| Hapbeat 側の kit | **必要**（Studio で deploy） | 不要 |
| MCU 上のデータ | なし（トリガーのみ） | なし（その場で合成） |
| 表現の自由度 | kit に作り込んだ波形 | 周波数・強さをライブ可変 |
| 最初の一歩 | kit deploy が前提 | **そのまま振動（推奨）** |

迷ったら、まず **sine** で疎通を確認してから、作り込んだ触覚を **command** に載せる流れが簡単です。

## level-1 のスコープ

このバージョンには**含まれていない**もの（将来対応）:

- 保存済み WAV / クリップのストリーミング
- EventMap（チューニング層）
- ESP-NOW transport（ルーター不要経路）

合成 sine の詳細は [](/docs/sdk-integration/arduino-sdk/streaming/) を参照してください。
