---
title: Editor メニュー一覧
kind: reference
sidebar:
  order: 300
description: Unity Editor 上の Hapbeat メニュー項目の使い方リファレンス。Window 系・シーン操作・サンプル生成・Debug の各カテゴリを説明。
---

Hapbeat SDK は Unity Editor のトップレベルメニュー **`Hapbeat`** にすべての操作を集約しています。役割ごとに区切り線で分かれた flat 構成で、SDK 開発者向けの項目だけが最下部の `Developer/` サブメニューに分離されています（end-user の install では非表示）。

```
Hapbeat/
  Open Event Map                           ← Window (Event ID + Wiring 管理メイン画面)
  Open Batch Setup                         ← Window (複数 GO に Trigger を一括設定)
  Open Settings                            ← Window (接続設定 / Group / Bridge UI)
  ─────────────────────────────
  Initial Scene Setup                      ← Router + EventMap を一括作成 (推奨)
  Create Event Router                      ← シーンに [Hapbeat Event Router] を配置
  Create Event Map                         ← EventMap .asset だけを作成
  Create HapbeatSDK Folder                 ← Assets/HapbeatSDK/ の標準レイアウトを生成
  ─────────────────────────────
  Export Event Map (Selected)              ← 選択中 EventMap を Markdown summary に書き出し
  Export Event Map (All in Project)        ← project 内全 EventMap を一括 Markdown 化
  Normalize Audio Folder (16kHz · 2ch ...) ← フォルダ内 WAV を 16kHz / stereo / PCM16 に揃える
  Attach Event Logger to Selected          ← 選択 GO の UnityEvent をログに流す配線を追加
  Remove Event Logger Wiring from Selected ← 上記の解除
  Logs/Start Recording                     ← Hapbeat 系ログのファイル記録を開始
  Logs/Stop Recording                      ← 記録を停止して保存
  Logs/Reveal Current File                 ← 記録中ログを Explorer/Finder で表示
  Logs/Open Logs Folder                    ← ログ保存先フォルダを開く
  Logs/Dump Last Recording to Console      ← 直近のログを Console に流す
  Close Edit-mode Transport                ← Edit-mode の UDP 接続を強制クローズ
  Disable Verbose Log on All Hapbeat Components ← _verboseLog / _debugLog 一括 off
  ─────────────────────────────
  Developer/Build Basic Example            ← Basic サンプル一式の scaffold (Local/Embedded install のみ)
  Developer/Sync HapbeatSDK → Samples~ (Showcase)
  Developer/Sync HapbeatSDK → Samples~ (BasicExample)
```

セクションの分け方:

1. **Window 系** (top): ウィンドウを開く操作。Event Map / Settings / Batch Setup。
2. **Create 系**: シーン GameObject / asset を新規作成する操作。Initial Scene Setup は (1) + (2) + フォルダレイアウトの一括コマンド。
3. **Tools** (同じ区切りの中): export / 変換 / 診断 / ログ。粒度に応じて Logs だけサブメニュー化。
4. **Developer**: SDK 開発者専用。UPM Git URL / registry installs では `HapbeatDevModeMenuGate` により非表示。

加えて以下のメニュー位置にも Hapbeat エントリがあります:

- **GameObject → Hapbeat → Event Router** (Hierarchy 右クリック含む) — `Create Event Router` と同じ
- **Assets → Create → Hapbeat → Config / Event Map** — ScriptableObject 生成
- **Add Component → Hapbeat/...** — 各種 Trigger / Bridge / Helper をコンポーネントとして追加

---

## Window 系

### Settings

接続設定を編集する Window。

| 設定 | 用途 |
|---|---|
| Port | UDP ポート (デフォルト 7700) |
| Group | 送信先デバイスのグループ ID (0 = 全デバイス) |
| アプリ名 | Hapbeat デバイスのディスプレイに表示するクライアントアプリ名。**Max 16 文字** (display grid 幅)。デフォルトの `app_name` 要素 (8x1) では先頭 8 文字のみ表示。空欄なら `Application.productName` が自動使用 (16 文字超過時は切り詰め) |
| Use Bridge | ESP-NOW 経由 (上位構成) を使う場合のみ ON |
| Ping Interval | キープアライブ送信間隔 (秒) |

実機との Ping テストや、シーン外からの設定編集に使います。`Assets/Create/Hapbeat/Config` で生成した `HapbeatConfig` ScriptableObject の Inspector と内容は同じ。

### Event Map

**Hapbeat 統合作業のメイン画面**。シーン内の Event ID 一覧、各 Trigger の wiring (どの GO にどの Trigger が付いているか)、ParameterBinding の設定をすべてここから操作します。

主な機能:

- 左ペイン: EventMap.asset の全エントリ一覧 (mode / target / gain などをカード表示)
- 右ペイン: 選択中エントリの詳細編集 (Event ID / streamClip / target / gain / Notes / Bindings)
- Wiring セクション: 選択中エントリを発火する Trigger を逆引きスキャン
- Play モード中の Test 再生 / Snapshot/Restore (実機調整時の値を保存・復元)

詳細: [Event Map ウィンドウ](./event-map.md)

### Batch Setup

複数の GameObject (例: 同じ Tag の Pin × 6) に Trigger コンポーネントを一括追加するための補助 Window。Drag&Drop で参照を取り込み、適用先を絞ってまとめて配線できます。

ユースケース:

- ボウリングのピン 6 個に同じ `HapbeatCollisionTrigger` を配るとき
- XR インタラクタブル多数に `HapbeatUnityEventTrigger` を配るとき

---

## シーン操作

### Initial Scene Setup

新規シーンへの推奨入口。次を 1 コマンドで揃えます:

- `Assets/HapbeatSDK/` フォルダレイアウト (Kits / Scenes / EventMaps)
- `[Hapbeat Event Router]` GameObject (内部に `HapbeatManager` singleton)
- `Assets/HapbeatSDK/EventMaps/<scene-name>-EventMap.asset`
- Event Map ウィンドウを開いて新規 asset を選択状態にする

再実行は idempotent — 既存の Router / EventMap があれば再利用するだけで、複製や上書きはしません。

### Create Event Router

`[Hapbeat Event Router]` GameObject だけを配置します。中身は `HapbeatManager` (singleton)。EventMap は触らないので、すでに EventMap を持っていてシーンに Router だけ追加したい場合に使います。

> Hierarchy 右クリック → `Hapbeat → Event Router` でも同じことができます。

### Create Event Map

`Assets/HapbeatSDK/EventMaps/...asset` だけを生成します。シーンに Router は追加しません。複数の EventMap を持ちたい advanced ケース用 (例: シーンごとに別の EventMap を持つ)。

> `Assets → Create → Hapbeat → Event Map` でも同じ asset を作れますが、こちらは保存先フォルダを尋ねます (HapbeatSDK 標準パスは尊重されない)。

---

## Setup / Asset 準備

### Create HapbeatSDK Folder

`Assets/HapbeatSDK/` 配下に標準レイアウトを生成します:

```
Assets/HapbeatSDK/
├── Kits/        ← 触覚波形 (Studio から deploy / 自前 Kit を置く場所)
├── Scenes/      ← 生成サンプルシーン
└── EventMaps/   ← EventMap.asset
```

`Initial Scene Setup` も内部で呼ぶので、明示的に叩く必要はありません。「最初に手動で枠だけ作っておきたい」時の補助。

### Normalize Audio Folder (16kHz · 2ch · PCM16)

指定フォルダ配下の WAV を Hapbeat 標準形式 (16kHz / stereo / PCM16) に揃えます。Tutorial 用音声を一括コンバートする時など、StreamClip mode で送信予定の素材整形に使います。

---

## Export

### Export Event Map (Selected) / (All in Project)

`HapbeatEventMap.asset` の内容を Markdown summary として書き出します。AI 支援で wiring を相談する時や、デザインドキュメントへ貼る用途を想定。

- `Selected` — Project ビューで選択中の EventMap だけ
- `All in Project` — `t:HapbeatEventMap` で project 全体を一括書き出し

詳細: [AI 支援ワークフロー](./ai-assisted-workflow.md)

---

## 診断 / Debug

ユーザーが触ってよい範囲の診断ユーティリティ。バグ報告時に Logs を添付してもらうのが推奨フローです。

### Attach Event Logger to Selected / Remove Event Logger Wiring from Selected

選択中 GameObject の UnityEvent (XR Interactable の `selectEntered` など) を Console にログ出力する補助配線を追加 / 解除します。

何が起きているか可視化したい時、Trigger を仕込む前の発火タイミング確認に便利。AI 支援で wiring を組むときも、まずこれで「どのイベントがいつ飛ぶか」を観察すると設計がブレません。詳細: [AI 支援ワークフロー](./ai-assisted-workflow.md)。

### Logs/

Hapbeat 系のログ (Console 出力 + 実行イベント) をファイルに記録する機能群。

| メニュー | 用途 |
|---|---|
| Start Recording | フィルタ済みログのファイル記録を開始 |
| Stop Recording | 記録を停止し、ファイルを Explorer/Finder で表示 |
| Reveal Current File | 記録中ファイルを Explorer/Finder で表示 (記録中のみ有効) |
| Open Logs Folder | 過去のログを集めてあるフォルダを開く |
| Dump Last Recording to Console | 直近のログを Console に書き出す (記録停止後の確認用) |

**バグ報告のおすすめフロー:**

1. `Logs/Start Recording` を実行
2. 再現手順を実行 (Play → 問題発生 → Stop)
3. `Logs/Stop Recording` で保存 → ファイルを Issue / DM に添付

### Close Edit-mode Transport

Edit-mode で開いている UDP / mDNS transport を強制クローズします。「Play モードに入る前から接続テストしたい」「ポートが掴まれっぱなしで Play できない」などのレアケース用。

通常は触る必要はありません。

---

## Developer (Local / Embedded install only)

SDK 開発者向け。end-user の UPM Git URL / registry / tarball install では `HapbeatDevModeMenuGate` により非表示になり、メニュー自体が現れません。

### Build Basic Example

Basic Example サンプル一式 (Kit / EventMap / Scene) を `Assets/HapbeatSDK/SDK_Samples/BasicExample/` に scaffold します。Package Manager で Basic Example を Import 済みであることが前提。

End user は Package Manager の Sample Import で直接 Scene を開けるため、このメニューは通常不要です。

### Sync HapbeatSDK → Samples~ (Showcase) / (BasicExample)

`Assets/HapbeatSDK/SDK_Samples/<sample>/` で編集した Scene / EventMap / Animation を package の `Samples~/<sample>/` に書き戻します。SDK 自体を編集している人向けの maintainer 専用コマンド。

---

## ScriptableObject 生成 (`Assets/Create/Hapbeat/`)

Project ビューの右クリック → `Create → Hapbeat`:

| 項目 | 用途 |
|---|---|
| Config | `HapbeatConfig.asset` (接続設定の置き場) |
| Event Map | `HapbeatEventMap.asset` (Event ID 一覧の置き場) |

生成位置: 右クリックしたフォルダの直下。**プロジェクトに 1 つあれば足りる** ため、`Assets/HapbeatSDK/EventMaps/` 配下に置くのを推奨。

---

## コンポーネント (`Add Component → Hapbeat/`)

GameObject の Inspector → Add Component → 検索欄に `Hapbeat`:

| コンポーネント | 用途 |
|---|---|
| Hapbeat Collision Trigger | 物理衝突 / Trigger Enter / Exit で発火 |
| Hapbeat Sequence Trigger | grab / hold / release を 1 component で扱う |
| Hapbeat Tick Emitter | 連続値 (Slider 等) の変化量に応じてスナップ触覚 |
| Hapbeat Unity Event Trigger | UnityEvent の `Fire()` メソッドから任意発火 |
| Hapbeat Parameter Binding | Transform / Rigidbody → gain / pan のリアルタイムマッピング |
| Hapbeat Action Helper | Stop / StopAll / Ping を UnityEvent から呼ぶラッパ |
| Hapbeat Event Logger | UnityEvent 発火を Console に流す (Debug 用) |
| Hapbeat Key Dispatcher | キー押下を UnityEvent にマップ (sample / proto 用) |
| Hapbeat Status Overlay | 接続状態と Log を Canvas に表示 |

> Animator state からの発火は **`HapbeatStateBehaviour`** を使います。これは StateMachineBehaviour なので、GameObject の Add Component ではなく **Animator window で state を選択 → Inspector → Add Behaviour** から追加します。詳細: [Trigger コンポーネント](./triggers.md#hapbeatstatebehaviour)。

詳細: [Trigger コンポーネント](./triggers.md) / [Parameter Binding](./parameter-binding.md)
