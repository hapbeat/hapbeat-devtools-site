---
title: Walkthrough
kind: tutorial
sidebar:
  order: 200
description: Showcase シーンを Play した後にやってみることのガイド — 改造ヒント、Command モード切替、WASD 衝突対処、トラブルシューティング。
---

[Showcase Sample](./) を Play しながら **試したいこと・つまずきやすいこと** をまとめたページです。シーンの開き方や Zone 構成は [overview](./) を、各 Zone の wire 詳細は [Wiring Reference](./wiring/) を参照してください。

## 改造して違いを体感する (Playground)

Showcase は読むだけのカタログではなく、**Inspector を書き換えて Play して違いを聞く** ためのプレイグラウンドでもあります。各 Zone におすすめの「小さく変えて違いがすぐ分かる」改造ポイントを挙げます。

### Z1 Bowling — velocity scaling のカーブを変える

- `Pin_*` の `HapbeatCollisionTrigger` の `MaxVelocity` を 5 → 2 に下げる → **弱い衝突でも最大強度** で鳴る
- `Gain Mode` を `VelocityScaled` → `Fixed` に切替 → **どの速度でも均一強度**。「ゲーム的衝撃」と「物理的衝撃」のニュアンスの違い
- EventMap の `pin_hit` entry の `target` を `*/pos_neck` に変える → 衝撃を首側で受ける

### Z2 Door — 別 Animator state に紐付ける

- `DoorAnimator.controller` の他 state に `HapbeatStateBehaviour` を追加 → 「state 遷移」発火のバリエーション増
- `door_open` / `door_close` の EventMap entry の `streamClip` を別 wav に差し替え → ドアの「音」と「触覚」がどれだけ独立に作れるか体感
- EventMap で `door_open` の `gain` を 0.3 に下げる → 静かな閉まり音の触覚版

### Z3 Fishing — Parameter Binding を変える

- `grab_loop` entry の Bindings 内 preset の **Source Property** を `PositionDeltaMagnitude` → `LocalPositionY` に変更 → **高さ基準で gain が変化** (高く上げると強く震える)
- Range を 0.2〜1.5 → 0.5〜3.0 にすると変化が急になる。`Curve` を `Linear` ↔ `EaseInOut` 切替で「擦り始めの立ち上がり」が変わる
- Loop entry の `streamClip` を `rain_loop.mp3` → 別のループ素材に変えるとループ感が変わる (短い素材を入れて切れ目に注意)

### Z4 Stream — Gain/Pan binding を加える

- 既存の Slider → `playback.Gain` の代わりに `HapbeatParameterBinding` を Slider に attach → script レス化 (declarative path)
- `HapbeatTickEmitter` の `Tick Threshold` を 0.05 → 0.2 にすると **段階数が減って粗いフィードバック**
- StreamClip の `loop` チェックを外して 1 発もの化 → ambient loop と single shot の違い
- `target` を broadcast → `*/pos_r_arm` 固定にして「特定 position だけ受ける」挙動確認

### Z5 Charge & Shoot — curve の形状を変える

- `ChargeShooter._gainCurve` (Inspector で AnimationCurve 直接編集) を `EaseInOut` → 上に凸の曲線にすると **チャージ初期から強く立ち上がる**
- 同じ curve を `Linear` にしてから 1/4 だけ離してみる → **離すタイミングの違い**が触覚 gain に直結
- `target_hit` の entry mode を `StreamClip` → `Command` に変えて Kit deploy 経由にすると、当たりの応答が低遅延化

### EventMap 全体

- `Hapbeat → Open Event Map` ウィンドウで各 entry の `gain` 列を 0.5 → 1.5 にするだけで Z 全体の強さが変わる
- `target` 列を `*/pos_neck` 一斉適用にして「首だけで全部受ける」モードを試す
- `Mode` 列で `StreamClip` → `Command` に切替、Studio で対応 Kit を deploy すれば低遅延化を体感

> 元に戻したくなったら Package Manager から Showcase を再 Import すれば authored 版に戻ります。サンプルフォルダ (`Assets/Samples/Hapbeat SDK/<version>/Showcase/`) は再 Import で上書きされるので、永続化したい改造は別フォルダにコピーしてから編集してください。

## Command モードで再現する (任意, Studio 連動)

Showcase は **StreamClip だけで完結する** ように設計しています。次のステップとして「Hapbeat Studio で Kit を整備すると何が変わるか」を Command モードで体験できます (任意)。

### Command モードのメリット

- **低遅延**: event id (短い文字列) だけ送るので、PCM ストリームより到達が速い
- **デバイス内蔵 clip 再生**: Unity 側に WAV を持たなくてよい (アプリの容量削減)
- **Studio で clip を編集**: Kit を Studio で更新して deploy すれば、Unity 側のビルドし直しは不要

### 手順

1. **Studio で Kit を作る (または同梱の showcase-kit を流用)**
   - Sample Import 直後は `Assets/Samples/Hapbeat SDK/<version>/Showcase/Kit/showcase-kit-manifest.json` に Kit が同梱されている
   - Hapbeat Studio でこの Kit を開く (または独立コピーで作業)
   - `install-clips/` に Command 用 WAV (例: `pin_hit.wav`) を追加
2. **Kit をデバイスに deploy** (Studio の Save → Deploy)
3. **EventMap で mode を Command に切替**
   - `pin_hit` entry を開いて Mode を `Command` に
   - Category = `showcase-kit`, Event Name = `pin_hit` (Event ID = `showcase-kit.pin_hit`)
   - streamClip フィールドはそのまま (Command モードでは無視される)
4. **試したい entry を順次 Command 化**
   - 全部 Command にする必要はなく、低遅延を効かせたい衝撃系だけ Command、ambient/drag 系は StreamClip という混在運用が実用的
5. Play で動作確認

### Command + StreamClip 混在の指針

- **Command 向き**: 衝撃 (pin_hit, target_hit, charge_release, manual_fire など)。低遅延が効く
- **StreamClip 向き**: ループ系 (grab_loop, stream_demo)。ParameterBinding で動的 modulation できる

実機で両方触ってみると、Command の応答の速さと StreamClip の表現の自由度の違いが体感できます。

## WASD と UI nav の衝突 (Showcase の対処)

Unity の **`InputSystemUIInputModule`** のデフォルト `UI/Navigate` action には **WASD がバインド**されています。Slider にフォーカスがある状態で WASD を押すと、Player 移動と同時に Slider 値も変化してしまう (UI nav として動く)。

Showcase では Zone 4 で stream gain slider を触る局面があるため、以下の二重対策を入れています:

1. **`SimpleFPSController.HandleMove` は cursor lock 中のみ動作** — Z4 は `unlockCursorOnEnter=true` で cursor unlock 中なので player は WASD で動かない
2. **`UiDeselectOnPointerUp` script を各 Slider に attach** — マウスドラッグ離した時点で EventSystem の selection を解除 → 以降 WASD は Slider に届かない

### Production project では根本治療推奨

zero-config を優先する Showcase では上記対症療法を採用していますが、**実プロジェクトでは UI Input Module 側で WASD を外す**のが筋:

1. `Packages/Input System/.../DefaultInputActions.inputactions` を `Assets/` 配下にコピー
2. コピーを Input Actions Editor で開く → **UI / Navigate / 2D Vector Composite** から `<Keyboard>/w` `<Keyboard>/a` `<Keyboard>/s` `<Keyboard>/d` の 4 binding を削除 (Arrow キーは残す)
3. シーンの **EventSystem → Input System UI Input Module → Actions Asset** に作ったコピーを差し替え

これで `UiDeselectOnPointerUp` が不要になり、project 全体の UI element (Slider / Dropdown 等) で WASD が干渉しなくなる。

## トラブルシューティング

| 症状 | 原因 / 対処 |
|---|---|
| 何も鳴らない | Hapbeat デバイスがオフライン → Studio / Helper で接続確認 |
| 接続済みなのに鳴らない | `[Hapbeat Event Router]` の `HapbeatManager` が無い、または各 Trigger の `EventMap` 未割当 |
| `[Hapbeat] Entry not found` ログが出る | EventMap entry の displayName と Trigger 側 entry 選択がミスマッチ。Inspector の Entry ドロップダウンを確認 |
| Sequence の Loop が無音 | `grab_loop` entry の `streamClip` 未割当、または `loop` 未チェック |
| Tick がスパムする | Tick Threshold が低すぎる。0.05 程度に調整 |
| Picker で切り替えても Z1 が変化しない | 仕様 (entry の固定 target が優先)。Z4・Z5・ホットキーで確認 |
