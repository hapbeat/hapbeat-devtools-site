---
title: XRI Hand Demo に haptics を追加
kind: howto
description: XR Interaction Toolkit の Hands Interaction Demo に、Editor メニュー 1 回で Hapbeat の触覚フィードバックを追加する手順。
sidebar:
  order: 200
  label: XRI デモに haptics 追加
---

Unity 公式の [XR Interaction Toolkit (XRI)](https://docs.unity3d.com/Packages/com.unity.xr.interaction.toolkit@3.3/manual/index.html) のサンプル「Hands Interaction Demo」に、Hapbeat の触覚フィードバックを後付けで追加する。掴む・押す・スナップする・こするといった操作すべてに haptics が追加される。

:::tip[体験するだけなら Unity は不要です]
ビルド済み APK を配布しています → [](/docs/sdk-integration/unity-sdk/xri-handdemo-apk/)
:::

## 必要なもの

- **Unity 6 (6000.0) 以上**
- **[XR Interaction Toolkit](https://docs.unity3d.com/Packages/com.unity.xr.interaction.toolkit@3.3/manual/index.html)** — 動作確認済みは 3.3.1
- **Hapbeat SDK**
- **Hapbeat 実機** — Unity を動かす PC と同じ Wi-Fi
- **ハンドトラッキング対応 HMD** — Quest 3 / 3S など

## 手順

1. **XR Interaction Toolkit を Install**
   - Package Manager → Unity Registry
   - VR テンプレートで作成したプロジェクトには導入済み

2. **XRI の Samples から *Starter Assets* と *Hands Interaction Demo* を Import**
   - 展開先は `Assets/Samples/XR Interaction Toolkit/<version>/Hands Interaction Demo/`

3. **Hapbeat SDK を Install**
   - Package Manager → `+` → `Install package from git URL...` に次を貼り付け

     ```
     https://github.com/Hapbeat/hapbeat-unity-sdk.git
     ```

   - バージョン固定は末尾にタグを付与（例 `#v0.3.0`）

4. **Hapbeat SDK の Samples から *XR Helpers* と *XRI Hand Demo (haptics add-on)* を Import**
   - **両方必要**。前者は XRI 用のフィルタコンポーネント、後者は EventMap と Kit

5. **`HandsDemoScene.unity` を開く**

6. **メニュー `Hapbeat > Samples > Augment XRI Hand Demo` を実行**
   - 触覚コンポーネントを配置し、XRI 側の UnityEvent に配線
   - Undo 1 回で全て取り消し可能。再実行しても重複なし
   - 適用件数・スキップ件数・警告数を Console に 1 行で出力

7. **OpenXR で Hand Interaction Profile と Hand Tracking Subsystem を有効化**
   - 設定先は `Project Settings → XR Plug-in Management → OpenXR` の**ビルド対象のタブ**（Quest 単体なら Android、Air Link で Editor Play なら PC）
   - 未設定だと掴めない。poke は指の位置だけで成立するが、grab はピンチ = select 入力を要し、それを供給するのが Hand Interaction Profile

8. **Hapbeat を同じ Wi-Fi に接続して Play**

:::tip[配線先を検討したいとき]
手順 6 の代わりに `Hapbeat > Samples > Augment XRI Hand Demo (+ diagnostic Event Logger)` を実行すると、Poke ボタンの XRI イベントがすべて Console に出力されます。
:::

:::note[Kit のデプロイは不要です]
同梱 EventMap の 10 エントリはすべて CLIP（StreamClip）で、波形はアプリからストリーミングされます。同梱の `hand-demo-kit-manifest.json` は、EventMap 上で基準 intensity をプレビューするためのものです。FIRE との違いは [](/docs/sdk-integration/unity-sdk/fire-vs-clip/) を参照してください。
:::

## 動作しないとき

| 症状 | 対処 |
|---|---|
| `HandsDemoEventMap.asset` が見つからない | サンプル *XRI Hand Demo (haptics add-on)* が未 Import → 手順 4 |
| 開いているシーンが Hands Interaction Demo ではない | シーン違い、または XRI のバージョン差。見つからなかったパスはダイアログに列挙 |
| Console に `GameObject '…' not found` | XRI 側で改名・移動。警告に出たパスを手動で配線（[](/docs/sdk-integration/unity-sdk/triggers/)） |
| Console に `type '…HapbeatXRGrabFilter' not found` | サンプル *XR Helpers* が未 Import → 手順 4 |
| 掴めない | Hand Interaction Profile と Hand Tracking Subsystem を有効化 → 手順 7 |
| 触覚フィードバックが出ない | [](/docs/support/faq/) の接続関連を参照 |

## ライセンスとツール方式の理由

Hapbeat SDK が配布するのは **EventMap・Kit・配線を適用する Editor コマンド**の 3 点のみで、シーン本体は非同梱。XRI 由来のアセットは 1 つも含まない。

XRI のサンプルは [Unity Companion License (UCL)](http://www.unity3d.com/legal/licenses/Unity_Companion_License) 下にある。改変したシーンの権利の帰属や著作権表示の義務が絡むため、SDK に第三者アセットを含めない形にしている。

ビルド済みアプリ（APK など）の配布は別で、UCL が想定するアプリケーションそのものであり許諾範囲に収まる → [](/docs/sdk-integration/unity-sdk/xri-handdemo-apk/)

## 次に読む

- [](/docs/sdk-integration/unity-sdk/triggers/) — 適用された Trigger コンポーネントの役割
- [](/docs/sdk-integration/unity-sdk/event-map/) — EventMap を編集して感触を調整する
