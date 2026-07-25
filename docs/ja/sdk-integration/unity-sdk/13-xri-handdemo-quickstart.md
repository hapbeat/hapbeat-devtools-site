---
title: XRI Hand Demo に触覚を足す
kind: howto
description: XR Interaction Toolkit の Hands Interaction Demo に、Editor メニュー 1 回で Hapbeat の触覚を後付けする手順。掴む / 押す / スライドの各操作に触覚が乗る。
sidebar:
  order: 200
---

Unity 公式の **XR Interaction Toolkit (XRI)** サンプル「**Hands Interaction Demo**」に、Hapbeat の触覚を後付けするデモです。掴む・保持する・UI を押す・スナップする・こするといった基本操作に、そのまま触覚フィードバックが乗ります。

Hapbeat SDK が配布するのは **EventMap・Kit・配線を適用する Editor コマンド** の 3 点だけです。シーン本体は皆さん自身が XRI パッケージから import したものを使います。

:::tip[体験するだけなら Unity は不要です]
ビルド済み APK を配布しています。**Quest に入れて試すだけ**なら [](/docs/sdk-integration/unity-sdk/xri-handdemo-apk/) を参照してください。adb / SideQuest / ストアのリリースチャンネルの 3 通りの入れ方を説明しています。

本ページは、**このデモを自分の Unity プロジェクトで再現し、触覚を編集したい人**向けです。
:::

## なぜ「シーン配布」ではなく「ツール方式」なのか

XRI とそのサンプルは **Unity Companion License** で提供されており、改変したシーンを Hapbeat 側から再配布することはできません。

そのため SDK には、シーンそのものではなく **「手元の `HandsDemoScene` に対して触覚側の差分（コンポーネントと UnityEvent 配線）を適用するコマンド」** を同梱しています。XRI 由来のアセットは Hapbeat SDK に一切含まれていません。

## 必要なもの

- Unity Editor（[](/docs/sdk-integration/unity-sdk/installation/) の要件に準拠）
- **XR Interaction Toolkit**（動作確認済み: **3.3.1**）
- **Hapbeat SDK**（[](/docs/sdk-integration/unity-sdk/installation/) 参照）
- Hapbeat デバイスが Unity を実行する PC と同じ Wi-Fi LAN にいること
- ハンドトラッキング対応 HMD（Quest 3 / 3S など）。XRI 側の要件に従います
- OpenXR の **Hand Interaction Profile** と **Hand Tracking Subsystem** が有効になっていること（手順 5）

## 手順

1. **Package Manager → Unity Registry → XR Interaction Toolkit を Install**
   XRI 本体が入ります。**Unity の VR テンプレートでプロジェクトを作成した場合は XR Interaction Toolkit が最初から入っている**ため、この手順は不要です（バージョンだけ確認してください）。3D テンプレートなどから始めた場合のみ Package Manager から導入します。
2. **XR Interaction Toolkit の Samples タブ → *Starter Assets* と *Hands Interaction Demo* を Import**
   `Assets/Samples/XR Interaction Toolkit/<version>/Hands Interaction Demo/` にシーンとアセットが展開されます。XRI が追加サンプルの import を促す場合はそれに従ってください。
3. **Hapbeat SDK を導入**
   Git URL でインストールします（手順は [](/docs/sdk-integration/unity-sdk/installation/)）。
4. **Hapbeat SDK の Samples → *XR Helpers* と *XRI Hand Demo (haptics add-on)* を Import**
   前者は XRI 用のフィルタコンポーネント、後者は `HandsDemoEventMap.asset` と `Kit/hand-demo-kit/` が入ります。**両方**必要です。
5. **XR 設定（OpenXR）でハンドトラッキングの入力を有効にする**
   `Project Settings → XR Plug-in Management → OpenXR` を開き、**ビルド対象のタブ**（Quest 単体で動かすなら **Android**、Air Link 等で Editor Play するなら **PC**）で次の 2 つを設定します。
   - **Enabled Interaction Profiles** に **Hand Interaction Profile** を追加する
   - **Hand Tracking Subsystem** feature を有効化する

   この設定が無いと **「触覚は鳴るが掴めない」** 状態になります。poke（指先で押す）は指の**位置**だけで成立するのに対し、grab はピンチ = **select 入力**を必要とし、それを供給しているのが Hand Interaction Profile だからです。
6. **`HandsDemoScene.unity` を開く**
   コマンドは「今開いているシーン」に対して適用されます。
7. **メニュー `Hapbeat > Samples > Augment XRI Hand Demo` を実行**
   触覚コンポーネント（Sequence Trigger / UnityEvent Trigger / Tick Emitter / Parameter Binding、およびシーンに `HapbeatManager` が無ければ `[Hapbeat Event Router]`）が配置され、XRI 側の UnityEvent へ配線されます。適用件数・スキップ件数・警告数は Console に 1 行で出ます。
   - **Undo 可**: 実行直後の `Edit → Undo` 1 回ですべて取り消せます。
   - **冪等**: 既に入っているコンポーネントと同じ配線は追加されず、スキップとして数えられます。何度実行しても重複しません。
   - **XRI 自身の select イベントは書き換えません**。ソケット周りは *XR Helpers* のフィルタコンポーネントが公開するイベントに配線されます。
8. **Hapbeat デバイスを同じ Wi-Fi に接続 → Play**
   HMD をかぶってキューブを掴む / ボタンを押す / スライダーを動かすと触覚が返ります。

:::tip[どのイベントに触覚を足すか検討したいとき]
手順 7 の代わりに `Hapbeat > Samples > Augment XRI Hand Demo (+ diagnostic Event Logger)` を実行すると、Poke ボタンの XRI インタラクタブルイベントがすべて Console にログされます。配線先を決めるときに便利ですが、通常はノイズになるので必要なときだけ使ってください。
:::

## Kit（`hand-demo-kit`）の扱い

同梱の EventMap は **10 エントリすべてが CLIP（StreamClip）** です。CLIP は Unity の AudioClip を PCM としてストリーミングするモードなので、**デバイスへの Kit デプロイは不要**です。import してシーンを Play すればそのまま鳴ります。

`Kit/hand-demo-kit/hand-demo-kit-manifest.json` を同梱しているのは、EventMap 上で **基準 intensity をプレビュー**するためです（各エントリの gain はこの基準値に対する倍率として働きます）。FIRE モードとの違いは [](/docs/sdk-integration/unity-sdk/fire-vs-clip/) を参照してください。

## うまくいかないとき

| 症状 | 意味と対処 |
|---|---|
| ダイアログ「`HandsDemoEventMap.asset` が見つからない」 | サンプル *XRI Hand Demo (haptics add-on)* が未 import。手順 4 を実行してから再実行する |
| ダイアログ「開いているシーンは Hands Interaction Demo ではない」 | `HandsDemoScene.unity` 以外が開いている、または XRI のバージョン差でシーン構造が変わっている。ダイアログには見つからなかった GameObject のパスが列挙されるので、XRI のバージョン（動作確認済みは 3.3.1）を確認する |
| Console に「GameObject '…' not found」警告 | XRI 側で該当オブジェクトが改名・移動されている。コマンドは見つかった分だけ適用するので、**警告に出たパスは手動で配線**する（配線パターンは [](/docs/sdk-integration/unity-sdk/triggers/) 参照） |
| Console に「type '…HapbeatXRGrabFilter' not found」警告 | サンプル *XR Helpers* が未 import。手順 4 を実行して再実行する |
| 触覚は鳴るが掴めない / ハンドジェスチャーが認識されない | OpenXR の **Hand Interaction Profile** と **Hand Tracking Subsystem** を有効化する（手順 5） |
| 触覚が鳴らない | [](/docs/support/faq/) の接続関連、および [](/docs/sdk-integration/unity-sdk/getting-started/) の確認手順を参照 |

XRI は 3.3.1 で動作確認しています。他バージョンでも構造が変わっていなければ動作しますが、GameObject のパスが変わっていると該当箇所だけ警告になります（コマンド全体が失敗するわけではありません）。

## ライセンス上の注意

XRI のサンプルは **Unity Companion License (UCL)** 下にあります。同ライセンスは複製・派生物の作成・配布・サブライセンスを許諾しており、その行使範囲は「Unity エンジンに依存するアプリケーション / コンテンツの作成・使用・配布」に限定されています。

そのうえで、Hapbeat SDK が**シーンではなくコマンドを配っている**のは次の理由からです。

- UCL 第 3.2 条により、**Software の派生物（＝改変した `HandsDemoScene`）の権利は Unity に帰属**します。あなた自身が作ったコンテンツ（アプリやイベントマップ）はあなたのものですが、シーンの改変版はそうなりません。
- UCL 第 5 条により、Software を実質的に含めて配布する場合は**著作権表示とライセンス条文を添える義務**が生じます。
- SDK に第三者アセットを含めないことで、上記の論点自体を回避できます。

**ビルド済みアプリ（APK など）の配布は別の話**で、Unity エンジンに依存するアプリケーションそのものなので UCL の許諾範囲に収まります。実際に配布する手順は [](/docs/sdk-integration/unity-sdk/xri-handdemo-apk/) を参照してください（著作権表示の義務は同ページに記載しています）。

なお本ページの手順を第三者に案内する場合は、XRI サンプルを各自 import してもらう形になります。

## 次に読む

- [](/docs/sdk-integration/unity-sdk/triggers/) — 適用された Trigger コンポーネントそれぞれの役割
- [](/docs/sdk-integration/unity-sdk/event-map/) — `HandsDemoEventMap` の中身を編集して感触を調整する
- [](/docs/sdk-integration/unity-sdk/showcase/overview/) — XR デバイス不要で配線パターンを一覧できるサンプル
