---
title: 用語集
kind: reference
description: Hapbeat SDK に登場する用語の定義集。Event ID / Kit / Group / Player / intensity / gain / Fire / Clip など。
sidebar:
  order: 99
---

各ドキュメントで使われる用語を 1〜2 行で定義します。**正式な仕様は [](/docs/concepts/contracts/overview/) を参照** してください。

## コアコンセプト

**Hapbeat**
: 触覚デバイス本体。現行モデルは **Duo WL** (首掛けワイヤレス) と **Band WL** (リスト / アンクル装着) の 2 種類。ESP32 を内蔵し、Wi-Fi UDP で触覚イベントを受信して再生する。

**Kit**
: 触覚資産のフォルダ単位。`<kit-name>-manifest.json` + WAV 群で構成。Studio で作成し、Helper 経由で Hapbeat デバイスに転送する。詳細: [Event ID と Kit](./event-id-and-kit/)

**Event ID**
: 触覚イベントを識別する文字列。基本形式 `<category>.<name>`、拡張形式 `<category>.<subcategory>.<name>`、名前空間付き `<namespace>/<category>.<name>` をサポート。

**address**
: パケットの宛先文字列。形式は `[prefix/] player_{N} / {position} [/group_{M}]`。詳細: [Address の仕組み](./group-player-addressing/)

**Player 番号**
: 同じプレイヤーに属する複数デバイスをまとめる単位。1..99。

**Group ID**
: プレイヤー / ブース同士を分離する単位。同じ Wi-Fi 上で混信させないために使う。1..99 (省略時は全グループ受信)。

## 強度・モード

**intensity**
: Kit 設計時の基準振動強度。manifest の `events[<id>].parameters.intensity` / `stream_events[<id>].parameters.intensity` に 0.0〜1.0 で記録する。SDK 側 `gain` の **基準値 (× 1.0 の基準)** として働く。

**gain**
: SDK 実行時の動的強度倍率。Unity SDK 等で EventMap や ParameterBinding 経由で与える。`gain = 1.0` で「Kit 設計者が決めた標準の強さ」を意味する。

**Fire**
: 触覚送信方式の通称。manifest の `events` bucket に格納された Event を Event ID 指定で発火し、デバイス側にプリインストールされた波形を再生する。低遅延・安定で本番向き。詳細: [Fire と Clip](./fire-vs-clip/)

**Clip**
: 触覚送信方式の通称。manifest の `stream_events` bucket に格納された Event を SDK が PCM データに変換し、`STREAM_BEGIN`/`STREAM_DATA`/`STREAM_END` でストリーミングする。プロトタイピング・長尺・動的変調に向く。

**BOTH モード**
: 同一の Event ID を `events` と `stream_events` の両 bucket に置く構成。発火時に Fire / Clip を使い分けできる。Studio EventMap の `▶♪ BOTH` ラジオで設定する。

**bucket (manifest)**
: schema 2.0.0 ([DEC-031](https://github.com/Hapbeat/hapbeat-sdk-workspace/blob/master/docs/decision-log.md#DEC-031)) で導入された manifest 上の Event 格納区分。`events` (Fire 用 / device baked) と `stream_events` (Clip 用 / host streaming) の 2 種。Event が **どちらの bucket に入っているかで送信方式が決まる** (旧来の `mode` フィールドは廃止)。

## ツール

**Hapbeat Studio**
: Web ベースの Kit デザイン + デバイス管理ツール。`devtools.hapbeat.com/studio/` で動作する SPA。

**hapbeat-helper**
: Studio と Hapbeat デバイスを橋渡しする CLI daemon。`pipx install hapbeat-helper` で導入。`localhost:7703` の WebSocket と mDNS / UDP / TCP / Serial を中継する。アプリ実行時は不要。

**Contracts (hapbeat-contracts)**
: 各 repo 間の規範的プロトコル仕様を集めた repo。Kit format / message protocol / display layout / device addressing 等の "単一情報源"。

**device firmware**
: Hapbeat 本体に焼かれた ESP32 固定ランタイム。ユーザーは書き換え不要 (OTA で更新)。

## ネットワーク

**Wi-Fi UDP broadcast**
: 標準通信経路。SDK が UDP broadcast で送信し、各 Hapbeat が address で自己フィルタする。中継サーバ不要。

**ESP-NOW**
: 上位オプション通信経路。Bridge + Transmitter ファームウェア経由で AP 不要の独立網を構成する。大規模パフォーマンス / Wi-Fi 不在環境向け。

**SoftAP / STA**
: Hapbeat が **AP 機能を持つ場合 (SoftAP)** とルーターに **STA として接続する場合**。VR HMD などルーターなし環境では Hapbeat 自身が SoftAP になる。

**targetTime**
: 「N ms 後に発火」という将来時刻指定。ネットワーク揺らぎを吸収して発火タイミングを安定させる。

## Kit と manifest

**install-clips/**
: Fire (`events` bucket) 用 WAV を入れる Kit 内サブディレクトリ。デバイスに **install されて常駐** する意味。

**stream-clips/**
: Clip (`stream_events` bucket) 用 WAV を入れる Kit 内サブディレクトリ。実行時に **stream として都度送る**。デバイスにはデプロイされない。

**target_device**
: manifest.json のフィールド。Kit が対象とする基板 (例: `duo_wl_v3` / `neck_wl_v2`) と最低ファームウェアバージョンを記録する。

**device_wiper**
: Hapbeat デバイスの MCP4018 デジタルポテンショメータの wiper 値 (0..127)。Kit / Event 調整時の音量設定を **再現性のための参照情報** として manifest に記録する。

## 関連リンク

- [アーキテクチャ全体像](./architecture/) — 各コンポーネントの役割と境界
- [](/docs/concepts/contracts/overview/) — 仕様の正式定義
- [](/docs/concepts/contracts/overview/) — API / コマンドのリファレンス
