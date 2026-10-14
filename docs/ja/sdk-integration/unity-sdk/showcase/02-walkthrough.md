---
title: Walkthrough
kind: tutorial
sidebar:
  order: 200
description: Showcase シーンを Play した後にやってみることのガイド — 改造ヒント、Command モード切替、WASD 衝突対処、トラブルシューティング。
---

[Showcase Sample](/docs/sdk-integration/unity-sdk/showcase/overview/) を Play しながら **試したいこと・つまずきやすいこと** をまとめたページです。シーンの開き方や Zone 構成は [overview](/docs/sdk-integration/unity-sdk/showcase/overview/) を、各 Zone の wire 詳細は [Wiring Reference](/docs/sdk-integration/unity-sdk/showcase/wiring/) を参照してください。

## 改造して違いを体感する (Playground)

Showcase は読むだけのカタログではなく、**Inspector を書き換えて Play して違いを聞く** ためのプレイグラウンドでもあります。各 Zone におすすめの「小さく変えて違いがすぐ分かる」改造ポイントを挙げます。

### Z1 Bowling — velocity scaling を変える

- `Prefabs/BowlingPin.prefab` の `HapbeatCollisionTrigger` で **Max Velocity** を下げる → **弱い衝突でも最大強度** で鳴る
- `Gain Mode` を `VelocityScaled` → `Fixed` に切替 → **どの速度でも均一強度**。「ゲーム的衝撃」と「物理的衝撃」のニュアンスの違い
- EventMap の `Z1_pin_hit` の Targeting を `*/pos_neck` に変える → 衝撃を首側で受ける

### Z2 Door — state ごとの触覚を変える

- `Z2_door_open` / `Z2_door_close` の Clip を別 wav に差し替え → ドアの「音」と「触覚」がどれだけ独立に作れるか体感
- EventMap で `Z2_door_close` の Gain を下げる → 静かに閉まるドアの触覚版
- `DoorAnimator.controller` の state に付いた `HapbeatStateBehaviour` の **Required Previous State** を空にする → どの state から来ても鳴るようになる

### Z3 Fishing — Parameter Binding を変える

- `Z3_hook_loop` エントリの Bindings で **Source Property** を `VelocityMagnitude` → `LocalPositionY` に変更 → **高さ基準で gain が変化** (高く上げると強く震える)
- 入力 / 出力の Range を変えると変化の急さが変わる。Curve を `Linear` ↔ `EaseInOut` で切り替えると「振り始めの立ち上がり」が変わる
- `Z3_hook_loop` の Clip を別のループ素材に変えるとループ感が変わる (短い素材を入れて切れ目に注意)

### Z4 Stream — Slider と tick を変える

- Gain / Pan Slider の `HapbeatTickEmitter` で **Tick Threshold** を上げる → **段階数が減って粗いフィードバック**
- `Z4_stream_loop` の **Loop** を外す → ambient loop と single shot の違い
- `Z4_stream_loop` の Targeting を `*/pos_r_arm` にして「特定 position だけ受ける」挙動を確認
- Slider の `HapbeatParameterBinding` を外し、`StreamDemoController.cs` のコメントアウト部分（`ActivePlayback.Gain = slider.value`）を有効にする → 同じ挙動を script で書く方式

### Z5 Charge & Shoot — curve の形状を変える

- `Z5_ChargeShot` の `ChargeShooter` で **Gain Curve** を上に凸の曲線にすると **チャージ初期から強く立ち上がる**
- **Shot Follows Charge T** を ON にすると、発射の強さもチャージ量に追従する
- `Z5_tar_hit_light` / `Z5_tar_hit_heavy` の Mode を `FIRE (Command)` に変えて Kit deploy 経由にすると、当たりの応答が低遅延化

### EventMap 全体

- `Hapbeat → Open Event Map` ウィンドウで各 entry の Gain を変えるだけで Zone 全体の強さが変わる
- Targeting を `*/pos_neck` にして「首だけで全部受ける」モードを試す
- Mode を `CLIP (Stream Clip)` → `FIRE (Command)` に切替、Studio で対応 Kit を deploy すれば低遅延化を体感（次節）

> 元に戻したくなったら Package Manager から Showcase を再 Import すれば authored 版に戻ります。サンプルフォルダ (`Assets/Samples/Hapbeat SDK/<version>/Showcase/`) は再 Import で上書きされるので、永続化したい改造は別フォルダにコピーしてから編集してください。

## Command モードで再現する (任意, Studio 連動)

Showcase は **StreamClip だけで完結する** ように設計しています。次のステップとして「Hapbeat Studio で Kit を整備すると何が変わるか」を Command モードで体験できます (任意)。

### Command モードのメリット

- **低遅延**: event id (短い文字列) だけ送るので、PCM ストリームより到達が速い
- **デバイス内蔵 clip 再生**: Unity 側に WAV を持たなくてよい (アプリの容量削減)
- **Studio で clip を編集**: Kit を Studio で更新して deploy すれば、Unity 側のビルドし直しは不要

### 手順

1. **Kit をデバイスに deploy する**
   - Showcase には `Kit/showcase-kit/`（manifest と、FIRE 用の `install-clips/` / CLIP 用の `stream-clips/`）が同梱されている
   - Hapbeat Studio の Kit タブでこのフォルダを開き、デバイスへ **Deploy**（手順は [](/docs/sdk-integration/unity-sdk/getting-started/) の「Studio で Kit をデプロイ」と同じ）
2. **EventMap で Mode を FIRE に切替**
   - 例: `Z1_pin_hit` の Mode を `FIRE (Command)` に。Event ID は `showcase-kit.z1_pin_hit`
   - Clip フィールドはそのまま (FIRE では使われない)
3. **試したい entry を順次 FIRE 化**
   - 全部 FIRE にする必要はなく、低遅延を効かせたい衝撃系だけ FIRE、ループ系は CLIP という混在運用が実用的
4. Play で動作確認

### Command + StreamClip 混在の指針

- **FIRE (Command) 向き**: 衝撃 (`Z1_pin_hit`, `Z2_door_slam`, `Z5_tar_hit_*`, `Z5_shot_*` など)。低遅延が効く
- **CLIP (Stream) 向き**: ループ系 (`Z3_hook_loop`, `Z4_stream_loop`, `Z5_charge_loop`)。Parameter Binding やスクリプトで再生中の強さを変えられる

実機で両方触ってみると、Command の応答の速さと StreamClip の表現の自由度の違いが体感できます。

## トラブルシューティング

| 症状 | 原因 / 対処 |
|---|---|
| Slider を触った後に WASD で値が動く | Unity 標準の UI ナビゲーションに WASD がバインドされているため。Showcase 側では対策済み。実プロジェクトでの根治手順は [](/docs/sdk-integration/unity-sdk/showcase/wiring/#wasd-と-ui-nav-の衝突への対処) |
| 何も鳴らない | Hapbeat デバイスがオフライン → Studio / Helper で接続確認 |
| 接続済みなのに鳴らない | `[Hapbeat Event Router]` の `HapbeatManager` が無い、または各 Trigger の `EventMap` 未割当 |
| `entry id '...' not found` の警告が出る | Trigger が参照しているエントリが EventMap から削除された。Inspector の Event ドロップダウンで選び直す |
| Sequence の Loop が無音 | `Z3_hook_loop` entry の Clip 未割当、または Loop 未チェック |
| Tick が鳴りすぎる | `HapbeatTickEmitter` の Tick Threshold が低すぎる。値を上げる |
