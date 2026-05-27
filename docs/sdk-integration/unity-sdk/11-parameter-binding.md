---
title: Parameter Binding
kind: reference
sidebar:
  order: 300
description: HapbeatParameterBinding でゲーム状態 (移動量・速度・距離) を StreamGain / StreamPan に動的にマッピングする方法。
---

`HapbeatParameterBinding` は、StreamClip 再生中の **gain** や **pan** をゲーム状態 (Transform の位置、Rigidbody の速度、Animator のパラメータなど) に応じて毎フレーム書き換えるコンポーネントです。

「掴んだ箱を動かしている間だけ手応えが強くなる」「歩く速度に応じて足元の振動が強まる」といった連続的な触覚表現を、コードを書かずに実現できます。

## どこで動いているか

ParameterBinding は `HapbeatTriggerBase` の **ActivePlayback** (StreamClip 再生中の `HapbeatStreamPlayback` ハンドル) に対して書き込みます。仕組みは:

```
[Trigger.Fire]
    → Manager.StreamAudioClip(clip) → StreamPlayback handle 取得
    → Trigger が ActivePlayback として保持
[ParameterBinding.Update] (毎フレーム)
    → source value (Transform.position 等) を読む
    → input range で 0..1 に正規化
    → curve で形を整える
    → output range にマップ
    → ActivePlayback.Gain / ActivePlayback.Pan に書く
```

つまり ParameterBinding は **Stream 中のサンプルを動的に乗算する** ものです。Command mode (eventId 送信) には作用しません — Command は単発で完結するため modulate する余地がありません。

## 設定項目

| フィールド | 役割 |
|---|---|
| Source Transform Path | source として読む Transform。空 = この GameObject 自身 |
| Source Property | `LocalPositionX` / `LocalPositionY` / `VelocityMagnitude` / `AngularVelocityMagnitude` / `PositionDeltaMagnitude` / `LocalRotationY` / `SliderValue` (UI Slider 連動) / `External` (スクリプト `binding.SetValue()` で外部入力) 等から選択 |
| Input Min / Max | source 値をどの範囲で 0..1 に正規化するか |
| Curve Type | `Linear` / `EaseIn` / `EaseOut` / `EaseInOut` / `Custom` |
| Output Parameter | `StreamGain` (0..2) または `StreamPan` (-1..+1) |
| Output Min / Max | 出力範囲 |
| Debug Log | true で Console に input/output を周期出力 (動作確認に便利) |

## Showcase Z3 での実例

[](/docs/sdk-integration/unity-sdk/showcase/overview/) の Fishing Rod (Z3) は、釣り糸に attach した物体を振り回している間、loop の gain を **物体の移動速度** に追従させます。

設定 (`Z3_Fishing` root の `HapbeatParameterBinding`):

| 項目 | 値 |
|---|---|
| Source Transform Path | `FishingObject` (root からの相対) |
| Source Property | `PositionDeltaMagnitude` |
| Input Min / Max | 0 / 0.5 |
| Curve Type | `EaseInOut` |
| Output Parameter | `StreamGain` |
| Output Min / Max | 0.2 / 1.5 |

挙動:
- `FishingObject` を **静止** させていると `PositionDeltaMagnitude = 0` → 正規化 0 → curve 0 → output 0.2 (静かな loop)
- **激しく振り回す** と `PositionDeltaMagnitude > 0.5` → 正規化 1 → output 1.5 (強い loop)

`FishingController` (script) はマウス入力に応じて `Sequence.Fire() / Stop()` を呼ぶだけ。binding は EventMap entry (`grab_loop`) に preset として登録されているので、BatchSetup や Apply Binding ボタン経由で自動的に `Z3_Fishing` に `HapbeatParameterBinding` が貼られます。

## EventMap preset と standalone の違い

ParameterBinding には 2 つの設定モードがあります:

1. **Linked preset** (EventMap 管理): EventMap entry の `bindings[]` に preset を登録 → BatchSetup で対象 GameObject に component が自動生成 + preset id で link。preset を編集すると runtime に反映される (live tuning 可能)
2. **Standalone**: GameObject に直接コンポーネント追加して全フィールドをローカル設定。preset との link なし

| | Linked preset | Standalone |
|---|---|---|
| 設定箇所 | EventMap window の Binding section | scene の GameObject に AddComponent |
| 保存先 | ScriptableObject (asset) | scene |
| source 参照方法 | 文字列パス (Trigger からの相対) | 直接 component ref (Transform/Slider) |
| Hierarchy 制約 | **あり** (Trigger の子孫のみ) | **なし** (scene 内自由) |
| prefab portability | ◎ (prefab 内で完結) | △ (scene 直 ref は prefab override が要) |
| 複数 Trigger 共有 | ✓ 同 entry を引く Trigger 全てに自動 attach | ✗ 1 binding = 1 Trigger |

### Linked preset の Hierarchy 制約について

EventMap preset は ScriptableObject (asset) なので Unity の原則で **scene GameObject への direct ref を保存できません**。代わりに **trigger GameObject からの相対パス文字列** で source を表します:

```
Trigger GO
├─ ChildA   ← path = "ChildA" で reachable
│   └─ Grandchild  ← path = "ChildA/Grandchild"
└─ ChildB   ← path = "ChildB"
```

Trigger の **子孫しか source に出来ない** ため、設計上の注意:

#### 推奨パターン: 触覚関連を root に集約

```
Zone_Root (← ★ Trigger をここに attach)
├─ Visual / Mesh
├─ Physics / Rigidbody
└─ SourceObject (← binding source path "SourceObject" で reachable)
```

Zone の root に Trigger を置けば、配下の全 GO を binding source として preset で参照できる (Hierarchy 制約に当たらない)。これが **EventMap 管理を最大化するパターン**。

→ Showcase Z3 (`Z3_Fishing` root に SequenceTrigger 配置 + 子の `FishingObject` を source) はこの形。

#### この制約が嫌なら: script 駆動 (Z5 Charge 参照)

binding source を **Trigger の子孫にできない** ケース (例: UI canvas 上の Slider が Blaster Trigger の子孫でない、別 hierarchy の管理オブジェクトを参照したい、など) は、**EventMap preset は使わず script から直接 modulate** する方式に切替えます:

```csharp
// Z5 ChargeShooter 抜粋
private void Update() {
    if (_charging) {
        float t = ...;
        _sequenceTrigger.GainMultiplier = _gainCurve.Evaluate(t);
        // ↑ setter が ApplyGainModulation を呼ぶ → playback.Gain modulate
    }
}
```

- ParameterBinding を attach しない / 使わない
- `Trigger.GainMultiplier = v` を毎フレーム書く (内部で `playback.ApplyGainModulation(v)` が走り、ParameterBinding と同じ entry point で gain が書き換わる)
- ゲーム状態の取得が複雑な場合 (時間累積 / 閾値検知 / 複数 state 合成等) も script なら自由

→ Showcase Z5 ChargeShooter (`Samples~/Showcase/Scripts/ChargeShooter.cs`) がこの実装の参考例。Blaster の Trigger と chargeBar Slider (UI canvas 配下) が別 hierarchy なため、preset 経由は不可 → script 駆動を採用。

### どちらを選ぶか — 早見表

| 状況 | 推奨 |
|---|---|
| Trigger と source が同じ prefab / 同じ root 配下に置ける | **Linked preset** (EventMap 管理) |
| source が UI canvas / 別 hierarchy など Trigger 子孫に置けない | **script 駆動** (Z5 参照) or **Standalone PB + 直接 ref** |
| 複数の Trigger で同じ binding を共有したい | **Linked preset** (auto-attach 機能) |
| Game state を組み合わせて modulator を計算したい (閾値、複数値合成等) | **script 駆動** |

Showcase では **Z3 が Linked preset の典型例、Z5 が script 駆動の典型例**。両方の参照先として読み比べると使い分けの感覚がつかみやすい。

## スクリプトから動かしたい場合 (imperative pattern)

ParameterBinding を使わず、スクリプトで直接 `HapbeatTriggerBase.GainMultiplier` (または `ActivePlayback.Gain`) を書き換えることもできます。

Showcase の対応例:
- **Z4 Stream Console**: ParameterBinding (Slider → StreamGain / StreamPan) — declarative。EventMap window で wiring 完結
- **Z5 Charge Shooter**: script から `_sequenceTrigger.GainMultiplier = curve(chargeT)` を毎フレーム書込み — imperative。custom 計算ロジック (`AnimationCurve` 評価) や mid-flow ロジック (閾値超え検知) と相性が良い

判断基準:
- ゲーム状態の取得が単純 (Transform / Rigidbody / Slider) → ParameterBinding
- 複数の game state を組み合わせる / curve や閾値ロジックを script で書きたい → スクリプト

### Gain の連続変化を滑らかにする仕組み

どちらの方式でも、SDK 側の mixer thread が **per-sample で gain を線形補間** するので、急な slider 操作でも 16ms (= 1 chunk) 単位の階段状にならず連続変化として device に届きます。これがないと chunk 境界で gain が急にジャンプし、ADPCM 予測器が乱れて warble / 暴れに繋がります。

つまり: ParameterBinding でも script からの GainMultiplier 書込みでも、**device 側の体感はほぼ同じ滑らかさ**。選択基準は Inspector wiring 派か script 派か、で決めて良い。

## 参考

- [](/docs/sdk-integration/unity-sdk/showcase/wiring/#z3-fishing-rod) — Z3 の wire 詳細
- [](/docs/sdk-integration/unity-sdk/showcase/method-choice/) — コンポーネント vs スクリプトの使い分け
- [](/docs/sdk-integration/unity-sdk/triggers/) — `HapbeatSequenceTrigger` の詳細
