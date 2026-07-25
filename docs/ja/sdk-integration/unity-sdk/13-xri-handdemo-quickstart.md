---
title: XRI Hand Demo に触覚を足す
kind: howto
description: XR Interaction Toolkit の Hands Interaction Demo に、Editor メニュー 1 回で Hapbeat の触覚を後付けする手順。
sidebar:
  order: 200
  label: XRI デモに触覚を足す
---

Unity 公式の **XR Interaction Toolkit (XRI)** サンプル「Hands Interaction Demo」に、Hapbeat の触覚を後付けします。掴む・押す・スナップする・こするといった操作に触覚が乗ります。

:::tip[体験するだけなら Unity は不要です]
ビルド済み APK を配布しています → [](/docs/sdk-integration/unity-sdk/xri-handdemo-apk/)
:::

## 必要なもの

- Unity Editor（[](/docs/sdk-integration/unity-sdk/installation/) の要件に準拠）
- XR Interaction Toolkit（動作確認済み: **3.3.1**）
- Hapbeat SDK
- Hapbeat 実機（Unity を動かす PC と同じ Wi-Fi）
- ハンドトラッキング対応 HMD（Quest 3 / 3S など）

## 手順

1. **XR Interaction Toolkit を Install する**
   - Package Manager → Unity Registry から。VR テンプレートで作成したプロジェクトには最初から入っています

2. **XRI の Samples から *Starter Assets* と *Hands Interaction Demo* を Import する**
   - `Assets/Samples/XR Interaction Toolkit/<version>/Hands Interaction Demo/` に展開されます

3. **Hapbeat SDK を Install する**
   - Git URL の手順は [](/docs/sdk-integration/unity-sdk/installation/)

4. **Hapbeat SDK の Samples から *XR Helpers* と *XRI Hand Demo (haptics add-on)* を Import する**
   - **両方必要**です。前者は XRI 用のフィルタコンポーネント、後者は EventMap と Kit

5. **OpenXR で Hand Interaction Profile と Hand Tracking Subsystem を有効にする**
   - `Project Settings → XR Plug-in Management → OpenXR` の**ビルド対象のタブ**で設定します（Quest 単体なら Android、Air Link で Editor Play なら PC）
   - 未設定だと「触覚は鳴るが掴めない」状態になります。poke は指の位置だけで成立しますが、grab はピンチ = select 入力を必要とし、それを供給するのが Hand Interaction Profile です

6. **`HandsDemoScene.unity` を開く**

7. **メニュー `Hapbeat > Samples > Augment XRI Hand Demo` を実行する**
   - 触覚コンポーネントが配置され、XRI 側の UnityEvent に配線されます
   - Undo 1 回で全て取り消せます。何度実行しても重複しません
   - 適用件数・スキップ件数・警告数は Console に 1 行で出ます

8. **Hapbeat を同じ Wi-Fi に接続して Play する**

:::tip[配線先を検討したいとき]
手順 7 の代わりに `Hapbeat > Samples > Augment XRI Hand Demo (+ diagnostic Event Logger)` を実行すると、Poke ボタンの XRI イベントがすべて Console に出ます。
:::

## Kit のデプロイは不要です

同梱 EventMap の 10 エントリはすべて **CLIP（StreamClip）** で、波形はアプリからストリーミングされます。Import して Play すればそのまま鳴ります。

`hand-demo-kit-manifest.json` を同梱しているのは、EventMap 上で基準 intensity をプレビューするためです。FIRE との違いは [](/docs/sdk-integration/unity-sdk/fire-vs-clip/)。

## うまくいかないとき

| 症状 | 対処 |
|---|---|
| `HandsDemoEventMap.asset` が見つからない | サンプル *XRI Hand Demo (haptics add-on)* が未 Import。手順 4 |
| 開いているシーンが Hands Interaction Demo ではない | シーン違い、または XRI のバージョン差。ダイアログに見つからなかったパスが出ます |
| Console に `GameObject '…' not found` | XRI 側で改名・移動されている。**警告に出たパスを手動で配線**（[](/docs/sdk-integration/unity-sdk/triggers/)） |
| Console に `type '…HapbeatXRGrabFilter' not found` | サンプル *XR Helpers* が未 Import。手順 4 |
| 触覚は鳴るが掴めない | Hand Interaction Profile と Hand Tracking Subsystem を有効化。手順 5 |
| 触覚が鳴らない | [](/docs/support/faq/) の接続関連 |

## ライセンスとツール方式の理由

Hapbeat SDK が配布するのは **EventMap・Kit・配線を適用する Editor コマンド**の 3 点だけで、シーン本体は含みません。XRI 由来のアセットは 1 つも入っていません。

XRI のサンプルは **Unity Companion License (UCL)** 下にあり、複製・派生物の作成・配布・サブライセンスは許諾されています（Unity エンジンに依存するアプリ / コンテンツの作成・使用・配布の範囲で）。そのうえでシーンを配らないのは次の理由です。

- **UCL 第 3.2 条** — Software の派生物（＝改変した `HandsDemoScene`）の権利は **Unity に帰属**します
- **UCL 第 5 条** — Software を実質的に含めて配布すると、**著作権表示とライセンス条文を添える義務**が生じます
- SDK に第三者アセットを含めなければ、この 2 点を回避できます

**ビルド済みアプリ（APK など）の配布は別の話**で、UCL が想定するアプリケーションそのものなので許諾範囲に収まります → [](/docs/sdk-integration/unity-sdk/xri-handdemo-apk/)

## 次に読む

- [](/docs/sdk-integration/unity-sdk/triggers/) — 適用された Trigger コンポーネントの役割
- [](/docs/sdk-integration/unity-sdk/event-map/) — EventMap を編集して感触を調整する
