# Campaign.astro v6 リライト指示 — 「数ヶ月」表記への統一

_作成日: 2026-05-27_
_作成元: hapbeat-ops 側のキャンペーン設計セッション_
_前提: v5 指示書適用後の Campaign.astro に対する差分指示_
_対象ファイル: `src/components/Campaign.astro`_

---

## このタスクの目的

v5 で「最長6ヶ月までの無償長期利用」と明示していた Perk 02 を、**「数ヶ月の無償長期利用」**に表現を緩和する。

---

## 方針転換の経緯

v5 で長期利用期間を「最長6ヶ月」と明示していたが、運用検討の結果以下の判断:

1. **具体数値を出すと、それを基準に「目一杯借りる」層が出る**: 用途と関係なく長期化する傾向
2. **「数ヶ月」と濁すと、用途に応じた柔軟運用が可能**: 2週間後の相談時に具体的な期間を握れる
3. **機材回転の最適化**: 「6ヶ月固定」需要を防ぎ、より多くの人にリーチできる
4. **内部基準は維持**: 公開ページとは独立して、3〜6ヶ月の幅で個別判断可能

→ 公開ページの Perk 02 を「数ヶ月の無償長期利用」に変更。Form 冒頭説明文との表現も統一済み。

---

## 具体的な変更指示

### 1. ファイル冒頭コメントの更新

現状の v5 コメント（推定）:
```
 * Campaign.astro — Hapbeat 無償貸出プログラム バナー (v5)
 *
 * v5 方針:
 *   - 常設プログラムとして運用 ("キャンペーン" 表記廃止)
 *   - 長期利用OK (最長6ヶ月) を独立した特典として明示
 *   ...
```

→ 以下に更新:
```
 * Campaign.astro — Hapbeat 無償貸出プログラム バナー (v6)
 *
 * v6 方針 (v5 からの差分):
 *   - 長期利用期間の表記を「最長6ヶ月」→「数ヶ月」に緩和
 *   - 公開ページでは期間を具体数値で出さず、相談ベースで柔軟運用
 *   - 内部基準は context/decisions/rental-pricing-policy.md を参照
 *
 * v5 から引き継ぐ方針:
 *   - 常設プログラムとして運用 ("キャンペーン" 表記廃止)
 *   - 「資料請求レベル」の温度感 — 申込時点で深い判断は不要
 *   - 2週間試用後にメールで継続/返却の相談
 *   - プレゼント・進呈の事前約束はしない (個別相談で対応)
 *   - "無料" 表記は使わず "無償" に統一
```

---

### 2. Perk 02 の文言変更

現状（v5）:
```html
<li class="campaign__perk">
  <span class="campaign__perk-num">02</span>
  <div>
    <h3>
      気に入ったら、<strong>最長6ヶ月までの無償長期利用</strong>
      <span class="campaign__perk-tag">長期OK</span>
    </h3>
    <p>
      デモ制作・展示・研究等で継続利用したい場合は、無償のままご相談いただけます。
      申込時点でお決めいただく必要はありません。
    </p>
  </div>
</li>
```

→ 以下に変更:
```html
<li class="campaign__perk">
  <span class="campaign__perk-num">02</span>
  <div>
    <h3>
      ご相談で<strong>数ヶ月の無償長期利用</strong>もOK
      <span class="campaign__perk-tag">長期OK</span>
    </h3>
    <p>
      お試し後、デモ制作・展示・研究等で継続利用したい場合は、
      数ヶ月単位の長期貸出を無償でご相談いただけます。
      申込時点でお決めいただく必要はありません。
    </p>
  </div>
</li>
```

#### 変更点
- タイトル: 「気に入ったら、最長6ヶ月までの無償長期利用」→「**ご相談で数ヶ月の無償長期利用もOK**」
- 本文: 「最長6ヶ月」相当の文言を「**数ヶ月単位の長期貸出**」に変更
- 本文冒頭に「**お試し後、**」を追加して時系列を明確化

---

### 3. その他「6ヶ月」表記の点検

`grep -ri "6ヶ月\|6か月\|6カ月" src/` を実行し、Campaign.astro 以外に「6ヶ月」表記が残っていないか確認:

- 該当があれば「数ヶ月」または「数ヶ月単位」に置換
- ただし内部メモやコメント内の運用基準としての「6ヶ月」は維持してよい（公開テキストのみが対象）

---

## 完成後の Perk 02 全体イメージ

```html
<li class="campaign__perk">
  <span class="campaign__perk-num">02</span>
  <div>
    <h3>
      ご相談で<strong>数ヶ月の無償長期利用</strong>もOK
      <span class="campaign__perk-tag">長期OK</span>
    </h3>
    <p>
      お試し後、デモ制作・展示・研究等で継続利用したい場合は、
      数ヶ月単位の長期貸出を無償でご相談いただけます。
      申込時点でお決めいただく必要はありません。
    </p>
  </div>
</li>
```

Perk 01 と Perk 03 は v5 のまま維持。

---

## やってはいけないこと

1. **具体数値「6ヶ月」「半年」を公開テキストに残さない**
2. **「最長」という表現を使わない**（基準値を明示することになるため）
3. **「数ヶ月」を「数ケ月」「数カ月」と表記揺れさせない**: 「数ヶ月」に統一
4. **CSS クラス名は変更しない**: 既存資産との衝突回避

---

## テスト・確認手順

1. `npm run dev` でローカル起動し、Campaign が表示されるページを確認
2. Perk 02 の表示が「ご相談で数ヶ月の無償長期利用もOK」になっているか目視
3. 各 breakpoint（mobile / tablet / desktop）でレイアウト崩れがないか
4. `grep -ri "6ヶ月\|6か月\|6カ月" src/` で残存表記がないか確認
5. `npm run build` が警告なく成功すること

---

## push 方針

- **完成しても自動 push しないでください**
- commit までで止め、依頼者にレビューを依頼すること
- コミットメッセージ例: `Campaign: v6 — soften long-term duration expression (6mo → "several months")`

---

## 完了後の処理

このファイル (`instructions-campaign-rework-v6-202605271448.md`) は、完了後に `instructions/completed/` に移動してください（既存の運用慣習に従う）。

---

## 関連リソース

- 現状ファイル: `src/components/Campaign.astro`
- v5 指示書（適用済み）: `instructions/completed/instructions-campaign-rework-v5-202605271300.md`
- v4 指示書（適用済み）: `instructions/completed/instructions-campaign-rework-v4-202605221700.md`
- ops 側の方針記録: `hapbeat-ops/context/decisions/2026-05-22-rental-pricing-policy.md`（内部基準として3〜6ヶ月の幅は維持）
- 関連 Form 修正指示書: `hapbeat-ops/outputs/drafts/2026-05-27-trial-program-form-revisions.md`

---

## 完了の定義

- [ ] Perk 02 のタイトル・本文が「数ヶ月」表記に変更されている
- [ ] ファイル冒頭コメントが v6 方針を反映している
- [ ] サイト内に「6ヶ月」「半年」「最長X月」などの具体数値表記が残っていない
- [ ] `npm run build` 成功
- [ ] commit までで止め、依頼者の push 承認を待つ
- [ ] このinstructions ファイルが `instructions/completed/` に移動済み
