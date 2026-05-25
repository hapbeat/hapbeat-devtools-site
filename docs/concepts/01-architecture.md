---
title: アーキテクチャ全体像
description: Hapbeat SDK を構成する Studio / Helper / SDK / Firmware / Contracts の役割分担と、設計フロー・実行フローの 2 系統を俯瞰する。
kind: explanation
sidebar:
  order: 1
---

このページは Hapbeat SDK エコシステム全体の **設計判断と役割分担** を説明します。「どのコンポーネントが何をしないか」も含めて理解すると、自分のユースケースでどのツールを使えばよいかが見えてきます。

## 全体図

![Hapbeat の構成図。左側が設定・デザインフロー（Studio → Helper → Hapbeat デバイス、PC 経由）、右側がゲーム / アプリ実行フロー（Unity SDK / Quest / PC / スマートフォン → Wi-Fi UDP broadcast → Hapbeat デバイス、直結）](../assets/hapbeat-sdk-architecture.svg)

Hapbeat には **2 つの独立したフロー** があります:

- **設定・デザインフロー** — PC で Kit や UI を設計してデバイスに書き込む（Studio + Helper 経由）
- **実行フロー** — ゲーム / アプリが Hapbeat に触覚を発火する（SDK 直結、Helper 不要）

実行時は **Studio も Helper も不要** です。これが「クラウド必須にしない」「オフラインで動く」設計判断の根本です。

## コンポーネント一覧

| コンポーネント | 種別 | 役割 | 動作環境 |
|---|---|---|---|
| **Hapbeat デバイス** | ハードウェア | ESP32 固定ランタイム。Wi-Fi STA/SoftAP / UDP 受信 / Kit ローカル再生 / OLED 表示 | 自走 |
| **hapbeat-device-firmware** | ファームウェア | デバイスに焼かれる固定ランタイム。ユーザーは書き換え不要（OTA で更新） | デバイス上 |
| **hapbeat-contracts** | 仕様 | プロトコル・Kit 形式・アドレッシング規約の単一情報源 | docs / spec |
| **Hapbeat Studio** | Web アプリ | Kit 設計・UI 設定・Wi-Fi 設定・ファーム書込みを GUI で行う | ブラウザ (Chrome/Edge) |
| **hapbeat-helper** | CLI daemon | PC 上の常駐デーモン。Studio ↔ デバイス間を mDNS / UDP / TCP / Web Serial で中継 | PC (Mac/Win) |
| **hapbeat-unity-sdk** | UPM パッケージ | Unity から触覚イベントを発火する SDK | Unity Editor / Runtime |
| **hapbeat-unreal-sdk** | プラグイン | Unreal 用 SDK（実装予定） | — |
| **hapbeat-creative-kit** | ツール群 | OSC / VJ など創作向け SDK（実装予定） | — |

## 役割境界（やらないこと）

設計が「やらないこと」を明示することで責務を絞っています。

- **Studio / Helper はランタイムには関与しない** — ゲーム実行中に Studio が落ちていても触覚は問題なく出る
- **デバイスは Wi-Fi UDP を直接受ける** — Bridge は標準経路ではなく、上位オプション（ESP-NOW 経由）
- **SDK はプロトコル仕様を独自定義しない** — すべて hapbeat-contracts に従う
- **ユーザーはファームを書き換えない** — コンテンツの差し替えは Kit のデプロイで行う（OTA でファーム本体更新は可能）
- **クラウドサービスに依存しない** — App ID / API Key / 中央サーバー必須の方式は採らない

## 依存関係

```
hapbeat-contracts（仕様の起点）
  ├─ hapbeat-device-firmware
  ├─ hapbeat-helper
  ├─ hapbeat-studio
  ├─ hapbeat-unity-sdk
  ├─ hapbeat-unreal-sdk (WIP)
  └─ hapbeat-creative-kit (WIP)
```

仕様変更はまず contracts に入れ、その後で各実装 repo へ反映されます。

## SDK 利用者の視点

実行フローだけを使う場合（ゲーム開発者の通常のケース）:

```
あなたのゲーム / アプリ
   └─ Unity SDK (or Unreal / Creative Kit)
       └─ Wi-Fi UDP broadcast
           └─ Hapbeat デバイス（事前に Studio で設定済み）
```

セットアップ済みの Hapbeat デバイスと同じ Wi-Fi に PC やスマホ・Quest を繋ぐだけで、SDK が触覚を送れます。Helper や Studio の起動は不要です。

## 関連

- [通信モデル: Wi-Fi UDP / ESP-NOW](./communication-model/) — なぜ UDP broadcast が主経路なのか
- [Event ID と Kit の関係](./event-id-and-kit/) — 触覚資産の単位
- [gain の乗算構造](./gain-architecture/) — Studio と SDK の責務分離
