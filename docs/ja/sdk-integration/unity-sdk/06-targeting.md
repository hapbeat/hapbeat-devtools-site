---
title: ターゲティング
kind: explanation
sidebar:
  order: 200
description: どのデバイスを鳴らすかを決める仕組みと、構成ごとに player / position / group のどれで分けるべきかの指針。
---

Hapbeat のコマンドは、同じネットワーク上のデバイスに届く。どのデバイスが反応するかは、コマンドに含まれる **ターゲット文字列**と、各デバイスが持つ**アドレス**の照合で決まる。

デバイスのアドレスは 3 つのセグメントからなる正準形である。

```
player_<N> / <position> / group_<M>
    │            │             └ 一斉制御の単位（1〜99）
    │            └ 装着部位（pos_neck, pos_r_arm など）
    └ プレイヤー番号（1〜99）
```

送信側のターゲットは前方一致で照合され、`*` は 1 セグメント分の任意値にマッチする。したがって `player_2` は player 2 の全デバイスに、`*/pos_neck` は全プレイヤーの首だけに届く。

**どのセグメントで分けるかは、電波が届く 1 つの範囲（同一 Wi-Fi / 同一 AP）の中に、送信側と受信側が何台いるかで決まる。**

## 構成別の指針

| 構成 | 分ける軸 | 設定 |
|---|---|---|
| 送信 1 : 受信 1 | 分けない | 既定のまま |
| 送信 1 : 1 人が複数装着 | **position** | 装着部位を設定し、EventMap の target で撃ち分ける |
| 送信 1 : 複数プレイヤー | **player** | 各デバイスに player 1, 2, 3 … を割り当てる |
| 1:1 のペアが複数組（LBE 等） | **group** | ペアごとに group 1〜N を割り当て、アプリ側は override で固定 |
| 複数アプリが同居 | **player / group** | アプリごとに使う番号の範囲を決める |

### 送信 1 : 受信 1

分ける必要はない。override は無効のままでよく、EventMap の target も空または `*` で全て届く。**最も一般的な構成であり、設定は不要**。

### 送信 1 : 1 人が複数装着

同一プレイヤーの首と右腕を撃ち分ける、といった構成では **position** を使う。player と group は共通でよい。

- 各デバイスの position を Studio または本体ボタンから設定する（`pos_neck` / `pos_r_arm` など固定語彙）
- EventMap のエントリごとに target を `*/pos_neck` `*/pos_r_arm` と指定する

### 送信 1 : 複数プレイヤー

1 つのアプリが 3 人に別々の触覚を出す構成では **player** で分ける。

- 各デバイスに player 1 / 2 / 3 を割り当てる
- EventMap の target を `player_1` のように指定するか、送信のたびに override を切り替える

### 1:1 のペアが複数組

HMD と Hapbeat のペアを 5 組並べる LBE のような構成では、**group をペアの識別子**として使う。

- デバイス側に group 1〜5 を割り当てる
- 各 HMD のアプリで同じ番号を override として固定する
- EventMap は 5 組で共通のまま使い回せる

**全端末に同一ビルドを配ったまま運用できる**のがこの方式の利点である。ビルドを組ごとに分ける必要はない。

### 複数アプリが同居

デバイスは送信元アプリを区別しない。同じネットワークに複数のアプリが並ぶ場合は、**アプリごとに使う player / group の範囲を決める**（例: App A = player 1〜10、App B = player 11〜20）。

:::caution[OLED のアプリ名表示は分離できない]
触覚は分離されるが、`CONNECT_STATUS` の `appName` は最後に届いたもので上書きされる。表示で「自分のアプリと繋がっているか」を確認する用途には向かない。
:::

## 番号は 1 以外から振る

デバイスのアドレスは常に正準形で保持され、**既定値は `player_1` / `group_1`** である。「group 未設定のデバイス」という状態は存在しない。

つまり**設定し忘れた機体はすべて 1 番に合流する**。デモや組の番号を **2, 3, … と 1 以外から振っておく**と、設定漏れの機体が「どこにも反応しない」形で即座に判別できる。

## 固定の 2 つの単位

アプリ側からアドレスを固定する手段は 2 つあり、player / group の軸ごとに独立して指定できる。

| 単位 | 設定場所 | 用途 |
|---|---|---|
| **this build** | `Hapbeat > Settings` の Override Addressing | ビルド全体で固定。デモごとにビルドを分ける場合 |
| **this device** | 実行時 API / 設定パネル | 端末ごとに変える。1 本のビルドを配る場合 |

デバイス側の対応は不要で、プロトコルやファームウェアの変更なしに動作する。

### 端末ごとに設定する導線

**スクリプトから呼ぶ**

```csharp
// 起動時、または設定画面で番号を確定するタイミングで呼ぶ
HapbeatManager.Instance.SetAddressOverride(player: 3, group: HapbeatManager.AddressOverrideDisabled, persist: true);
```

- `player` / `group` は 1〜99。`AddressOverrideDisabled`（`-1`）を渡した軸は上書きしない
- `persist: true` で PlayerPrefs に保存され、次回起動時も復元される
- 付け替え時は `ClearPersistedAddressOverride()` を呼ぶ（Play モード中は `HapbeatManager` インスペクタの **Clear Saved Override** ボタン）

**`HapbeatAddressOverridePanel` をアタッチする**

GameObject に 1 個追加するだけで、player / group を選んで Apply する実行時 UI が生成される。シーン側で UI 階層を組む必要はない。

- `Space` で `ScreenSpaceOverlay`（画面固定 HUD・既定）と `WorldSpace`（VR 用 3D パネル）を切り替える
- `WorldSpace` では `World Attach Mode` に `LazyFollow`（既定・視界から外れたときだけ正面へ移動）と `WorldFixed`（置いた場所に固定）がある
- 実機だけ文字が滲む場合は、Android 側の URP アセットの Render Scale（VR テンプレート既定は 0.8）と、パネルの `World Pixel Density`（既定 3）を上げる
- Showcase サンプルの `AddressOverrideDemo` はこのパネルを継承しただけの薄いクラスで、独自 UI の出発点として読める

## 現場での確認手段

`HapbeatConfig.appName` に `<p>` / `<g>` を含めると、送信直前に現在の override 値へ置換されて OLED に表示される（無効時は `-`）。

```text
appName = "Booth <p>/<g>"
→ player=3, group 無効: "Booth 3/-"
```

「この HMD が正しい Hapbeat とペアか」をデバイスの画面だけで確認できる。

## 運用上の注意

- **EventMap の target のプレイヤー部分は `*` にしておく** — override 無効の端末では全デバイスに、設定済みの端末ではペア先だけに届き、同じ EventMap を使い回せる
- **group override を使うならデバイス側の group 番号も合わせる** — 照合は位置ベースなので、`group_5` 宛ては group_5 のデバイスにしか届かない
- **送信元アプリ単位の排他制御は未実装** — 同じ番号を使う複数アプリを排他的に切り替える機能（デバイスが最初の app_id を pin する方式）は、contracts / firmware / SDK の同時改修を要するため現時点では無い。必要な場合はユースケースを添えて [GitHub Issues](https://github.com/Hapbeat/hapbeat-unity-sdk/issues) へ

## 関連

- [](/docs/concepts/group-player-addressing/) — アドレスの仕様
- [](/docs/concepts/communication-model/) — 送信経路と台数の目安
