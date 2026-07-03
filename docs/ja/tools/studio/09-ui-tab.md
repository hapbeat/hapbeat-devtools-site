---
title: UI タブ
kind: reference
sidebar:
  order: 302
description: Hapbeat Studio の UI タブ（Display etc.）の網羅リファレンス。OLED 表示レイアウト・ボタン割当て・LED / Volume / Hold 設定と各値の初期値・範囲。
---

**UI タブ**（副題 *Display etc.*）は、Hapbeat 本体の **見た目と操作** を設計するタブです。OLED 表示レイアウト・ボタン割当て・LED 配色・Volume・Hold のフィードバックをまとめて編集し、**書込（Deploy）** でデバイスへ反映します。

対象は Hapbeat 本体（`duo_wl` / `band_wl`）です。UI 設定はデバイスの `ui-config.json`（NVS）に書き込まれます。

:::note
UI 設定は **Duo / Band のモデルごとに独立** して保持されます。編集中のモデルはコントロールバーで切り替えます。
:::

## 画面全体

![Hapbeat Studio の UI タブ全体。番号は下の凡例に対応（① タブ切替 / ② OLED プレビュー / ③ ページ管理 / ④ モデル切替 / ⑤ レイアウト操作 / ⑥ デバイスに書込 / ⑦ 要素パレット）](@assets/studio/ui-tab-overview.png)

1. **タブ切替** — Kit / UI / Manage を切り替え（現在 UI）
2. **OLED プレビュー** — 表示レイアウトのシミュレータ。左右にボタン割当て（Press / Hold）を表示
3. **ページ管理** — ページタブ（main / exhibit / debug など）・`＋ Page`・プリセット
4. **モデル切替** — Duo WL ⇄ Band WL（レイアウトはモデルごとに独立）
5. **レイアウト操作** — 初期化 / 向き（通常・180°）/ 保存 / 読込
6. **デバイスに書込（Deploy）** — 選択デバイスへ UI 設定を書き込み
7. **要素パレット** — OLED に置く要素群（ステータス / 操作可能 / 識別 / ネットワーク / メタ）

OLED プレビューの下には **Volume 設定 / LED 設定 / UI 設定** モーダルへのリンクがあります（下記各節）。

## Display Editor（OLED レイアウト）

OLED を **16 文字 × 2 行の文字グリッド**（1 文字 = 8×16px）と見なし、ブロックを配置するエディタです。各要素は「幅 = 文字数」で扱われ、`font_scale`（1 / 2 倍）にも対応します。

![Display Editor（OLED シミュレータ）。① OLED 表示プレビュー / ② 左ボタンの Press・Hold 割当て / ③ 右ボタンの割当て / ④ 各設定モーダルへのリンク](@assets/studio/ui-detail-simulator.png)

1. **OLED 表示プレビュー** — 配置した要素のリアルタイム表示
2. **左ボタン割当て** — 各ボタンの Press（短押し）/ Hold（長押し）動作
3. **右ボタン割当て** — 同上（Duo は左右で計 5 ボタン）
4. **設定モーダルへのリンク** — Volume 設定 / LED 設定 / UI 設定

### 配置操作

| 操作 | 動作 |
|---|---|
| パレットから **ドラッグ** → グリッドに配置 | 要素を追加 |
| OLED 上を **クリック** | その場に配置可能な要素をポップアップから選択 |
| 配置済みブロックを **ドラッグ** | 移動（衝突・はみ出しは無効プレビュー表示） |
| ブロックの **×** | 削除（即時・取り消し不可） |
| `custom_text` を **ダブルクリック** | ラベル文字列を編集 |

同じ要素は原則 1 ページに 1 個まで（`app_name` は 1 個、battery は「%」と「バー」を共存可）。空きが足りない / 重複時はトーストで通知します。

### 配置できる要素

パレットは **ステータス / 操作可能 / 識別 / ネットワーク / メタ** に分類されています。幅は文字数、`variant` があるものは S/M/L でサイズを選べます。

![要素パレットの 5 グループ。① ステータス / ② 操作可能 / ③ 識別 / ④ ネットワーク / ⑤ メタ](@assets/studio/ui-detail-palette.png)

1. **ステータス** — 動的に変化・常時表示向き（音量 / 残量 / 接続状態など）
2. **操作可能** — ボタン押下で増減（プレイヤー / グループ / ページ）
3. **識別** — 設定で決まる固定情報（デバイス名 / アドレス / アプリ名など）
4. **ネットワーク** — 通信状態・接続情報（RSSI / SSID / IP）
5. **メタ** — サポート情報（FW バージョン）

各要素カードの数字（`4` / `8` / `16` 等）は文字幅（variant）の選択肢です。

| 要素 | 既定幅 | variant（文字数） | 内容 |
|---|---|---|---|
| **音量**（volume） | 6 | — | `vol:05` |
| **Vol モード**（volume_mode） | 3 | — | `Fix` / `Var` |
| **残量**（battery %） | 4 | バー variant = 8 | ` 85%` / `BAT[\|\|\|\|]` |
| **プレイヤー番号**（player_number） | 4 | — | `P:01` |
| **グループ ID**（group_id） | 5 | — | `Gr:01` |
| **ページ番号**（page_indicator） | 3 | — | `1/2`（現在 / 総数） |
| **デバイス名**（device_name） | 5 | compact=4 / medium=8 / wide=16 | NVS `dev_name`。左から N 文字 |
| **アプリ名**（app_name） | 8 | compact=4 / wide=16 | 接続アプリ名 |
| **装着位置**（position） | 8 | compact=4 / wide=16 | NVS の `pos_xxx` 名（数値ではない） |
| **アドレス**（address） | 8 | compact=4 / wide=16 | address の prefix 部分のみ |
| **固定テキスト**（custom_text） | 8 | compact=4 / wide=16 | 任意の静的ラベル |
| **接続状態**（connection_status） | 4 | — | Wi-Fi + アプリ接続 `[--]` |
| **Wi-Fi 強度**（wifi_status） | 5 | — | RSSI `W:---` 〜 `W:+++` |
| **SSID**（wifi_ssid） | 8 | compact=4 / wide=16 | SSID の左 N 文字 |
| **IP アドレス**（ip_address） | 6 | compact=4 / wide=13 | 右から N 文字（末尾オクテット重視） |
| **MQTT**（mqtt_status） | 4 | — | `[OK]` / `[NG]`（受信機・ブローカー接続時のみ） |
| **アラートモード**（alert_limit_mode） | 10 | compact=4 | 制限モード / 全て再生（受信機） |
| **FW バージョン**（firmware_version） | 8 | compact=6 | `v0.1.0` |

### ページ

- OLED は **複数ページ** を定義でき、デバイスのボタン操作で遷移します。
- ページタブは **ダブルクリックでインライン rename**（最大 32 文字）。`+ Page` で空ページ追加、`×` で削除（最低 1 ページは残る）。
- **プリセット…** から 1 ページ単位で追加できます（モデル別）。

| プリセット | モデル | 内容 |
|---|---|---|
| **main** | Duo / Band | デバイス名 + プレイヤー / グループ + 残量 + Vol モード + 音量 |
| **exhibit** | Duo のみ | アドレス(compact) + プレイヤー / グループ + アプリ名(compact) + 残量 + 音量 |
| **debug** | Duo / Band | SSID(wide) + 装着位置(compact) + IP(compact) + FW(compact) |

### ボタン設定

OLED 直下のシミュレータで、各ボタンの **短押し（Press）** と **長押し（Hold）** の動作を割り当てます。ボタン数はモデルで異なります。

- **Duo WL**: 5 ボタン（`btn_1`〜`btn_5`。五角形筐体の左上 / 左中 / 左下 / 右上 / 右下）
- **Band WL**: 3 ボタン（`btn_l` / `btn_c` / `btn_r`。左 / 中 / 右）

割り当て可能なアクション:

`none` / `next_page` / `prev_page` / `toggle_page` / `player_inc` / `player_dec` / `group_inc` / `group_dec` / `wifi_select` / `display_toggle` / `led_toggle` / `vib_mode` / `limit_toggle`、および **`volume_up` / `volume_down`（Band のみ）**。

**Hold は 2 モードを独立に保持** します（切替えても他方の値は消えません）。

| モード | 表示 | 挙動 |
|---|---|---|
| momentary | **Tmp** | 押している間だけ実行、離すと戻る（`goto_page` 等） |
| latch | **Exec** | 短押しと同じ挙動、離しても戻らない |

**出荷時のボタン割当て**（初期化で戻る値）:

| Duo | 短押し | Hold(Exec) | | Band | 短押し | Hold(Exec) |
|---|---|---|---|---|---|---|
| btn_1 | player_inc | prev_page | | btn_l | group_inc | volume_up |
| btn_2 | vib_mode | wifi_select | | btn_c | toggle_page | wifi_select |
| btn_3 | player_dec | led_toggle | | btn_r | group_dec | volume_down |
| btn_4 | group_inc | next_page | | | | |
| btn_5 | group_dec | display_toggle | | | | |

### コントロールバー

![コントロールバー。① ページタブ / ② プリセット / ③ モデル切替 / ④ 初期化 / ⑤ 向き / ⑥ 保存・読込 / ⑦ デバイスに書込](@assets/studio/ui-detail-controlbar.png)

1. **ページタブ** — ページの切替・`+ Page`・rename
2. **プリセット** — モデル別のページを 1 枚追加
3. **モデル切替** — Duo WL ⇄ Band WL
4. **初期化** — 現在モデルを工場出荷値に戻す
5. **向き** — 通常 / 180°
6. **保存 / 読込** — `ui-config` の export / import
7. **デバイスに書込** — 選択デバイスへ Deploy

| コントロール | 役割 |
|---|---|
| **デバイスモデル切替** | 編集対象を Duo ↔ Band で切替（レイアウトはモデルごとに独立保持） |
| **向き（通常 / 180°）** | OLED の表示 orientation。**Band は装着時に上下逆になるため既定 180°（flipped）**、Duo は既定 通常 |
| **保存（export）** | 現在の設定を `ui-config_<日時>.json` としてダウンロード |
| **読込（import）** | `ui-config.json` を読み込み（該当モデルのスロットのみ更新） |
| **初期化** | 現在モデルのページ + ボタン + LED + Volume + UI 設定を**工場出荷値**に戻す（確認あり・もう一方のモデルは触らない） |
| **書込（Deploy）** | 選択中デバイスへ UI 設定を書き込む（下記） |

---

## Deploy（デバイスへ書込）

コントロールバーの **書込** で、UI 設定（Display + LED + Volume + Hold）を選択中デバイスの `ui-config.json` に書き込みます。

- **前提**: Helper 接続 + **Manage タブ / サイドバーでデバイスを選択済み**
- **対象**: Hapbeat 本体（`duo_wl` / `band_wl`）のみ。センサ / ブローカー等は自動的に除外
- **経路**: LAN（TCP）経由の `write_ui_config`。**USB Serial での Display 書込みは未対応**（LAN 接続デバイスを選択すること）
- 複数デバイス選択時は各デバイスへ順に書き込み、デバイスごとの進捗 / 成否を表示

書き込むのは **編集中モデルのレイアウト 1 つ**（デバイスのファームは 1 モデル分のみ保持）です。

---

## UI 設定モーダル（OLED / ボタン）

「UI 設定」から開きます。OLED 輝度と Hold タイミングを設定します。

![UI 設定モーダル。① OLED 輝度 / ② 発火時間 / ③ 変化色 / ④ 変化色の明るさ / ⑤ Hold 中の OLED 表示](@assets/studio/ui-detail-modal-ui.png)

1. **OLED 輝度** — Low / Mid / High（選択で即時反映）
2. **発火時間** — Hold 発火までの時間（スライダー / プリセット）
3. **変化色** — 予告色（純色）
4. **変化色の明るさ** — 予告の輝度（0〜10）
5. **Hold 中の OLED 表示** — `"Hold..."` 表示の ON/OFF

### OLED 輝度

3 段階のトグル。**選択した瞬間、選択中のオンラインデバイスへ即時反映** されます（`set_oled_brightness`）。

| 値 | ラベル | 目安 |
|---|---|---|
| 1 | Low | 暗所・夜間（~6%） |
| 2 | Mid | 通常室内（50%） |
| 3 | High | 明所・展示（100%） |

### Hold タイミング

長押し（Hold）発火までの予告フィードバックを設計します。押下 → **色変化開始** で LED が指定色 + 明るさに切り替わり、**発火時間** に向けて線形に 0（消灯）まで暗くなって発火します。

| 項目 | フィールド | 範囲 / 単位 |
|---|---|---|
| **発火時間** | `hold_ms` | 300〜3000ms（50ms 刻み）。プリセット 600 / 800 / 1000 / 1200 / 1500 / 2000 |
| **色変化開始** | `hold_feedback_start_ms` | 0〜（発火時間 − 50）ms（50ms 刻み） |
| **変化色** | `hold_feedback_color` | カラーピッカー + HEX（純色を指定、輝度は別軸） |
| **変化色の明るさ** | `hold_feedback_brightness` | 0〜10 段階（gamma 1.8。LED の全体明るさとは独立） |
| **Hold 中に OLED へ "Hold..." を表示** | `hold_show_oled_indicator` | ON/OFF（既定 OFF — 短押し時の位置 / グループ表示を隠さないため） |

タイムラインで「短押し 0-開始ms」「予告 開始-発火ms（色 → fade out）」「▾発火」が可視化されます。押下から色変化開始までは短押し扱い、色が変わってから発火時間までに離せば短押し相当（アクションなし）です。

:::caution
このモーダルの設定は **Deploy を押すまで本体に書き込まれません**（OLED 輝度スライダーの即時反映を除く）。
:::

---

## LED 設定モーダル

状態に応じた LED 配色を条件（ルール）ごとに設定します。

![LED 設定モーダル。① 全体の明るさ / ② 各条件の設定](@assets/studio/ui-detail-modal-led.png)

1. **全体の明るさ** — 個別指定が無いルールに適用（0〜10）
2. **各条件の設定** — 有効化 / 色 / 明るさ / 点滅 / フェード（警告・アプリ接続状態の各条件）

- **全体の明るさ**（`globalBrightness`）: 0〜10 段階。各ルールで個別指定が無い場合に適用
- ルールは 2 グループ: **警告**（最優先で点灯）/ **アプリ接続状態**（警告が無いとき、待機 ⇄ アプリ接続中を行き来）
- 各ルール: **有効化チェック** / **#優先度**（数値が小さいほど先に発火）/ **色** / **明るさ**（`個別` を ON で override）/ **点滅(秒)**（0〜10・0.1 刻み、0 = 常灯）/ **フェード**（なめらか / 瞬時）

**条件と出荷時の値**:

| 条件 | 表示名 | 説明 | グループ | 出荷時色 (RGB) | 点滅 | フェード | 優先度 |
|---|---|---|---|---|---|---|---|
| battery_critical | バッテリー危険 | 残量 ≤5%、間もなく停止 | 警告 | 128,0,0 | 0.5s | なめらか | 1 |
| battery_low | バッテリー低下 | 残量 ≤15%、充電推奨 | 警告 | 255,120,0 | 2s | なめらか | 2 |
| wifi_disconnected | Wi-Fi 未接続 | 設定済みなのに未接続 | 警告 | 255,200,0 | 1s | 瞬時 | 3 |
| volume_mute | 音量ミュート | 音量 = 0、振動しない | 警告 | 180,0,255 | 常灯 | 瞬時 | 4 |
| app_connected | アプリ接続中 | アプリから CONNECT_STATUS 受信中 | 状態 | 0,42,255 | 常灯 | 瞬時 | 6 |
| idle_wifi | 待機 | Wi-Fi 接続済み・アプリ非接続 | 状態 | 0,255,0 | 常灯 | 瞬時 | 7 |

---

## Volume 設定モーダル

Band の音量ノブ（Var モード）などの挙動を設定します。

![Volume 設定モーダル。① 分割数 / ② 方向 / ③ 固定値](@assets/studio/ui-detail-modal-volume.png)

1. **分割数** — 音量の段階数（1〜64）
2. **方向** — 昇順 / 降順
3. **固定値** — Fix モード時の音量（0〜分割数 − 1）

| 項目 | フィールド | 範囲 |
|---|---|---|
| **分割数** | `steps` | 1〜64 |
| **方向** | `direction` | 昇順（上げると大きく）/ 降順（上げると小さく） |
| **固定値** | `default_level` | 0〜（分割数 − 1）。**Fix モード時にこの値に固定** |

---

## 初期値（工場出荷 / 初期化ボタン）

新規状態および「初期化」で適用される値です。

| 設定 | 初期値 |
|---|---|
| OLED 輝度 | 3（High） |
| Hold: 発火時間 / 色変化開始 | 700ms / 150ms |
| Hold: 変化色 / 明るさ | オレンジ `#FF8800`（255,136,0）/ raw 35（約 14%） |
| Hold: OLED インジケータ | OFF |
| Volume | 10 段階・昇順・固定値 5 |
| LED 全体の明るさ | 5（控えめ。顔の近くで使う想定） |
| 向き | Duo = 通常 / Band = 180°（flipped） |

---

## 永続化と入出力

- 編集中の全設定は `localStorage`（`hapbeat-studio-display-v2`）+ sessionStorage + IndexedDB に自動保存されます（マシンごと）
- **Deploy** で編集中モデルの設定がデバイス `ui-config.json`（NVS）に書き込まれます
- **保存 / 読込** で `ui-config.json` を export / import できます（読込は該当モデルのスロットのみ更新）

---

## 関連ページ

- [画面構成（概要）](/docs/tools/studio/ui-overview/) — 全体像とヘッダー共通部
- [Manage タブ](/docs/tools/studio/manage-tab/) — デバイス選択・USB / OTA 書込・設定
- [Hapbeat を初期設定する](/docs/tools/studio/initial-setup/) — 初回セットアップ
