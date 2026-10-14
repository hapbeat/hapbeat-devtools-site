---
title: スクリプトから触覚を鳴らす
kind: howto
sidebar:
  order: 3
  label: スクリプトから鳴らす
description: 自分の C# スクリプトから Hapbeat の触覚を鳴らす最短手順。Trigger コンポーネントへの参照を 1 つ持ち、Fire() を呼ぶだけ。
---

自分のゲームロジック（ダメージを受けた、弾が当たった、アイテムを拾った…）の中から触覚を鳴らす方法です。

**やることは 3 つだけです。**

1. EventMap に、鳴らしたい触覚のエントリを作る
2. シーンの GameObject に **Hapbeat UnityEvent Trigger** を追加し、Inspector で EventMap とエントリを選ぶ
3. 自分のスクリプトにその Trigger への参照を持たせ、鳴らしたい所で `Fire()` を呼ぶ

```csharp
using UnityEngine;
using Hapbeat;   // SDK の名前空間

public class PlayerHealth : MonoBehaviour
{
    // Inspector で、手順 2 の Trigger をドラッグして割り当てる
    [SerializeField] private HapbeatUnityEventTrigger _damageHaptic;

    public void TakeDamage(int amount)
    {
        // ...HP を減らす処理...
        _damageHaptic.Fire();   // 触覚を鳴らす
    }
}
```

どの波形を・どの強さで・どのデバイスに鳴らすかは、スクリプトではなく **EventMap のエントリ** が決めます。スクリプトは「今鳴らす」と伝えるだけなので、強さや送信先を変えてもコードを書き直す必要はありません。

:::note[前提]
[](/docs/sdk-integration/unity-sdk/getting-started/) を終え、シーンで `Hapbeat → Initial Scene Setup` を実行済みであること（`[Hapbeat Event Router]` と EventMap がある状態）。
:::

## 仕組み — EventMap はどこに入っている？

コードに EventMap が出てこないのは、**EventMap とエントリの指定は Trigger コンポーネント側が持っている** からです。

```text
PlayerHealth (自分のスクリプト)
  └ _damageHaptic ──参照──▶ HapbeatUnityEventTrigger (シーン上のコンポーネント)
                               ├ Event Map : MyScene-EventMap.asset   ← Inspector で選ぶ
                               └ Event     : player_damage            ← Inspector で選ぶ
                                                │
                                                ▼
                                   EventMap のエントリ（Mode / Clip / Gain / Target）
                                                │
                                                ▼
                                   HapbeatManager → Hapbeat デバイス
```

- `HapbeatUnityEventTrigger` は SDK が用意している MonoBehaviour です。`Fire()` / `Stop()` などの public メソッドを持っています（一覧: [](/docs/sdk-integration/unity-sdk/script-api/#hapbeatunityeventtrigger)）。
- 名前に「UnityEvent」と付いているのは、Button の OnClick などの UnityEvent からもコードなしで `Fire()` を呼べるためです。スクリプトから呼ぶ場合も同じコンポーネントを使います。
- 送信は `[Hapbeat Event Router]` 上の `HapbeatManager` が行います。スクリプトから Manager を探したり接続処理を書いたりする必要はありません。

## 手順

### 1. EventMap にエントリを作る

`Hapbeat → Open Event Map` を開き、ツールバーの **`+`** ボタンでエントリを追加して、次を設定します。

| 項目 | 設定例 |
|---|---|
| Name | `player_damage`（Inspector のドロップダウンに出る名前） |
| Mode | まずは `CLIP (Stream Clip)` にして、Clip に WAV を割り当てるのが手軽（Kit の deploy 不要） |
| Gain | `0.5` 前後から試す |
| Targeting | 空のまま（全デバイス） |

各項目の意味は [](/docs/sdk-integration/unity-sdk/event-map/) を参照してください。行の ▶ ボタンで、Play しなくても試し鳴らしできます。

### 2. Trigger コンポーネントを置く

1. Hierarchy の任意の GameObject を選ぶ（プレイヤー自身でも、`[Hapbeat Event Router]` でもよい）
2. **Add Component → Hapbeat → Hapbeat UnityEvent Trigger**
3. Inspector で **Event Map** に手順 1 の EventMap を、**Event** のドロップダウンで `player_damage` を選ぶ

鳴らしたい触覚が複数あるときは、**エントリ 1 つにつき Trigger を 1 つ** 置きます（同じ GameObject に複数付けてもかまいません）。

### 3. スクリプトから呼ぶ

冒頭のコードのように `[SerializeField]` のフィールドを用意し、Inspector で手順 2 の Trigger をドラッグして割り当てます。あとは鳴らしたい所で `Fire()` を呼ぶだけです。

Play して `TakeDamage()` が呼ばれたときにデバイスが振動すれば完了です。

## よく使う操作

### 強さを変えて鳴らす

`GainMultiplier` に倍率（0〜2）を入れてから `Fire()` します。最終的な強さは「エントリの Gain × Kit の intensity × `GainMultiplier`」です。

```csharp
// 受けたダメージが大きいほど強く
_damageHaptic.GainMultiplier = Mathf.Clamp01(amount / 50f);
_damageHaptic.Fire();
```

### 鳴らし続けて、止める（ループ）

エントリを `CLIP (Stream Clip)` + **Loop** にして、開始で `Fire()`、終了で `Stop()` を呼びます。

```csharp
[SerializeField] private HapbeatUnityEventTrigger _engineHaptic;  // Loop のエントリ

void StartEngine() => _engineHaptic.Fire();
void StopEngine()  => _engineHaptic.Stop();
```

### 鳴っている最中に強さ・左右を変える

ループ中に `GainMultiplier` や `Pan`（−1 = 左 〜 +1 = 右）を書き換えると、再生中の振動にすぐ反映されます。

```csharp
void Update()
{
    // 速度が上がるほど強く
    _engineHaptic.GainMultiplier = Mathf.InverseLerp(0f, 30f, _speed);
}
```

同じことはコードなしの **Parameter Binding** でもできます（→ [](/docs/sdk-integration/unity-sdk/parameter-binding/)）。

### つかむ → 持っている間 → 離す

開始の一発・継続ループ・終了の一発の 3 段をまとめて扱うなら **Hapbeat Sequence Trigger** を使います。スクリプトからは同じく `Fire()`（つかんだ）と `Stop()`（離した）を呼ぶだけです。

```csharp
[SerializeField] private HapbeatSequenceTrigger _grabHaptic;

void OnGrab()    => _grabHaptic.Fire();   // On Start の一発 → Loop 開始
void OnRelease() => _grabHaptic.Stop();   // Loop 停止 → On Stop の一発
```

### 一時的に鳴らさない

```csharp
_damageHaptic.TriggerEnabled = false;  // false の間は Fire() しても鳴らない
```

## Showcase で実例を見る

Showcase サンプルには、スクリプトから触覚を呼んでいる例が 3 つあります。易しい順に読むのがおすすめです。

| 例 | スクリプト | やっていること |
|---|---|---|
| **Z3 Fishing** | [`FishingController.cs`](https://github.com/hapbeat/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/FishingController.cs) | マウスを押したら `_sequence.Fire()`、離したら `_sequence.Stop()`。触覚に関わるコードはこの 2 行だけ |
| **Z4 Stream Console** | [`StreamDemoController.cs`](https://github.com/hapbeat/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/StreamDemoController.cs) | Space キーで `HapbeatUnityEventTrigger` の `Fire()` / `Stop()` を切り替え、`ActivePlayback` で再生中かを判定 |
| **Z5 Charge & Shoot** | [`ChargeShooter.cs`](https://github.com/hapbeat/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/ChargeShooter.cs) | Trigger を使わず、EventMap のエントリを読んで `HapbeatManager` を直接呼ぶ上級例（[下記](#trigger-を使わずに鳴らす)） |

Showcase の開き方は [](/docs/sdk-integration/unity-sdk/showcase/overview/) を参照してください。

## Trigger を使わずに鳴らす

上級者向けの方法として、Trigger コンポーネントを置かず `HapbeatManager` を直接呼ぶこともできます。

```csharp
// Kit を deploy 済みのデバイスで、Event ID を指定して鳴らす（FIRE / Command）
HapbeatManager.Instance?.Play("my-kit.enemy_hit", gain: 0.8f);

// Unity の AudioClip をそのまま送って鳴らす（CLIP / Stream）
HapbeatStreamPlayback pb = HapbeatManager.Instance?.StreamAudioClip(myClip, gain: 0.5f);
pb?.Stop();  // 返り値のハンドルで止める・強さを変える
```

ただしこの経路では、**EventMap で設定した Gain・Target・Kit の intensity 補正・遅延補正が効きません**（値をすべてコード側で渡すことになる）。次のような場合に限って使うのが目安です。

- Event ID を実行時に組み立てる（例: `$"heartbeat.player_{id}"` のようにプレイヤーごとに別 ID）
- エントリの数が多すぎて EventMap で管理しきれない

EventMap の設定を活かしたまま Manager を直接呼ぶ書き方は、Showcase の `ChargeShooter.cs` がそのまま見本になります（`_eventMap.FindById(...)` でエントリを取り出し、`entry.GetEffectiveGain()` / `entry.target` / `entry.streamClip` を Manager に渡している）。

## うまく鳴らないとき

| 症状 | 確認すること |
|---|---|
| `Fire()` しても何も起きない | Console に `[Hapbeat] Fire rejected: no EventMap assigned` が出ていないか（手順 2 の Event Map 未選択） |
| `entry id '...' not found` の警告 | EventMap からエントリを消した。Trigger の Event 欄でエントリを選び直す |
| 1 回目は鳴るが連打すると鳴らない | Trigger の **Cooldown** が 0 より大きい |
| `_damageHaptic` が null で例外 | Inspector でフィールドに Trigger を割り当てていない |
| CLIP は鳴るが FIRE が鳴らない | デバイスに Kit が deploy されていない（[](/docs/sdk-integration/unity-sdk/fire-vs-clip/)） |

## 次に読む

- [](/docs/sdk-integration/unity-sdk/script-api/) — スクリプトから使えるメソッド・プロパティの一覧
- [](/docs/sdk-integration/unity-sdk/triggers/) — コードなしで鳴らす Trigger コンポーネント（衝突・Animator など）
- [](/docs/sdk-integration/unity-sdk/event-map/) — エントリの全設定項目
