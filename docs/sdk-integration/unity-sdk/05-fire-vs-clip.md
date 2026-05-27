---
title: Fire と Clip — 使い分けと実装
kind: explanation
description: Unity SDK 視点で Fire (command) と Clip (stream_clip) の判断基準・開発フローへの影響・実装パターンを整理。
sidebar:
  order: 200
---

EventMap entry の `Mode` フィールドの値（Fire / Clip）は、Unity への組み込み方針・触覚素材の置き場・反復作業のフローに大きく影響します。本ページは Unity 開発者の視点で「どちらを選ぶか」と「どう書くか」を整理します。

protocol / schema レベル（manifest bucket・wire 形式・gain 適用タイミング等）の詳細は **[](/docs/concepts/fire-vs-clip/)** を参照してください。

## TL;DR

| | **Fire** (FIRE / command) | **Clip** (CLIP / stream_clip) |
|---|---|---|
| 一言で | デバイス内蔵 clip を ID で再生 | Unity の AudioClip を PCM 送信 |
| 推奨用途 | 本番運用、短い one-shot | 試作、長尺、動的変調 |
| 事前 deploy | 必要 (Studio から Kit を書込) | 不要 |
| 遅延 | 小・安定 | 大きめ・環境依存 |
| 動的変調 | `gain` は発火ごとに固定 | 再生中に gain / pan を per-chunk 変調可 |

---

## 1. どちらを選ぶか

### 1-1. Unity 開発フローへの影響

| | Fire を選んだ場合 | Clip を選んだ場合 |
|---|---|---|
| 触覚素材の置き場 | Hapbeat Studio の Kit (`install-clips/`) | Unity の `AudioClip` |
| 反復作業のフロー | WAV 編集 → Studio → device deploy → Unity Play | AudioClip を Inspector で差し替え → 即 Play |
| Trigger 側コード | mode 非依存 (Trigger / StateBehaviour は mode を意識しない) | 同左 |
| 動的 modulation | 不可 (固定 gain のみ) | 可 (`Trigger.GainMultiplier` / `HapbeatParameterBinding`) |

**Trigger / StateBehaviour 側のコードは mode を意識しないため、後から切り替えが可能です**。EventMap entry の `Mode` フィールドを変えるだけで wire 形式が変わります。これは Unity SDK が EventMap を経由した抽象を提供しているためで、Fire / Clip 比較における Unity 側の最大の特徴です。

### 1-2. 具体例: Showcase での選択

| Showcase Zone | 選んだ Mode | 理由 |
|---|---|---|
| Z1 Pin hit | Clip | 開発中に色々な打撃感を試したいため。本番化なら Fire への移行が自然 |
| Z2 Door open/close | Clip | Animator state 連動で短い one-shot。試作段階のため Clip 維持 |
| Z3 grab loop | Clip (loop) | 長尺ループ + 物体速度に応じた動的 modulation が必要 |
| Z5 charge release | Clip | チャージ量を `AnimationCurve` で gain modulation するため Clip 必須 |

### 1-3. ガイドライン

- **試作段階** → Clip（差し替えの速さ）
- **触覚が確定 + 出荷予定** → Fire に切り替え（低遅延・安定）
- **長尺 / ループ / 動的 modulation 必須** → Clip 維持
- **Wi-Fi 混雑 or 多人数同時** → Fire（帯域消費が小さい）
- **同じ entry を 2 モード両対応したい** → manifest の BOTH 表現（[](/docs/concepts/fire-vs-clip/) で詳述）

---

## 2. EventMap での mode 切り替え

EventMap entry の `Mode` フィールドで `FIRE (Command)` / `CLIP (Stream Clip)` を選びます。コンポーネント / Behaviour 側は mode を意識せず、内部で適切な API (`HapbeatManager.Play` / `StreamAudioClip`) に分岐します。

| Mode 設定時 | 必須フィールド | wire 形式 |
|---|---|---|
| `FIRE (Command)` | Category + Event Name | PLAY / STOP packet (Event ID + パラメータ) |
| `CLIP (Stream Clip)` | Stream Clip (`AudioClip`) | STREAM_BEGIN / STREAM_DATA × N / STREAM_END |

詳細: [](/docs/sdk-integration/unity-sdk/event-map/)。

---

## 3. 実装例

[](/docs/sdk-integration/unity-sdk/integration/) と同じ分類で示します。A / B は mode 非依存で使えるため Unity 側コードは共通、C のみ mode 別 API を使います。

### A. Inspector で wire (mode 非依存)

GameObject に Hapbeat 系コンポーネント（Collision / Sequence / UnityEvent / TickEmitter）を attach、または `HapbeatStateBehaviour` を AnimatorController state に attach し、Inspector で対象 EventMap entry を選びます。コードは不要。

Fire / Clip の違いは EventMap entry 側の `Mode` と関連フィールドで吸収されるため、コンポーネント / Behaviour の Inspector 操作は同じです:

```
GameObject の Inspector
└─ HapbeatUnityEventTrigger
   Event Map : MyEventMap
   Event     : [▶ sword_hit]      ← entry.mode = FIRE
             : [♪ ambient_drone]  ← entry.mode = CLIP
```

EventMap entry 側の `Mode` を切り替えるだけで、コンポーネント / Behaviour を一切触らずに wire 形式が変わります。

### B. スクリプトから Trigger を呼ぶ (mode 非依存)

`[SerializeField]` で Trigger 参照を持ち、ゲームロジックから `Fire()` を呼びます。entry.mode が FIRE / CLIP どちらでも同じ呼び方です。

```csharp
public class GunController : MonoBehaviour
{
    [SerializeField] private HapbeatUnityEventTrigger _shootTrigger;

    void OnShoot() {
        _shootTrigger.Fire();
    }
}
```

Clip のとき、`GainMultiplier` を毎フレーム書けば再生中の動的変調も可能です（Fire のときは setter 自体は動作しますが、再生中の波形には反映されず、次の `Fire()` から効きます）:

```csharp
void Update() {
    if (_isCharging)
        _shootTrigger.GainMultiplier = _gainCurve.Evaluate(_chargeT);
}
```

実装例: Showcase **Z5 ChargeShooter** (`Samples~/Showcase/Scripts/ChargeShooter.cs`)。

### C. Manager.Play() / StreamAudioClip() を直接呼ぶ (mode 別 API、特殊ケース)

EventMap を介さない場合は mode 別に API を選びます。

**Fire**:
```csharp
HapbeatManager.Instance?.Play(
    eventId: "my-game.sword_hit",
    gain: 0.8f,
    target: "player_1/pos_r_arm"
);
```

**Clip**:
```csharp
[SerializeField] private AudioClip _footstepClip;

void OnFootstep() {
    var playback = HapbeatManager.Instance?.StreamAudioClip(
        clip: _footstepClip,
        gain: 0.7f
    );
    // 必要なら playback.SetGain(0.5f) / playback.Stop()
}
```

EventMap 経由の自動補正（manifest intensity / latency offset / wiring 一覧 / Inspector チューニング）は失われます。この経路を選ぶ条件は [](/docs/sdk-integration/unity-sdk/integration/) を参照。

---

## 4. Kit を device へ deploy する

Fire モードを使う前に、Kit（WAV + manifest.json）を device に書き込む必要があります。手順は Studio 側のドキュメントを参照:

- [](/docs/tools/studio/initial-setup/)
- [](/docs/tools/studio/kit-design/)

---

## 5. Helper の役割 (補足)

Fire / Clip ともに **runtime の SDK は直接 device に UDP を送る** ため、Helper は不要です。Helper が要るのは:

- Studio から Kit を deploy するとき（mDNS discovery + WS 中継）
- Studio 上の再生テスト・waveform preview

---

## 関連リンク

- [](/docs/concepts/fire-vs-clip/) — protocol / schema レベルの詳細
- [](/docs/sdk-integration/unity-sdk/integration/) — 紐づけ 3 パターンの全体像
- [](/docs/sdk-integration/unity-sdk/triggers/) — コンポーネント・Behaviour の一覧
- [](/docs/sdk-integration/unity-sdk/event-map/) — `Mode` 切り替え画面
- [](/docs/sdk-integration/unity-sdk/streaming/) — Clip モードのバッファ調整
