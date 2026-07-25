---
title: 複数アプリを共存させる
kind: howto
sidebar:
  order: 200
description: 同じネットワークに複数の Hapbeat / 複数のアプリが並ぶ場合の分け方と、同一ビルドを複数 HMD へ配るための Address Override。
---

Hapbeat SDK は **「1 デバイス = 1 アプリ専用」を基本想定**としています。同じネットワークに複数のアプリ（App A と App B、もしくはアプリ + Hapbeat Studio）が並ぶ場合は、**player / group で送信先を分けて**ください。

## 分けないとどうなるか

デバイスは受信したコマンドの **target（player / group）** だけで自分宛てかを判定します。送信元アプリを区別する仕組みはありません。

- App A の発火と App B の発火が**両方**同じデバイスで鳴る
- `CONNECT_STATUS` の `appName` は最後に届いた方で上書きされ、OLED 表示がちらつく

## 推奨: player / group で分ける

各 Hapbeat 本体に player / group 番号を割り当て、アプリ側は自分の番号だけに送ります。

1. **各 Hapbeat に番号を割り当てる**
   - Hapbeat Studio または本体ボタンから設定します（それぞれ 1〜99）

2. **アプリごとに使う番号の範囲を決める**
   - 例: App A = player 1〜10、App B = player 11〜20

3. **アプリ側で override を固定する**
   - `HapbeatManager.Instance.SetAddressOverride(player, group, persist: true)`
   - ビルド全体で固定するなら `Hapbeat > Settings` の **Override Addressing (this build)**

各デバイスは自分の番号宛てのコマンドしか拾わないので、触覚の衝突は起きません。

:::caution[OLED のアプリ名表示は分離できません]
触覚は分離されますが、`appName` は最後に届いたものが表示されます。表示で「自分のアプリと繋がっているか」を確認したい用途には向きません。
:::

## 同一ビルドを複数 HMD に配る（Address Override）

展示ブースで HMD × Hapbeat のペアを何組も並べる、貸出機材を同じビルドで運用する — こうした場合、**HMD ごとにビルドを分ける必要はありません**。全端末に同一ビルドを配り、端末側で player / group を選ぶだけで 1:1 のペアリングが成立します。

固定の単位は 2 つあり、軸（player / group）ごとに独立しています。

| 単位 | 設定場所 | 用途 |
|---|---|---|
| **this build** | `Hapbeat > Settings` の Override Addressing | ビルド全体で固定。デモごとにビルドを分けるとき |
| **this device** | 実行時 API / 設定パネル | 端末ごとに変える。1 本のビルドを配るとき |

デバイス側の対応は不要です。プロトコルやファームウェアの変更なしに動作します。

### 番号は 1 以外から振る

デバイスのアドレスは常に `player_<N>/<position>/group_<M>` の正規形で保持され、**既定値は `player_1` / `group_1`** です。

つまり**設定し忘れた機体はすべて「1 番」に合流します**。デモ側の番号を **2, 3, … と 1 以外から振っておく**と、設定漏れの機体が「どのデモにも反応しない」形で即座に分かります。

### 端末ごとに設定する 2 つの導線

**スクリプトから呼ぶ**

```csharp
// 起動時、または設定画面で番号を確定するタイミングで呼ぶ
HapbeatManager.Instance.SetAddressOverride(player: 3, group: HapbeatManager.AddressOverrideDisabled, persist: true);
```

- `player` / `group` は 1〜99。`AddressOverrideDisabled`（`-1`）を渡すとその軸は上書きしません
- `persist: true` で PlayerPrefs に保存され、次回起動時も復元されます
- 付け替え時は `ClearPersistedAddressOverride()` を呼びます（Play モード中は `HapbeatManager` インスペクタの **Clear Saved Override** ボタン）

**`HapbeatAddressOverridePanel` を 1 個アタッチする**

GameObject に追加するだけで、player / group を選んで Apply する実行時 UI が生成されます。シーン側で UI 階層を組む必要はありません。

- `Space` で `ScreenSpaceOverlay`（画面固定 HUD・既定）と `WorldSpace`（VR 用 3D パネル）を切り替え
- `WorldSpace` では `World Attach Mode` で `LazyFollow`（既定・視界から外れたときだけ正面へ移動）と `WorldFixed`（置いた場所に固定）を選択
- Showcase サンプルの `AddressOverrideDemo` はこのパネルを継承しただけの薄いクラスで、独自 UI の出発点として読めます

### appName に `<p>` / `<g>` を埋めておく

`HapbeatConfig.appName` に `<p>` / `<g>` を含めると、送信直前に現在の override 値へ置換されて OLED に表示されます（無効時は `-`）。

```text
appName = "Booth <p>/<g>"
→ player=3, group 無効: "Booth 3/-"
```

現場で「この HMD が正しい Hapbeat とペアか」を、デバイスの画面だけで確認できます。

### 運用のポイント

- **EventMap の target のプレイヤー部分は `*`** にしておく — override 無効の端末では全デバイスに、設定済みの端末ではペア先だけに届き、同じ EventMap を使い回せます
- **group override を使うならデバイス側の group 番号も合わせる** — アドレス照合は位置ベースなので、`group_5` 宛ては group_5 のデバイスにしか届きません
- **最終確認は実運用プラットフォームで 1 回行う** — Quest 向けなら Quest ビルドで PlayerPrefs の永続化と OLED 表示を確認してください

### VR 実機だけ文字が滲む場合

Editor（Air Link）では綺麗なのに Quest 実機ビルドだけ甘い場合、**Quality レベルがプラットフォームごとに別**であることが原因です。Air Link の Editor Play は Standalone 側、実機ビルドは Android 側を使います。

- VR テンプレートの既定 URP アセット `Mobile_RPAsset` は **Render Scale 0.8** です。`Project Settings > Quality` で Android 側のアセットを開き `1.0` にすると改善します
- パネルの `World Pixel Density`（既定 `3`、範囲 `1〜8`）を上げると、同じ物理サイズのまま高解像度でラスタライズします

いずれも**利用側プロジェクトの設定**で、SDK からは変更できません。

## strict source filter が欲しい場合

「同じネットワーク・同じ番号で、複数アプリを排他的に切り替えたい」用途には、送信元アプリ ID による strict source filter が技術的には可能です（デバイスが最初の app_id を pin し、他を無視）。ただし contracts / firmware / SDK の同時改修が必要な設計判断のため、現時点では未実装です。

ユースケースを添えて [GitHub Issues](https://github.com/Hapbeat/hapbeat-unity-sdk/issues) にご連絡ください。

## まとめ

| 状況 | 対応 |
|---|---|
| 通常運用（1 デバイス = 1 アプリ） | 既定のままで OK |
| 同じネットワークに複数アプリ + 複数 Hapbeat | **player / group で分ける** |
| 同一ビルドを複数 HMD に配る | **Address Override（this device）** |
| strict source filter が必要 | Issues に連絡（未実装） |
