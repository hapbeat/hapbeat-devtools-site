---
title: ターゲティング
kind: explanation
sidebar:
  order: 200
description: どのデバイスに触覚フィードバックを届けるかを決める仕組みと、構成ごとに player / position / group のどれで分けるべきかの指針。
---

Hapbeat のコマンドは、同じネットワーク上のデバイスに届く。どのデバイスが反応するかは、コマンドに含まれる**ターゲット文字列**と、各デバイスが持つ**アドレス**の照合で決まる。

デバイスのアドレスは 3 セグメントの正準形。

```
player_<N> / <position> / group_<M>
    │            │             └ 一斉制御の単位（1〜99）
    │            └ 装着部位（pos_neck, pos_r_arm など）
    └ プレイヤー番号（1〜99）
```

送信側のターゲットは前方一致で照合され、`*` は 1 セグメント分の任意値にマッチ。したがって `player_2` は player 2 の全デバイスに、`*/pos_neck` は全プレイヤーの首だけに届く。仕様の詳細は [](/docs/concepts/group-player-addressing/) を参照。

**どのセグメントで分けるかは、電波が届く 1 つの範囲（同一 Wi-Fi / 同一 AP）の中に、送信側と受信側が何台いるかで決まる。**

## 構成別の指針

| 構成 | 分ける軸（推奨） | 設定 |
|---|---|---|
| 送信：1 / 受信：1 種類 | 分けない | 既定のまま |
| 送信：1 / 受信：1 人が複数装着 | **position** | 装着部位を設定し、ターゲットで撃ち分け |
| 送信：1 / 受信：複数プレイヤー | **player** | 各デバイスに player 1, 2, 3 … を割り当て |
| 送信：N / 受信：N（1:1 のペアが N 組） | **group** + override | ペアごとに group を割り当て、送信側で固定 |
| 送信：複数 / 受信：混在 | **group** | 送信元ごとに group の範囲を分割 |

### 送信：1 / 受信：1 種類

**受信側が何台あっても、全台が同じ信号で振動してよいなら分ける必要はない。** override は無効のままでよく、ターゲットも空または `*` で全台に届く。1 人 1 台の構成はもちろん、複数人が同じ演出を共有する展示なども該当する。最も一般的な構成であり、設定は不要。

:::note[番号は 1 以外から振ると事故が減ります]
デバイスのアドレスは常に正準形で保持され、既定値は `player_1` / `group_1` です。「group 未設定のデバイス」という状態は存在しません。

つまり設定し忘れた機体はすべて 1 番に合流します。デモや組の番号を 2, 3, … と 1 以外から振っておくと、設定漏れの機体が「どこにも反応しない」形ですぐに分かります。
:::

### 送信：1 / 受信：1 人が複数装着

同一プレイヤーが複数の Hapbeat を装着し、それぞれ別々の haptics を出す場合は **position** で分ける。3 つの軸は機能的には等価なので player や group でも実現できるが、部位の識別は position が意味的に自然で、後からプレイヤーを増やす際に player 軸を空けておける。

- 各デバイスの position を Studio または本体ボタンから設定（`pos_neck` / `pos_r_arm` など固定語彙）
- ターゲットを `*/pos_neck` `*/pos_r_arm` と指定して撃ち分け

### 送信：1 / 受信：複数プレイヤー

1 つの送信元が 3 人に別々の haptics を出す構成では **player** で分ける。

- 各デバイスに player 1 / 2 / 3 を割り当て
- ターゲットを `player_1` のように指定するか、送信のたびに override を切り替え

### 送信：N / 受信：N（1:1 のペアが N 組）

HMD と Hapbeat のペアを 5 組並べる LBE のような構成では、**group をペアの識別子**として使う。

具体的には、次のように**両側に同じ番号を振る**。

| ペア | HMD 側（アプリの override） | Hapbeat 側（デバイスのアドレス） |
|---|---|---|
| 1 組目 | group 1 | group 1 |
| 2 組目 | group 2 | group 2 |
| … | … | … |
| 5 組目 | group 5 | group 5 |

こうすると HMD 1 からの送信は group 1 の Hapbeat にしか届かず、隣のペアには影響しない。デバイス側の番号は Studio または本体ボタンから、アプリ側の番号は override から設定する（→ [Override targeting](#override-targeting)）。

EventMap は 5 組で共通のまま使い回せるため、**全端末に同一ビルドを配ったまま運用できる**。ビルドを組ごとに分ける必要はない。

### 送信：複数 / 受信：混在

デバイスは送信元を区別しない。同じネットワークに複数の送信元（別々のアプリ、あるいは別々の PC / 送信機）が並ぶ場合は、**送信元ごとに使う group の範囲を分割**する（例: A = group 1〜10、B = group 11〜20）。プレイヤー単位の制御が別途必要なら player 軸をそちらに残せるため、送信元の分離には group を充てるのが扱いやすい。

## Override targeting

EventMap の各エントリに書いたターゲットを、**送信の直前にアプリ側から上書きする**仕組み。player / group の軸ごとに独立して指定でき、上書きしない軸は EventMap の指定がそのまま使われる。

これにより、**EventMap を書き換えずに、実行時の設定だけで送信先を切り替えられる**。同一ビルドを複数の端末へ配り、端末ごとに別の Hapbeat とペアリングする運用がこれで成立する。デバイス側の対応は不要で、プロトコルやファームウェアの変更なしに動作する。

上書きが走るのはコマンド送信の瞬間だけで、フレーム単位でもストリームのチャンク単位でもない。

固定の単位は 2 つ。

| 単位 | 設定場所 | 用途 |
|---|---|---|
| **this build** | `Hapbeat > Open Settings` の Override Addressing | ビルド全体で固定。デモごとにビルドを分ける場合 |
| **this device** | 実行時 API / 設定パネル | 端末ごとに変える。1 本のビルドを配る場合 |

### スクリプトから設定

```csharp
// 起動時、または設定画面で番号を確定するタイミングで呼ぶ
HapbeatManager.Instance.SetAddressOverride(player: 3, group: HapbeatManager.AddressOverrideDisabled, persist: true);
```

- `player` / `group` は 1〜99。`AddressOverrideDisabled`（`-1`）を渡した軸は上書きしない
- `persist: true` で PlayerPrefs に保存され、次回起動時も復元
- 付け替え時は `ClearPersistedAddressOverride()` を呼ぶ（Play モード中は `HapbeatManager` インスペクタの **Clear Saved Override** ボタン）

現在の値は `Hapbeat > Open Runtime Status` で確認できる（→ [](/docs/sdk-integration/unity-sdk/editor-menus/)）。

### 設定パネルを置く

`HapbeatAddressOverridePanel` を GameObject に 1 個追加するだけで、player / group を選んで Apply する実行時 UI が生成される。シーン側で UI 階層を組む必要はない。画面固定の HUD としても、VR 用の 3D パネルとしても置ける。

設定項目とコントローラー操作の受け付け方は [](/docs/sdk-integration/unity-sdk/components/) を参照。

### 実例

| サンプル | 内容 |
|---|---|
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

- **EventMap のターゲットのプレイヤー部分は `*` にしておく** — override 無効の端末では全デバイスに、設定済みの端末ではペア先だけに届き、同じ EventMap を使い回せる
- **group override を使うならデバイス側の group 番号も合わせる** — 照合は位置ベースのため、`group_5` 宛ては group_5 のデバイスにしか届かない
- **送信元アプリ単位の排他制御は未実装** — 同じ番号を使う複数アプリを排他的に切り替える機能（デバイスが最初の app_id を pin する方式）は、contracts / firmware / SDK の同時改修を要するため現時点では無い。必要な場合はユースケースを添えて [GitHub Issues](https://github.com/Hapbeat/hapbeat-unity-sdk/issues) へ

## 関連

- [](/docs/concepts/group-player-addressing/) — アドレスの仕様
- [](/docs/concepts/communication-model/) — 送信経路と台数の目安
- [](/docs/sdk-integration/unity-sdk/editor-menus/) — Settings / Runtime Status の場所
