---
title: ターゲティング
kind: explanation
sidebar:
  order: 200
description: どのデバイスに触覚フィードバックを届けるかを決める仕組みと、構成ごとに player / position / group のどれで分けるべきかの指針。
---

<!-- hapbeat:include targeting-overview -->

## Unity で設定する

### Event Map の Target を設定する

通常の送信先は Event Map entry ごとに決めます。`Hapbeat → Open Event Map` で Event Map を開き、entry の **Targeting** を編集します。例えば `*/pos_neck` を指定すると、その entry を再生するすべての Trigger が neck の Hapbeat だけへ送ります。

Event Map の Target は、触覚演出そのものに属する送信先です。同じ entry を再生する GameObject ごとに設定を重複させる必要はありません。

### Address Override を選ぶ

複数 HMD で同じ Event Map を使い、端末ごとに送信先だけ変えたい場合は、Event Map を編集せず Address Override を使います。

-   **this build** — `Hapbeat → Open Settings` の Override Addressing。展示端末用に player / group を固定する場合。
-   **this device** — 下記の API または実行時パネル。1 本の build を配り、起動した端末ごとに player / group を選ぶ場合。

Address Override は Event Map の Target を上書きするだけで、asset 自体は変更しません。

### スクリプトから設定

```csharp
// 起動時、または設定画面で番号を確定するタイミングで呼ぶ
HapbeatManager.Instance.SetAddressOverride(player: 3, group: HapbeatManager.AddressOverrideDisabled, persist: true);
```

-   `player` / `group` は 1〜99。`AddressOverrideDisabled`（`-1`）を渡した軸は上書きしない
-   `persist: true` で PlayerPrefs に保存され、次回起動時も復元
-   付け替え時は `ClearPersistedAddressOverride()` を呼ぶ（Play モード中は `HapbeatManager` インスペクタの **Clear Saved Override** ボタン）

現在の値は `Hapbeat > Open Runtime Status` で確認できる（→ [Editor メニュー一覧](/docs/sdk-integration/unity-sdk/editor-menus/)）。

### 設定パネルを置く

`HapbeatAddressOverridePanel` を GameObject に 1 個追加するだけで、player / group を選んで Apply する実行時 UI が生成される。シーン側で UI 階層を組む必要はない。画面固定の HUD としても、VR 用の 3D パネルとしても置ける。

設定項目とコントローラー操作の受け付け方は [その他のコンポーネント](/docs/sdk-integration/unity-sdk/components/) を参照。

### 実例

| サンプル | 内容 |
| --- | --- |
| **VR Config Example** | override 設定専用のシーン。VR 側の設定画面としてそのまま流用可能 |
| **Showcase / Z4 Stream Console** | `AddressOverrideDemo` がパネルを継承しただけの薄いクラス。独自 UI の出発点として読める |

いずれも Package Manager の Samples から Import する。

## 現場での確認手段

`HapbeatConfig.appName` に `<p>` / `<g>` を含めると、送信直前に現在の override 値へ置換されて OLED に表示される（無効時は `-`）。

```text
appName = "Booth <p>/<g>"
→ player=3, group 無効: "Booth 3/-"
```

「この HMD が正しい Hapbeat とペアか」をデバイスの画面だけで確認可能。

## 運用上の注意

-   **EventMap のターゲットのプレイヤー部分は `*` にしておく** — override 無効の端末では全デバイスに、設定済みの端末ではペア先だけに届き、同じ EventMap を使い回せる
-   **group override を使うならデバイス側の group 番号も合わせる** — 照合は位置ベースのため、`group_5` 宛ては group\_5 のデバイスにしか届かない
-   **送信元アプリ単位の排他制御は未実装** — 同じ番号を使う複数アプリを排他的に切り替える機能（デバイスが最初の app\_id を pin する方式）は、contracts / firmware / SDK の同時改修を要するため現時点では無い。必要な場合はユースケースを添えて [GitHub Issues](https://github.com/Hapbeat/hapbeat-unity-sdk/issues) へ

## 関連

-   [Address の仕組み](/docs/concepts/group-player-addressing/) — アドレスの仕様
-   [通信モデル](/docs/concepts/communication-model/) — 送信経路と台数の目安
-   [Editor メニュー一覧](/docs/sdk-integration/unity-sdk/editor-menus/) — Settings / Runtime Status の場所
