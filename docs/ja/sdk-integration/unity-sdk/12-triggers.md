---
title: Trigger コンポーネント
kind: reference
sidebar:
  order: 300
description: Animator / Collision / Sequence など、Event 発火用 Trigger コンポーネントの種類と使い分け。
---

Hapbeat SDK は多様な Trigger コンポーネントを用意しており、コードを書かずに触覚を組み込めます。

## 一覧

| コンポーネント | 発火タイミング | 主な用途 | 参考 Showcase Zone |
|---------------|--------------|---------|---|
| **HapbeatUnityEventTrigger** | UnityEvent から `Fire()` を呼ぶ | UI Button / XR Interactable / Animation Event 等 | Z4 Stream / Z5 Target（TargetReceiver の OnHitLight / OnHitHeavy） |
| **HapbeatStateBehaviour** | Animator state Enter / Exit | キャラクターアクション、UI アニメーション、ドア開閉等 | Z2 Door |
| **HapbeatCollisionTrigger** | OnCollision / OnTrigger | 衝突、当たり判定、銃弾命中 | Z1 Bowling |
| **HapbeatSequenceTrigger** | grab / hold / release の 3 段階 | XR Interaction（つかむ・持つ・離す） | Z3 Fishing |
| **HapbeatTickEmitter** | 連続値の変化量に応じてスナップ発火 | Slider / ScrollRect 等のスクロール触覚 | Z4 Stream Console |

## HapbeatUnityEventTrigger

UnityEvent（Button.OnClick / XRI Activate / Animation Event 等）の `Fire()` メソッドを紐付けて発火します。コードなしで任意の UnityEvent から触覚を呼べます。

設定:
- **Event Map**: EventMap.asset を参照
- **Event**: EventMap 内のエントリをドロップダウンで選択

UnityEvent から呼べる公開メソッド:
- `Fire()` — エントリを発火
- `FireWithGain(float)` — gain を指定して発火（Animation Event の float 引数向け）
- `Stop()` — 再生中のエントリを停止

```
On Activated:
  [Hapbeat Event Router] → HapbeatUnityEventTrigger.Fire()
```

スクリプトから呼ぶ方法は [](/docs/sdk-integration/unity-sdk/scripting/) と [](/docs/sdk-integration/unity-sdk/script-api/) を参照。

## HapbeatStateBehaviour

`AnimatorController` の **state に直接 attach** する `StateMachineBehaviour` 派生。state Enter / Exit の瞬間に Animator runtime から直接呼ばれるため、scene 側 MonoBehaviour で Animator パラメータを poll する方式より遅延も発火条件も明快です。

> 通常の Trigger と違い、Add Component メニューには出ません。**Animator window で対象 state を選択 → Inspector → Add Behaviour → Hapbeat State Behaviour** で追加します。

設定:
- **Event Map**: EventMap.asset
- **On State Enter → Entry** / **On State Exit → Entry**: state 遷移ごとに別エントリを発火可能（片方だけでも OK）
- **Transition Filter → Required Previous State**: 非空時は「指定 state からの遷移時のみ Enter 発火」（例: `Closed → LockedRattle` だけ鳴らす、など）
- **Gain → Gain Multiplier**: entry gain × manifest intensity への追加倍率

実装上の特徴:
- looping StreamClip を Enter で発火した場合、Exit で **自動的に Stop** されるので「state に紐付く擦り音」がクリーンに切れます
- 参照フィールド (EventMap 等) は AnimatorController asset 上に保存される（ScriptableObject 同士の参照なので scene 依存なし）
- Showcase **Z2 Door**: `Open` / `Closed` state に各 1 個ずつ attach して `Z2_door_open` / `Z2_door_close` を発火

## HapbeatCollisionTrigger

Collision / Trigger イベントで発火。**速度連動 (Gain Mode: VelocityScaled)** が可能。

設定:
- **Physics Mode**: Auto（既定。この GameObject の Collider から 2D / 3D を自動判定）/ Force2D / Force3D
- **Trigger Event**: 反応する物理イベント（CollisionEnter / CollisionExit / TriggerEnter / TriggerExit）
- **Tag Filter**: 反応するオブジェクトの Tag（空 = 全対象）
- **Layer Mask**: レイヤーフィルタ
- **Gain Mode**: Fixed（固定）/ VelocityScaled（速度連動）
- **Velocity Threshold**: これ未満の速度では発火しない（VelocityScaled のみ）
- **Velocity Curve**: 正規化した速度（速度 / Max Velocity）→ gain 倍率の曲線（VelocityScaled のみ）
- **Max Velocity**: curve の最大値に達する速度（VelocityScaled のみ）
- **Cooldown**: 連続発火防止（秒）

> 強い衝撃ほど強い触覚、というマッピングが組めます。

## HapbeatSequenceTrigger

XR Interaction Toolkit や独自の grab system と組み合わせ、**3 段階の Event を 1 コンポーネントで管理**します。

設定（Sequence Entries）:
- **On Start**: `Fire()` で鳴らす one-shot（つかんだ瞬間など。不要なら `(none)`）
- **Loop (hold)**: `Fire()` から `Stop()` までの継続 Event（loop の CLIP 推奨）
- **On Stop**: `Stop()` で鳴らす one-shot（離した瞬間など。不要なら `(none)`）

タイミング / ガード:
- **Start Shot Delay**: On Start から Loop 開始までの遅延（秒）。既定 `-1` = On Start clip の長さだけ待つ / `0` = 待たない
- **Stop Shot Delay**: Loop 停止から On Stop までの遅延（秒）。既定 `0.05`
- **Guard Reentry**: すでに同じ状態のときの重複 `Fire()` / `Stop()` を無視（既定 ON。XRI のソケット装着で selectEntered が 2 回来るケース向け）
- **Post Stop Fire Cooldown**: `Stop()` 後この秒数の `Fire()` を無視（既定 0 = 無効）

XR Helpers サンプル (`Samples~/XriHelpers/`) を Import すれば XRGrabInteractable / XRSocketInteractor との接続が自動でセットアップできます（プロジェクト側で XRI を導入していなくても scaffold 自体は壊れません）。

## HapbeatTickEmitter

Slider / ScrollRect などの連続値の変化量に応じて、スナップアルゴリズムでトリガーします。

- Cooldown 不要（アルゴリズムが連続発火を自制）
- **Tick Mode**: `AbsolutePosition`（既定。0, threshold, 2×threshold… の固定目盛りをまたぐたびに発火）/ `AccumulatedMotion`（前回発火位置から threshold 動くたびに発火）
- **Tick Threshold**: 目盛り間隔（入力値の単位、既定 0.1）。0 = 値が変わるたびに発火
- **Axis**: Vector2 入力のどの成分を見るか（X / Y / Magnitude、float 入力では無視）
- **Emit On Initial Value**: 最初に受け取った値で 1 回発火するか（既定 OFF）

## ParameterBinding と組み合わせる

`HapbeatParameterBinding` を併用すると、Transform / Rigidbody の値を StreamClip の gain / pan に毎フレームマッピングできます。

例: 距離が近いほど触覚を強くする、移動速度が上がるほど振動が強まる。

詳細は [](/docs/sdk-integration/unity-sdk/parameter-binding/)

## デバッグ

メニューバー → `Hapbeat` → `Attach Event Logger to Selected` を実行すると、選択中 GameObject の UnityEvent 発火をコンソールにログ出力できます。XRI のイベント発火順序の可視化に有効です。

詳細ログを記録する場合: `Hapbeat → Logs → Start Recording`

## 次のステップ

- [](/docs/sdk-integration/unity-sdk/event-map/)
- [](/docs/sdk-integration/unity-sdk/streaming/) — StreamClip モードの停止遅延・途切れ耐性のトレードオフ
- [](/docs/sdk-integration/unity-sdk/showcase/overview/) — 各 Trigger の実例 (Z1 Collision / Z2 Animator / Z3 Sequence + Binding / Z4 TickEmitter / Z5 UnityEvent + スクリプト)
- [](/docs/sdk-integration/unity-sdk/scripting/)
