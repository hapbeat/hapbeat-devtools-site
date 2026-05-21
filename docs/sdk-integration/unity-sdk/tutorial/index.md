---
title: Tutorial Sample
kind: tutorial
sidebar:
  label: Tutorial Sample
  order: 100
description: キーマウスだけで Hapbeat Unity SDK の触覚イベント登録パターンを一通り体験する 1 シーン構成のチュートリアル。
---

このチュートリアルは「Hapbeat デバイスは買ったけど Unity でどう繋ぐか分からない」という人向けに、SDK が提供する**触覚イベント登録パターンを一通り体験**できるサンプルです。

XR デバイス不要・キーマウスだけで完結します (XRI HandDemo 連携は [別サンプル](/docs/sdk-integration/unity-sdk/xri-handdemo-quickstart/) を参照)。

> **設計方針**: Hapbeat SDK の王道は「**Trigger 系コンポーネントを Inspector で wire**」する宣言的スタイル。Tutorial も `HapbeatBridge` 派生クラスを置かず、各 Zone で直接 Trigger を使う構成にしています。Script は **Trigger の `Fire() / Stop()` を呼ぶか、`GainMultiplier` を書くだけ** に留まり、触覚計算は SDK 側に任せます。

## 構成

5 ゾーンを 1 シーンに収め、**1〜5 キーでゾーン切替** (`ZoneSwitcher` が現在ゾーン以外を `SetActive(false)`)。各ゾーンは SDK の異なる haptic 登録パターンを 1 つだけ担当します。

| Zone | 教示パターン | Trigger 系コンポーネント | Script (haptic 関与) |
|---|---|---|---|
| **Z1 Bowling Lane** | Collision Trigger (velocity-scaled) | `HapbeatCollisionTrigger` × pins | なし (`BallLauncher` は物理のみ) |
| **Z2 Swing Door** | Animator Trigger (bool edge) | `HapbeatAnimatorTrigger` × 2 (Open / Close) | なし (`DoorController` はアニメ駆動のみ) |
| **Z3 Fishing Rod** | Sequence Trigger + Parameter Binding | `HapbeatSequenceTrigger` (Fire/Loop/Stop) + `HapbeatParameterBinding` (motion → StreamGain) | `FishingController` (Fire/Stop 呼出のみ) |
| **Z4 Stream Console** | UnityEvent Trigger (loop) + Tick Emitter | `HapbeatUnityEventTrigger` (StreamClip loop) + `HapbeatTickEmitter` × 2 | `StreamDemoController` (Fire/Stop + Slider→`ActivePlayback.Gain` の 3 行) |
| **Z5 Charge & Shoot** | UnityEvent Trigger + curve-driven GainMultiplier | `HapbeatUnityEventTrigger` (charge_release) + `HapbeatUnityEventTrigger` (target_hit) | `ChargeShooter` (curve 評価 → `GainMultiplier` → `Fire()`) |
| **Global hotkeys** | Key Dispatcher + Action Helper + UnityEvent Trigger | `HapbeatKeyDispatcher` + `HapbeatActionHelper` + `HapbeatUnityEventTrigger` (manual_fire) | `GlobalHotkeys` (Pong 表示のみ) |

### グローバル操作

| キー | 役割 |
|---|---|
| `WASD` / Mouse | プレイヤー移動 / 視点 |
| `Tab` | カーソル lock / unlock (UI 操作時に解放) |
| `1`〜`5` | ゾーン切替 |
| `Q` | `manual_fire` イベント発火 (`KeyDispatcher → Trigger.Fire`) |
| `P` | Ping (`KeyDispatcher → ActionHelper.Ping`)、HUD に RTT 表示 |

## どの Zone でどのパターンを学ぶか

### Z1 Bowling — Collision Trigger (velocity-scaled)

ボールをピンにぶつけて倒すと、各ピンの `HapbeatCollisionTrigger` が collision velocity に応じた gain で発火します。SDK が **velocity scaling を内部処理**するため、ユーザー側のコードは 0 行。

「物体衝突に触覚を付ける最短コース」がこのパターン。

### Z2 Door — Animator Trigger (bool edge)

F キーで Animator の `IsOpen` bool をトグル → 2 個の `HapbeatAnimatorTrigger` がそれぞれ `BoolBecameTrue` / `BoolBecameFalse` を監視して door_open / door_close を発火。

「アニメ状態遷移と触覚を同期させる」パターン。

### Z3 Fishing — Sequence Trigger + Parameter Binding

LMB hold で床の物体が釣り糸に attach。Hold 中は `HapbeatSequenceTrigger` の loop が走り、同時に `HapbeatParameterBinding` が物体の `PositionDeltaMagnitude` を読んで stream gain にリアルタイム反映します。**振り回すほど振動が強くなる** = 持っている物の慣性体感。

walkthrough 内で `HapbeatParameterBinding` の Source Property を `LocalPositionY` に変更すれば、**高さ基準で gain が変化** する挙動も体験可能。

### Z4 Stream — UnityEvent Trigger (loop) + Tick Emitter

Space で `HapbeatUnityEventTrigger` (StreamClip mode, loop=true) を `Fire() / Stop()`。HUD の Gain / Pan slider を動かすと:

- `HapbeatTickEmitter` が **段階フィードバック**を返す (slider step ごと 1 tick)
- 3 行 script が `trigger.ActivePlayback.Gain = slider.value` で **再生中の gain/pan をリアルタイム変調**

「ambient loop + UI 操作」の典型 (ゲーム設定画面の触覚強度スライダー等)。

### Z5 Charge & Shoot — UnityEvent Trigger + GainMultiplier

LMB hold でチャージ、release で発射。`ChargeShooter` は `_trigger.GainMultiplier = curve.Evaluate(chargeT)` で trigger の gain を書き込んでから `Fire()` を呼ぶだけ。命中時は `TargetReceiver` から別の `HapbeatUnityEventTrigger.Fire()` で hit haptic。

「script で計算した値を Trigger に渡して発火」する最小パターン。

### Global hotkeys — Key Dispatcher + Action Helper

Q / P キーは `HapbeatKeyDispatcher` の `Bindings` リストで UnityEvent として宣言的に wire:

- Q → `HapbeatUnityEventTrigger.Fire()` (entry: manual_fire)
- P → `HapbeatActionHelper.Ping()`

`GlobalHotkeys` script は **Pong 受信時に HUD テキストを更新するだけ**。キー処理は SDK 任せ。

## script は最小限・Trigger は Inspector で

このサンプルでは **`HapbeatBridge` 派生クラス・`Bridge.Play(string)` 呼び出し・runtime target 上書き** はいずれも使いません。HapbeatBridge 派生は「string lookup ベースの script 駆動」が必要な場面 (≒ runtime 生成 AudioClip など) で使う escape hatch であり、通常の game では Trigger 系コンポーネントで十分です。

| script に書くこと | SDK 側に任せること |
|---|---|
| Player input → `Trigger.Fire() / Stop()` | EventMap entry の resolve |
| script float → `Trigger.GainMultiplier` (e.g. charge curve) | velocity scaling (CollisionTrigger 内蔵) |
| Slider value → `playback.Gain / Pan` (3 行) | Animator bool edge 監視 |
| GameObject / Animator の物理駆動 | StreamClip 再生 / 停止 |

## 始め方

1. Unity Editor で **Window → Package Manager → Hapbeat SDK → Samples → Tutorial → Import**
2. `Assets/Samples/Hapbeat SDK/<version>/Tutorial/` 配下のシーンを開く
3. (任意) `Assets/HapbeatSDK/SDK_Samples/Tutorial/` に scenes を **コピーして編集** すると再 import 上書きを避けられる
4. Hapbeat Studio または Helper でデバイスをオンラインにして Play
5. 1〜5 でゾーンを切り替えながら各パターンを体験

> 自動生成 builder は v3 設計移行中のため一時的に外しています。手動 wiring の手順は walkthrough を参照。

## WASD と UI nav の衝突 (Tutorial の対処)

Unity の **`InputSystemUIInputModule`** のデフォルト `UI/Navigate` action には **WASD がバインド**されています。Slider にフォーカスがある状態で WASD を押すと、Player 移動と同時に Slider 値も変化してしまう (UI nav として動く)。

Tutorial では Zone 4 で stream gain slider を触る局面があるため、以下の二重対策を入れています:

1. **`SimpleFPSController.HandleMove` は cursor lock 中のみ動作** — Z4 は `unlockCursorOnEnter=true` で cursor unlock 中なので player は WASD で動かない
2. **`UiDeselectOnPointerUp` script を各 Slider に attach** — マウスドラッグ離した時点で EventSystem の selection を解除 → 以降 WASD は Slider に届かない

### Production project では根本治療推奨

zero-config を優先する Tutorial では上記対症療法を採用していますが、**実プロジェクトでは UI Input Module 側で WASD を外す**のが筋:

1. `Packages/Input System/.../DefaultInputActions.inputactions` を `Assets/` 配下にコピー
2. コピーを Input Actions Editor で開く → **UI / Navigate / 2D Vector Composite** から `<Keyboard>/w` `<Keyboard>/a` `<Keyboard>/s` `<Keyboard>/d` の 4 binding を削除 (Arrow キーは残す)
3. シーンの **EventSystem → Input System UI Input Module → Actions Asset** に作ったコピーを差し替え

これで `UiDeselectOnPointerUp` が不要になり、project 全体の UI element (Slider / Dropdown 等) で WASD が干渉しなくなる。

## 関連ドキュメント

- [Triggers](/docs/sdk-integration/unity-sdk/triggers/) — 各 Trigger の詳細仕様
- [Event Map](/docs/sdk-integration/unity-sdk/event-map/) — EventMap window の使い方
- [Parameter Binding](/docs/sdk-integration/unity-sdk/parameter-binding/) — Z3 Fishing で使う Binding
- [Streaming](/docs/sdk-integration/unity-sdk/streaming/) — StreamClip / Stream Playback
- [Fire vs Clip](/docs/sdk-integration/unity-sdk/fire-vs-clip/) — Command / StreamClip モードの違い
