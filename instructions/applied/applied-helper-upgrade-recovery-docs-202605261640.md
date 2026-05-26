# [applied] Helper のアップデート失敗リカバリ手順を docs に追記

**起点セッション:** hapbeat-helper (workspace root, master)
**日付:** 2026-05-26
**関連 commit (helper):** 84b73db (schema 2.0.0 追従 cleanup + 0.1.3.dev1 bump)

## 当 repo の変更

### `src/content/docs/docs/tools/helper/getting-started.md`

「アップデート」セクションに新しいサブセクション **「`hapbeat-helper stop` を忘れて upgrade / uninstall した場合」** を追加し、Windows / macOS 別のリカバリ手順を記載:

- **Windows**: 自動起動 helper が `.pyd` を握っているため `pipx uninstall` / `pipx upgrade` が `PermissionError` で失敗するメカニズムを説明。PowerShell ベースのリカバリ手順 (schtasks /End → Stop-Process → trash 掃除 → pipx 再実行 → install-service) を掲載
- **macOS**: Unix が実行中ファイル削除を許す挙動上、pipx 自体は成功するが古い daemon が動き続けるリスクを説明。launchctl bootout 経由のリカバリ手順を掲載
- 「アップデート」手順の step 1 に `← 必須（後述「stop を忘れた場合」参照）` を追記
- 「トラブルシューティング」表に Windows `PermissionError` 行を追加 (anchor link で詳細セクションへ誘導)

## 横断的な背景

helper v0.1.3.dev1 を TestPyPI で検証する過程で、`pipx uninstall hapbeat-helper` を v0.1.2 daemon 常駐のまま実行すると `PermissionError` で失敗する事象を再現確認。ユーザーから「stop を忘れた場合のリカバリ手順が必要」「docs に書いておいて」の依頼で本変更を実施。

helper repo 側にも同じ内容を載せる選択肢はあったが、workspace の 2026-05-12 IA 再編で **sub-repo の `docs/` は撤去し devtools-site に一元化** したため、devtools-site の `src/content/docs/docs/tools/helper/getting-started.md` が source of truth。

## 検証状況

- `npx astro build` で 94 ページ build 完走 (anchor link 切れ等の warning なし)
- 追記したセクションのリンク (`#hapbeat-helper-stop-を忘れて-upgrade--uninstall-した場合`) は Starlight の自動 heading anchor 生成規約に従う
- 実機確認は本セッションの helper TestPyPI 動作確認の流れで担当 (ユーザー側で実施中)

## devtools-site エージェントへのアクション

- 内容を review し、問題なければ本ファイルを `completed/` に移動
- 文章のトーン / 用語 (`commit`, `pipx`, `launchctl`) が他のページと揃っているか軽くチェック (helper docs 内では既存表記と一致させた)
- helper の TestPyPI 検証が完了し本番 PyPI に上がる commit と一緒に push される想定 (helper 本体の commit/push 完了後に devtools-site の deploy が走ると `notify-devtools-site.yml` の repository_dispatch で trigger される)
