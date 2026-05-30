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
