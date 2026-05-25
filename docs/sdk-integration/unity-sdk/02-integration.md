---
title: プロジェクトに組み込む
kind: tutorial
description: 既存 Unity シーンに Hapbeat SDK を追加する流れの全体像。紐づけと調整の 2 段階で組み込む。
sidebar:
  order: 2
---

[Basic Example で動作を確認](/docs/sdk-integration/unity-sdk/getting-started/) の完了により、自分のプロジェクトに組み込む準備ができています。

## Showcase サンプル

実際の触覚配線パターンの実例は **Showcase サンプル**で確認できます。
> Package Manager の Samples タブから **Showcase** を Import → `Showcase.unity` を開いて Play。詳細は [Showcase Sample](/docs/sdk-integration/unity-sdk/showcase/) を参照。

---

組み込みは大きく 2 段階です。本ページは全体の流れを示し、詳細は各ページへリンクします。

1. **紐づけ (Wiring)** — ゲーム内の出来事と、再生したい触覚フィードバックを結びつける
2. **触覚フィードバックの調整 (Tuning)** — 再生方式（Fire / Clip）・強度・対象デバイス・動的 modulation を整える

---

## 1. 紐づけ (Wiring)

ゲーム内のイベント（ボタンクリック・衝突・Animator state 遷移など）と、`EventMap` の各エントリ（再生したい触覚フィードバック）を結びつけるパートです。

### 1-1. 初回セットアップ

メニューバー → **`Hapbeat → Initial Scene Setup`** を実行します。これだけで次が揃います:

- `Assets/HapbeatSDK/` フォルダレイアウト (Kits / EventMaps / Scenes)
- `[Hapbeat Event Router]` GameObject (内部に `HapbeatManager` singleton)
- `Assets/HapbeatSDK/EventMaps/<scene-name>-EventMap.asset`
- Event Map ウィンドウのオープン（新規 asset が選択された状態で）

再実行は idempotent (既存 Router / EventMap を再利用) なので、セットアップ済みシーンで再度実行しても安全です。「Router だけ追加」「EventMap だけ追加」など個別操作が必要な場合は [Editor メニュー一覧](/docs/sdk-integration/unity-sdk/editor-menus/) を参照してください。

### 1-2. EventMap でエントリを定義する

`Hapbeat → Open Event Map` ウィンドウを開き、**+ Add Event** からエントリを追加します（ウィンドウを開くだけでは asset は作られません — 1-1 で作成済みの前提）。

主な設定項目（**頻繁に触る項目のみ抜粋**。loop / bindings / delayOffsetSeconds / notes / manifestOverride を含む全項目の詳細は [EventMap ウィンドウ](/docs/sdk-integration/unity-sdk/event-map/) を参照）:

| フィールド | 内容 |
|---|---|
| Mode | `StreamClip`（Unity の AudioClip を PCM 送信）/ `Command`（デバイス内蔵 Kit を ID で再生） |
| Display Name | エディタ表示用の人間可読ラベル |
| Category + Event Name | wire 上の Event ID は `<category>.<eventName>` 形式に合成される |
| Stream Clip | StreamClip モードで送信する `AudioClip` |
| Gain | 振動強度（0.0〜2.0、Kit manifest の intensity と乗算される） |
| Target | 送信先（空 = 全デバイス、`player_1` / `*/pos_neck` / `player_1/pos_chest` など） |

### 1-3. ゲーム内イベントとエントリを紐づける

定義したエントリを、ゲーム中のどの瞬間に呼び出すかを設定します。経路は 3 通り。プロジェクトの規模・チーム構成・既存コードの形に合わせて選んでください（併用も可能）。

#### A. コンポーネント / Behaviour 経由 (Inspector で wire)

GameObject に Hapbeat 系の Trigger コンポーネント（または `HapbeatStateBehaviour`）を attach し、Inspector で EventMap entry を選択します。コードを書かずに wiring が完了します。Showcase サンプルの Z1〜Z5 に各パターンの実装例があります。

| コンポーネント / Behaviour | 用途 | 参考 Showcase Zone |
|---|---|---|
| **HapbeatCollisionTrigger** | 物理衝突 / Trigger Enter / Exit。VelocityScaled で衝撃連動可 | **Z1 Bowling** (Pin × 6 を BatchSetup で一括) |
| **HapbeatStateBehaviour** | Animator state Enter/Exit で発動。state に直接 attach する StateMachineBehaviour | **Z2 Door** (Open / Closed state に attach) |
| **HapbeatSequenceTrigger** | Grab / Hold / Release を 1 component で管理 | **Z3 Fishing** (Sequence + ParameterBinding) |
| **HapbeatTickEmitter** | 連続値（Slider 等）の変化量に応じてスナップ発動 | **Z4 Stream Console** (Slider に BatchSetup) |
| **HapbeatUnityEventTrigger** | 任意の UnityEvent から `Fire()` を呼ぶ。Button / XR Interactable / Animation Event 等 | **Z5 Charge** (TargetReceiver.OnHit → Fire) |

各要素の詳細: [Trigger コンポーネント](/docs/sdk-integration/unity-sdk/triggers/)

#### B. スクリプトから Trigger を呼ぶ (EventMap 経由)

Script に Trigger 参照を持たせ、ゲームロジックの中で `trigger.Fire()` を呼びます。EventMap entry を介すので gain / target / latency / manifest intensity 補正がすべて自動で効きます。`GainMultiplier` を毎フレーム書けば動的 modulation も可能です。

```csharp
public class ChargeShooter : MonoBehaviour
{
    [SerializeField] private HapbeatUnityEventTrigger _trigger;
    [SerializeField] private AnimationCurve _gainCurve;

    void Release(float chargeT) {
        _trigger.GainMultiplier = _gainCurve.Evaluate(chargeT);
        _trigger.Fire();
    }
}
```

実装例: Showcase **Z5 ChargeShooter** (`Samples~/Showcase/Scripts/ChargeShooter.cs`)。

A との使い分けは「呼び出し条件が Inspector の宣言で完結するか / script ロジックで計算する必要があるか」の違いです。両方のパターンを併用できます。

#### C. EventMap を介さず Manager.Play() を直接呼ぶ (特殊ケース)

EventMap を経由せず `HapbeatManager` を直接叩く経路もあります。

```csharp
HapbeatManager.Instance?.Play("my-kit.enemy_hit", gain: 0.8f);
```

**この経路は EventMap 一元管理の利点（デザイナーが Inspector で値調整できる・wiring 一覧が見える・latency 補正が効くなど）を失います**。EventMap で扱える範囲を超える規模・動的性が求められる場合に限定して使うのが目安です。

たとえば「100 プレイヤーぶんの heartbeat を player ID 付きで個別管理したい」ケース。EventMap に静的列挙すると数百エントリが必要になり GUI 管理が現実的でない、加えて Event ID を runtime に動的構築する (`Play($"heartbeat.player_{id}")`) 必要がある、という条件が組み合わさったとき C が有効です。

---

## 2. 触覚フィードバックの調整 (Tuning)

紐づけが済んだら、各エントリの再生方式・強度・対象デバイスを設計します。多くの項目は [EventMap ウィンドウ](/docs/sdk-integration/unity-sdk/event-map/) で編集できます。本ページでは概要のみ、詳細は各ページへ。

### 2-1. Fire (Command) と Clip (StreamClip) の選択

EventMap entry の **Mode** で選びます:

- **Fire (Command)** — デバイスに deploy 済みの Kit を ID で呼び出す。低遅延・短いコマンド送信のみ
- **Clip (StreamClip)** — Unity の `AudioClip` を UDP で送信して再生。Kit deploy 不要・動的 modulation 可

開発初期は Clip でクイック試作 → 形が決まったら Fire に移すのが典型です。判断軸・移行手順・Kit のデプロイ手順: [Fire と Clip を実装する](/docs/sdk-integration/unity-sdk/fire-vs-clip/)。

### 2-2. Gain と Target

- **Gain** は Kit manifest の `intensity` (Hapbeat Studio で Kit 設計時に決めた基準振動強度) との **乗算**として効きます。1.0 で manifest 通り、0.5 で半分。Gain の階層構造の詳細は [Kit を作って配布する](/docs/tools/studio/kit-design/) を参照
- **Target** は送信先デバイスの指定。空 = 全デバイス、`player_1` で特定プレイヤー、`*/pos_neck` で全プレイヤーの首部位、`player_1/pos_chest` で特定プレイヤー+部位など。詳細は contracts の addressing spec を参照

### 2-3. 動的 modulation (Parameter Binding / スクリプト)

StreamClip 中の gain / pan を毎フレーム書き換えて、ゲーム状態（移動量・速度・距離など）に追従させる仕組み。

- **Parameter Binding** — Inspector で declarative に Transform / Rigidbody / Slider 等を gain / pan にマッピング (Showcase Z3 / Z4)
- **スクリプト** — `trigger.GainMultiplier = curve(t)` のように毎フレーム書く (Showcase Z5)

詳細・使い分け: [Parameter Binding](/docs/sdk-integration/unity-sdk/parameter-binding/)

---

## 次のステップ

- [Trigger コンポーネント](/docs/sdk-integration/unity-sdk/triggers/) — 各トリガーの設定例
- [EventMap ウィンドウ](/docs/sdk-integration/unity-sdk/event-map/) — Wiring の可視化・一括管理
- [Parameter Binding](/docs/sdk-integration/unity-sdk/parameter-binding/) — ゲーム状態を gain / pan に動的マッピング
- [AI 支援ワークフロー](/docs/sdk-integration/unity-sdk/ai-assisted-workflow/) — 既存シーンへの触覚後付け実践フロー
- [Editor メニュー一覧](/docs/sdk-integration/unity-sdk/editor-menus/) — Hapbeat メニュー全項目の使い方逆引き
- [複数アプリを共存させる](/docs/sdk-integration/unity-sdk/multi-app/) — LAN 分離 / group ID 切り分け
