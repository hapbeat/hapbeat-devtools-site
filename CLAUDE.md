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

- `src/content/docs/` — Starlight コンテンツ
  - `index.mdx` — Landing
  - `docs/*.md` — ツール・SDK・仕様ドキュメント
  - `docs/_fetched/<repo>/` — fetch-docs が生成（.gitignore 対象）
  - `downloads.md` / `showcase.md` / `faq.md` / `changelog.md`
- `src/styles/custom.css` — 共通デザイントークン
- `scripts/fetch-docs.mjs` — docs 集約スクリプト
- `.github/workflows/deploy.yml` — CI デプロイ
