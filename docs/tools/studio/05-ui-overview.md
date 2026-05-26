---
title: 画面構成
kind: reference
sidebar:
  order: 300
description: Studio の Kit / UI / Manage 各タブとパネル構成。
---

## 全体レイアウト

Studio は上部の 3 タブで機能が切り替わります。

| タブ | 副題 | 用途 |
|------|------|-----|
| **Kit** | Vibration Clips | Library と Kit Editor、Save Folder / Deploy |
| **UI** | Display etc. | OLED 表示レイアウト・LED 設定・UI 設定 |
| **Manage** | Config | デバイス検出・Wi-Fi 設定・ファームウェア OTA・Kit デプロイ管理・Streaming Test |

ヘッダー右側には **Docs リンク** と **Helper 接続ステータス pill** が並びます。pill は:

- 🟢 **Helper 接続中**: 緑バッジ。クリックで [Helper Manage モーダル](#helper-manage-モーダル) が開き、version 情報と再起動コマンドを確認できる
- 🟡 **Helper 要更新**: Helper のバージョンが `MIN_HELPER_VERSION` (`0.1.3`) 未満のとき。ヘッダー直下に dismissible な amber バナーも表示される
- 🔴 **Helper 未接続**: クリックで Onboarding モーダル (インストール手順 + 自動起動コマンド) が開く

---

## Kit タブ

最もよく使うタブです。左右 (または上下) 2 ペインに分かれます。ペインのレイアウトはツールバー左端のトグル (`┃` = side / `━` = stacked) で切り替えられます。

### 共通ツールバー (上部)

- **view mode toggle** (`┃` / `━`): Library を左 / 上のどちらに配置するか
- **i (info toggle)**: クリップ詳細 (長さ・ch・sampleRate・サイズ) の表示 ON/OFF
- **? 操作説明**: マウス / キーボード操作のチートシートをポップオーバー表示
- **DevicePill**: 接続中デバイスの状態を表示
- **Vol** ピル: デバイスのボリューム (MCP4018 wiper) を 0–127 表示 (接続時のみ)

### Library パネル (左 / 上)

WAV / 触覚素材ファイルのリスト。Library フォルダから自動 import されます。

- **+ Library** チップ: Library フォルダの選択 / 変更 / 解除
- **Flat list (`=`) / Tree view (`▸`)** トグル: フォルダ構造を畳むか展開するか
- **Search ボックス**: 名前 / Note でフィルタ
- **Sort セレクト**: 名前 / 更新日時 / 長さ × 昇順・降順 (localStorage で永続化)
- **+ Import**: ファイルダイアログから WAV を追加
- **Refresh**: ディスク上の変更を再スキャン
- **Amp Preset バー**: Library 側の Amp (libraryIntensity) 一括プリセット保存 / 読込
- 各クリップカードに **+ Kit** (アクティブ Kit に追加) / **Edit** (詳細モーダル) / **×** (clips/archive/ に退避) / **Swap** (Name ↔ Note 入れ替え)

### Kit Editor パネル (右 / 下)

選択中の Kit に含まれる Event のリストです。

- **Kit 名入力 + Create** で新規 Kit
- **+ Kit** チップ: Kit 出力フォルダの選択 / 解除 (未指定なら Library フォルダ直下に作る)
- 各 Kit 行は **3-col grid card** レイアウトで表示
  - Name / Note / Mode pill (`> FIRE` / `♪ CLIP` / `>♪ BOTH`)
  - Amp スライダー / Edit / Swap / × (Kit から削除)
- **Events ヘッダー**: 件数 / 容量 / sort セレクト / 「モード説明」 / 「一括変更…」セレクト (FIRE / CLIP / BOTH を Kit 全体に適用)
- **Target Device** セクション (details): board / firmware_version_min / volume_level / volume_wiper / volume_steps を manifest に焼き込み
- **Capacity gauge**: FIRE モードのクリップが消費する flash 容量を視覚化
- 下部に **Deploy** と **Save Folder** ボタン (詳細は [Kit を作って配布する](./kit-design/))

### Helper Manage モーダル

ヘッダーの **Helper 接続中 / 要更新** バッジをクリックで開きます。Helper のバージョン情報・OS 別の起動コマンド・自動起動の有効化手順を表示。outdated 検知時は upgrade コマンド (`pipx upgrade hapbeat-helper`) も copy-paste できる形で並びます。

---

## UI タブ

### Display Editor（OLED レイアウト）

OLED (128×64) 表示のブロック配置エディタ。

- グリッド上にテキスト / アイコン / バッテリーゲージ / app_name 等のブロックを配置
- 複数ページを定義し、ボタン操作でページ遷移
- ページ名のインライン rename 対応
- Deploy ボタンで選択中デバイスへ書き込み (USB / OTA は Manage タブ側で行う)

### UI Settings モーダル

OLED 輝度・Hold フィードバックのタイミング / 色 / 明るさ・Hold 予告 LED 設定などをデバイスごとに変更できます。

### LED Config モーダル

LED の待機色・パターン・接続状態連動色を編集します。

---

## Manage タブ

デバイス管理の中枢。左サイドバーでデバイスを選択すると右ペインに詳細が表示されます。

### サイドバー (デバイス一覧)

mDNS + UDP broadcast で検出したデバイスが自動表示されます。

- online / offline は視覚的に区別される (offline は dim)
- **Refresh** ボタン (Helper rescan) で即時再検出
- 複数選択対応 (Wi-Fi / OTA を一括処理するとき用)
- 接続中アプリ名 (`app_name`) を pill で表示

### Onboarding ウィザード

サイドバーが空のときに右ペインに表示される 3-step ウィザード。USB Serial → ファーム書込 → Wi-Fi 設定の流れを案内します ([初期セットアップ](./initial-setup/))。

### 設定サブタブ

選択デバイスの Wi-Fi プロファイル管理・デバイス識別 (名前 / グループ / リブート)・UI 設定モーダルへの導線。

### Kit サブタブ

デバイスにインストール済みの Kit 一覧と、各 Event の発火テスト (`> FIRE` / `♪ CLIP`)。manifest の `target_device.board` がデバイス基板と食い違う場合は警告も表示。

### Firmware サブタブ

ファームウェア書き込みと OTA 更新。

- **2 層構成**: Necklace / Band の種別 → バージョン選択
- **USB Serial**: 初期セットアップ / ダウングレード用
- **OTA**: Helper 経由で Wi-Fi を通して最新版に更新
- GitHub Releases から最新ファームを自動取得 (prod 環境)
- 複数デバイス選択時は順次 OTA

### Streaming Test サブタブ

WAV / Live Audio (システム音、マイク) のストリーミングテスト。

---

## データ永続化

| データ | 場所 |
|---|---|
| Library / Kit メタ (`kits-meta.json` 相当) | ブラウザの **IndexedDB** |
| Library WAV / Kit 出力 (`install-clips/` `stream-clips/` `manifest.json`) | ユーザーが指定した Library / Kit **ローカルフォルダ** |
| Sort / View mode などの UI 設定 | `localStorage` |

サーバーには何も保存されません。**完全クライアントサイド**です。

別マシンへの移行は Library フォルダを共有するだけで済みます。

## キーボードショートカット

詳細は [ショートカット一覧](/docs/tools/studio/shortcuts/) を参照。
