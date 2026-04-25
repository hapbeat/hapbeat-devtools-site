# hapbeat-devtools-site

`https://devtools.hapbeat.com/` にデプロイされる開発者向けポータル・ドキュメントサイト。

## 技術スタック

- [Astro](https://astro.build/) + [Starlight](https://starlight.astro.build/)
- 各サブ repo の `docs/` を build 時に `scripts/fetch-docs.mjs` で集約
- GitHub Actions → FTPS で Xserver にデプロイ

## 構成

- `/` — Landing（splash template）
- `/docs/getting-started/` など — ドキュメント
- `/downloads/` — 各 repo の GitHub Releases へのリンク
- `/changelog/` — リリースノート集約
- `/showcase/`, `/faq/` — その他ページ
- `/studio/` — **別 repo（hapbeat-studio）のデプロイ対象**。ここでは配信しない

## ローカル開発

```bash
npm install
npm run dev      # sibling workspace の docs/ を拾って起動
```

## ビルド（CI と同じ経路）

```bash
FETCH_DOCS_MODE=git npm run build
```

## 依存関係

| 参照先 | 集約対象 |
|--------|---------|
| hapbeat-contracts | `docs/*.md` |
| hapbeat-pack-tools | `docs/*.md` |
| hapbeat-device-firmware | `docs/*.md` |
| hapbeat-manager | `docs/*.md` |
| hapbeat-studio | `docs/*.md` |
| hapbeat-unity-sdk | `docs/*.md` |
| その他 repo | `docs/*.md`（存在すれば） |

## デプロイ

- `master` に push → GitHub Actions が build & FTP 転送
- 転送先: `devtools.hapbeat.com` doc root 直下
- `/studio/` は除外（別 repo がデプロイを担当）
- 必要な secrets: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`
