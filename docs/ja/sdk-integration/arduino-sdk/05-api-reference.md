---
title: API リファレンス
kind: reference
description: Hapbeat.h の公開 API 一覧 — begin / play / playSine / beginSine / discover など。
sidebar:
  order: 5
  label: API reference
---

`Hapbeat` クラス（`src/Hapbeat.h`）の公開メソッド一覧です。正本はコードです。

## 接続

| メソッド | 説明 |
|---|---|
| `bool begin(uint16_t port = 7700, const char* appName = "")` | UDP ソケットを開く。`appName`（16 文字以内）は接続中 Hapbeat の OLED に表示。Wi-Fi 接続後に呼ぶ |
| `void end()` | アプリ離脱を通知（OLED の app 名をクリア） |
| `void setGroup(uint8_t group)` | CONNECT_STATUS に載るグループ id（level-1 既定 0） |

## command（fire）

| メソッド | 説明 |
|---|---|
| `void play(const char* eventId, float gain = 1.0f, const char* target = "")` | kit イベントを再生（`gain` 0..1）。`eventId` は `<kit 名>.<ファイル名>` |
| `void stop(const char* eventId, const char* target = "")` | 指定イベントを停止 |
| `void stopAll(const char* target = "")` | 全停止 |
| `void ping()` | キープアライブ / RTT プローブ |

## 合成 sine

| メソッド | 説明 |
|---|---|
| `void playSine(float freqHz, float intensity, uint32_t durationMs, const char* target = "")` | 一発の合成 sine（`durationMs` の間ブロック）。`intensity` 0..1 |
| `void beginSine(float freqHz, float intensity, const char* target = "")` | 連続 sine を開始 |
| `void pumpSine()` | デバイスのリングを満たし続ける（`loop()` から頻繁に呼ぶ） |
| `void endSine()` | 連続 sine を停止 |
| `bool sineActive()` | 連続 sine が再生中か |

## 検出 / アドレッシング

| メソッド | 説明 |
|---|---|
| `bool discover(uint32_t timeoutMs = 1500)` | ブロードキャスト PING → 応答した全デバイスを宛先表に登録（タイムアウトまでブロック）。以降の送信は unicast |
| `void poll()` | 届いた PONG を取り込む（送信時にも自動で行うため任意） |
| `uint8_t deviceCount()` | 生存している既知デバイス数（0 ならブロードキャスト送信） |
| `IPAddress deviceIp()` | 最初の既知デバイス IP |
| `void setDeviceIp(IPAddress ip)` | IP を直接指定（期限切れしない）。`0.0.0.0` で解除 |
| `void setDeviceTimeout(uint32_t ms)` | 生存判定の窓（既定 15000） |
| `void setBroadcastOnly(bool on)` | 常にブロードキャストで送る |

`target`: `""`（全機）/ `"player_1/pos_neck"` / `"*/pos_neck"` / `"*/*/group_2"`。
照合は**位置ベース**なので、`"group_2"` 単独は player スロットと比較され一致しません。
`*` はセグメント全体のときだけワイルドカードです（`"pos_*"` は不一致）。

## level-1 の注意

このバージョンには **EventMap クラスはありません**。チューニング（intensity / loop 等）は
Hapbeat 側の kit に持たせます。保存 WAV / クリップのストリーミング、ESP-NOW transport も
未対応です（[](/docs/sdk-integration/arduino-sdk/command-vs-sine/) 参照）。

ワイヤフォーマット（バイト仕様）は repo の `docs/wire-format.md` と `src/HapbeatProtocol.h`
を参照してください。`hapbeat-contracts` および Python / Unity / JS SDK とバイト互換です。
