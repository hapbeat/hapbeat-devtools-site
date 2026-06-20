# instructions: llms.txt 自動生成（ツール/SDK 単位）+ getting-started 冒頭の AI ヒント

- 起点: workspace セッション（python-sdk の公開準備）/ 2026-06-20 / 依頼者: ユーザー直
- 対象 repo: hapbeat-devtools-site（このリポ）
- 種別: 機能追加（Starlight プラグイン）+ 全 getting-started ページへの定型ブロック追加
- 重要: **deploy しない**。実装 → `npm run build` で生成物を確認 → commit まで。デプロイ（master push）はユーザー判断。

## ゴール

1. **サイト全体 + ツール/SDK 単位の llms.txt を自動生成**する。
   - 全体: `/llms.txt`（索引）・`/llms-full.txt`（全文）・`/llms-small.txt`（圧縮）
   - ツール/SDK 単位: `/llms-<label>.txt`（その SDK/ツール + 共通 concepts のみ）
   - ユーザーは「自分が使う SDK の 1 URL」をエージェントに渡せば全体を掴める。
2. **各 getting-started（入口）ページの冒頭に「AI に読ませる用」のヒントブロック**を置く。
   そのページの SDK/ツールに対応する llms URL（と、あれば repo の `AGENTS.md`）を案内する。

## 背景（確認済みの事実）

- `starlight-llms-txt`（delucis 製・Starlight メンテナ）が docs から llms.txt 系を自動生成する。
  確認済みオプション: `projectName` / `description` / `details` / `optionalLinks` /
  `promote` / `demote` / `exclude` / `pageSeparator` / `minify` / **`customSets`**。
  - **`customSets`** = 「docs の部分集合を path glob で指定し、`llms-<label>.txt` を追加生成し
    `llms.txt` からリンクする」。← これで **SDK/ツール単位の分割**ができる。
  - 出典: https://delucis.github.io/starlight-llms-txt/configuration/ , https://github.com/delucis/starlight-llms-txt
- このサイト: `astro ^6.0.0` / `@astrojs/starlight ^0.38.0` / `site: https://devtools.hapbeat.com` /
  base なし（ルート配信）/ `public/` はルート静的配信 / `starlight({...})` に **`plugins:` 配列は未使用**（新設する）。
- **未確認・要検証**: `starlight-llms-txt` が Starlight 0.38 / Astro 6 で動くか。プラグインの
  peerDeps レンジを確認し、`npm run build` が通ることを必ず検証する。動かない場合は §「フォールバック」へ。
- `customSets` の正確なフィールド名（`label` / `paths` 等）は導入時にプラグイン docs で確認する
  （`customSets` 存在・path glob・`llms-<label>.txt` 出力は確認済み）。

## 実装 1: starlight-llms-txt 導入

1. 依存追加: `npm i -D starlight-llms-txt`（peerDeps が Starlight 0.38/Astro 6 を満たすか確認。
   満たさなければ §フォールバック）。
2. `astro.config.mjs` の `starlight({ ... })` に `plugins: [ starlightLlmsTxt({...}) ]` を追加。設定例（フィールド名は要確認）:

```js
import starlightLlmsTxt from 'starlight-llms-txt';
// starlight({
plugins: [
  starlightLlmsTxt({
    projectName: 'Hapbeat Developer Tools',
    description: 'Hapbeat の SDK・ツールの開発者向けドキュメント。',
    // SDK/ツール単位の部分集合。共通の concepts を各セットに含める。
    customSets: [
      { label: 'python-sdk', paths: ['docs/sdk-integration/python-sdk/**', 'docs/concepts/**'] },
      { label: 'unity-sdk',  paths: ['docs/sdk-integration/unity-sdk/**',  'docs/concepts/**'] },
      { label: 'studio',     paths: ['docs/tools/studio/**',               'docs/concepts/**'] },
      { label: 'helper',     paths: ['docs/tools/helper/**',               'docs/concepts/**'] },
      // 将来: web-sdk / godot-sdk / vrchat / touchdesigner / unreal-sdk の docs が
      // sdk-integration 配下に追加されたら同形で 1 行ずつ足す。
    ],
  }),
],
```

3. `npm run build`（`FETCH_DOCS_MODE=local`）で以下が生成されることを確認:
   - `dist/llms.txt` / `dist/llms-full.txt` / `dist/llms-small.txt`
   - `dist/llms-python-sdk.txt` / `dist/llms-unity-sdk.txt` / `dist/llms-studio.txt` / `dist/llms-helper.txt`
   各 `llms-<label>.txt` がその SDK/ツール + concepts のみを含むこと（他 SDK が混ざらない）を中身で確認。

### フォールバック（プラグインが 0.38/6 で動かない場合）
- `scripts/fetch-docs.mjs` の隣に自前生成スクリプト（`scripts/gen-llms.mjs`）を追加し、
  `docs/ja/<section>` から `public/llms*.txt` を組み立てて `public/` に出力（ルート配信）。
  最低限 `/llms.txt`（索引）と `/llms-<label>.txt`（SDK 単位）を作る。build 前に走らせる。
- どちらの方式でも **最終的な公開 URL は `https://devtools.hapbeat.com/llms-<label>.txt`** に揃える。

## 実装 2: getting-started 冒頭の AI ヒントブロック

対象（各 SDK/ツールの「入口」ページの **本文冒頭**、frontmatter 直後・最初の段落の前）:

- `docs/ja/start-here/01-getting-started.md`（サイト全体 → `/llms.txt` か `/llms-full.txt`）
- `docs/ja/sdk-integration/python-sdk/01-getting-started.md`（→ `/llms-python-sdk.txt` + repo `AGENTS.md`）
- `docs/ja/sdk-integration/unity-sdk/01-getting-started.md`（→ `/llms-unity-sdk.txt`）
- `docs/ja/tools/studio/01-initial-setup.md`（→ `/llms-studio.txt`）
- `docs/ja/tools/helper/01-getting-started.md`（→ `/llms-helper.txt`）
- 将来 SDK/ツールの docs が増えたら同様に追加。

ブロックの定型（JA、各ページの該当 URL に差し替える）。Starlight の `:::tip` を使う:

```md
:::tip[AI コーディングエージェントを使う方へ]
このツール/SDK の仕様・使い方を AI（Claude / Cursor / Copilot 等）に把握させるには、
次の一文をエージェントに渡してください。

> Hapbeat <名称> を使います。`https://devtools.hapbeat.com/llms-<label>.txt` を読んで、
> その仕様とベストプラクティスに従ってください。

（Python SDK はリポジトリ同梱の `AGENTS.md` でも同じ内容を参照できます。）
:::
```

- python-sdk ページには既存の「## AI コーディングエージェントに渡す」節がある。冒頭ヒントと
  重複しないよう、冒頭は短い `:::tip`（URL 1 つ）に留め、詳細は既存節へリンクで集約してよい。
- リンクは devtools-site ルールに従い、外部遷移は `target="_blank" rel="noopener noreferrer"`。
  ただし llms.txt は「人がクリックする導線」ではなく「エージェントに渡す URL 文字列」なので、
  コードスパン（`` ` ``）で**プレーン表示**にするのが無難（誤クリックで生 txt を開かせない）。

## devtools-site 固有ルール（厳守）

- **JA が source of truth**。`docs/ja/` を編集する。EN（`docs/en/`）は **per-PR で訳さない**
  （deploy/リリース節目に一括ミラー）。今回の AI ヒントブロックも JA のみでよい。
- サイドバー label の表示幅 ≤ 24。今回は新規ページを作らないので影響小。
- `src/content/docs/**` は生成物（編集しない）。編集は `docs/ja/**` と `astro.config.mjs`。

## 受け入れ条件

- `npm run build` 成功。`dist/llms.txt` + `dist/llms-full.txt` + 各 `dist/llms-<label>.txt` が生成。
- `llms-python-sdk.txt` が python-sdk + concepts のみ（unity/studio が混ざらない）を確認。
- 対象 getting-started 全ページの冒頭に AI ヒントブロックが表示される（プレビューで目視）。
- 既存ページ・サイドバー・他言語フォールバックが壊れていない。
- **deploy しない**。commit まで。プレビュー（`npm run dev` → http://localhost:4321）で目視確認し、
  人間の確認後に master push（= デプロイ）はユーザーが行う。

## 検証

```bash
FETCH_DOCS_MODE=local npm run build
ls dist/llms*.txt            # llms.txt / llms-full.txt / llms-small.txt / llms-<label>.txt
# 各 llms-<label>.txt の中身が当該セクション + concepts に限定されているか確認
```

## 参考

- python-sdk の user 向け `AGENTS.md`（repo 直下）= 手書きキュレーション版。llms-python-sdk.txt は
  docs からの自動生成版。役割が違うので両立（[python-sdk/AGENTS.md] 参照）。
- 既存 python-sdk docs（`docs/ja/sdk-integration/python-sdk/01-07`）に「## AI コーディングエージェントに渡す」節あり。
