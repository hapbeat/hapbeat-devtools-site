---
title: スクリプト API リファレンス
kind: reference
sidebar:
  order: 300
  label: スクリプト API
description: C# スクリプトから呼べる Hapbeat Unity SDK の public メソッド・プロパティの一覧（Trigger / HapbeatManager / HapbeatStreamPlayback / EventMap）。
---

C# スクリプトから使う主なクラスの public メンバーの一覧です。使い方の流れは [](/docs/sdk-integration/unity-sdk/scripting/) を参照してください。

- 名前空間はすべて `Hapbeat`（`using Hapbeat;`）
- 対象バージョン: SDK 0.6.0
- ここに無いメンバーの詳細は、ソースの XML コメントを参照してください（[Runtime/](https://github.com/hapbeat/hapbeat-unity-sdk/tree/master/Runtime)）

## どのクラスを使うか

| やりたいこと | 使うもの |
|---|---|
| EventMap のエントリを鳴らす・止める | [HapbeatUnityEventTrigger](#hapbeatunityeventtrigger) |
| つかむ → 持つ → 離すの 3 段 | [HapbeatSequenceTrigger](#hapbeatsequencetrigger) |
| 再生中の CLIP の強さ・左右を変える | Trigger の `GainMultiplier` / `Pan`、または [HapbeatStreamPlayback](#hapbeatstreamplayback) |
| EventMap を通さずに鳴らす、接続状態を見る | [HapbeatManager](#hapbeatmanager) |
| スクリプトからエントリの設定を読む | [HapbeatEventMap / HapbeatEventEntry](#hapbeateventmap--hapbeatevententry) |

## Trigger 共通のメンバー

`HapbeatUnityEventTrigger`・`HapbeatSequenceTrigger`・`HapbeatCollisionTrigger`・`HapbeatTickEmitter` はすべて基底クラス `HapbeatTriggerBase` を継承しており、次のメンバーを共通で持ちます。

| メンバー | 型 | 内容 |
|---|---|---|
| `GainMultiplier` | `float`（0〜2） | このコンポーネント固有の倍率。最終 gain = エントリの Gain × Kit の intensity × `GainMultiplier`。CLIP の再生中に書き換えると即座に反映される |
| `Pan` | `float`（−1〜+1） | 左右バランス。−1 = 左のみ、0 = 中央、+1 = 右のみ。CLIP の再生中に書き換えると即座に反映される |
| `TriggerEnabled` | `bool` | `false` の間は `Fire()` しても鳴らない |
| `ActivePlayback` | [`HapbeatStreamPlayback`](#hapbeatstreamplayback) | このコンポーネントが再生中の CLIP のハンドル。再生していなければ `null` |
| `EventMap` | `HapbeatEventMap`（読み取り専用） | Inspector で割り当てた EventMap |
| `EntryId` | `string`（読み取り専用） | 選択中エントリの ID（GUID） |
| `ResolveEntry()` | `HapbeatEventEntry` | 選択中エントリの設定を取得する。未選択・削除済みなら `null` |

Inspector だけで設定する項目（スクリプトからは変更できない）: **Event Map**・**Event**（エントリの選択）・**Cooldown**（連続発火を防ぐ最小間隔、秒）。

## HapbeatUnityEventTrigger

**Add Component → Hapbeat → Hapbeat UnityEvent Trigger**。EventMap のエントリを 1 つ鳴らすための汎用 Trigger です。スクリプトから呼ぶ場合も、Button の OnClick などの UnityEvent から呼ぶ場合も、このコンポーネントを使います。

| メソッド | 内容 |
|---|---|
| `Fire()` | エントリを鳴らす。FIRE（Command）なら Event ID を送信、CLIP（Stream）なら AudioClip を送信する。Loop のエントリは `Stop()` まで鳴り続ける |
| `Stop()` | このコンポーネントが鳴らしている触覚を止める |
| `FireWithGain(float gain)` | 指定した値を最終 gain として鳴らす（エントリの Gain・Kit の intensity・`GainMultiplier` は掛からない）。**FIRE（Command）のエントリ専用**。CLIP のエントリの強さを変えるときは `GainMultiplier` を設定してから `Fire()` を呼ぶ |

加えて [Trigger 共通](#trigger-共通のメンバー) のメンバーを使えます。

```csharp
[SerializeField] private HapbeatUnityEventTrigger _hit;

void OnHit(float power)
{
    _hit.GainMultiplier = power;   // 0〜2
    _hit.Fire();
}
```

## HapbeatSequenceTrigger

**Add Component → Hapbeat → Hapbeat Sequence Trigger**。「開始の一発 → 継続ループ → 終了の一発」を 1 つで扱います。Inspector で **On Start**（開始の一発）・**Loop (hold)**（継続、Loop を有効にした CLIP エントリ）・**On Stop**（終了の一発）を選びます。使わない段は `(none)` にします。

| メンバー | 内容 |
|---|---|
| `Fire()` | On Start の一発を鳴らし、続けて Loop を開始する |
| `Stop()` | Loop を止め、On Stop の一発を鳴らす |
| `FireWithStartGain(float gainMultiplier)` | `Fire()` と同じだが、On Start の一発だけ倍率を掛ける（Loop はエントリの gain のまま） |
| `StartShotDelay` | On Start から Loop 開始までの待ち時間（秒）。−1 = On Start のクリップの長さだけ待つ（既定） |
| `StopShotDelay` | Loop 停止から On Stop までの待ち時間（秒、既定 0.05） |

加えて [Trigger 共通](#trigger-共通のメンバー) のメンバーを使えます（`GainMultiplier` / `Pan` / `ActivePlayback` は Loop に効く）。

## HapbeatCollisionTrigger / HapbeatTickEmitter

通常は Inspector の設定だけで動くため、スクリプトから呼ぶメソッドは少数です。設定項目は [](/docs/sdk-integration/unity-sdk/triggers/) を参照してください。

| クラス | メンバー | 内容 |
|---|---|---|
| `HapbeatTickEmitter` | `Fire(float value)` / `Fire(Vector2 value)` | 連続値を渡す。前回からの変化量がしきい値を超えるたびに鳴らす |
| | `FireNow()` | しきい値に関係なく 1 回鳴らす |
| | `TickThreshold` | 何だけ値が変わったら鳴らすか |
| | `ResetReference()` | 変化量の基準をリセットする |
| `HapbeatParameterBinding` | `SetValue(float v)` | Source Property が `External` のとき、スクリプトから入力値を渡す |

## HapbeatStreamPlayback

CLIP（Stream）の再生 1 本ごとのハンドルです。Trigger の `ActivePlayback`、または `HapbeatManager.StreamAudioClip()` の返り値として得られます。

| メンバー | 型 | 内容 |
|---|---|---|
| `Gain` | `float`（0〜2） | 再生中の強さ。書き換えると次に送るデータから反映される |
| `Pan` | `float`（−1〜+1） | 左右バランス |
| `Loop` | `bool` | ループするか。再生中に切り替えられる |
| `ApplyGainModulation(float m)` | — | `Gain = BaselineGain × m` にする。`BaselineGain` は再生開始時の基準 gain（Trigger 経由ならエントリの Gain × Kit の intensity）。Trigger の `GainMultiplier` も内部でこれを呼ぶ |
| `Stop()` | — | この再生だけを止める（同じデバイスで鳴っている他の CLIP は止めない） |
| `IsStopped` | `bool` | 停止済み、または最後まで再生し終えたら `true` |
| `IsActive` | `bool` | デバイスへの送信が始まっていれば `true`（接続先が見つかるまでは `false`） |
| `Status` | `HapbeatStreamPlaybackStatus` | `Deferred`（送信先待ち）/ `Active` / `Stopped` |

## HapbeatManager

`[Hapbeat Event Router]` 上にあるシングルトンで、デバイスとの通信を受け持ちます。`HapbeatManager.Instance` で取得します（シーンに無いときは `null`）。

### 鳴らす・止める

EventMap を通さずに直接送ります。EventMap の Gain・Target・Kit の intensity 補正・遅延補正は掛からないので、値はすべて引数で渡します。

| メソッド | 内容 |
|---|---|
| `Play(string eventId, float gain = 1, string displayName = null, string target = null, float pan = 0)` | FIRE（Command）。デバイスに deploy 済みの Kit から `eventId`（`<kit名>.<イベント名>`）を鳴らす。`target` は送信先（空 = 全デバイス。書式は [](/docs/sdk-integration/unity-sdk/targeting/)） |
| `Stop(string eventId, string displayName = null, string target = null)` | 指定した Event ID の再生を止める |
| `StopAll(string target = null)` | デバイス上の再生をすべて止める |
| `StreamAudioClip(AudioClip clip, float gain = 1, string target = null, bool loop = false)` | CLIP（Stream）。AudioClip を送って鳴らし、[`HapbeatStreamPlayback`](#hapbeatstreamplayback) を返す（未接続・clip が null なら `null`） |
| `StopStream()` | 送信中の CLIP をすべて止める |

### 接続状態

| メンバー | 内容 |
|---|---|
| `IsConnected` | 送信の準備ができていれば `true` |
| `IsAlive` / `AliveDeviceCount` | 応答しているデバイスがあるか / その台数 |
| `DiscoveredDevices` | 見つかったデバイスの一覧 |
| `Ping()` | デバイスへ疎通確認を送る。応答は `OnPong` で届く |
| `OnConnected` / `OnDisconnected` | 接続・切断時のイベント（`Action`） |
| `OnPong` | Ping の応答（`Action<long>`、往復時間 µs） |
| `OnError` | エラー（`Action<string>`） |

### 送信先の上書き

| メソッド | 内容 |
|---|---|
| `SetAddressOverride(int player, int group, bool persist = false)` | 以後のすべての送信の player / group を実行時に上書きする（−1 = その軸は上書きしない）。`persist: true` で次回起動時も保持。詳細は [](/docs/sdk-integration/unity-sdk/targeting/) |

## HapbeatEventMap / HapbeatEventEntry

EventMap（`.asset`）の中身をスクリプトから読むためのクラスです。通常は Trigger が読むので直接触る必要はありません。Trigger を使わずに `HapbeatManager` を呼びつつ EventMap の設定を活かしたいときに使います（実例: Showcase の [`ChargeShooter.cs`](https://github.com/hapbeat/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/ChargeShooter.cs)）。

| `HapbeatEventMap` のメソッド | 内容 |
|---|---|
| `FindByName(string displayName)` | EventMap ウィンドウの Name でエントリを探す |
| `FindByEventId(string eventId)` | Event ID（`<kit名>.<イベント名>`）でエントリを探す |
| `FindById(string id)` | エントリの GUID で探す |
| `entries` | 全エントリのリスト |

| `HapbeatEventEntry` のメンバー | 内容 |
|---|---|
| `mode` | `HapticMode.Command`（FIRE）/ `HapticMode.StreamClip`（CLIP） |
| `eventId` | Event ID（FIRE で送る文字列） |
| `streamClip` / `loop` | CLIP で送る AudioClip / ループするか |
| `GetEffectiveGain()` | エントリの Gain × Kit の intensity（実際に送る強さの基準値） |
| `target` / `HasTarget` | 送信先 / 送信先が指定されているか |

```csharp
// EventMap の設定を使って、Manager から直接 CLIP を鳴らす
var entry = _eventMap.FindByName("player_damage");
if (entry != null && entry.mode == HapticMode.StreamClip)
{
    HapbeatManager.Instance?.StreamAudioClip(
        entry.streamClip,
        entry.GetEffectiveGain(),
        entry.HasTarget ? entry.target : null,
        entry.loop);
}
```
