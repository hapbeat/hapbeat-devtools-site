---
title: VR Config Example
kind: howto
sidebar:
  order: 200
description: VR 実機で Address Override の設定とテスト再生を行う最小サンプル。自分のプロジェクトの設定画面としてそのまま流用できる。
---

VR 実機（Quest 等）で **Address Override の設定とテスト再生**を行うための最小シーン。ヘッドセットを被ったまま、どの Hapbeat とペアにするかを決められる。

**XR Interaction Toolkit に依存しない。** Input System だけで動くため、XRI を導入していないプロジェクトにもそのまま入る。

## 何ができるか

- **player / group の設定** — パネル上で番号を選び、Apply で確定。`persist` されるので次回起動時も復元される
- **テスト再生** — Play ボタンでその場で振動を確認。同梱の EventMap が CLIP エントリ（100Hz sine）なので、**デバイスへの Kit 配備は不要**
- **自分のシーンへの復帰** — Exit の戻り先を設定しておけば、設定画面として自プロジェクトに組み込める

## 導入

1. **Package Manager の Samples から *VR Config Example* を Import**
2. **`Scenes/VRConfigExample.unity` を開いて Build / Play**
3. **Hapbeat を同じ Wi-Fi に接続**

## 操作

コントローラーの操作は **2 つだけ**。左右どちらの手でも同じ操作ができる（左右で役割が分かれていない）。

| 操作 | 割り当て | キーボード |
|---|---|---|
| フォーカス移動 | スティックを倒す（左右どちらでも） | 矢印キー |
| 決定 | トリガー / A(X) / B(Y) のいずれか（左右どちらでも） | Enter / Space |
| パネルを正面へ引き寄せ | スティック押し込み | R |

Player -/+ ・ Group -/+ ・ Play ・ Apply ・ Exit のすべてがパネル内のボタンとして 2D グリッドに並んでおり、上記 2 操作だけで完結する。

:::note[パネルは頭に固定されません]
パネルとガイドは**遅延追従（lazy follow）**します。視界中央から一定角度以内にある間はワールド固定のままで、それを超えて見回したときだけ正面へ滑らかに移動します。頭に密着させると XR コンポジタの再投影が重なって UI が泳いで見えるためです。

起動時に自動で正面へ寄せることはしません。位置を合わせたいときはスティック押し込みで引き寄せてください。
:::

## 自分のプロジェクトに組み込む

`VRConfigExampleController` の **Return Scene** に戻り先シーンを指定すると、Exit で自分のシーンへ復帰する。これにより、**このシーンをそのまま「Hapbeat 設定画面」として使える**。

自前の UI を作りたい場合は、`HapbeatAddressOverridePanel` を GameObject に 1 つ追加するだけでも同等の設定 UI が生成される（→ [](/docs/sdk-integration/unity-sdk/targeting/#override-targeting)）。

## 関連

- [](/docs/sdk-integration/unity-sdk/targeting/) — player / group の決め方と Override targeting の仕組み
- [](/docs/sdk-integration/unity-sdk/showcase/overview/) — XR 不要で全配線パターンを確認できるサンプル
