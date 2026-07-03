---
title: 画面構成（概要）
kind: reference
sidebar:
  order: 300
description: Hapbeat Studio の全体レイアウトと共通ヘッダー・3 タブ（Kit / UI / Manage）の早見表。各タブの網羅リファレンスへの入口。
---

このページは Studio の **全体像** と **どのタブにも共通する UI（ヘッダー・ログ・トースト）** を扱います。各タブに何があるか・各コントロールが何をするかは、タブごとの専用リファレンスに分けています。

| タブ | 副題 | ひとことで | 詳細ページ |
|------|------|-----------|-----------|
| **Kit** | Vibration Clips | WAV 素材を Kit にまとめてデバイスへ配布 | [Kit タブ](/docs/tools/studio/kit-tab/) |
| **UI** | Display etc. | OLED 表示・ボタン・LED・Volume・Hold の見た目/挙動を設計 | [UI タブ](/docs/tools/studio/ui-tab/) |
| **Manage** | Config | デバイス検出・Wi-Fi・ファーム OTA・各種設定・再生テスト | [Manage タブ](/docs/tools/studio/manage-tab/) |

---

## 全体レイアウト

Studio の画面は 3 段構成です。

1. **ヘッダー**（常時表示）: 左からアプリ名 + バージョン切替、中央に 3 タブ、右に Docs リンクと Helper ステータス pill
2. **タブ本体**: 選択中タブ（Kit / UI / Manage）の内容
3. **下部共通**: ログドロワー（LogDrawer）と操作結果のトースト通知

### タブの切り替えと状態保持

- 上部 3 タブ（**Kit** / **UI** / **Manage**）はクリックで切り替わります。選択中タブは `localStorage`（`hapbeat-studio-tab`）に保存され、次回起動時に復元されます。
- 各タブは **一度開くと以後もマウントされたまま**（非表示は `display:none`）保持されます。Kit タブの Library 読み込み結果・スクロール位置・選択中 Kit などがタブを行き来しても失われません（初回訪問時のみ読み込みコストがかかります）。

---

## ヘッダー共通部

### アプリ名 + バージョン切替

タイトル「Hapbeat Studio」の右に、現在の版（例 `v0.4.0 ▾`）がプルダウンで並びます。選ぶとその版の固定 URL に移動します（[バージョンとロールバック](#バージョンとロールバック)）。

### Docs リンク

ヘッダー右の **Docs** リンクは、この開発者ポータルの Studio ドキュメントを新しいタブで開きます。

### Helper 接続ステータス pill

Studio は単体でも Kit 設計・UI 設計ができますが、**デバイスへの書き込み・OTA・実機再生テスト・ライブラリ/フォルダアクセスの一部**は [hapbeat-helper](/docs/tools/helper/getting-started/) 経由で行います。ヘッダー右端の pill が Helper の状態を表します。

| 表示 | 状態 | クリック時 |
|------|------|-----------|
| 🟢 **Helper 接続中** | 接続済み・バージョン OK | [Helper Manage モーダル](#helper-manage-モーダル)（version 情報・再起動コマンド） |
| 🟡 **Helper 要更新** | 接続済みだが `MIN_HELPER_VERSION`（`0.1.3`）未満 | Helper Manage モーダル（`pipx upgrade hapbeat-helper` などの更新手順） |
| 🔴 **Helper 未接続** | 未接続 | Onboarding モーダル（インストール手順 + 自動起動コマンド） |

Helper が「要更新」のときは、ヘッダー直下に **dismissible な amber バナー**（`現在 vX / 必要 v0.1.3 以上`）も表示されます。この非表示はセッション単位で、永続化されません（古い Helper は毎回の起動で気付かせるべき問題のため）。

### Helper Manage モーダル

**Helper 接続中 / 要更新** の pill をクリックで開きます。Helper のバージョン情報・OS 別の起動コマンド・自動起動の有効化手順を表示し、outdated 検知時は upgrade コマンドも copy-paste できる形で並びます。Helper が接続すると自動で閉じます。

### Onboarding モーダル

**Helper 未接続** の pill をクリックで開き、OS 別のインストール手順と自動起動コマンドを案内します。「再試行」で即時再接続を試みます。

---

## 下部共通

### ログドロワー（LogDrawer）

画面下部の折りたたみドロワー。Helper とのやり取りやデバイス応答のログを表示します（トラブルシューティング用）。

### トースト（HelperToastBridge）

書き込み結果・OTA 結果・エラーなどを画面隅のトーストで通知します。個別のボタンごとに散らばらず、Helper からの結果を一元的に集約して表示する設計です。

---

## バージョンとロールバック

Studio はリリースごとに **固定 URL のスナップショット** が残ります。新しい版で不具合が出ても、旧版に戻して作業を続けられます。

| URL | 内容 |
|---|---|
| `https://studio.hapbeat.com/` | 最新版（常に更新される） |
| `https://studio.hapbeat.com/v0.2.0/` 等 | 各リリースの **不変スナップショット**（凍結。永続的に残る） |

ヘッダのタイトル横の **バージョン表記（`v0.2.0 ▾`）がプルダウン** になっており、選ぶとその版の固定 URL に移動します。直接 URL を開いても同じです。

---

## データ永続化（全体像）

Studio は **完全クライアントサイド** で、サーバーには何も保存されません。保存先はデータの種類ごとに分かれます。

| データ | 保存先 | 補足 |
|---|---|---|
| Library / Kit の WAV・`manifest.json` | ユーザー指定の **ローカルフォルダ** | disk が真実（disk-as-truth）。詳細は [Kit タブ](/docs/tools/studio/kit-tab/) |
| Library / Kit メタ・エンコード済み WAV キャッシュ | ブラウザの **IndexedDB** | 素材の再エンコード skip 等に利用 |
| UI（Display / LED / Volume / Hold）設定 | **localStorage** + IndexedDB、Deploy 時にデバイス NVS | 詳細は [UI タブ](/docs/tools/studio/ui-tab/) |
| デバイス設定（Wi-Fi / 名前 / アドレス / AP 等） | デバイスの **NVS**（本体側） | Studio 側キャッシュは表示用。詳細は [Manage タブ](/docs/tools/studio/manage-tab/) |
| 並び順・view mode・入力履歴などの UI 状態 | **localStorage** | マシンごと |

別マシンへの移行は、基本的に Library / Kit フォルダを共有するだけで済みます。

---

## 関連ページ

- [Kit タブ](/docs/tools/studio/kit-tab/) — Library / Kit Editor / Deploy の網羅リファレンス
- [UI タブ](/docs/tools/studio/ui-tab/) — Display / ボタン / LED / Volume / Hold の網羅リファレンス
- [Manage タブ](/docs/tools/studio/manage-tab/) — デバイス管理・Wi-Fi・ファーム・テストの網羅リファレンス
- [ショートカット一覧](/docs/tools/studio/shortcuts/) — キーボード / マウス操作
- [Kit を作って配布する](/docs/tools/studio/kit-design/) — Kit 作成の作業手順（howto）
- [Hapbeat を初期設定する](/docs/tools/studio/initial-setup/) — 入手後の初回セットアップ
