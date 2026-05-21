# applied: Tutorial v3 全体像を index.md に反映

**起点セッション**: workspace worktree `gallant-mclaren-85d445` (hapbeat-unity-sdk Tutorial 再設計)
**日付**: 2026-05-18
**関連 instruction**:
- `hapbeat-unity-sdk/instructions/later/instructions-tutorial-unified-bowling-zone-202605180000.md`
- `hapbeat-unity-sdk/instructions/later/instructions-tutorial-scene-builder-v3-202605180100.md`

## 変更ファイル

- `docs/sdk-integration/unity-sdk/tutorial/index.md` — 全面書き直し

## 背景

Tutorial v3 (Trigger-first 再設計) のセッション中に作成した「統合後の Tutorial 全体像」表をユーザーが docs に転記するよう指示。devtools-site を docs の真の単一ソース化した最近の方針に従い、本 repo に直接書いた。

## 主な変更点 (v2 → v3)

- **`TutorialBridge` 派生クラスへの言及を全削除** — v3 で完全撤廃したため
- **Target Picker UI を撤去** — 動的 target 切替は SDK 仕様だが Tutorial では教えない方針に変更
- **Z3 を Pickup Box → Fishing Rod に変更** — `HapbeatParameterBinding` の demo が直感的になるよう物理シミュレーション側を再設計
- **Z4 を raw `Manager.StreamAudioClip` → `HapbeatUnityEventTrigger` (StreamClip loop) に統一** — EventMap 経由が王道
- **Z5 を `Bridge.PlayWithCurve` → `Trigger.GainMultiplier + Fire()` に変更** — script は値書くだけ
- **Q/P hotkey を `GlobalHotkeys` script から `HapbeatKeyDispatcher + HapbeatActionHelper` に置換** — 宣言的 wiring
- **`Build Samples → 2. Tutorial (full scene)` メニューの記述を削除** — 旧 builder は v3 アーキ非対応で削除済、v3 builder は別 instruction で起票済

## 影響を受ける他ページ (本セッションでは触らず)

- `docs/sdk-integration/unity-sdk/tutorial/walkthrough.md` — 旧 Build メニュー前提・TutorialBridge wiring 手順含む。**stale**
- `docs/sdk-integration/unity-sdk/tutorial/method-choice.md` — 内容未確認だが BatchSetup vs script の比較ページ。Z4 が EventMap 経由になった影響あり得る

Tutorial v3 が手動 wiring で完成し動作確認が終わった後、walkthrough.md を v3 手順に書き直すべき。後続 instruction を別途起票するのが望ましい。

## 検証

- typecheck / build は本セッションでは未実施 (markdown 編集のみで Astro build に影響しないため)
- リンク先 (triggers / event-map / parameter-binding / streaming / fire-vs-clip) は既存のまま — 内容変更不要

## アクション

- devtools-site セッションでレビュー → 問題なければ `instructions/completed/` に移動
- 表現の校正・stale ページ更新が必要なら fix instruction を新規起票
