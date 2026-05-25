---
title: プロジェクトに組み込む
kind: tutorial
description: 既存 Unity シーンに Hapbeat SDK を追加する手順。EventMap + Trigger パターンの基本。
sidebar:
  order: 2
---

[Basic Example で動作を確認](/docs/sdk-integration/unity-sdk/getting-started/) の完了により、自分のプロジェクトに組み込む準備ができています。

## Showcase サンプル

SDK の触覚フィードバック適用パターンを一覧できる **Showcase サンプル** をご覧ください。
> Package Manager の Samples タブから **Showcase** を Import → `Showcase.unity` を開いて Play。詳細は [Showcase Sample](/docs/sdk-integration/unity-sdk/showcase/) を参照。

---

以下は既存シーンへの手動組み込み手順です。**初回は「Initial Scene Setup」一発で全部揃います**。EventMap だけ追加したい等、個別操作が必要な場合のために単独コマンドも残しています。

## 1. 初回セットアップ (推奨)

メニューバー → **`Hapbeat → Initial Scene Setup`** を実行します。これだけで次が揃います:

- `Assets/HapbeatSDK/` フォルダレイアウト (Kits / EventMaps / Scenes)
- `[Hapbeat Event Router]` GameObject (内部に `HapbeatManager` singleton)
- `Assets/HapbeatSDK/EventMaps/<scene-name>-EventMap.asset`
- Event Map ウィンドウのオープン（新規 asset が選択された状態で）

再実行は idempotent (既存 Router / EventMap を再利用) なので、セットアップ済みシーンで再度叩いても安全です。

### 個別コマンド (advanced)

「Router だけ追加」「EventMap だけ追加」がしたい場合は次を使います:

| メニュー | 効果 |
|---|---|
| **`Hapbeat → Create Event Router`** | `[Hapbeat Event Router]` だけを追加。EventMap は作らない |
| **`Hapbeat → Create Event Map`** | `Assets/HapbeatSDK/EventMaps/...asset` だけを作成。Router には触らない |
| **`Hapbeat → Event Map`** | Event Map ウィンドウを開く（既存 asset の編集入口） |

## 2. EventMap でエントリを設定する

`Hapbeat → Event Map` ウィンドウを開き、**+ Add Event** からエントリを追加します（ウィンドウを開くだけでは asset は作られません — Step 1 で作成済みの前提）。

主な設定項目（**頻繁に触る項目のみ抜粋**。loop / bindings / delayOffsetSeconds / notes / manifestOverride を含む全項目の詳細は [EventMap ウィンドウ](/docs/sdk-integration/unity-sdk/event-map/) を参照）:

| フィールド | 内容 |
|---|---|
| Mode | `StreamClip`（Unity の AudioClip を PCM 送信）/ `Command`（デバイス内蔵 Kit を ID で再生） |
| Display Name | エディタ表示用の人間可読ラベル |
| Category + Event Name | wire 上の Event ID は `<category>.<eventName>` 形式に合成される |
| Stream Clip | StreamClip モードで送信する `AudioClip` |
| Gain | 振動強度（0.0〜2.0、Kit manifest の intensity と乗算される） |
| Target | 送信先（空 = 全デバイス、`player_1` / `*/pos_neck` / `player_1/pos_chest` など） |

---

## Trigger コンポーネントで発火させる（推奨）

発火タイミングに合った Trigger コンポーネントを GameObject にアタッチします。Showcase サンプルに各 Trigger の実装例があるので（Z1〜Z5）、対応する Zone を参考にすると最短で組み込めます。

| Trigger | 用途 | 参考 Showcase Zone |
|---|---|---|
| **HapbeatCollisionTrigger** | 物理衝突 / Trigger Enter / Exit。VelocityScaled で衝撃連動可 | **Z1 Bowling** (Pin × 6 を BatchSetup で一括) |
| **HapbeatStateBehaviour** | Animator state Enter/Exit で発火（state に直接 attach、Component 扱いではない） | **Z2 Door** (Open / Closed state に attach) |
| **HapbeatSequenceTrigger** | Grab / Hold / Release を 1 コンポーネントで管理 | **Z3 Fishing** (Sequence + ParameterBinding) |
| **HapbeatTickEmitter** | 連続値（Slider 等）の変化量に応じてスナップ発火 | **Z4 Stream Console** (Slider に BatchSetup) |
| **HapbeatUnityEventTrigger** | 任意の UnityEvent から `Fire()` を呼ぶ。Button / XR Interactable / Animation Event 等 | **Z5 Charge** (TargetReceiver.OnHit → Fire) |

各コンポーネントの Inspector で **Event Map** に先ほどの `.asset` を設定し、**Event** ドロップダウンでエントリを選択します。

各 Trigger 詳細: [Trigger コンポーネント](/docs/sdk-integration/unity-sdk/triggers/)

## コードから発火する場合（補足）

Trigger コンポーネントを介さず、`HapbeatManager` を直接叩いて発火することもできます。

```csharp
using Hapbeat;

void OnEnemyHit() {
    HapbeatManager.Instance?.Play("my-kit.enemy_hit");
}
```

ただし、**この経路は通常は推奨されません**。Trigger 経由なら EventMap で一元管理でき、デザイナーが Inspector で値を調整できるためです。

**Manager.Play を直接使うのが向いているケース**は限られます:

- Event ID を runtime に動的構築する必要がある（例: `Play($"weapon.{weaponName}_fire")`）
- EventMap で 1 つずつ管理すると膨大な量になり、script から生成するほうが現実的なとき

詳細とトレードオフ: [イベント呼び出しを集約する / 分散する](/docs/sdk-integration/unity-sdk/centralized-vs-distributed/)

## Command モード（FIRE）を使う場合

EventMap entry を **Command モード** にすると、デバイスに事前 deploy した Kit を低遅延で再生できます（StreamClip は SDK が PCM を送信、Command は短い ID 送信だけでデバイス側内蔵 clip を再生）。

Command モードを使うには Hapbeat Studio でデバイスへ Kit を deploy する必要があります。Fire と Clip の選び方・deploy 手順は [Fire と Clip を実装する](/docs/sdk-integration/unity-sdk/fire-vs-clip/) を参照してください。

## 次のステップ

- [Trigger コンポーネント](/docs/sdk-integration/unity-sdk/triggers/) — 各トリガーの設定例
- [EventMap ウィンドウ](/docs/sdk-integration/unity-sdk/event-map/) — Wiring の可視化・一括管理
- [Parameter Binding](/docs/sdk-integration/unity-sdk/parameter-binding/) — ゲーム状態を gain / pan に動的マッピング
- [AI 支援ワークフロー](/docs/sdk-integration/unity-sdk/ai-assisted-workflow/) — 既存シーンへの触覚後付け実践フロー
- [Editor メニュー一覧](/docs/sdk-integration/unity-sdk/editor-menus/) — Hapbeat メニュー全項目の使い方逆引き
- [複数アプリを共存させる](/docs/sdk-integration/unity-sdk/multi-app/) — LAN 分離 / group ID 切り分け
