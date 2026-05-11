# Instructions: docs 内容の再編集 (Phase 6 残作業)

**発行日:** 2026-05-12
**起票:** docs IA 大規模再編セッション (claude/practical-matsumoto-fb2a09)
**優先度:** 即着手（IA 構造は固まったが、各ページの内容自体は古いまま）

## 背景

このセッション (2026-05-11) で docs IA の大規模再編が完了:

- Diátaxis 4 区分 (Tutorial / How-to / Reference / Explanation) のフレームワーク採用
- devtools-site への docs 一元化 (sub-repo docs/ は撤去、portal が正本)
- サイドバー刷新: 🎯 Start Here / 💡 Concepts / 🛠 Tools / 📦 SDK Integration / 📖 Reference / ❓ Support
- 全ページに `kind:` frontmatter + KindBadge (TOC 直下に Diátaxis 区分 pill 表示)
- サブページを Diátaxis 順に並び替え (tutorial → howto → reference → explanation)
- Concepts hub の P1 3 ページ新規 (architecture / communication-model / gain-architecture)
- umbrella ランディング auto-gen (/docs/tools/ /sdk-integration/ /reference/)
- サイドバーのネスト罫線・パディング微調整 (3 階層末端のみ、margin 0.6rem)
- umbrella クリック navigation を撤去 (bindGroupLabelNav 撤去で toggle のみに)
- トップレベル □ 撤去 (絵文字アイコンに一本化)

**しかしページ本体の中身は IA 移行前の状態のまま** — タグ付けと並び替えだけで、
中身の総合的な見直し・再編は次セッションに持ち越しとなっている。

## タスク

### Phase 6: 既存ページの内容再編 (Diátaxis に整合させる)

各ページが `kind` フィールドの種別に純粋に沿っているか見直し、必要に応じて:

1. **Tutorial 系** (`kind: tutorial`) — 手を動かす学習
   - 対象: `docs/getting-started.md`, `docs/studio/getting-started.md`,
     `docs/helper/getting-started.md`, `docs/unity-sdk/getting-started.md`,
     `docs/unity-sdk/integration.md`, `docs/unity-sdk/tutorial/*`,
     `docs/unity-sdk/xri-handdemo-quickstart.md`
   - 確認: 1 シナリオを最初から最後まで案内、リファレンス情報の混入なし
   - 重複削除: helper/getting-started, studio/getting-started, devtools-site/getting-started
     の入門フローが3重に書かれている問題は **未解決**。portal を正本に統合

2. **How-to 系** (`kind: howto`) — 特定タスクの手順
   - 対象: `docs/studio/initial-setup.md`, `docs/studio/kit-design.md`,
     `docs/firmware/wifi-setup.md`, `docs/firmware/troubleshooting.md`,
     `docs/unity-sdk/streaming.md`, `docs/unity-sdk/multi-app.md`,
     `docs/unity-sdk/ai-assisted-workflow.md`
   - 確認: 達成目的が冒頭に明示、手順が箇条書きで簡潔、概念解説は Concepts へリンク

3. **Reference 系** (`kind: reference`) — 仕様照会
   - 対象: `docs/helper/cli-reference.md`, `docs/studio/shortcuts.md`,
     `docs/studio/ui-overview.md`, `docs/unity-sdk/installation.md`,
     `docs/unity-sdk/triggers.md`, `docs/unity-sdk/event-map.md`,
     `docs/unity-sdk/parameter-binding.md`, `docs/unity-sdk/editor-menus.md`,
     `docs/faq.mdx`
   - 確認: 一覧性、検索しやすさ、ナレーション排除

4. **Explanation 系** (`kind: explanation`) — 背景・設計判断
   - 対象: `docs/concepts/*`, `docs/helper/security.md`,
     `docs/studio/modes.md`, `docs/unity-sdk/fire-vs-clip.md`,
     `docs/unity-sdk/tutorial/method-choice.md`
   - 確認: なぜそうしたのかが説明されている。手順は How-to へ

### Phase 6 P2 ページ執筆 (Concepts hub の追加分)

プランで宣言したが未着手:

- `docs/concepts/event-id-and-kit.md` — Event ID 命名規則 + Kit 構造 (contracts/overview から昇格)
- `docs/concepts/group-player-addressing.md` — DEC-030 の `group_<N>` suffix 方式と player 概念
- `docs/concepts/fire-vs-clip.md` — Unity SDK ローカル版を統合し SDK 横断の判断ガイドへ
- `docs/glossary.md` — Event ID / Kit / Group / Player / Helper など用語集
- `docs/start-here/03-kit-deploy.md` (もしくは別構成) — Kit 作成 → デプロイの完全チュートリアル

### Studio modes.md / kit-design.md の Concepts vs How-to 分割

- `docs/studio/kit-design.md`: gain 乗算構造の概念部 → `docs/concepts/gain-architecture.md` へ統合済み？再確認
- `docs/studio/modes.md`: Fire vs Clip 概念解説 → `docs/concepts/fire-vs-clip.md` へ統合する余地

### portal duplicates の最終統合

- `docs/getting-started.md` (portal root) と `docs/helper/getting-started.md` /
  `docs/studio/getting-started.md` の入門フロー重複を整理
- portal root を「全体俯瞰 + 各ツールへの誘導」に絞り、ツール別 getting-started に
  詳細を委ねる

## 完了条件

- [ ] 全 30 ページの `kind` が内容と一致しているレビュー完了
- [ ] Concepts P2 ページ (event-id-and-kit / group-player-addressing / fire-vs-clip /
      glossary) を新規執筆
- [ ] Studio modes / kit-design の Concept 部分を Concepts hub と整合させる
- [ ] portal getting-started と sub-repo getting-started の重複を解消
- [ ] `npm run build` が warning なしで通過
- [ ] dev server で全ページのリンク切れがないこと、サイドバーが正しく描画されることを目視確認
- [ ] 本ファイルを `instructions/completed/` に移動

## 依存関係

- **Required**: なし (IA 構造は本セッションで固まっている)
- **Downstream**: 完了後、CLAUDE.md の進捗を更新 + master へ push

## 参考

- IA プラン: `hapbeat-sdk-workspace/docs/instructions-docs-ia-restructure-202605111600.md`
- 本セッションの commit: `b34ab4f` から `6a69ea7` まで (devtools-site, 20 件)
