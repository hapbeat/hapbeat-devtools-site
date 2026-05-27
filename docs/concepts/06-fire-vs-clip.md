---
title: Fire と Clip の違い
kind: explanation
description: 触覚イベントの送信モード「Fire (command)」と「Clip (stream)」の本質的な違いと、どちらをどのケースで選ぶか。
sidebar:
  order: 6
---

Hapbeat の触覚は、Event ごとに **Fire** か **Clip** のどちらで送るかを選択します。同じ触覚体験を実現する道筋が複数あるので、**遅延・帯域・柔軟性のトレードオフ** を踏まえて選ぶことになります。このページは「どちらを選ぶか」の判断材料を 1 か所にまとめます。

## 2 つの送信方式

manifest 上では Event が **どちらの bucket に入っているか** で送信方式が決まります ([DEC-031](https://github.com/Hapbeat/hapbeat-sdk-workspace/blob/master/docs/decision-log.md#DEC-031))。

| 通称 | manifest bucket | wire 上 | 送信内容 | 主な用途 |
|---|---|---|---|---|
| **Fire** | `events` (command) | PLAY/STOP packet に Event ID | コマンド (数バイト) | 短い one-shot 効果音 |
| **Clip** | `stream_events` (stream) | STREAM_BEGIN / STREAM_DATA / STREAM_END | AudioClip 由来の PCM ストリーミング | 長尺・動的変調・プロトタイピング |

同じ Event ID を **両 bucket に置く** ことで「Fire / Clip どちらでも再生できる (= BOTH モード)」を表現できます。Studio の EventMap UI では FIRE / CLIP / BOTH のラジオで切り替えます。

> schema 1.x までは entry に `mode: "command" | "stream_clip" | "stream_source"` フィールドがありましたが、schema 2.0.0 で bucket 分離に置き換わり、`mode` フィールドと `stream_source` mode は廃止されました。

## Fire (command) と Clip (stream) の比較

| | **Fire** (`events` bucket) | **Clip** (`stream_events` bucket) |
|---|---|---|
| 事前デプロイ | 必要 (Kit を install-clips に焼く) | 不要 |
| wire 上を流れるもの | Event ID + パラメータの **数バイト** | PCM chunk (`STREAM_BEGIN` / `STREAM_DATA` / `STREAM_END`) |
| 遅延 | 数 ms / 安定 | 数十 ms / 環境依存 |
| 長さ | 数 ms 〜 数秒 (Kit パーティション容量内) | 任意 (数十秒・ループ可) |
| 動的制御 | `gain` のみ (発火ごとに固定) | 再生中に `gain` / pan を変調可能 |
| 停止の即時性 | 即時 | 既送 buffer 分は再生されきる |
| 無線帯域消費 | ごく小 | 連続消費 |

## Fire モード

Kit の WAV をデバイスに **事前デプロイ** しておき、SDK は Event ID と少しのパラメータだけを送ります。デバイス側は受信したコマンドに対応する WAV を自分のストレージから再生します。

### 強み
- **遅延が低く安定** — wire 上を流れるのが小さなコマンドだけなので、Wi-Fi が混雑していても再現性が高い
- **無線帯域を消費しない** — 大量同時発火でも輻輳しにくい
- **停止コマンド (`stop`) も即時反映**

### 弱み
- **事前にデプロイが必要** — Kit を作って Studio から書き込む手順が入る
- **Kit パーティション容量に依存** — install-clips/ は数 MB の制約
- **動的に波形を変えられない** — `gain` を変えるだけなら可能だが、波形そのものは固定

### 向いている用途
- ボタン押下感、銃撃音、衝撃音、足音などの **短い one-shot 効果音**
- ゲーム本番、XR インタラクション、量産展示など **安定再現が必須** な場面

## Clip モード

SDK 側に置いた AudioClip 等を PCM データに変換し、`STREAM_BEGIN` → `STREAM_DATA` × N → `STREAM_END` の UDP メッセージ列としてデバイスに送ります。事前デプロイ不要。device は eventId を認識せず、stream session 単位で受信します。

### 強み
- **デプロイ不要で即試せる** — 波形を入れ替えながら試行錯誤できる (プロトタイピング向き)
- **任意の長さに対応** — 数十秒の持続触覚やループも送れる
- **再生中に動的変調** — `gain` を per-chunk で乗算するため、動的パラメータ (距離・速度・体力など) に追従できる

### 弱み
- **Wi-Fi 環境依存** — ネットワークが不安定だと chunk drop で途切れる
- **遅延が大きめ** — chunk 単位の buffering + 送信で数十 ms (Fire より一桁大きい)
- **停止に少し遅れ** — 既に送信済みの buffer 分は再生されきってから止まる

### 向いている用途
- 開発中の **試作・確認**
- **長尺の持続触覚** (BGM 的な背景振動・環境音)
- **動的パラメータ連動** (擦り感の速度マッピング・距離減衰など)

## 判断フロー

```
触覚は数秒以内に収まる ?
├─ Yes
│  └─ 本番運用 / Wi-Fi が混雑する環境 ?
│     ├─ Yes → Fire        ← 標準デフォルト
│     └─ No  (プロトタイピング段階) → Clip
└─ No (長尺 / ループ / 動的変調が必要)
   └─ Clip
```

**典型ワークフロー**: プロトタイピングは Clip で試行錯誤 → 形が決まったら Fire に切り替えて Kit にコミット。Studio EventMap の FIRE / CLIP / BOTH ラジオで切り替えるだけで移行できます (BOTH のままにすれば Kit 配布後も両モードで再生可能)。

## gain の扱いの違い

[gain の乗算構造](./gain-architecture/) は両モード共通ですが、**Clip では per-chunk で pre-multiply** されます。

| モード | gain 適用タイミング |
|---|---|
| Fire | デバイス側でコマンド受信時に 1 回 |
| Clip | SDK / Helper 側で PCM chunk 1 つごとに掛け合わせ → ストリーミング |

このため Clip は **再生中に gain を変えると次の chunk から反映** されます (連続変調に向く)。Fire の途中で強度を動的に変えることはできません (新しい発火 = 新しいコマンドが必要)。

## Studio UI と SDK API の対応

| | Studio 表示 | manifest 上の格納先 | Unity SDK API |
|---|---|---|---|
| Fire | `▶ FIRE` | `events.<id>` | `HapbeatManager.Play(eventId, gain)` |
| Clip | `♪ CLIP` | `stream_events.<id>` | `HapbeatManager.StreamAudioClip(clip, gain)` |
| BOTH | `▶♪ BOTH` | 両 bucket に同一 id | 上記両方 (用途に応じて使い分け) |

## Helper の役割 (補足)

Clip のストリーミング自体は **SDK が直接デバイスに UDP を送信** すれば成立します。Helper は必須ではなく、Studio の再生テストや SDK 開発時のホスト側中継として使う **任意のツール** です。実行時の最小構成は SDK + Hapbeat デバイスだけです。

## 関連リンク

- [](/docs/tools/studio/modes/) — Studio で Mode を切り替える手順 (howto)
- [](/docs/sdk-integration/unity-sdk/fire-vs-clip/) — Unity 実装でのコード例
- [](/docs/sdk-integration/unity-sdk/streaming/) — Clip モードの buffering / 遅延チューニング
- [gain の乗算構造](./gain-architecture/) — gain がどの段で乗算されるか
