# CLAUDE.md — hapbeat-devtools-site

## このリポジトリの責務

`https://devtools.hapbeat.com/` にデプロイされる開発者向けポータル・ドキュメントサイト。

- Landing（ツール一覧）
- 各ツール・SDK のドキュメント集約
- Downloads（GitHub Releases への導線）
- Showcase / FAQ / Changelog

## 技術スタック

- Astro 5 + Starlight 0.30+
- Pagefind（Starlight 標準）で全文検索
- `sharp` による画像最適化
- GitHub Actions → FTPS で Xserver にデプロイ

## 設計方針

- **完全静的**: サーバーサイドコードなし
- **ドキュメントは各 repo が source of truth**: このリポジトリに直接書かない。`scripts/fetch-docs.mjs` が各 repo の `docs/` を集約する
- **ローカル dev は sibling path 優先**: `../hapbeat-*/docs/` を優先的に読む（git clone 不要で高速）
- **CI では git clone**: `FETCH_DOCS_MODE=git` でリモートから最新を取得
- **意匠は本家 hapbeat.com と揃える**: `src/styles/custom.css` に共通トークンを置く

## やってはいけないこと

- サブ repo の docs をこのリポジトリにコピペで置く（fetch-docs で吸い上げる前提）
- Starlight の docs 以外で重い JS を入れる（Astro の「ゼロ JS デフォルト」思想を崩さない）
- `/studio/` 配下のパスを作る（別 repo の deploy が配置する領域）
- 認証機能を入れる（完全公開ポータル）

## 依存

- 各サブ repo の `docs/` ディレクトリ
- Xserver FTPS（secrets 経由）
- GitHub Releases（Downloads / Changelog のリンク先）

## ディレクトリ

### docs ソース（真の編集場所）— i18n はロケールフォルダ分割
- `docs/ja/<section>/*.md` — **日本語（root locale, source of truth）**
- `docs/en/<section>/*.md` — **英語**（ja をミラー。未訳ファイルは置かなくてよい → JA に自動フォールバック）
- `docs/assets/<topic>/` — 画像（**ロケール中立で共有**。markdown は `@assets/<topic>/foo.jpg` で参照）
- 運用詳細・用語集・翻訳手順: workspace `dev-notes/devtools-site/i18n-strategy.md`

### Starlight コンテンツ（生成 + 手書き）
- `src/content/docs/` — Starlight コンテンツ root
  - `index.mdx` / `downloads.mdx` / `showcase.md` — JA top-level（MDX のため手書き、fetch 対象外）
  - `en/index.mdx` 等 — EN top-level（手書き）
  - `docs/**` — `docs/ja/` から生成（.gitignore 対象）
  - `en/docs/**` — `docs/en/` から生成（.gitignore 対象）
- `src/styles/custom.css` — 共通デザイントークン
- `scripts/fetch-docs.mjs` — docs 集約（ja→root / en→en、contracts は外部 fetch）
- `.github/workflows/deploy.yml` — CI デプロイ

## ドキュメント執筆ルール

### サイドバー表記は 1 行に収める（タイトル最大長）

サイドバー幅は固定なので、長いタイトルは折り返して 2 行になり見づらい。
**サイドバーに出る表記（`sidebar.label` 未指定なら `title`）の表示幅を 24 以下**
に保つ。

- **表示幅** = 全角（日本語・全角記号・かな・漢字）を **2**、半角（ASCII・数字・
  記号・スペース）を **1** として合計した値。≈ 全角のみで **12 文字**、半角のみで
  **24 文字**。
- 校正の根拠: `Hapbeat を初期設定する`（表示幅 22）は 1 行に収まり、
  `MQTT アラートを初期設定する`（27）は折り返す。安全側に 24 を上限とする。
- **超える場合**: 説明的な `title` はそのまま残し、`sidebar:` に短い `label` を
  指定する（`title` は H1 / ブラウザタブ用、`label` はサイドバー用に分離）。

```yaml
---
title: MQTT アラートを初期設定する   # H1・タブ用（長くてよい）
sidebar:
  order: 7
  label: MQTT アラート設定            # サイドバー用（表示幅 ≤ 24）
---
```

### 別ページへのリンクは新しいタブで開く（基本方針）

ドキュメント間のページ遷移、特に **「別ページの手順を済ませてから戻ってくる」前提のリンク** は新しいタブで開く形にする。markdown の `[]()` は同タブ遷移なので、HTML の `<a>` で書く。

```html
<a href="/docs/start-here/getting-started/" target="_blank" rel="noopener noreferrer">Getting Started</a>
```

- 同一ページ内のアンカー (`#step-b` 等) は同タブで OK（戻る前提ではないため）
- 同タブ遷移にしたい例外（最後の "次に読むページ" 等）は markdown の `[]()` のままで構わない
- `rel="noopener noreferrer"` はセキュリティ上 `target="_blank"` とセットで必須

### 英訳ミラーはデプロイ時に一括反映する（per-PR で訳さない）

JA を source of truth とし、`docs/en/` は **デプロイ時 / リリース節目に一括でミラー** する運用にする。

- JA を編集した PR の段階では EN を同時更新しなくてよい（差分が分散して翻訳作業の効率が落ちる）
- セッションが JA だけ更新したらユーザーに「EN も訳しますか？」と毎回聞かない（運用負荷が高い）
- 翻訳ミラーは別途まとめてジョブ（手動 or 自動）で実施する

### ダウンロードさせるサンプルファイルは `download` 属性付きの `<a>` で貼る

`public/` のサンプル（.json 等）はリンクすると**ブラウザ内で開いてしまう**ので、
クリックで保存が走るよう markdown 内に生 HTML で `download` を付ける（同一
オリジン配信なので `download` が効く）。

```html
<a href="/samples/mqtt-alert/sensor-mapping.json" download><code>sensor-mapping.json</code></a>
```
