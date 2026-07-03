---
title: Manage タブ
kind: reference
sidebar:
  order: 303
description: Hapbeat Studio の Manage タブ（Config）の網羅リファレンス。デバイス検出サイドバー・Wi-Fi / 設定 / Kit / 再生テスト / ファームウェア各セクション・OTA / USB 書込。
---

**Manage タブ**（副題 *Config*）はデバイス管理の中枢です。左の **サイドバー** でデバイスを検出・選択し、右の **詳細ペイン** で選択デバイスの設定・ファーム更新・テストを行います。

ほとんどの操作は [hapbeat-helper](/docs/tools/helper/getting-started/) 接続と、対象デバイスの **オンライン状態** を前提とします（オフライン時はボタンが無効）。

## 画面全体

![Hapbeat Studio の Manage タブ全体。番号は下の凡例に対応（① タブ切替 / ② デバイス選択 / ③ セクション切替 / ④ 再スキャン / ⑤ USB 追加）](@assets/studio/manage-tab-overview.png)

1. **タブ切替** — Kit / UI / Manage を切り替え（現在 Manage）
2. **デバイス選択** — カードのチェック / クリックで対象を選択
3. **セクション切替** — Wi-Fi / 設定 / Kit / 再生テスト / ファームウェア
4. **再スキャン** — Helper に再検出を要求（Refresh）
5. **USB 追加** — USB 直結デバイスを追加（`＋`）

※ 画像はデモ表示（匿名のサンプルデータ。実際の SSID / IP / デバイス名ではありません）。

## サイドバー（デバイス一覧）

![サイドバー。① デバイス選択 / ② 再スキャン / ③ USB 追加](@assets/studio/manage-detail-sidebar.png)

1. **デバイス選択** — チェックで複数選択・クリックで詳細表示
2. **再スキャン** — Helper に再スキャンを要求（Refresh）
3. **USB 追加** — USB 直結デバイスを追加（`＋`）

### ヘッダー

- **Devices** と検出台数、複数選択時は `(N 選択)`
- **⟳ Refresh**: Helper に再スキャンを要求（UDP broadcast PING → デバイス一覧を再取得）

### Wi-Fi（LAN デバイス）

mDNS + UDP broadcast で検出した LAN デバイスがカードで並びます。

- **オンライン**: 緑ドット。**オフライン**: 赤 **✕**（クリックで一覧から一時的に消す。再接続で自動復活）
- **チェックボックス** で複数選択（Explorer 風: クリック = 単独選択 / Ctrl = 追加 / Shift = 範囲）。Wi-Fi / OTA を一括処理する対象になります
- カードに **ロールバッジ**（receiver / sensor / broker / transmitter）、Hapbeat 本体には水色 **Hapbeat** ピル、AP モード時は紫 **AP** ピル、**IP / mDNS アドレス / fw バージョン** を表示
- OTA 実行中は進捗行（`⚡ OTA [phase] N%` → `✓ 完了` / `✗ 失敗`）が出ます

初回は先頭デバイスが自動選択され、右ペインに詳細が出ます。

### USB Serial

USB ケーブル直結のデバイス。Helper 不要（Web Serial API）。

- **＋** で USB デバイスを追加（初回のみブラウザの許可ダイアログ。以降は自動表示）
- 各カードは `#番号` で識別（ブラウザは COM 名を取得できないため、`↻ 識別`（get_info）で名前 / fw を取得して区別）
- **接続 / 設定**: 1 台ずつ設定用の接続を開く（get_info / Wi-Fi 設定）。接続中は「設定」で詳細ペインを開く
- **チェックボックス** で複数選択 → ファームウェアセクションで **並列書き込み**
- 書込 / 設定の状態（待機中 / 書込中 / 完了 / 失敗）を各カードに表示

### 空状態

- Helper 未接続: `Helper 未接続` + `hapbeat-helper start`（USB Serial は利用可）
- Helper 接続済・デバイス無し: `検出中…`

---

## Onboarding ウィザード

サイドバーが空のとき、右ペインに **3 ステップの初期セットアップ** が表示されます（[初期セットアップ](/docs/tools/studio/initial-setup/)）。

1. **シリアル接続**: USB で繋ぎ、`＋` → カードの「接続」。応答内容で自動分岐（ファーム入り → Step 3 / 応答なし → Step 2）
2. **ファーム書き込み**: 種別（Hapbeat / 周辺機器）を選び「Serial 書き込み」。完了で自動的に Step 3 へ
3. **Wi-Fi 設定**: 電源 OFF→ON で再接続後、Wi-Fi の SSID / パスワードを設定

---

## デバイス詳細ヘッダー

![デバイス詳細ヘッダーとセクション切替。① デバイスから読み込み / ② 再起動 / ③ セクション切替](@assets/studio/manage-detail-header.png)

1. **デバイスから読み込み** — get_info / Wi-Fi 状態 / プロファイルを取得
2. **再起動** — reboot
3. **セクション切替** — Wi-Fi / 設定 / Kit / 再生テスト / ファームウェア

選択デバイスの上部に、名前・**SELECTED** ピル・ロール / AP バッジ・IP・`fw` バージョン（+ build SHA）・mDNS アドレス・offline 表示が並びます。

- **⟳ デバイスから読み込み**: `get_info` / `get_wifi_status` / `list_wifi_profiles`（受信機は `get_ap_status` / `get_oled_brightness` も）を取得
- **再起動**: `reboot`（一部の `set_*` は再起動後に有効）

## セクション構成

セクションはロール / トランスポートで変わります。

| ロール | セクション |
|---|---|
| receiver（UDP） | Wi-Fi / 設定 / Kit / 再生テスト / ファームウェア |
| receiver（MQTT） | Wi-Fi / 設定 / MQTT / Kit / 再生テスト / ファームウェア |
| receiver（ESP-NOW stream 専用） | ESP-NOW / ファームウェア |
| sensor | Wi-Fi / 設定 / MQTT / センサー / ファームウェア |
| broker | Wi-Fi / 設定 / MQTT / ファームウェア |
| transmitter | ESP-NOW / ファームウェア |

Wi-Fi 未接続を検出すると自動で Wi-Fi セクションに切り替わります（ESP-NOW stream 受信機は ESP-NOW セクション）。

---

## セクション: Wi-Fi

![Wi-Fi セクション。① 保存プロファイル操作 / ② 追加 / ③ Wi-Fi モード切替 / ④ AP パスワード](@assets/studio/manage-detail-wifi.png)

1. **保存プロファイル操作** — 接続 / 編集 / 削除
2. **追加** — 新規追加（一覧取得 / すべて削除も同列）
3. **Wi-Fi モード切替** — STA ⇄ AP
4. **AP パスワード** — Set / Clear（オープン）

- **現在の接続状況**: 接続中 / 未接続・SSID・IP・RSSI・チャンネル
- **プロファイル一覧**（`list_wifi_profiles`）: 各行に active マーク（●）/ SSID / 🔒（パスワード有）/ **接続**（`connect_wifi_profile`）/ **編集**（パスワードのみ・SSID 変更不可）/ **削除**
- **＋ 新規追加**（最大数で無効）/ **⟳ 一覧取得** / **すべて削除**（`clear_wifi`・確認あり）
- **追加 / 編集フォーム**:
  - **SSID**: Helper が PC 側で OS スキャン（信号強度順）した候補をドロップダウン表示。**⟳ スキャン**（`scan_wifi`）はフォームを開くと自動実行。編集時は SSID 固定
  - **パスワード**: 表示 / 隠す切替。編集時は空欄で現パスワード維持
  - **追加・接続 / 更新・接続**（`set_wifi`）: 完了後に一覧を再取得
  - **⚡ 選択 N 台に一括適用（並列）**: 複数の USB Serial デバイスを選択中のとき、同じ Wi-Fi を全台に並列適用

Wi-Fi 変更後はデバイスの **再起動** が必要です。

---

## セクション: 設定

![設定セクション。① 名前変更 / ② アドレス設定 / ③ UI Config 書込 / ④ デバッグ取得](@assets/studio/manage-detail-settings.png)

1. **名前変更** — set_name
2. **アドレス設定** — prefix / player / position / group
3. **UI Config 書込** — `ui-config.json` を選んで書込
4. **デバッグ取得** — get_debug_dump の一覧表示

### デバイス識別

- **名前**（最大 32 文字、`set_name`。入力履歴を datalist で補完）
- **アドレス**（`[prefix/]player_N/pos_xxx[/group_N]`）:
  - **prefix**（任意・履歴補完）/ **player**（1〜99）/ **position**（`pos_xxx` から選択）/ **group**（1〜99 または空欄 = 全グループ受信）
  - `set_address` で反映。現在値を `現在: ...` で表示
- **再起動**（`set_*` の一部は再起動後に有効）

### Wi-Fi モード（STA / AP）

- 現在モード表示 + **⟳ 更新**（`get_ap_status`）
- **AP モードに切り替え** / **通常モード（STA）に戻す**（いずれも確認あり・再起動）
- **AP パスワード**: 8〜63 文字で `set_ap_pass`、空欄 + Clear で `clear_ap_pass`（オープン AP）。オープン AP は誰でも接続できるため公共環境では非推奨
- AP モードは firmware ≥ v0.1.0 が必要（`get_info` の mode フィールド）

### UI Config

`ui-config.json` を「参照…」で選び「書込」（`write_ui_config`）。※ Display エディタからは [UI タブ](/docs/tools/studio/ui-tab/) の書込ボタンが便利です。

### デバッグ情報

**取得**（`get_debug_dump`）で、バッテリー / 音量 / ESP-NOW / Wi-Fi / アプリ接続 / オーディオ / FW（uptime・heap）などを一覧表示。

---

## セクション: Kit

![Kit セクション。① 一覧取得 / ② FIRE 発火テスト / ③ Event ID コピー](@assets/studio/manage-detail-kit.png)

1. **一覧取得** — kit_list
2. **FIRE 発火テスト** — クリックで `preview_event`
3. **Event ID コピー** — センサーマッピング等への貼り付け用

（`♪ CLIP` はストリーム経由のみで、ここからは送信できません）

デバイスにインストール済みの Kit を管理します。

- **⟳ 一覧取得**（`kit_list`）
- 各 Kit は折りたたみ表示（バージョン・`N events`・**削除**（`kit_delete`・確認あり））
- **`> FIRE` install-clips**: 各 Event をクリックで発火テスト（`preview_event`）。Event ID の **Copy** も可
- **`♪ CLIP` stream-clips**: SDK ストリーム経由でのみ再生されるため、ここからは送信不可（表示のみ）
- amp 値の表示は firmware ≥ v0.1.3 が必要（未満は `amp ?`）

---

## セクション: 再生テスト

![再生テストセクション。① フォルダ選択 / ② ストリーム再生 / ③ FIRE 送信テスト](@assets/studio/manage-detail-test.png)

1. **フォルダ選択** — WAV フォルダをブラウズ
2. **ストリーム再生** — CLIP をライブ再生（再生 / 一時停止 / シーク）
3. **FIRE 送信テスト** — PLAY / STOP / PING

### CLIP ストリーミングテスト

ローカルフォルダをブラウズして WAV を選択し、選択中デバイスへライブストリーム再生します。

- 「参照…」でフォルダ選択、パンくずと `📁 ..` で移動、キーボード / ダブルクリック / ドラッグ操作対応
- **▶ 再生 / ■ 停止 / ⏸ 一時停止 / ▶ 再開**、シークスライダー、再生位置表示
- **Intensity スライダー**（0〜100%）: CLIP 再生のライブ強度倍率（FIRE には効かない）
- 複数 LAN デバイス選択時は同時ストリーム（USB のみ選択は不可の警告）

### FIRE コマンドテスト

- **Event ID** 入力（直近 5 件の履歴を datalist で補完、例 `impact.damage`）
- 選択デバイスへ: **▶ PLAY**（`preview_event`・gain=1.0=manifest 値優先）/ **■ STOP** / **PING**（RTT 計測、3 秒でタイムアウト）
- ブロードキャスト: **Target** 入力（例 `player_1`・`*/chest`・空欄=全て）で **▶ PLAY ALL** / **■ STOP ALL**

---

## セクション: ファームウェア

![ファームウェアセクション。① ライブラリ更新 / ② 種別 / ③ バリアント選択 / ④ ローカル .bin 参照 / ⑤ Wi-Fi OTA 書き込み](@assets/studio/manage-detail-firmware.png)

1. **ライブラリ更新** — Releases / ビルドから再取得（⟳ 更新）
2. **種別** — Hapbeat / 周辺機器
3. **バリアント選択** — DuoWL / BandWL・バージョン
4. **ローカル .bin 参照** — 任意の `.bin` を選択
5. **Wi-Fi OTA 書き込み** — LAN 経由で書込（複数台は順次）

ファームのソース選択・OTA・USB Serial 書込・バージョン選択・基板検証を行います。

### ファームウェア ライブラリ

- prod は GitHub Releases、dev は `.pio` ビルドから取得（**⟳ 更新**）
- **グループタブ**（Hapbeat / 周辺機器）で絞り込み、**バリアントグリッド**（DuoWL / BandWL など）から選択
- 選択後の詳細: バージョン・ロール・トランスポート・基板。**バージョンピッカー**でアーカイブ版（ダウングレード）も選択可（選ぶと警告表示）。リリース日・成果物サイズ（OTA app / SERIAL full）を表示

### ローカル .bin

任意の `.bin` を直接指定して書き込み（`参照…`、ハンドルは IndexedDB に保存）。merged image は app 部分に自動スライス。

### Wi-Fi OTA 書き込み

- LAN 経由で選択中ファームを上書き（自動再起動）
- 複数 LAN デバイス選択時は **順番に** 書き込み（`OTA 書き込み (N 台)`）
- 進捗が 3 秒以上途絶えると停滞警告 + **中止する** ボタン（TCP セッションを drain）
- 進捗 / 結果はデバイス / タブを切り替えても保持（page-singleton の OTA コントローラ）

### USB Serial 書き込み

- USB 直結で書き込み（Wi-Fi 不要・Web Serial 対応ブラウザ）
- 複数ポート選択時は **並列** 書き込み
- **消去オプション**（書込前に全消去）/ **Flash 消去**（chip erase）: Wi-Fi 設定・名前なども消える点に警告
- **COM ポート再選択** で書込先を切替

**基板ミスマッチ確認**: ファーム宣言基板とデバイス報告基板が食い違うと確認ダイアログ（単体は 1 台ずつ、複数は対象一覧）。OTA イメージは chip-ID / 形式を検証してから送信します。

---

## セクション: ESP-NOW / MQTT / センサー

- **ESP-NOW**（stream 受信機 / transmitter）: チャンネル **1 / 6 / 11**（送信機と全受信機で統一）、受信機は既定ゲイン（0〜1）、送信機は入力レベル（0〜100）を設定して適用
- **MQTT**（sensor / broker / receiver-MQTT）: ブローカー host / port、クライアント一覧・接続状態、トピックレジストリ、メッセージメトリクス、接続可視化のフローチャート。構築手順は [MQTT アラートを初期設定する](/docs/tools/studio/mqtt-alerts/)
- **センサー**（sensor）: 現在のセンサー値（r/g/b/clear など）と、入力 → Event ID のマッピング表、ライブ調整ビュー

---

## Helper / オンライン依存と制約

- **Helper 接続** が無いと、LAN デバイスの検出・設定・OTA・Kit デプロイはできません。Helper バージョンが `MIN_HELPER_VERSION`（`0.1.3`）未満だと一部操作が失敗します（ヘッダー pill が「要更新」）
- **オフライン** デバイスへの `get_*` / `set_*` は無効
- **設定用のシリアル接続は 1 台ずつ**（単一 master）。一方、書込対象の複数選択は各カードのチェックで独立に行い、並列書込できます
- 一部機能はロール / firmware バージョン依存（OLED 輝度 = 本体受信機のみ、AP モード = fw ≥ v0.1.0、Kit の amp 表示 = fw ≥ v0.1.3）

## 永続化

- **デバイス設定**（Wi-Fi プロファイル / 名前 / アドレス / AP / OLED 輝度 / MQTT / センサーマッピング）はデバイスの **NVS** に保存され、再起動後も維持されます
- セクション選択・入力履歴・テスト設定など **Studio 側の UI 状態** は `localStorage`（マシンごと）に保存されます
- 選択した `.bin` / ストリーミングフォルダのハンドルは IndexedDB に保存され、次回も参照されます

---

## 関連ページ

- [Hapbeat を初期設定する](/docs/tools/studio/initial-setup/) — 入手後の初回セットアップ（Onboarding ウィザード）
- [MQTT アラートを初期設定する](/docs/tools/studio/mqtt-alerts/) — センサー → ブローカー → Hapbeat の構築
- [画面構成（概要）](/docs/tools/studio/ui-overview/) — 全体像とヘッダー共通部
- [Kit タブ](/docs/tools/studio/kit-tab/) — Kit の作成と Deploy
