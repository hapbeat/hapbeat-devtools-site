---
title: スクリプトから触覚を再生する
kind: howto
sidebar:
  order: 3
  label: スクリプトから再生
description: 自分の C# スクリプトから Hapbeat の触覚を再生する方法。Trigger コンポーネント経由（EventMap の設定を使う）と、HapbeatManager の直接呼び出しの 2 通り。
---

ダメージを受けた・弾が当たった・アイテムを拾った、といったゲームロジックの中から触覚を再生する方法をまとめます。

スクリプトから再生する方法は 2 通りあります。

| 方法 | EventMap | 使う場面 |
|---|---|---|
| **A. Trigger コンポーネントを呼ぶ**（基本） | 使う。どの触覚を・どの強さで・どのデバイスに再生するかは EventMap で設定する | ほとんどの場合 |
| **B. HapbeatManager を直接呼ぶ** | 使わない。Kit の Event ID や AudioClip、強さ、送信先をコードで指定する | Event ID を実行時に組み立てるなど、EventMap で管理しきれない場合 |

コードを書かずに、衝突・Animator・UI などから直接再生する方法（コンポーネント経由）は [](/docs/sdk-integration/unity-sdk/triggers/) を参照してください。

:::note[前提]
[](/docs/sdk-integration/unity-sdk/getting-started/) を終え、シーンで `Hapbeat → Initial Scene Setup` を実行済みであること（`[Hapbeat Event Router]` と EventMap がある状態）。
:::

## A. Trigger コンポーネントを呼ぶ

### 仕組み

スクリプトが持つのは Trigger コンポーネント（`HapbeatUnityEventTrigger`）への参照だけです。**どの EventMap のどのエントリを再生するかは、Trigger コンポーネントの Inspector で選びます**。そのため、コードには EventMap が出てきません。

```text
自分のスクリプト（例: PlayerHealth）
  └ _damageHaptic ──参照──▶ HapbeatUnityEventTrigger（シーン上のコンポーネント）
                               ├ Event Map : MyScene-EventMap.asset   ← Inspector で選ぶ
                               └ Event     : player_damage            ← Inspector で選ぶ
                                                │
                                                ▼
                                   EventMap のエントリ（Mode / Clip / Gain / Target）
                                                │
                                                ▼
                                   HapbeatManager → Hapbeat デバイス
```

- `HapbeatUnityEventTrigger` は SDK が用意している MonoBehaviour で、`Fire()`（再生）/ `Stop()`（停止）などの public メソッドを持っています。一覧は [](/docs/sdk-integration/unity-sdk/script-api/#hapbeatunityeventtrigger) を参照してください。
- 名前の「UnityEvent」は、Button の OnClick などの UnityEvent からもコードなしで `Fire()` を呼べることを表しています。スクリプトから呼ぶ場合も同じコンポーネントを使います。
- 強さや送信先を変えるときは EventMap を編集します。スクリプトを書き直す必要はありません。

### 設定の流れ

**1. EventMap にエントリを作る**

`Hapbeat → Open Event Map` を開き、ツールバーの **`+`** ボタンでエントリを追加して、次を設定します。

| 項目 | 設定例 |
|---|---|
| Name | `player_damage`（Trigger の Event ドロップダウンに出る名前） |
| Mode | `CLIP (Stream Clip)` にして Clip に WAV を割り当てると、Kit を deploy せずに試せる |
| Gain | `0.5` 前後 |
| Targeting | 空（全デバイス） |

各項目の意味は [](/docs/sdk-integration/unity-sdk/event-map/) を参照してください。行の ▶ ボタンで、Play しなくても試し再生できます。

**2. Trigger コンポーネントを置き、EventMap とエントリを選ぶ**

1. Hierarchy の任意の GameObject を選ぶ（プレイヤー自身でも、`[Hapbeat Event Router]` でもよい）
2. **Add Component → Hapbeat → Hapbeat UnityEvent Trigger**
3. Inspector の **Event Map** に手順 1 の EventMap を、**Event** のドロップダウンで `player_damage` を選ぶ

再生したい触覚が複数あるときは、エントリ 1 つにつき Trigger を 1 つ置きます（同じ GameObject に複数付けてもかまいません）。

**3. スクリプトから `Fire()` を呼ぶ**

```csharp
using UnityEngine;
using Hapbeat;   // SDK の名前空間

public class PlayerHealth : MonoBehaviour
{
    // 手順 2 の Trigger を Inspector でドラッグして割り当てる。
    // 再生する EventMap とエントリは、その Trigger の Inspector で選んである。
    [SerializeField] private HapbeatUnityEventTrigger _damageHaptic;

    public void TakeDamage(int amount)
    {
        // ...HP を減らす処理...
        _damageHaptic.Fire();   // EventMap のエントリ player_damage を再生
    }
}
```

Play して `TakeDamage()` が呼ばれたときにデバイスが振動すれば、設定は完了です。

### よく使う操作

**強さを変えて再生する** — `GainMultiplier` に倍率（0〜2）を入れてから `Fire()` します。最終的な強さは「エントリの Gain × Kit の intensity × `GainMultiplier`」です。

```csharp
// 受けたダメージが大きいほど強く
_damageHaptic.GainMultiplier = Mathf.Clamp01(amount / 50f);
_damageHaptic.Fire();
```

**ループ再生して止める** — エントリを `CLIP (Stream Clip)` + **Loop** にして、開始で `Fire()`、終了で `Stop()` を呼びます。

```csharp
[SerializeField] private HapbeatUnityEventTrigger _engineHaptic;  // Loop のエントリを選んだ Trigger

void StartEngine() => _engineHaptic.Fire();
void StopEngine()  => _engineHaptic.Stop();
```

**再生中に強さ・左右を変える** — ループ中に `GainMultiplier` や `Pan`（−1 = 左 〜 +1 = 右）を書き換えると、再生中の振動にすぐ反映されます。同じことはコードなしの [](/docs/sdk-integration/unity-sdk/parameter-binding/) でもできます。

```csharp
void Update()
{
    // 速度が上がるほど強く
    _engineHaptic.GainMultiplier = Mathf.InverseLerp(0f, 30f, _speed);
}
```

**つかむ → 持っている間 → 離す** — 開始の一発・継続ループ・終了の一発の 3 段をまとめて扱うなら **Hapbeat Sequence Trigger** を使います。スクリプトからは `Fire()`（つかんだ）と `Stop()`（離した）を呼びます。

```csharp
[SerializeField] private HapbeatSequenceTrigger _grabHaptic;

void OnGrab()    => _grabHaptic.Fire();   // On Start の一発 → Loop 開始
void OnRelease() => _grabHaptic.Stop();   // Loop 停止 → On Stop の一発
```

**一時的に再生しない** — `TriggerEnabled` が `false` の間は、`Fire()` を呼んでも再生されません。

```csharp
_damageHaptic.TriggerEnabled = false;
```

## B. HapbeatManager を直接呼ぶ

Trigger コンポーネントも EventMap も使わず、`HapbeatManager` に再生内容をすべて渡す方法です。

```csharp
// FIRE（Command）: デバイスに deploy 済みの Kit から、Event ID を指定して再生
HapbeatManager.Instance?.Play("my-kit.enemy_hit", gain: 0.8f);

// CLIP（Stream）: Unity の AudioClip を送って再生。返り値のハンドルで停止・強さ変更
HapbeatStreamPlayback pb = HapbeatManager.Instance?.StreamAudioClip(myClip, gain: 0.5f);
pb?.Stop();
```

EventMap を通らないため、EventMap の Gain・Target、Kit の intensity 補正、遅延補正は効きません。次のような場合に使います。

- Event ID を実行時に組み立てる（例: プレイヤーごとに `$"heartbeat.player_{id}"`）
- エントリの数が多すぎて EventMap で管理しきれない

`HapbeatManager` を直接呼びつつ EventMap の設定を読むこともできます。Showcase の `ChargeShooter.cs` がその例で、`_eventMap.FindById(...)` で取り出したエントリの `GetEffectiveGain()` / `target` / `streamClip` を Manager に渡しています。

## Showcase の実例

Showcase サンプルでスクリプトから触覚を再生しているのは次の 3 か所です。

| ゾーン | スクリプト | 方法 | 内容 |
|---|---|---|---|
| **Z3 Fishing** | [`FishingController.cs`](https://github.com/hapbeat/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/FishingController.cs) | A | マウスを押したら `_sequence.Fire()`、離したら `_sequence.Stop()`。触覚に関わるコードはこの 2 行 |
| **Z4 Stream Console** | [`StreamDemoController.cs`](https://github.com/hapbeat/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/StreamDemoController.cs) | A | Space キーで `HapbeatUnityEventTrigger` の `Fire()` / `Stop()` を切り替え、`ActivePlayback` で再生中かを判定 |
| **Z5 Charge & Shoot** | [`ChargeShooter.cs`](https://github.com/hapbeat/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/ChargeShooter.cs) | B | EventMap のエントリを読んで `HapbeatManager` を直接呼び、チャージ量に応じて再生中の強さを変える |

各ゾーンの内容は [](/docs/sdk-integration/unity-sdk/showcase/overview/) を参照してください。

## 再生されないとき

| 症状 | 確認すること |
|---|---|
| `Fire()` しても何も起きない | Console に `[Hapbeat] Fire rejected: no EventMap assigned` が出ていないか（Trigger の Event Map 未選択） |
| `entry id '...' not found` の警告 | EventMap からエントリを消した。Trigger の Event 欄でエントリを選び直す |
| 1 回目は再生されるが、連続で呼ぶと再生されない | Trigger の **Cooldown** が 0 より大きい |
| `_damageHaptic` が null で例外 | スクリプトのフィールドに Trigger を割り当てていない |
| CLIP は再生されるが FIRE が再生されない | デバイスに Kit が deploy されていない（[](/docs/sdk-integration/unity-sdk/fire-vs-clip/)） |

## 次に読む

- [](/docs/sdk-integration/unity-sdk/script-api/) — スクリプトから使えるメソッド・プロパティの一覧
- [](/docs/sdk-integration/unity-sdk/triggers/) — コードなしで再生する Trigger コンポーネント（衝突・Animator など）
- [](/docs/sdk-integration/unity-sdk/event-map/) — エントリの全設定項目
