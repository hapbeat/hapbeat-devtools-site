---
title: 複数アプリを共存させる
kind: howto
sidebar:
  order: 200
description: 1 台の Hapbeat デバイスに対して複数の Unity アプリ (またはアプリ + Hapbeat Studio など) を同時稼働させる場合の運用指針と回避策。
---

Hapbeat SDK は **「1 デバイス = 1 アプリ専用」を基本想定** としています。1 つの Hapbeat デバイスに対して複数のクライアントアプリ (App A と App B、もしくはアプリ + Hapbeat Studio) を**同時に**接続させると、振動コマンドが衝突したり、デバイスのディスプレイ表示が頻繁に切り替わるなどの挙動になります。

このページは「どうしても複数アプリを共存させたい」場合の運用指針です。

---

## なぜ衝突するのか

Hapbeat デバイスは UDP broadcast で受け取る触覚コマンドを、`group_id` フィルタにのみ依存して処理します。送信元アプリを区別する仕組みは v0.1.0 時点では実装されていません。

そのため:

- App A が `event_id=A.foo` で発火 → デバイスが振動
- 同時に App B が `event_id=B.bar` で発火 → デバイスが**両方**振動 (重なって意図しない触覚に)
- `CONNECT_STATUS` で送られてくる `appName` は最後に届いた方で上書きされるため、ディスプレイ表示が A・B でちらつく

---

## 推奨: 物理的に LAN を分離する (一番シンプル)

最も確実で、設定もシンプルです。

### パターン 1: ルーター / SSID を分ける

- App A の PC + App A 用 Hapbeat → ルーター A (SSID `studio-a`)
- App B の PC + App B 用 Hapbeat → ルーター B (SSID `studio-b`)

それぞれの LAN 内では UDP broadcast が独立しているので、**お互いの Hapbeat に到達しない**。設定不要で完全に分離できます。

### パターン 2: Hapbeat 自体を SoftAP として使う

VR HMD や PC を Hapbeat の SoftAP に直接接続する構成。複数の Hapbeat を別々の SoftAP として動かせば、独立した小さな LAN が複数できあがるのと同じ。

- アプリ A → Hapbeat A の SoftAP `hapbeat-a-XXXX` に接続
- アプリ B → Hapbeat B の SoftAP `hapbeat-b-XXXX` に接続

> 詳細な接続シナリオは workspace の CLAUDE.md (Connection scenarios A–E) を参照してください。

---

## 次善策: group ID で切り分ける

LAN を分けられない (同じ展示ブースで複数アプリ・Hapbeat 多数台、など) 場合は、**group ID の範囲を分けて運用** することで切替自体は実現できます。

### 例: A・B でグループ範囲を分ける

| アプリ | 使う group ID |
|---|---|
| App A | 0〜10 (player 0〜10) |
| App B | 11〜20 (player 11〜20) |

- 各 Hapbeat デバイスには Hapbeat Studio または Hapbeat Helper の Settings から **個別に group ID を割り当て** ておく (例: 1, 2, 3, ..., 11, 12, ...)
- App A は実行時に `HapbeatManager.Instance.SetAddressOverride(player, group, persist: true)` を呼び、group を 1〜10 のいずれかに固定
- App B は同様に group を 11〜20 のいずれかに固定

各 Hapbeat は自分の group ID に対する packet しか拾わないので、振動衝突は起きません。

### この方法の制約

- **ディスプレイ上のアプリ名表示は混乱します**: App A・App B の両方が同じネットワークに CONNECT_STATUS をブロードキャストするため、デバイス側の `app_name` 表示は最後に届いたアプリ名で上書きされる
  - 触覚自体は group filter で正しく分離されるので動作には影響しない
  - 表示で「自分のアプリと繋がっているか」を確認したい場合はこの方法では不十分
- group ID 範囲の管理は運用ルールで縛る必要がある (アプリ A が誤って 15 を送信すれば B のデバイスに伝わる)

---

## 同一ビルドを複数 HMD に配布する場合 (Address Override)

上記は「複数アプリを 1 台の Hapbeat に向ける」ケースでしたが、逆に **「同一の Unity ビルドを複数の HMD に配布し、各端末を自分の Hapbeat に 1:1 で向けたい」** ケース (展示ブースで HMD×Hapbeat のペアを何組も並べる、貸出機材を毎回同じビルドで運用する、など) もよくあります。

このユースケースでは、HMD ごとにビルドを分ける必要はありません。**Address Override はビルド設定 (`HapbeatConfig`) には存在せず、常に実行時 API で設定します** — SDK が持つ **Address Override** 機能を使うと、全端末に同一ビルドを配布したまま、各端末側で player/group を選ぶだけで済みます。

### 設定する 2 つの導線

1. **スクリプトから直接呼ぶ**: `HapbeatManager.Instance.SetAddressOverride(player, group, persist: true)`。
   `player` / `group` は 1〜99、`HapbeatManager.AddressOverrideDisabled` (`-1`) を渡すとそのまま (EventMap 側の target を上書きしない)。
   `persist: true` を指定すると PlayerPrefs に保存され、次回起動時も同じ値が自動的に復元されます — **これが「1 本のビルドを何台もの HMD に配り、各端末を自分の Hapbeat に紐付ける」フローの基本形**です。
2. **`HapbeatAddressOverridePanel` コンポーネントを 1 個アタッチする**: GameObject に追加するだけで、player/group を +/- ステッパーで選び Apply する実行時 UI が自動生成されます。シーン側で UI 階層を組む必要はありません。
   - `Space` (Inspector) で `ScreenSpaceOverlay` (画面固定 HUD、既定) と `WorldSpace` (VR コントローラーや空間に貼り付ける 3D パネル) を切り替え可能。
   - Showcase サンプルの `AddressOverrideDemo` (Z4_Stream) は、この `HapbeatAddressOverridePanel` をそのまま継承しただけの薄いクラスです — 独自 UI を実装したい場合の最小の出発点として読めます。

```csharp
// 起動時、または設定画面でユーザーが選んだ番号を確定するタイミングで呼ぶ
HapbeatManager.Instance.SetAddressOverride(player: 3, group: HapbeatManager.AddressOverrideDisabled, persist: true);
```

デバイス側の対応は不要です。プロトコルやファームウェアの変更なしに動作します。各 Hapbeat 本体のボタン操作で player/group 番号を設定するだけで、SDK 側の override とデバイス側の番号を一致させれば 1:1 のペアリングが成立します。

### appName に \<p\>/\<g\> を埋め込むと現場で確認しやすい

`HapbeatConfig.appName` の文字列内に `<p>` / `<g>` を含めておくと、送信直前に現在の override 値へ自動置換されてからデバイスの OLED (`app_name` 要素) に表示されます。override が無効なときはそれぞれ `-` に置き換わります。

```text
appName = "Booth <p>/<g>"
→ player=3, group 無効 のとき: "Booth 3/-"
→ override 無効のとき:          "Booth -/-"
```

現場で「この HMD は正しい Hapbeat とペアになっているか」を、デバイスの画面だけで即座に確認できます。

### ベストプラクティス

- **ビルドは全端末共通、個体差は端末側で持つ**: `SetAddressOverride(..., persist: true)` は PlayerPrefs (端末ローカル) に保存されるので、ビルド自体は 1 本のまま何台の HMD にも配布できます。player/group の割り当ては配布後、各端末側で 1 回設定すれば済みます。
- **EventMap の target は端末非依存に作る**: target のプレイヤー部分は `*` (ワイルドカード) にしておきます。override が無効な端末ではそのまま全デバイスに届き、override を設定した端末ではペア先の Hapbeat だけに届く — 同じ EventMap をそのまま両方の運用で使い回せます。
- **group は「override」とは別の軸として使う**: player の 1:1 ペアリングとは別に、「チームで一斉に鳴らす」といった用途には group を使う、という住み分けが安全です。
- **付け替え時は明示的にクリアする**: 端末を別の Hapbeat に付け替える場合は `HapbeatManager.Instance.ClearPersistedAddressOverride()` を呼ぶか、Play モード中は `HapbeatManager` インスペクタの **Clear Saved Override** ボタンを押します。クリア後は override 無効 (config 側にフォールバックする default 値は存在しません) に戻ります。
- **最終検証は実運用プラットフォームで 1 回行う**: Editor 上の Play モードでの確認に加えて、Quest 向けなら Quest ビルドで実際に PlayerPrefs の永続化・OLED 表示・ペアリングが機能することを最低 1 回確認してください。

---

## それでも source-app 単位の strict filter が欲しい場合

「同じ LAN・同じ group で、複数アプリを排他的に切り替えたい」用途 (例: 同じ Hapbeat を A・B で時間分けて使う、エンタープライズデモなど) には、**送信元アプリ ID による strict source filter** の追加が技術的には可能です:

- 各アプリに UUID / app_id を持たせる
- Hapbeat デバイスは最初に受け取った app_id を pin、それ以外を無視
- デバイス上のボタン操作で pin 解除 → 新しい app_id を受け入れ可能

bHaptics エンタープライズ版に近い設計ですが、**実装には contracts / device firmware / SDK の同時改修が必要** (DEC レベルの設計判断)。

需要があれば実装を検討するので、ユースケースを添えて [GitHub Issues](https://github.com/Hapbeat/hapbeat-unity-sdk/issues) にご連絡ください。

---

## まとめ

| 状況 | 推奨対応 |
|---|---|
| 通常運用 (1 デバイス = 1 アプリ) | デフォルト構成で OK |
| 同じ部屋で複数アプリ + 複数 Hapbeat | **LAN / SoftAP を物理分離** (最推奨) |
| LAN 分離不可・触覚切替だけしたい | **group ID 範囲で分割** (表示は混乱するが動作は OK) |
| strict source filter が必要 | Issues に連絡 (現時点では未実装) |
