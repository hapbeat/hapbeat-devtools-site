# Campaign.astro v5 リライト指示 — プログラム名変更・長期利用強調・3段Perk化

_作成日: 2026-05-27_
_作成元: hapbeat-ops 側のキャンペーン設計セッション_
_前提: v4 指示書 (`completed/instructions-campaign-rework-v4-202605221700.md`) 適用済みの状態に対する差分指示_
_対象ファイル: `src/components/Campaign.astro` ＋ 必要に応じて `src/styles/campaign.css`_

---

## このタスクの目的

v4 適用済みの Campaign.astro に対して、以下の方針修正を反映する:

1. **「キャンペーン」表記を全廃**: 常設運用のため、期間限定ニュアンスを排除し「**プログラム**」に統一
2. **長期利用OK（最長6ヶ月）を独立した特典として強調**: 申込ハードルを下げつつ、得られるメリットを明示
3. **Perk 構成を 2段 → 3段** に戻す（プレゼント文言は復活させない）

---

## 方針転換の経緯

v4 で「資料請求レベルの軽さ」を実現したが、以下の指摘あり:

- 「キャンペーン」は期間限定促進のニュアンスがあり、常設運用とは温度感が合わない
- v4 の Perk 02「2週間後にメール」だと、**長期利用OK（最長6ヶ月）** が読み手に伝わりにくい
- 長期利用OKは申込動機として強いフックなので、独立した特典として見せたい

→ プログラム名を「**Hapbeat 無償貸出プログラム**」に変更し、長期利用を Perk 02 として独立させる。

---

## 具体的な変更指示

### 1. ファイル冒頭コメントの更新

現状:
```
 * Campaign.astro — Hapbeat 試用キャンペーンバナー (v4: 資料請求レベル)
 *
 * v4 方針:
 *   - 「資料請求レベル」の温度感 — 申込時点で深い判断は不要
 *   - 2週間試用後にメールで継続/返却の相談
 *   - プレゼント・進呈の事前約束は撤廃 (個別相談で対応)
 *   - "無料" 表記は使わず "無償" に統一
```

→ 以下に更新:
```
 * Campaign.astro — Hapbeat 無償貸出プログラム バナー (v5)
 *
 * v5 方針:
 *   - 常設プログラムとして運用 ("キャンペーン" 表記廃止)
 *   - 「資料請求レベル」の温度感 — 申込時点で深い判断は不要
 *   - 長期利用OK (最長6ヶ月) を独立した特典として明示
 *   - 2週間試用後にメールで継続/返却の相談
 *   - プレゼント・進呈の事前約束はしない (個別相談で対応)
 *   - "無料" 表記は使わず "無償" に統一
```

**コンポーネント名 (`Campaign.astro`)・CSS クラス名 (`.campaign*`) は変更不要** (既存資産との衝突を避けるため)。コンポーネントの "中身としての呼称" のみ「プログラム」に統一する。

---

### 2. リボン文言の変更

現状:
```html
<div class="campaign__ribbon">
  <span class="campaign__ribbon-dot"></span>
  OPEN CAMPAIGN · 開発者・クリエイター向け
</div>
```

→ 以下に変更:
```html
<div class="campaign__ribbon">
  <span class="campaign__ribbon-dot"></span>
  OPEN PROGRAM · 開発者・クリエイター向け
</div>
```

「CAMPAIGN」を「PROGRAM」に置換。

---

### 3. メインタイトル＆サブコピー

現状のタイトル・サブコピーは v5 方針と整合しているので **維持** で良い:

```html
<h2 id="campaign-title" class="campaign__title">
  <span class="campaign__title-pre">Hapbeat を</span>
  <span class="campaign__title-main">
    無償で<em>２週間</em>お試しいただけます
  </span>
</h2>
<p class="campaign__sub">
  ゲーム開発者・VR/XRクリエイター・メディアアーティスト・研究者の方を対象に、
  ワイヤレス触覚デバイス Hapbeat を実機で評価いただけます。
</p>
```

---

### 4. Perk リストを 2段 → 3段に変更

現状は 01「無条件2週間」、02「2週間後メール」の 2段構成。これを **3段** にする。

#### 新 Perk 01 (維持)

```html
<li class="campaign__perk">
  <span class="campaign__perk-num">01</span>
  <div>
    <h3>
      <strong>無条件で2週間</strong>の無償貸出
      <span class="campaign__perk-tag">誰でも</span>
    </h3>
    <p>審査なし。届いた当日から実機で開発・評価いただけます。返送料はお客様負担となります。</p>
  </div>
</li>
```

#### 新 Perk 02 (新規追加) — 長期利用強調

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

#### 新 Perk 03 (旧 Perk 02 を変形) — メールフォロー

```html
<li class="campaign__perk">
  <span class="campaign__perk-num">03</span>
  <div>
    <h3>
      2週間後、<strong>メールでご相談</strong>
      <span class="campaign__perk-tag">アフター</span>
    </h3>
    <p>
      お試し後、Hapbeat 社からメールでご連絡します。
      返却・継続利用のご相談はそのタイミングで承ります。
    </p>
  </div>
</li>
```

旧 Perk 02 にあった「**無償での延長もご相談いただけます**」は新 Perk 02 に吸収済みなので、新 Perk 03 では削除。

---

### 5. `campaign__fine` セクション

#### 「商用利用について」の文言微調整

現状:
```html
<div class="campaign__fine-block">
  <span class="campaign__fine-label">商用利用について</span>
  <p>
    体験者・イベント運営者等から金銭を得る形でのご利用は、
    事前に Hapbeat 社へご相談ください。
    自社 PR・社内利用は対象外です。
  </p>
</div>
```

→ 「対象外」が分かりづらいので以下に微調整:
```html
<div class="campaign__fine-block">
  <span class="campaign__fine-label">商用利用について</span>
  <p>
    体験者・イベント運営者等から金銭を得る形（=商用利用）でのご利用は、
    事前に Hapbeat 社へご相談ください。
    自社PR・社内利用は本プログラムの対象範囲内です。
  </p>
</div>
```

「対象外」→「対象範囲内」と言い換えることで、ユーザーに「自社PR・社内利用OK」というポジティブな情報として伝わる。

---

### 6. CSS 側の調整 (必要に応じて)

新 Perk 02 で `campaign__perk-tag` に「長期OK」が入る。既存の `campaign__perk-tag` クラスがそのまま使えるならスタイル変更不要。色を変えたい場合のみ `--long-term` などのバリアントクラスを追加してよい。

---

### 7. その他の "キャンペーン" 表記の点検

`grep -ri "キャンペーン\|campaign" src/components/Campaign.astro` を実行し、以下の場所に「キャンペーン」が残っていないか点検する:

- HTML 内のテキスト
- コメント
- aria 属性
- 画像 alt（あれば）

CSS クラス名（`.campaign`, `.campaign__*`）は変更しない（既存資産との衝突回避）。**「中身としての呼称」のみ "プログラム" に統一**する。

サイト内の他のページ・コンポーネントで Campaign セクションへの言及があるか確認:
```bash
grep -ri "試用キャンペーン\|無償キャンペーン\|キャンペーン" src/ --exclude-dir=node_modules
```

該当があれば、それも「無償貸出プログラム」に書き換える。

---

## 完成後の Campaign.astro 全体イメージ (参考)

```astro
---
/**
 * Campaign.astro — Hapbeat 無償貸出プログラム バナー (v5)
 * (前述のコメント全文)
 */
interface Props {
  formUrl: string;
  accentEdge?: boolean;
}
const { formUrl, accentEdge = false } = Astro.props;
---

<section class:list={["campaign", accentEdge && "campaign--accent-left"]} aria-labelledby="campaign-title">
  <div class="campaign__ribbon">
    <span class="campaign__ribbon-dot"></span>
    OPEN PROGRAM · 開発者・クリエイター向け
  </div>

  <div class="campaign__grid">
    <div class="campaign__lede">
      <h2 id="campaign-title" class="campaign__title">
        <span class="campaign__title-pre">Hapbeat を</span>
        <span class="campaign__title-main">
          無償で<em>２週間</em>お試しいただけます
        </span>
      </h2>
      <p class="campaign__sub">
        ゲーム開発者・VR/XRクリエイター・メディアアーティスト・研究者の方を対象に、
        ワイヤレス触覚デバイス Hapbeat を実機で評価いただけます。
      </p>
      <div class="campaign__cta-row">
        <a class="btn btn--campaign" href={formUrl} target="_blank" rel="noopener">
          Google Form で応募する
          <!-- 矢印svg維持 -->
        </a>
        <span class="campaign__cta-note">所要 3 分 · 個人 / 法人どちらでも</span>
      </div>
    </div>

    <ol class="campaign__perks">
      <li class="campaign__perk">
        <span class="campaign__perk-num">01</span>
        <div>
          <h3><strong>無条件で2週間</strong>の無償貸出<span class="campaign__perk-tag">誰でも</span></h3>
          <p>審査なし。届いた当日から実機で開発・評価いただけます。返送料はお客様負担となります。</p>
        </div>
      </li>
      <li class="campaign__perk">
        <span class="campaign__perk-num">02</span>
        <div>
          <h3>気に入ったら、<strong>最長6ヶ月までの無償長期利用</strong><span class="campaign__perk-tag">長期OK</span></h3>
          <p>デモ制作・展示・研究等で継続利用したい場合は、無償のままご相談いただけます。申込時点でお決めいただく必要はありません。</p>
        </div>
      </li>
      <li class="campaign__perk">
        <span class="campaign__perk-num">03</span>
        <div>
          <h3>2週間後、<strong>メールでご相談</strong><span class="campaign__perk-tag">アフター</span></h3>
          <p>お試し後、Hapbeat 社からメールでご連絡します。返却・継続利用のご相談はそのタイミングで承ります。</p>
        </div>
      </li>
    </ol>
  </div>

  <div class="campaign__fine">
    <div class="campaign__fine-block">
      <span class="campaign__fine-label">返送について</span>
      <p>同梱された梱包物を用いて、<strong>クリックポスト（185円・税込）</strong>にてご返却ください。返送料はご負担となります。</p>
    </div>
    <div class="campaign__fine-block">
      <span class="campaign__fine-label">在庫・上限</span>
      <p>
        Duo WL は<strong>2台まで</strong>、Band WL は<strong>1台まで</strong>（数量限定・先着順）。
        組み合わせ申込可・合計3台までご利用いただけます。
        在庫状況によりお待ちいただく場合があります。
      </p>
    </div>
    <div class="campaign__fine-block">
      <span class="campaign__fine-label">商用利用について</span>
      <p>
        体験者・イベント運営者等から金銭を得る形（=商用利用）でのご利用は、
        事前に Hapbeat 社へご相談ください。
        自社PR・社内利用は本プログラムの対象範囲内です。
      </p>
    </div>
  </div>
</section>
```

---

## やってはいけないこと

1. **「キャンペーン」を本文・属性・コメントに残さない**: ただしCSSクラス名（`.campaign`）はそのまま維持
2. **プレゼント・進呈・無償提供（譲渡）の文言を復活させない**: 個別相談で対応するため、公開ページには出さない
3. **「無料」表記を入れない**: "無償" に統一
4. **新規ページを作らない**: スコープは Campaign.astro と関連ファイルのみ
5. **Astro の「ゼロJS デフォルト」を崩さない**

---

## テスト・確認手順

1. `npm run dev` でローカル起動し、Campaign が表示されるページを確認
2. 各 breakpoint（mobile / tablet / desktop）でレイアウト崩れがないか目視
3. Perk が 3段に増えても、グリッドや高さが破綻していないか
4. アクセシビリティ: heading 構造（h2 → h3）が正しいか
5. `npm run build` が警告なく成功すること
6. `grep -ri "キャンペーン" src/` で意図しない箇所が残っていないか最終確認

---

## push 方針

- **完成しても自動 push しないでください**
- commit までで止め、依頼者にレビューを依頼すること
- このリポジトリは Xserver に FTPS デプロイされる配布物 repo の扱い
- コミットメッセージ例: `Campaign: v5 rework (rename to program, emphasize long-term use)`

---

## 完了後の処理

このファイル (`instructions-campaign-rework-v5-202605271300.md`) は、完了後に `instructions/completed/` に移動してください（既存の運用慣習に従う）。

---

## 関連リソース

- 現状ファイル: `src/components/Campaign.astro`
- 関連CSS: `src/styles/campaign.css`
- 前回適用済み指示書: `instructions/completed/instructions-campaign-rework-v4-202605221700.md`
- ops 側の方針記録: `C:\GitHub\Hapbeat\hapbeat-ops\context\decisions\`

---

## 完了の定義

- [ ] 「キャンペーン」表記が本文・属性・コメントから完全削除 (CSS クラス名は除く)
- [ ] リボン文言が `OPEN PROGRAM` に変更
- [ ] Perk リストが 3段構成 (01: 2週間 / 02: 最長6ヶ月 / 03: メールフォロー)
- [ ] 「商用利用について」の文言が新版に更新済み
- [ ] サイト内の他のページ・コンポーネントで「キャンペーン」表記が残っていない (grep 確認)
- [ ] `npm run build` 成功
- [ ] commit までで止め、依頼者の push 承認を待つ
- [ ] このinstructions ファイルが `instructions/completed/` に移動済み
