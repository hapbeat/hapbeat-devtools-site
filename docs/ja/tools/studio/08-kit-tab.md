---
title: Kit タブ
kind: reference
sidebar:
  order: 301
description: Hapbeat Studio の Kit タブ（Vibration Clips）の網羅リファレンス。Library パネル・Kit Editor パネルの全コントロール・操作・制約・永続化。
---

**Kit タブ**（副題 *Vibration Clips*）は Studio で最もよく使うタブです。WAV 触覚素材を **Library** で管理し、それらを **Kit** にまとめてデバイスへ配布します。

このページは **各コントロールが何をするか** の網羅リファレンスです。「最初の Kit を作る手順」は [最初の Kit を作る](/docs/tools/studio/getting-started/)、「Kit の作成・配布のワークフロー」は [Kit を作って配布する](/docs/tools/studio/kit-design/)、Kit / Event ID / manifest の概念は [](/docs/concepts/event-id-and-kit/) を参照してください。

## 画面全体

![Hapbeat Studio の Kit タブ全体。番号は下の凡例に対応（① タブ切替 / ② ツールバー / ③ Library パネル / ④ Kit Editor パネル / ⑤ モード説明 / ⑥ モード選択レール / ⑦ Deploy・Save Folder）](@assets/studio/kit-tab-overview.png)

1. **タブ切替** — Kit / UI / Manage を切り替え（現在 Kit）
2. **ツールバー** — 表示切替（side / stacked）・クリップ詳細（`i`）・操作説明（`?`）
3. **Library パネル** — 素材クリップの一覧（検索・並び替え・Import・Amp プリセット）
4. **Kit Editor パネル** — 選択中 Kit（図は `demo-kit`）に含まれる Events
5. **モード説明** — 各再生モード（FIRE / CLIP / BOTH）の比較を開く
6. **モード選択レール** — 各 Event の FIRE / CLIP / BOTH
7. **Deploy / Save Folder** — デバイスへ転送 / フォルダへ書き出し

※ 画像はデモ表示（匿名のサンプルデータ）。

## レイアウトとビューモード

Kit タブは 2 ペイン構成です。

- **Library パネル**: WAV 素材の一覧（左 / 上）
- **Kit Editor パネル**: 選択中 Kit に含まれる Event の一覧（右 / 下）

ツールバー左端の **view mode トグル** で 2 つの配置を切り替えます。

| ボタン | モード | 配置 |
|---|---|---|
| `⊥` | side | Library 左・Kit Editor 右（左右分割） |
| `─` | stacked | Library 上・Kit Editor 下（上下分割、境界をドラッグでリサイズ可） |

選択したビューモードは保存され、次回も復元されます。

## 共通ツールバー

![共通ツールバー。① 表示切替（side / stacked）/ ② クリップ詳細（i）/ ③ 操作説明（?）](@assets/studio/kit-detail-toolbar.png)

1. **表示切替** — Library を左（side）/ 上（stacked）
2. **クリップ詳細（`i`）** — 長さ・ch・サイズ等の表示 ON/OFF
3. **操作説明（`?`）** — マウス / キーボード操作の一覧

ペイン上部のツールバーにあるコントロール。

| コントロール | 役割 |
|---|---|
| **view mode**（`⊥` / `─`） | Library を左 / 上どちらに置くか |
| **`i`（info toggle）** | クリップ詳細（長さ・チャンネル・サンプルレート・サイズ・Note）の表示 ON/OFF |
| **`?`（操作説明）** | マウス / キーボード操作のチートシートをポップオーバー表示。詳細は [ショートカット一覧](/docs/tools/studio/shortcuts/) |
| **DevicePill** | 接続中デバイスの状態を表示 |
| **Vol** ピル | 接続中デバイスのボリューム（MCP4018 wiper）を `Vol {wiper}/128 ({percent}%)` で表示（接続時のみ） |

---

## Library パネル

![Library パネル。① Library フォルダ / ② 検索 / ③ フラット・ツリー / ④ Import / ⑤ Amp プリセット](@assets/studio/kit-detail-library.png)

1. **Library フォルダ** — WAV 素材フォルダの指定
2. **検索** — 名前 / タグ / グループでフィルタ
3. **フラット / ツリー** — 一覧表示の切替
4. **Import** — WAV を追加（隣の Refresh でディスク再スキャン）
5. **Amp プリセット** — Amp 設定の保存 / 読込

WAV 触覚素材ファイルの一覧です。Library フォルダから自動 import されます。

### Library フォルダチップ（📁 Library）

WAV 素材を置くフォルダを指定します。ここから Studio が `clips/` / メタデータを読み書きします。

- **未指定時**: `+ Library` ボタンでフォルダを選択
- **指定済み時**: フォルダ名表示 + `⇄`（変更） / `×`（解除）

### Library ツールバー

| コントロール | 役割 |
|---|---|
| **Search ボックス** | 名前 / タグ / グループでフィルタ |
| **Sort セレクト** | 並び順。`名前 ↑ / ↓`・`更新日時 (新しい順 / 古い順)`・`長さ (短い順 / 長い順)` の 6 通り（永続化） |
| **+ Import** | ファイルダイアログから WAV / mp3 / ogg / flac / aac / m4a を追加。2 件以上は進捗バー表示 |
| **Refresh** | ディスク上の `clips/` を再スキャン（新規 / 削除を反映）。ウィンドウ復帰時にも自動実行 |
| **フラット / ツリー**（`=` / `▸`） | 一覧をフラット表示するか、素材ファイルのフォルダ構造でグループ表示するか |

### Amp プリセットバー

Library 側の Amp（`libraryIntensity`）を一括で保存 / 読込します。

- **プリセット選択**: `(new)`（全クリップの Amp を 0.5 にリセット）＋保存済みプリセット。選ぶと即適用
- **Save as…**: 現在の Amp 設定を新規プリセットとして保存（既定名 `amp-YYYYMMDD`、同名は上書き確認）
- **Delete**: 選択中プリセットを削除（確認あり）

### クリップカード

各素材ファイルが 1 カードとして並びます。

| 要素 | 説明 |
|---|---|
| **▶ / ■** | 再生 / 停止。Helper + デバイス接続時は実機で振動、未接続はブラウザ音声でプレビュー |
| **名前**（インライン編集） | クリックで rename。使用可能文字は英小文字 / 数字 / `-` / `_`（違反は警告） |
| **Amp スライダー** | 基準振動強度（0〜100%、5% ステップ）。数値クリックで直接入力 |
| **+ Kit** | 選択中（アクティブ）Kit に追加。アクティブ Kit が無いと無効 |
| **Edit** | 詳細モーダル（Name / Note / Group / Tags の編集、Swap、Archive） |
| **× Archive** | クリップを `clips/archive/` に退避（Studio から非表示・確認なし・ファイルを戻せば復活） |
| **⇅ Swap** | クリップ名 ↔ Note を入れ替え（素材ファイル名を一時退避してリネームしたいとき）。Note が空だと無効 |

`i`（info toggle）が ON のときは、カード下部に **長さ / チャンネル（Mono/Stereo）/ サンプルレート / ファイルサイズ / Note** が表示されます。

**ドラッグ＆ドロップ**: クリップを Kit Editor パネルへドラッグして追加できます。

### Library の Edit モーダル

「Edit」で開くクリップ詳細モーダル。

- **Name**（英小文字 / 数字 / `-` / `_`、最大 64 文字）
- **Note**（自由記述メモ。import 時は原ファイル名が自動セットされ、カード hover で表示）
- **Group**（整理用ラベル。例 `impacts`）
- **Tags**（チップ形式。Enter で追加、`×` で削除）
- **⇅ Swap**（Name ↔ Note。Name 側は拡張子除去 + 英数字 sanitize）
- **Archive**（確認ダイアログ後に `clips/archive/` へ退避）

---

## Kit Editor パネル

![Kit Editor 上部。① Kit 作成 / ② 容量ゲージ（青 = 重要な表示情報）](@assets/studio/kit-detail-kitmeta.png)

1. **Kit 作成** — Kit 名を入力して Create（Name / Version / Target Device もこの領域で編集）
2. **容量ゲージ**（青）— FIRE クリップが使う flash 容量（表示専用だが重要）

選択中の Kit に含まれる Event の一覧です。

### Kit フォルダチップ（📦 Kit）

Kit のビルド成果物（`manifest.json` + `install-clips/` + `stream-clips/`）の書き出し先。**未指定なら Library フォルダ直下に `<kitId>/` を作成**します。Unity の `Assets/.../Kits/` を指定すると SDK が Kit を直接読めます（[Kit を作って配布する](/docs/tools/studio/kit-design/)）。

### 新規 Kit 作成

**入力欄 + Create** で Kit 名を入力して作成します。Kit 名は **フォルダ名 + `manifest.name` + Event ID の prefix** で共通利用され、命名規則は `^[a-z][a-z0-9-]*$`（英小文字始まり・英小文字 / 数字 / `-`）。違反文字は入力時点で除去されます。

### Kit リストと Kit 詳細

各 Kit 行は `[▸/▼] [Kit 名] [N events] [×]` で、クリックで開閉します。アクティブ Kit を開くと詳細が展開されます。

**Kit メタ**

- **Name**（インライン編集、`^[a-z][a-z0-9-]*$`。無効時は赤字でエラー表示）
- **Version**（semver 慣習・強制なし）

**Target Device**（折りたたみ / 任意）— Kit 作者が調整したハードウェア設定を manifest に記録します。

| フィールド | 内容 |
|---|---|
| **Board** | 対象基板（例 `duo_wl_v3`） |
| **FW min** | 必要ファーム最低バージョン（`firmware_version_min`） |
| **Volume level / Wiper (0-127) / Volume steps** | 基準ボリューム。`⟳ デバイスから取り込む` で接続中デバイスの現在値を反映 |

**Capacity ゲージ** — `install-clips/`（FIRE モード）が消費するデバイス flash 容量を可視化します。Kit が空き容量を超えると赤く警告します（超過してもデプロイ自体は可能）。デバイス未接続時は推定値表示です。

### Events ヘッダーと一括操作

![Events と再生モード。① モード説明 / ② 一括変更 / ③ イベント操作 / ④ モード選択レール](@assets/studio/kit-detail-events.png)

1. **モード説明** — FIRE / CLIP / BOTH の比較を開く
2. **一括変更** — 全 Event を一括でモード切替
3. **イベント操作** — Amp スライダー / Edit / Swap / 削除
4. **モード選択レール** — FIRE / CLIP / BOTH（Event ごと）

- **Events（N）** と Kit 容量を表示（容量は FIRE モードのクリップのみが対象）
- **Sort セレクト**: Library の 6 通りに加えて `追加順` / `追加順 (逆)`（挿入順）。選択は `hapbeat-studio-kit-sort` に永続化
- **モード説明**（`?`）: 各再生モードのデバイス側挙動を比較するモーダルを開く（正確な仕様は [Mode を切り替える](/docs/tools/studio/modes/)）
- **一括変更…** セレクト: Kit 内全 Event を `> FIRE` / `♪ CLIP` / `>♪ BOTH` のいずれかに一括切替

### Kit Event 行

各 Event は Library と同じクリップカード + 右側の **モードセレクタレール** で構成されます。

- カード部分は Library と同一（▶ 再生 / 名前 / Amp / Edit / ⇅ Swap / × Kit から削除）。名前・Amp・Note は **Library とは独立した copy**（Library で後から変更しても Kit 内 Event には影響しない）
- **× 削除**: Kit から Event を外す（元の Library クリップは残る）
- **モードセレクタ**（3 択ラジオ、下記）

### 再生モード（FIRE / CLIP / BOTH）

各 Event の再生モードを 3 択で選びます（`KitEvent.modes` 配列の UI 表現）。

| 表示 | 記号 | manifest 内部値 | 主な用途 |
|---|---|---|---|
| **FIRE** | `>` | `['command']` | 短い one-shot・本番運用。デバイス内蔵 WAV を再生（低遅延・オフライン） |
| **CLIP** | `♪` | `['stream_clip']` | 長尺・動的変調・プロトタイピング。SDK が WAV を UDP ストリーム |
| **BOTH** | `>♪` | `['command', 'stream_clip']` | 開発段階で両方を試すとき。`events` と `stream_events` の両 bucket に同じ base eventId で並存 |

モード変更や一括変更の際は、再生中プレビューは自動停止します。判断材料は [](/docs/concepts/fire-vs-clip/)、Studio 上の操作と制約は [Mode を切り替える](/docs/tools/studio/modes/) を参照。

### Kit Event の Edit モーダル

- **Name**（英小文字 / 数字 / `-` / `_`。kit 内の表示名 + eventId を再構成）
- **Note**（Event 独自のメモ。Library とは独立）
- **Event ID**（読み取り専用。`<kit名>.<clip名>` で自動導出）
- **⇅ Swap** / **Remove from kit**（確認あり・Library 元クリップは残る）

---

## Deploy と Save Folder

![Deploy と Save Folder。① Deploy / ② Save Folder](@assets/studio/kit-detail-deploy.png)

1. **Deploy** — ビルドして Helper 経由でデバイスへ転送
2. **Save Folder** — フォルダに書き出し（デバイスには送らない）

Kit 詳細の下部に 2 つのボタンが並びます（手順は [Kit を作って配布する](/docs/tools/studio/kit-design/)）。

| ボタン | 動作 | 必要なもの |
|---|---|---|
| **Save Folder** | `manifest.json` + WAV を Kit フォルダに書き出す（デバイスには送らない） | Library / Kit フォルダ |
| **Deploy** | 同じビルドを行い、その zip を Helper 経由でデバイスに転送 | + Helper + オンラインの再生デバイス |

- 音声が前回保存から変わっていない Event は WAV 再エンコードがキャッシュで skip されます（Amp 調整だけなら高速）
- ボタン横の **ステータス**が、フォルダ未指定 / Kit 名無効 / 保存中 / 保存済み / デバイス準備状況（`Helper offline` / `デバイスが見つかりません` / `N device(s) ready`）を示します
- 複数デバイス選択時は各デバイスへ順に配信し、デバイスごとの進捗 / 成否が表示されます

デプロイ前チェック: Kit フォルダ指定・全 Event が空でない Event ID を持つ・Event ID が contracts 形式（`category.name`、`[a-z0-9_-]`）に合致、を満たさないとブロックされます。

---

## 永続化とデータモデル

| データ | 保存先 |
|---|---|
| クリップ WAV / Kit 出力（`manifest.json` / `install-clips/` / `stream-clips/`） | Library / Kit **ローカルフォルダ**（disk が真実） |
| クリップ音声・エンコード済み WAV キャッシュ | ブラウザ **IndexedDB** |
| クリップ / Kit メタ・Amp プリセット | Library フォルダ内の JSON（`clips-meta.json` / `kits-meta.json` / `amp-presets.json`） |
| view mode・sort・info toggle 等の UI 状態 | `localStorage` |

ディスクの変更は自動検出されません（**Refresh** ボタン、またはウィンドウ復帰で再スキャン）。Kit メタは編集ごとに自動保存されますが、**Kit フォルダ内の WAV / manifest は Save Folder / Deploy を押すまで書き換わりません**。Kit / manifest の構造は [](/docs/concepts/event-id-and-kit/) を参照。

---

## キーボード操作

パネル内にカーソルがある / フォーカスしているときのみ反応します（テキスト入力中は無効）。

| キー | Library | Kit Editor |
|---|---|---|
| **↑ / ↓** | 選択を上下移動（表示順） | 選択を上下移動（表示順） |
| **← / →** | 選択クリップの Amp を ±5% | 選択 Event の Amp を ±5% |
| **Space** | 再生 / 停止 | 再生 / 停止（再生開始時にデバイス wiper を取得） |
| **Enter** | 選択クリップをアクティブ Kit に追加 | — |
| **Delete / Backspace** | — | 選択 Event を Kit から削除 |

全一覧は [ショートカット一覧](/docs/tools/studio/shortcuts/) を参照。

---

## 関連ページ

- [最初の Kit を作る](/docs/tools/studio/getting-started/) — 初回チュートリアル
- [Kit を作って配布する](/docs/tools/studio/kit-design/) — 作成・配布の作業手順
- [Mode を切り替える](/docs/tools/studio/modes/) — FIRE / CLIP / BOTH の操作と制約
- [](/docs/concepts/event-id-and-kit/) — Kit / manifest / Event ID の概念
- [](/docs/concepts/fire-vs-clip/) — mode 選択の判断材料
- [](/docs/concepts/gain-architecture/) — intensity が乗算チェーンのどこに入るか
