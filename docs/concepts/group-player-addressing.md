---
title: Address の仕組み
kind: explanation
description: 複数 Hapbeat を 1 つのネットワークで同時に動かすための address 設計と、Group / Player の役割。
sidebar:
  order: 4
---

Hapbeat の通信は UDP broadcast が基本です。複数のデバイスを同じネットワークに混在させたとき、**どのパケットを誰が再生するか** を決めるのが address です。このページは address 文字列の組み立て方と、その背景にある設計判断を説明します。

仕様の正式定義は [Contracts: device-addressing](https://github.com/Hapbeat/hapbeat-contracts/blob/master/specs/device-addressing.md) を参照。

## address の形式

```
[prefix/] player_{N} / {position} [/group_{M}]
```

- `prefix` — 任意 (0 段以上)。チーム / アプリ識別など自由文字列 (例: `red/alpha`)
- `player_{N}` — **必須**。`N` は 1..99
- `{position}` — **必須**。装着部位を示す定義済み語彙 (例: `chest` / `band` / `left_upper_arm`)
- `group_{M}` — 任意 (0 または 1 段)。**`{position}` の直後** に置く。`M` は 1..99

セグメント区切りは `/` (スラッシュ)、使用可能文字は `[a-zA-Z0-9_-]`、address 全体の最大長は 64 bytes (null 終端含む) です。

### address 例

| 構成 | address |
|---|---|
| シンプル (1 人 1 台) | `player_1/chest` |
| マルチプレイヤー | `player_1/chest`, `player_2/left_upper_arm` |
| チーム制 | `red/player_1/chest` |
| チーム + 小隊 | `red/alpha/player_3/chest` |
| グループ分離 | `player_1/chest/group_1`, `player_1/chest/group_2` |

`group_{M}` を **付けない address は全グループのデバイスが受信** します。1 人で使うときは省略して構いません。

## Player と Group の役割

| 概念 | 用途 | 値域 |
|---|---|---|
| **Player 番号** | 同じ "プレイヤー" に属する複数デバイスをまとめる単位。1 人が首掛けと腰の 2 台を装着する場合、両方に同じ player 番号を割り当てる | 1..99 |
| **Group ID** | プレイヤー同士を分離する単位。同じ Wi-Fi 上の別グループ (別ブース・別チーム) が混信しないようにする | 1..99 |

OLED 表示 (`Gr:01..99` / `P:01..99`) と整合させるため、Player / Group とも **`1..99` 固定** です ([DEC-030](https://github.com/Hapbeat/hapbeat-sdk-workspace/blob/master/docs/decision-log.md#DEC-030))。技術的には `uint8_t` で 255 まで保持できるため、将来必要になれば拡張可能です。

## なぜ broadcast + デバイス側フィルタにしたか

| 設計判断 | 理由 |
|---|---|
| **デバイス IP を管理しない** | DHCP で IP が変わってもアドレス指定の更新は不要 |
| **1 台でも複数台でも送信コードが同じ** | unicast / broadcast の切替や宛先テーブルが不要 |
| **PC / Quest / スマホで同一の動作** | 各プラットフォームの UDP socket API だけで完結 |
| **Bridge / 中継サーバ不要** | アプリ起動だけで触覚が出る、オフラインでも動く |

このため Hapbeat は「中央サーバが存在しない / クラウド不要」設計が成立しています。詳細は [通信モデル](./communication-model/) を参照。

## 接続シナリオでの使い分け

| シナリオ | Player | Group |
|---|---|---|
| 単独プレイヤー LAN | 1 | (省略 — 全グループ受信) |
| マルチプレイヤー LAN | プレイヤー毎に固有 | プレイヤー毎に固有 |
| Hapbeat SoftAP (HMD など) | 1 | (省略) |
| 展示ブース隔離 | 1 | ブース毎に固有 |

「**他人と混信させないために Group を使う**」「**1 人の複数装着を区別するために `{position}` を使う**」と覚えれば運用は単純です。

## 歴史的経緯

過去には address とは別に `target_group` (uint8) フィールドが wire protocol 上に存在していました。これは 2026-05-09 の [DEC-030](https://github.com/Hapbeat/hapbeat-sdk-workspace/blob/master/docs/decision-log.md#DEC-030) で廃止され、**Group は address 末尾の `/group_{M}` suffix に統合** されました。1 つの文字列で完結することで spec が単純化し、firmware / SDK / Studio の 3 リポでの整合性も取りやすくなりました。

## 関連リンク

- [アーキテクチャ全体像](./architecture/)
- [通信モデル](./communication-model/)
- [Contracts 概要](/docs/reference/contracts/overview/) / [device-addressing 仕様](https://github.com/Hapbeat/hapbeat-contracts/blob/master/specs/device-addressing.md)
