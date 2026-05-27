---
title: イベント呼び出しを集約する / 分散する
kind: howto
sidebar:
  order: 200
description: Trigger-first（分散）と HapbeatManager.Play（集約）の使い分け。どちらも SDK は等しくサポート。
---

Hapbeat SDK は **触覚イベントの呼び出し方** に 2 つのパターンを提供します。どちらが正解という話ではなく、**プロジェクトの規模・チーム構成・既存のアーキテクチャに合わせて選ぶ設計判断** です。

| パターン | 呼び出し主体 | 典型用途 |
|---|---|---|
| **Trigger-first（分散）** | ゾーンごとの Trigger コンポーネントを Inspector で wire | Showcase / 中小規模 / デザイナーが Inspector で組む |
| **Manager.Play（集約）** | 任意 script から `HapbeatManager.Instance.Play(eventId)` を直接呼ぶ | 既存のゲームに後付け / イベントカタログを script で一元管理したい |

組み合わせも可能（同一プロジェクト内で混在）。

## Trigger-first パターン（標準・Showcase 採用）

各ゾーンに **`HapbeatXxxTrigger`** コンポーネントを attach し、ゾーン script は `[SerializeField]` でその Trigger を持ち `.Fire()` を呼ぶ。

```csharp
public class ChargeShooter : MonoBehaviour
{
    [SerializeField] private HapbeatUnityEventTrigger _trigger;
    [SerializeField] private AnimationCurve _gainCurve;

    private void Release(float chargeT)
    {
        _trigger.GainMultiplier = _gainCurve.Evaluate(chargeT);
        _trigger.Fire();
    }
}
```

### Pros
- **Inspector で完結** — EventMap entry の選択も dropdown で済む
- **デザイナーが触れる** — script を書かずに event ID 変更可
- **wire を見れば全イベントが追える** — どのオブジェクトが何を発火するか hierarchy で可視化

### Cons
- イベント数が増えると Inspector wire が散らばる
- script 側から動的に event ID を組み立てたい場合に向かない

## Manager.Play パターン（集約）

`HapbeatManager.Instance.Play(eventId, target, gain)` を直接呼ぶ。Trigger コンポーネントを使わない。

```csharp
public class GameHapticRouter : MonoBehaviour
{
    public static GameHapticRouter Instance { get; private set; }

    [SerializeField] private HapbeatEventMap _eventMap; // optional: entry lookup 用
    private void Awake() => Instance = this;

    public void Play(string eventId, float gain = 1f, string target = null)
    {
        HapbeatManager.Instance.Play(eventId, target ?? "", gain);
    }

    public void OnEnemyHit() => Play("game.enemy_hit");
    public void OnPickup() => Play("game.pickup", gain: 0.6f);
}
```

呼ぶ側:
```csharp
GameHapticRouter.Instance.OnEnemyHit();
```

### Pros
- **イベントカタログを 1 ファイルで管理** — 命名・gain・target を 1 箇所に集約
- **動的構築が容易** — `Play($"weapon.{weaponName}_fire")` のような string 組立
- **既存ゲームに後付けしやすい** — Trigger を散らかさず singleton 1 つで導入完了

### Cons
- Inspector では何が呼ばれているか見えない（script 読まないと分からない）
- EventMap との連動が手動（runtime に存在チェックは出るが、Inspector で未使用 entry の検知ができない）
- **Latency 補正の対象外**: `HapbeatConfig.hapticDelaySeconds` (audio 遅延補正) は Trigger / Bridge / Event / StateBehaviour 経由でのみ自動適用される。`Manager.Instance.Play()` を直叩きする経路は EventMap entry を経由しないので、必要なら呼び出し側で `Invoke` / `StartCoroutine` で同等の delay を入れる必要がある — 集約パターンを採用する場合は注意。

## 使い分けの目安

- **小〜中規模 / デザイナー協業 / Showcase で学習中** → Trigger-first
- **既に game manager / event bus が存在する大規模プロジェクト** → Manager.Play 集約 or 混在
- **デバッグしやすさ重視** → Trigger-first（Hapbeat Event Logger メニューで wire を可視化できる）
- **動的イベント命名が多い** → Manager.Play

## 混在も OK

たとえば「UI / シーン内オブジェクトは Trigger-first、ゲームロジックの内側で発火するシステミックなイベントは Manager.Play」のような分担は自然です。SDK 内部は両方とも `HapbeatManager` を経由するので、混ぜても動作に影響しません。

## 参考

- [](/docs/sdk-integration/unity-sdk/triggers/) — Trigger-first で使える各種 Trigger
- [](/docs/sdk-integration/unity-sdk/event-map/) — entry 管理
- [](/docs/sdk-integration/unity-sdk/integration/) — 初期セットアップ
