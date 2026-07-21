# hapbeat-devtools-site

`https://devtools.hapbeat.com/` にデプロイされる開発者向けポータル・ドキュメントサイト。

## 技術スタック

- [Astro](https://astro.build/) + [Starlight](https://starlight.astro.build/)
- 本 repo 自身の `docs/ja|en/` と、各サブ repo の `docs/`・`CHANGELOG.md` を
  build 時に `scripts/fetch-docs.mjs` / `scripts/fetch-demos.mjs` で集約
- GitHub Actions → Cloudflare Workers (static assets) にデプロイ

## 構成

- `/` — Landing（splash template）
- `/docs/...` — ドキュメント（JA がルートロケール、`/en/docs/...` が英語）
- `/downloads/` — 各 repo の GitHub Releases へのリンク
- `/changelog/` — リリースノート集約
- `/showcase/`, `/faq/` — その他ページ
- `/demos/arcade/` — hapbeat-js-sdk の examples/games 取り込み（Hapbeat Arcade）
- `/tools/` — 本 repo 直書きの静的ツール（例: `/tools/metronome/`）
- `/studio/` — **別 repo（hapbeat-studio）のデプロイ対象**。ここでは配信しない
  （`studio.hapbeat.com` へ転送、cutover 済）

## コンテンツの出所

サイトに出るコンテンツは 4 系統に分かれる。編集する前に「どこが真の編集場所か」を確認すること。

| 領域 | 出所 | 真の編集場所 | 集約タイミング |
|---|---|---|---|
| `/docs/...`・`/en/docs/...`（本 repo 手書き分） | (a) 本 repo 内 `docs/ja\|en/` | 本 repo の `docs/ja/<section>/*.md`（JA が source of truth。`docs/en/` はミラー、未訳ページは JA へ自動フォールバック） | `npm run build`／`npm run dev` の `fetch-docs` ステップが `docs/ja/` → `src/content/docs/docs/`、`docs/en/` → `src/content/docs/en/docs/` へコピー |
| `/docs/concepts/contracts/...` | (b) sibling repo 取得（fetch-docs） | `hapbeat-contracts` の `docs~/` または `docs/`（`scripts/fetch-docs.mjs` の `SOURCES` に列挙された repo のみ。現状 contracts のみ） | ローカル: workspace sibling を直接 cp。CI: `git clone --depth=1`（`FETCH_DOCS_MODE=git`） |
| `/docs/**/changelog/` | (b) sibling repo 取得（fetch-docs, CHANGELOG） | 各 repo の `CHANGELOG.md`（`scripts/fetch-docs.mjs` の `CHANGELOG_SOURCES`: studio / helper / unity-sdk / python-sdk / js-sdk / arduino / device-firmware / transmitter-firmware） | 同上（sibling優先 → git clone フォールバック、取得失敗は静かにスキップしビルドは落とさない） |
| `/demos/arcade/...` | (c) fetch-demos による js-sdk examples 取込 | `hapbeat-js-sdk` の `examples/games/`（この repo には無い。js-sdk 側で編集） | `npm run build` の `fetch-demos` ステップが sibling／git clone から `public/demos/arcade/` へコピー（**毎ビルド全消去して作り直す**）。副次的に `@hapbeat/sdk` の browser バンドルを `public/tools/vendor/` へも配置する |
| `/` `/downloads/` `/changelog/` `/showcase/` `/faq/` 等 | (d) 本 repo native（Starlight splash/page） | `src/content/docs/*.mdx`・`src/content/docs/en/*.mdx`（Astro コンテンツコレクションの手書き MDX） | 集約対象外・このリポジトリで直接編集。**i18n-sync の対象外**（`docs/ja|en/` の自動差分検出は Markdown 側のみ。MDX top-level ページの英訳は手動で追従する） |
| `/tools/metronome/` 等 | (d) 本 repo native（site-native アプリ） | `public/tools/<name>/`（生 HTML/CSS/JS、Astro コンテンツコレクションを経由しない） | 集約対象外・このリポジトリで直接編集。ただし `public/tools/vendor/` だけは (c) の副産物として毎ビルド上書きされる生成物 |

運用ルール:

- `/demos/` 配下は js-sdk 由来、`/tools/` 配下（`vendor/` を除く）は site-native。両者を混同して js-sdk 側の変更をこの repo に手で書き写さない。
- `docs/ja/` を編集した PR の段階で `docs/en/` を同時更新しなくてよい（英訳はリリース節目にまとめて反映、`npm run i18n:sync` 参照）。
- `src/content/docs/*.mdx`（native ページ）は i18n-sync のスキャン対象外なので、英訳が必要な変更は手動で `en/` 側にも反映する。

## ローカル開発

```bash
npm install
npm run dev      # sibling workspace の docs/ を拾って起動
```

## ビルド（CI と同じ経路）

```bash
FETCH_DOCS_MODE=git npm run build
```

## デプロイ

- `master` に push（または `workflow_dispatch` / 他リポジトリからの `repository_dispatch: docs-updated`）→ `.github/workflows/deploy.yml` が起動
- ビルド: GitHub Actions 上で `npm run build`（Playwright Chromium を明示 install — mermaid の SSR に必要）
- 配信: ビルド成果物 (`./dist`) を `wrangler` で **Cloudflare Workers（static assets）** に deploy（`wrangler.jsonc` の `assets.directory=./dist`）。本番ドメイン `devtools.hapbeat.com` は Worker の custom domain 経由
- `wrangler` バージョンは `4.103.0` に固定（assets-only Worker を deploy できない旧 wrangler-action 既定を回避するため）
- `/studio/` は配信しない（`studio.hapbeat.com` へ転送、別 repo がデプロイを担当）
- 必要な secrets: `CLOUDFLARE_API_TOKEN`（Workers Scripts:Edit）, `CLOUDFLARE_ACCOUNT_ID`, （任意）`DOCS_FETCH_TOKEN`（private repo を再び集約する場合のみ。現状 contracts は public のため不要）

各 repo の `dev-notes/` (内部開発知見) は portal には掲載しない。
