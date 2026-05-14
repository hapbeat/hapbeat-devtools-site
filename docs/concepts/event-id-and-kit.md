---
title: Event ID と Kit の構造
kind: explanation
description: Hapbeat の触覚資産を束ねる「Kit」と、SDK が発火する「Event ID」の命名規則と関係。
sidebar:
  order: 5
---

:::caution[執筆中]
このページは Phase B で執筆予定です。現状は要点メモのみ。
:::

## このページで扱うこと (予定)

- Kit = 触覚資産 (WAV + manifest.json) のフォルダ
- Event ID = `<kit-name>.<clip-name>` の命名規約
- manifest.json の構造 (events / target_device / mode / intensity / device_wiper)
- Studio がローカルファイルとして書き出し、Helper 経由で Hapbeat に転送される流れ
- Kit name = manifest の `name` = フォルダ名の一本化 (DEC-028)

## 関連リンク

- [gain の乗算構造](/docs/concepts/gain-architecture/) — Kit の intensity が乗算チェーンのどこに入るか
- [Kit デザインガイド](/docs/tools/studio/kit-design/) — Studio で Kit を作る具体手順 (howto)
- [Mode の使い分け](/docs/tools/studio/modes/) — Studio 視点のモード解説
- [Fire と Clip の比較](/docs/concepts/fire-vs-clip/) — SDK 横断の選択ガイド
