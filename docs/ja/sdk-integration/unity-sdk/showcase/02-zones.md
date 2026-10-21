---
title: Showcase のゾーン詳細
kind: reference
sidebar:
  label: Showcase ゾーン詳細
  order: 200
description: Showcase の各ゾーンの操作・配線（どの GameObject にどのコンポーネントが付いているか）・スクリプト・試せる改造と、FIRE モードでの再生、トラブルシューティング。
---

[Showcase サンプル](/docs/sdk-integration/unity-sdk/showcase/overview/) の各ゾーンについて、**操作**・**配線**（どの GameObject にどのコンポーネントが付いているか）・**試してみる**（Inspector を変えて違いを確かめる改造）をまとめています。Unity で `Showcase.unity` を開き、Inspector と見比べながら読むことを想定しています。

改造したサンプルを元に戻すには、Package Manager から Showcase を再 Import します。再 Import でサンプルフォルダは上書きされるので、残したい改造は別のフォルダにコピーしてから行ってください。

## Z1 Bowling Lane

**操作**: 左クリックでボールを発射、Space でピンを元に戻す。ピンに当たると、衝突の速さに応じた強さで再生される。

**配線**

- `Prefabs/BowlingPin.prefab` に `HapbeatCollisionTrigger`（6 本のピンはこの prefab のインスタンス）
  - **Event Map**: `ShowcaseEventMap`、**Event**: `Z1_pin_hit`
  - **Trigger Event**: `CollisionEnter`
  - **Gain Mode**: `VelocityScaled`（衝突の速さが **Max Velocity** に近いほど強い）
- `BallLauncher`（`Z1_Bowling`）は発射とリセットだけを行い、Hapbeat のコンポーネントには触れない

**試してみる**

- `HapbeatCollisionTrigger` の **Max Velocity** を下げる → 弱い衝突でも最大の強さで再生される
- **Gain Mode** を `Fixed` にする → 速さに関係なく同じ強さになる
- EventMap の `Z1_pin_hit` の Targeting を `*/pos_neck` にする → 首の位置のデバイスだけで再生される

## Z2 Swing Door

**操作**: F で開閉、G で叩きつけ、L で施錠 / 解錠。

**配線**

- `Z2_Door/Door` に `Animator` + `DoorController`。キーで Animator の Trigger を送る（F → `DoorAction`、G → `Slam`、L → `LockToggle`）
- `DoorAnimator.controller` の各 state に `HapbeatStateBehaviour`。state に入ったとき（**On State Enter**）にエントリを再生する

| state | Event | Required Previous State |
|---|---|---|
| `Open` | `Z2_door_open` | `Closed` |
| `Closed` | `Z2_door_close` | `Open` |
| `Slam` | `Z2_door_slam` | `Open` |
| `LockEngage` | `Z2_door_lock` | — |
| `LockRelease` | `Z2_door_unlock` | — |
| `LockedRattle` | `Z2_door_rattle` | — |

`DoorController` は Animator を動かすだけで、触覚のコードは持たない。

**試してみる**

- `Z2_door_open` / `Z2_door_close` の Clip を別の wav に替える → 音と触覚を別々に作れることを確かめる
- EventMap で `Z2_door_close` の Gain を下げる → 静かに閉まるドアの触覚になる
- state の `HapbeatStateBehaviour` の **Required Previous State** を空にする → どの state から来ても再生される

## Z3 Fishing Rod

**操作**: 左クリックを押している間、物体を釣り糸で吊る（離すと落ちる）。視点を動かして竿を振ると物体が揺れる。吊っている間はループ再生され、物体が速く動くほど強くなる。

**配線**

- `Z3_Fishing` に `HapbeatSequenceTrigger`
  - **On Start**: `Z3_hook_start`（吊った瞬間の一発）
  - **Loop (hold)**: `Z3_hook_loop`（CLIP、Loop）
  - **On Stop**: `Z3_hook_release`（離した瞬間の一発）
- `Z3_Fishing/FishingObject` に `HapbeatParameterBinding`（`Z3_hook_loop` エントリの Bindings で設定）
  - **Source Property**: `VelocityMagnitude`、**Output**: `StreamGain`

**スクリプト**: [`FishingController.cs`](https://github.com/hapbeat/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/FishingController.cs) は、左クリックの押下で `_sequence.Fire()`、解放で `_sequence.Stop()` を呼ぶ。触覚に関わるコードはこの 2 行で、強さの変化は Parameter Binding が受け持つ。

**試してみる**

- `Z3_hook_loop` の Bindings で **Source Property** を `LocalPositionY` にする → 物体を高く上げるほど強くなる
- 入力 / 出力の範囲や Curve を変える → 振り始めの立ち上がり方が変わる
- `Z3_hook_loop` の Clip を別のループ素材に替える（短い素材だとループの継ぎ目に注意）

## Z4 Stream Console

**操作**: Space でループ再生の開始 / 停止。Gain / Pan スライダーで再生中の強さと左右を変える（スライダーを動かすと刻みの触覚も再生される）。Z4 に切り替えるとカーソルのロックが外れ、スライダーをマウスで操作できる。

**配線**

- `Z4_Stream/StreamCanvas/StreamPanelHud` に `HapbeatUnityEventTrigger`（**Event**: `Z4_stream_loop`、CLIP、Loop）と `StreamDemoController`
- `GainSlider` / `PanSlider` にそれぞれ
  - `HapbeatParameterBinding`（**Source Property**: `SliderValue`、**Output**: `StreamGain` / `StreamPan`）
  - `HapbeatTickEmitter`（Tick Trigger、**Event**: `Z4_slider_tick`）
- `Z4_Stream/AddressOverridePanel` で、player / group の実行時の上書きを試せる（→ [](/docs/sdk-integration/unity-sdk/targeting/)）

**スクリプト**: [`StreamDemoController.cs`](https://github.com/hapbeat/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/StreamDemoController.cs) は、Space で Trigger の `ActivePlayback` を見て、再生中なら `Stop()`、停止中なら `Fire()` を呼ぶ。スライダーの値を Binding の代わりにスクリプトで `ActivePlayback.Gain` / `Pan` に書く方法も、コメントで残してある（どちらでも同じ動作）。

**試してみる**

- `HapbeatTickEmitter` の **Tick Threshold** を上げる → 刻みの数が減り、粗い手応えになる
- `Z4_stream_loop` の **Loop** を外す → 1 回だけの再生になる
- `Z4_stream_loop` の Targeting を `*/pos_r_arm` にする → 右腕の位置のデバイスだけで再生される
- スライダーの `HapbeatParameterBinding` を外し、`StreamDemoController.cs` のコメント部分を有効にする → 同じ動作をスクリプトで書いた形になる

## Z5 Charge & Shoot

**操作**: 左クリックを押してチャージし、離して発射する。チャージ中はループ再生が強くなっていき、しきい値を超えると 1 回再生される。発射時はチャージ量に応じて弱 / 強の 2 種類を再生し分ける。的に当たると別の触覚が再生される。

**配線**

- `Z5_ChargeShot` に `ChargeShooter`（Trigger コンポーネントを使わないスクリプト）
  - Inspector で `ShowcaseEventMap` と 4 つのエントリ（`Z5_charge_loop` / `Z5_charge_thd` / `Z5_shot_light` / `Z5_shot_heavy`）を選ぶ
- `Z5_ChargeShot/TargetBoard` に `TargetReceiver`、その子の `Event_Hit_Light` / `Event_Hit_Heavy` に `HapbeatUnityEventTrigger`（`Z5_tar_hit_light` / `Z5_tar_hit_heavy`）
  - `TargetReceiver` の UnityEvent `OnHitLight` / `OnHitHeavy` から、それぞれの Trigger の `Fire()` を呼ぶ（Inspector で配線）

**スクリプト**: [`ChargeShooter.cs`](https://github.com/hapbeat/hapbeat-unity-sdk/blob/master/Samples~/Showcase/Scripts/ChargeShooter.cs) は、`HapbeatManager` を直接呼ぶ上級例。

- チャージ開始: `HapbeatManager.StreamAudioClip(...)` で `Z5_charge_loop` を再生し、毎フレーム返り値のハンドルに `ApplyGainModulation(_gainCurve.Evaluate(chargeT))` を呼んで強さを変える
- 発射: ループを `Stop()` し、チャージ量で `Z5_shot_light` / `Z5_shot_heavy` を再生する
- 強さ・送信先・クリップは EventMap のエントリから読む（`entry.GetEffectiveGain()` / `entry.target` / `entry.streamClip`）ので、EventMap ウィンドウでの調整がそのまま効く

**試してみる**

- `ChargeShooter` の **Gain Curve** を上に膨らんだ曲線にする → チャージの序盤から強くなる
- **Shot Follows Charge T** を ON にする → 発射の強さもチャージ量に合わせて変わる
- `Z5_tar_hit_light` / `Z5_tar_hit_heavy` の Mode を `FIRE (Command)` にして Kit を deploy する → 命中の応答が速くなる（[下記](#fire-command-で再生する)）

## 共通のキー操作の配線

Q / P は、コードを書かずに UnityEvent で配線している。

- `[Hapbeat Event Router]` に次をまとめている
  - `HapbeatManager`
  - `HapbeatKeyDispatcher` — キーと UnityEvent の対応を Inspector で設定する
  - `HapbeatActionHelper` — `Ping()` などを UnityEvent から呼べるようにする
  - `HapbeatUnityEventTrigger`（**Event**: `Z5_tar_hit_light`）
- Q → `HapbeatUnityEventTrigger.Fire()`、P → `HapbeatActionHelper.Ping()` と `GlobalHotkeys.NotifyPingSent()`
- `GlobalHotkeys` は Ping の応答を受けて画面の表示を更新するだけ

## EventMap 全体で試す

- `Hapbeat → Open Event Map` で各エントリの Gain を変える → ゾーン全体の強さが変わる
- Targeting を `*/pos_neck` にする → 首の位置のデバイスだけで受ける
- Mode を `CLIP (Stream Clip)` から `FIRE (Command)` にする（次節）

## FIRE (Command) で再生する

Showcase のエントリは、Kit を deploy しなくても動くよう、すべて CLIP（Stream）にしてあります。Kit をデバイスに deploy すると、FIRE（Command）でも再生できます。

FIRE にすると:

- 送るのは Event ID だけなので、応答が速い
- デバイスに保存した clip を再生するので、アプリに WAV を持たせなくてよい
- Studio で Kit を更新して deploy し直せば、Unity 側をビルドし直さずに触覚を差し替えられる

手順:

1. Showcase に同梱の `Kit/showcase-kit/`（manifest と、FIRE 用の `install-clips/`・CLIP 用の `stream-clips/`）を、Hapbeat Studio の Kit タブで開き、デバイスへ **Deploy** する（手順は [](/docs/sdk-integration/unity-sdk/getting-started/) の「Studio で Kit をデプロイ」と同じ）
2. EventMap で試したいエントリの Mode を `FIRE (Command)` にする（例: `Z1_pin_hit` → Event ID `showcase-kit.z1_pin_hit`）。Clip の欄はそのままでよい（FIRE では使わない）
3. Play で確かめる

すべてを FIRE にする必要はありません。衝撃のように速い応答が効くもの（`Z1_pin_hit`、`Z2_door_slam`、`Z5_tar_hit_*`、`Z5_shot_*` など）を FIRE、ループ（`Z3_hook_loop`、`Z4_stream_loop`、`Z5_charge_loop`）は再生中に強さを変えられる CLIP のまま、という使い分けが実用的です。

## WASD と UI ナビゲーションの衝突

Unity の `InputSystemUIInputModule` の既定の `UI/Navigate` には WASD が割り当てられています。スライダーが選択された状態で WASD を押すと、移動と同時にスライダーの値も変わります。

Showcase では次の 2 つで回避しています。

1. `SimpleFPSController` はカーソルをロックしている間だけ移動する（Z4 ではカーソルのロックが外れるので WASD で移動しない）
2. 各スライダーに `UiDeselectOnPointerUp` を付け、ドラッグを離した時点で選択を解除する

自分のプロジェクトでは、UI 側から WASD を外すのが確実です。

1. `Packages/Input System/.../DefaultInputActions.inputactions` を `Assets/` 配下にコピーする
2. コピーを Input Actions Editor で開き、**UI / Navigate / 2D Vector Composite** から `<Keyboard>/w` `<Keyboard>/a` `<Keyboard>/s` `<Keyboard>/d` を削除する（矢印キーは残す）
3. シーンの **EventSystem → Input System UI Input Module → Actions Asset** をコピーに差し替える

## トラブルシューティング

| 症状 | 原因 / 対処 |
|---|---|
| 何も再生されない | Hapbeat デバイスがオフライン。Studio / Helper で接続を確認する |
| 接続済みなのに再生されない | `[Hapbeat Event Router]` に `HapbeatManager` が無い、または Trigger の Event Map が未選択 |
| `entry id '...' not found` の警告 | Trigger が参照しているエントリが EventMap から削除された。Inspector の Event ドロップダウンで選び直す |
| Z3 のループが再生されない | `Z3_hook_loop` の Clip が未割当、または Loop が OFF |
| 刻み（tick）が多すぎる | `HapbeatTickEmitter` の Tick Threshold が小さすぎる。値を上げる |
| スライダーを触った後、WASD で値が動く | [上記](#wasd-と-ui-ナビゲーションの衝突) を参照 |
