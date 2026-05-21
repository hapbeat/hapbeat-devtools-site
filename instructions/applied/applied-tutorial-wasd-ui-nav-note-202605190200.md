# applied: Tutorial index.md に WASD/UI nav 衝突対策の節を追加

**起点セッション**: workspace worktree (hapbeat-unity-sdk Tutorial scene 編集中)
**日付**: 2026-05-19

## 変更ファイル
- `docs/sdk-integration/unity-sdk/tutorial/index.md` — 「WASD と UI nav の衝突 (Tutorial の対処)」セクションを追加

## 背景
ユーザーが Z4 Stream Panel の Slider を触った際、WASD で Slider 値が変化する症状を発見。原因は Unity `InputSystemUIInputModule` の `UI/Navigate` action のデフォルト WASD バインド。

Tutorial では:
1. `SimpleFPSController.HandleMove` を cursor lock 中のみ動作させる (Z4 unlock 中は player 不動)
2. 各 Slider に `UiDeselectOnPointerUp` script を attach (drag 離した時点で deselect)

の二重対症療法で対応。Production project では UI Input Module 側の InputActions を編集して WASD を外すのが筋なので、その手順も併記。

## 検証
- markdown 編集のみ。Astro build には影響なし

## アクション
- devtools-site セッションでレビュー → completed/ へ移動
- 表現校正など必要なら fix
