# Instructions: docs サイトのコンテンツ拡充

**発行日:** 2026-05-08
**起票:** 2026-05-08 devtools-site 公開準備セッション
**優先度:** 即着手（次回セッションでまず取り組む）

## 背景

公開準備（リンク target ルール / 画像配置 / サイドバー整理 / トップ最小化）が一通り終わった。次のフェーズは **各 docs ページの中身を実用レベルまで詰める** こと。

## タスク

### 各 sub-repo の docs/ 中身

- `hapbeat-helper/docs/`
  - `getting-started.md` の OS 別インストール手順を最新化（pipx / brew / msi / Linux 削除済み）
  - トラブルシューティング項を実例ベースで拡充（port 7703 / Windows ファイアウォール等）
- `hapbeat-studio/docs/`
  - `getting-started.md` を「最初の Kit」フローに沿って整える
  - `initial-setup.md` を OS 別 / デバイス別の OOBE 手順に
  - `modes.md` (FIRE/CLIP/LIVE) の図解
  - `shortcuts.md` の最新 keyboard map
  - `ui-overview.md` の画面構成図
- `hapbeat-unity-sdk/docs/`
  - `getting-started.md` の前後を Unity SDK 視点で整理
  - EventMap / Trigger Component / Parameter Binding の使い方を実例 + スクショ込みで
- `hapbeat-contracts/docs/`
  - protocol overview を読みやすく（メッセージ仕様 / アドレシング / display layout）

### devtools-site 側

- トップページ index.mdx に再度コンテンツを足すか判断
  - 現状は hero + Tools 3 枠のみ。docs サイトとしてはこれでも OK
  - 「中身が増えてきたタイミング」で `## 最近の更新` のような News 的セクション追加を検討（手書き or hapbeat.com の API 取り込み）
- `concepts.md` を拡充（4 層モデル / 通信経路 / Group ID / Kit）。図解の追加検討
- `support.md` の Discussions URL を正式 URL に確定（現状 TODO コメントあり）
- `changelog.md` の自動収集化検討（GitHub Releases API → build 時取り込み）

### 画像 / 図版の整備

- `getting-started.md` の構成図 (`hapbeat-sdk-architecture.jpg`) は配置済み。EN 版の英訳版が欲しい場合 hero と同様
- 各 SDK ページにスクショや UI 図版を入れる検討

### Phase 2 候補（保留）

- hapbeat.com 側 `/api/usecases.json` 生成 → devtools-site が build 時 fetch（`workspace/docs/instructions-usecases-api-202605080340.md` 参照）
- Showcase ページの実装

## 完了条件

- [ ] 各 sub-repo の docs/ が「ユーザーが詰まらず読み通せる」レベルまで埋まる
- [ ] devtools-site 側のハブページ (concepts / support / changelog 等) も同様
- [ ] 本ファイルを `instructions/completed/` に移動

## 依存関係

- **Required**: なし（既存ベースの拡充）
- **Downstream**: hapbeat.com 側の usecases API 連携 (Phase 2)
