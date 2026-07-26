---
title: その他のコンポーネント
kind: reference
sidebar:
  order: 300
description: Trigger / Parameter Binding 以外のランタイムコンポーネント — 設定パネル・ステータス HUD・キー入力・UnityEvent 用ヘルパーのリファレンス。
---

Trigger 系は [](/docs/sdk-integration/unity-sdk/triggers/)、Parameter Binding は [](/docs/sdk-integration/unity-sdk/parameter-binding/) を参照。ここではそれ以外のランタイムコンポーネントを扱う。いずれも `Add Component → Hapbeat/` から追加できる。

| コンポーネント | 役割 |
|---|---|
| **Hapbeat Address Override Panel** | player / group を実行時に設定する UI を自動生成 |
| **Hapbeat Status Overlay** | 接続状態とイベント履歴を UI Text に表示するデバッグ HUD |
| **Hapbeat Key Dispatcher** | 単一キー押下を UnityEvent にマップ |
| **Hapbeat Action Helper** | Stop / StopAll / StopStream / Ping を Inspector から呼べるようにする |
| **Hapbeat Event Logger (Diagnostic)** | UnityEvent の発火を時刻付きで Console に出力 |

## Hapbeat Address Override Panel

GameObject に 1 つ追加するだけで、Player -/+ ・ Group -/+ ・ Play ・ Apply ・ Exit を備えた実行時 UI が生成される。シーン側で UI 階層を組む必要はない。用途と設計の背景は [](/docs/sdk-integration/unity-sdk/targeting/#override-targeting) を参照。

### 主な設定

| 項目 | 既定 | 内容 |
|---|---|---|
| `Space` | `ScreenSpaceOverlay` | 画面固定 HUD。VR で空間に置く場合は `WorldSpace` |
| `World Attach Mode` | `LazyFollow` | `LazyFollow` = 視界から外れたときだけ正面へ移動 / `WorldFixed` = 置いた場所に固定 |
| `Follow Distance` | `1.5` m | `WorldSpace` 時のカメラからの距離 |
| `Follow Vertical Offset` | `0` m | 同、上下位置 |
| `Follow Deadzone Degrees` | `10°` | この角度内にある間は移動しない |
| `Follow Smooth Seconds` | `0.25` s | 移動の時定数 |
| `World Pixel Density` | `3`（範囲 1〜8） | `WorldSpace` 時のフォントのラスタライズ解像度 |

`Follow Camera` を未設定にすると `Camera.main` を使う。カメラが見つからない場合は警告を 1 回出して `WorldFixed` 相当で動作する。

### コントローラー操作を受け付ける

`RegisterFocusable` / `MoveFocus` / `ActivateFocused` で 2D フォーカスグリッドを操作できる。Play / Exit の実処理は `OnPlayRequested` / `OnExitRequested` から外部で注入する。実装例は VR Config Example サンプル（→ [](/docs/sdk-integration/unity-sdk/vr-config-example/)）。

`PanelCanvasTransform` / `IsFollowingView` / `FollowVerticalOffset` / `SnapToView()` は public。自前の world-space UI をパネル Canvas の下にぶら下げたり、「視界中央へ戻す」操作を実装するために使う。

### 実機だけ文字が滲む場合

Editor（Air Link 等）では綺麗なのに Quest 実機ビルドだけ甘い場合、**Quality レベルがプラットフォームごとに別**であることが原因。Air Link での Editor Play は Standalone 側、実機ビルドは Android 側の設定を使う。

- VR テンプレートの既定 URP アセット `Mobile_RPAsset` は **Render Scale 0.8**。`Project Settings > Quality` で Android 側が参照するアセットを開き `1.0` にすると改善する
- パネルの `World Pixel Density` を上げると、同じ物理サイズのまま高い解像度でフォントをラスタライズする（フォントアトラスのメモリと引き換え）

いずれも**利用側プロジェクトの設定**であり、SDK からは変更できない。

## Hapbeat Status Overlay

接続状態とイベント履歴を 2 つの UI Text に流し込むデバッグ HUD。

- **Status** — 接続状態 / ストリーミング中フラグ
- **Log** — OnConnected / OnDisconnected / OnPong / OnError と Stream の遷移を 1 行ずつ。`maxLogLines` で上限を指定

動作確認用であり、製品ビルドに含める前提のものではない。

## Hapbeat Key Dispatcher

単一キーの押下を Inspector 上の UnityEvent にマップする。`PlayerInput` / `InputAction` を組むほどでもない場面（サンプル・プロトタイプ・デバッグ用）向け。

`HapbeatUnityEventTrigger` や `HapbeatActionHelper` と組み合わせると、スクリプトを書かずにキー → 触覚発火の配線ができる。

## Hapbeat Action Helper

`HapbeatManager` のシングルトン専用メソッド（`Stop` / `StopAll` / `StopStream` / `Ping`）を、インスタンスメソッドとして公開するラッパー。

UI Button・Key Dispatcher・Animation Event などの UnityEvent から**ターゲットとして直接指定できる**ようになるため、この用途のためだけに MonoBehaviour を書く必要がなくなる。

## Hapbeat Event Logger (Diagnostic)

UnityEvent 経由で呼ばれるたびに、タグと時刻を付けた 1 行を Console に出力する診断用コンポーネント。

XRI の Interactable に貼り付けて hoverEntered / selectEntered などを全て配線すると、**どのイベントがどの順序で飛ぶか**を観測できる。配線先を決めるときに使い、通常はノイズになるので外す。

配線は `Hapbeat > Attach Event Logger to Selected` で自動化できる（→ [](/docs/sdk-integration/unity-sdk/editor-menus/)）。
