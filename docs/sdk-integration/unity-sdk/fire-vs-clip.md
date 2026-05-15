---
title: Fire と Clip を実装する
kind: howto
sidebar:
  order: 400
description: Unity SDK で Fire (command) と Clip (stream_clip) を使い分けるためのコード例と EventMap 設定手順。
---

このページは Unity SDK で Fire / Clip を **どう書くか** に絞ります。両者の本質的な違い・選び方の判断材料は [Fire と Clip の違い](/docs/concepts/fire-vs-clip/) を参照してください。

## EventMap での mode 切り替え

Unity の EventMap ウィンドウで各 Event の Mode ドロップダウンから切り替えます。

| EventMap 表示 | manifest 値 | Unity SDK API |
|---|---|---|
| `▶ FIRE` | `command` | `HapbeatManager.Play(eventId, gain)` |
| `♪ CLIP` | `stream_clip` | `HapbeatManager.StreamAudioClip(clip, gain)` |

Trigger コンポーネント (`HapbeatTriggerBase` 派生) は mode を意識せず Event を発火し、内部で適切な API を呼び分けます。

## コード例

### Fire (command)

事前にデプロイ済みの Kit に対して Event ID で発火します。

```csharp
HapbeatManager.Instance.Play("my-game.sword-hit", gain: 0.8f);
```

任意で target を指定 (Group / Player address):

```csharp
HapbeatManager.Instance.Play(
    eventId: "my-game.sword-hit",
    gain: 0.8f,
    target: "player_1/chest"
);
```

### Clip (stream_clip)

Unity の `AudioClip` を直接ストリーミングします (事前デプロイ不要)。

```csharp
public AudioClip footstepClip;  // Inspector でアサイン

void OnFootstep() {
    var playback = HapbeatManager.Instance.StreamAudioClip(
        clip: footstepClip,
        gain: 0.7f
    );
    // playback ハンドルで停止や gain 変更が可能
}
```

ループ + 動的 gain は次のように:

```csharp
var playback = HapbeatManager.Instance.StreamAudioClip(
    clip: ambientClip,
    baselineGain: 0.5f,
    initialGain: 0.5f,
    target: "player_1/chest",
    loop: true
);

// 再生中に gain を変更
playback.SetGain(0.2f);

// 停止
playback.Stop();
```

## 移行ワークフロー (Clip → Fire)

開発初期は Clip でクイック試作 → 形が決まったら Fire に移すのが典型です:

1. **Clip でプロトタイプ** — `AudioClip` を Inspector に直接アサインして即座に試行錯誤
2. **波形を Kit に取り込む** — Studio に WAV をインポートして `install-clips/` 配下に配置
3. **EventMap で mode を切り替え** — `stream_clip` → `command`
4. **Kit をデプロイ** — Studio から対象デバイスへ
5. **動作確認** — Trigger 経由で発火、低遅延・安定再生に切り替わる

Trigger 側のコードは変更不要 (mode 切替は EventMap 側だけで完結) です。

## よくある質問

**Q. Fire と Clip をミックスできるか？**
A. はい。EventMap 内で Event ごとに mode を選べるので、効果音は Fire / 環境音は Clip など使い分けて構いません。

**Q. Helper が止まると Fire も止まるか？**
A. いいえ。Fire は SDK が直接 UDP broadcast を送るため Helper 不要です。Clip も SDK 直送で動作しますが、Studio から再生テストするときは Helper 経由になります。

**Q. Clip で長尺ループの先頭が欠ける**
A. [Streaming buffer を調整する](./streaming/) で先読みバッファのサイズを調整してください。

## 関連リンク

- [Fire と Clip の違い](/docs/concepts/fire-vs-clip/) — 概念と判断フロー
- [EventMap ウィンドウ](./event-map/) — mode の編集場所
- [Streaming buffer を調整する](./streaming/) — Clip モードのバッファ調整
- [Kit を作って配布する](/docs/tools/studio/kit-design/) — Fire 用 Kit の設計
