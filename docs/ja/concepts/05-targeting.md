---
title: ターゲティング
kind: explanation
description: どの Hapbeat に触覚を届けるかを決める Target と Address Override の共通ガイド。
sidebar:
  order: 5
---

Hapbeat のコマンドは、同じネットワーク上の device に届きます。どの device が再生するかは、コマンドに含まれる **Target** と、device が持つ **Address** の照合で決まります。

Address は 3 セグメントの正準形です。

```text
player_<N> / <position> / group_<M>
    │            │             └ 一斉制御の単位（1〜99）
    │            └ 装着部位（pos_neck、pos_r_arm など）
    └ プレイヤー番号（1〜99）
```

Target は前方一致で照合され、`*` は 1 セグメント分の任意値に一致します。例えば `player_2` は player 2 の全 device に、`*/pos_neck` は全 player の neck に届きます。形式の詳細は<a href="/docs/concepts/group-player-addressing/" target="_blank" rel="noopener noreferrer">アドレス形式</a>を参照してください。

## 構成別の使い分け

| 構成 | 分ける軸 | 設定 |
|---|---|---|
| 送信 1 / 受信 1 種類 | 分けない | 既定のまま |
| 送信 1 / 1 人が複数装着 | **position** | 部位ごとに Address を設定し、Target で指定 |
| 送信 1 / 複数 player | **player** | 各 device に player 番号を割り当て |
| 送信 N / 受信 N（1:1 の組が N 組） | **group** + override | 組ごとに同じ group を割り当て |
| 複数送信元 / 受信混在 | **group** | 送信元ごとに group 範囲を分ける |

### 1 人が複数装着する場合

部位の識別には `position` を使います。各 device の position を設定し、`*/pos_neck` や `*/pos_r_arm` のような Target を指定します。player を増やす予定があれば、player 軸をこの用途に使わない方が扱いやすくなります。

### 複数 player に個別送信する場合

各 device に player 1、2、3 のような番号を割り当て、`player_1` のような Target を使います。送信する player を実行時に切り替える場合は Address Override を使います。

### HMD と Hapbeat が 1:1 で複数組ある場合

LBE のように複数のペアが並ぶ場合は、`group` をペアの識別子にします。HMD 側の override と Hapbeat 側の Address に同じ group 番号を設定します。Event Map は共通のまま、同じビルドをすべての端末に配布できます。

### 複数の送信元が混在する場合

device は送信元を区別しません。別アプリや別 PC が同じネットワークにある場合は、送信元ごとに group の範囲を分けます。例えば送信元 A は group 1〜10、B は group 11〜20 を使います。

## Address Override

Address Override は、Event Map に記録した Target の player / group を**送信直前に上書き**します。各軸は独立して指定でき、off の軸は Event Map に記録した Target をそのまま使います。

これにより Event Map を複製せず、端末ごとの実行時設定だけで送信先を切り替えられます。複数端末へ同じビルドを配布する構成に使います。

| 単位 | 用途 |
|---|---|
| **this build** | ビルド全体で固定する override。展示ごとに別ビルドを作る場合に使用 |
| **this device** | 実行端末ごとに保持する override。1 本のビルドを複数端末へ配る場合に使用 |

各 SDK の設定場所と API は、その SDK のターゲティングページを参照してください。

## 運用のヒント

- Event Map を複数端末で使い回す場合、Target の player 軸は `*` にしておくと、override が off のときは全 player、設定済みのときは指定先へ送れます。
- `group` override を使う場合、Hapbeat 側の group 番号も同じ値にします。
- 既定の Address は `player_1` / `group_1` です。設定漏れとの衝突を避けたい展示では、運用番号を 2 以上から始めると確認しやすくなります。

## 関連

- <a href="/docs/concepts/group-player-addressing/" target="_blank" rel="noopener noreferrer">アドレス形式</a>
- <a href="/docs/concepts/communication-model/" target="_blank" rel="noopener noreferrer">送信経路と台数の目安</a>
