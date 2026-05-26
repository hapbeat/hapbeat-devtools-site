# 事後承認 note: Concepts 3 ページを schema 2.0.0 / DEC-031 に追従

**起点 repo:** `hapbeat-contracts` (workspace session 2026-05-26)
**関連:** [DEC-031](../../../docs/decision-log.md#DEC-031) (Kit manifest schema 2.0.0)
**起点 commit (contracts):** `0371eb4` "spec: kit manifest schema 2.0.0 (DEC-031, Option C)"

## 何を変更したか

workspace `hapbeat-contracts` セッションから横断的に devtools-site の Concepts 3 ページを schema 2.0.0 (DEC-031) に追従させた。Concepts は規範ドキュメントへの導入路として読まれるため、`mode` フィールド廃止と `stream_source` 廃止が反映されていない状態を放置すると新規読者の誤解を招く。

### 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `docs/concepts/05-event-id-and-kit.md` | Kit フォルダ図の `manifest.json` → `<kit-name>-manifest.json` に rename し host/wire の rename 規約を注記。サンプル manifest を schema 2.0.0 (`events` + `stream_events` 2 bucket) に書き直し、`mode` フィールドを削除。フィールド表に `schema_version` / `events` / `stream_events` を追加し、`mode` / `stream_*` 行を削除。`<bucket>[<id>].clip` 説明を bare filename + bucket 自動解決に。デプロイ流れの mode 用語を bucket 用語に |
| `docs/concepts/06-fire-vs-clip.md` | 「3 つの mode」セクションを「2 つの送信方式」に置換 (`events` / `stream_events` bucket 由来、BOTH モード追加、DEC-031 リンク注記、schema 1.x との差分を簡潔に明記)。`stream_source` の言及を完全削除。Fire / Clip モード見出しから `(command)` / `(stream_clip)` を削除。判断フローと Studio UI 対応表を bucket 用語に書き直し、BOTH 行を追加 |
| `docs/concepts/07-glossary.md` | `Fire (command)` / `Clip (stream_clip)` エントリを `Fire` / `Clip` に rename し、bucket 由来の説明に書き換え。`stream_source` エントリ削除。新規エントリ `BOTH モード` と `bucket (manifest)` を追加。`Kit` の `manifest.json` を `<kit-name>-manifest.json` に。`intensity` のフィールドパスを 2 bucket 両方に。`install-clips/` / `stream-clips/` 説明の mode 用語を bucket 用語に |

## 横断的背景

- 同セッションで先に contracts 側 schema 2.0.0 (Option C: `events` を command 専用に narrow + `stream_events` 新設) を commit `0371eb4` で確定
- 既存 Concepts は `mode` フィールド + `stream_source` 前提のままだったため、追従が必要だった
- Unity SDK API 名 (`HapbeatManager.Play(eventId, gain)` / `HapbeatManager.StreamAudioClip(clip, gain)`) は現行実装 (`Runtime/HapbeatManager.cs:255, 464`) と一致することを確認済 — 変更なし

## 検証状況

- ローカル build / preview は未実施 (内容更新のみ、構造的な変更なし)
- リンク (`./architecture/` / `./fire-vs-clip/` / GitHub DEC リンク等) はすべて既存と同じパターン
- fetch-docs.mjs の対象に `hapbeat-devtools-site/docs/` 自身は含まれない (site repo はサブ repo の `docs/` を集約するが、自身の `docs/` は直接配信) ため、サブ repo を編集する必要は無い

## 当該 repo (devtools-site) エージェントへのアクション

1. 上記 3 ファイルの diff を review
2. ローカルで `npm run dev` を起動し Concepts 3 ページの表示崩れがないか確認
3. 問題なければそのまま master に commit (本セッションで commit までは workspace が実行する見込み)
4. 本 applied note を `instructions/completed/` へ移動

## 補足

- Concepts はユーザー向け explanation。schema 2.0.0 は破壊的変更だが pre-release のため移行ガイドは作らず、現行 spec の説明として書き直す方針 (workspace CLAUDE.md「既存ユーザー向け移行ガイドを作らない」)
- 関連で kit-format spec / kit-manifest schema / fixtures / message-format / decision-log は contracts repo 側で commit 済 (`0371eb4`)
- 別途、unity-sdk と device-firmware には追従 instructions が起票済 (firmware は dead code 削除のみで動作変更なし、低優先)
