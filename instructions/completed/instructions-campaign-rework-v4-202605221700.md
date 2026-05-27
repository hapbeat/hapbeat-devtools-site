# Campaign.astro リライト指示 — v4 方針（資料請求レベル化）

_作成日: 2026-05-22_
_作成元: hapbeat-ops 側のキャンペーン設計セッション_
_対象ファイル: `src/components/Campaign.astro` ＋ 必要に応じて `src/styles/campaign.css`_

---

## このタスクの目的

既存の `Campaign.astro`（v1 相当の内容）を、**v4 方針（資料請求レベルの軽い貸出キャンペーン）** にリライトする。新規ページの作成や別コンポーネントの追加は不要。**現状のコンポーネントを上書き・簡素化**するのが基本方針。

---

## 方針転換の経緯（背景理解）

### v1（既存）の問題点
現状の Campaign.astro には以下が明記されており、運用上・法的に問題が出ることが判明:

1. **「条件次第でデバイスをプレゼント」を事前に約束している**
   - 品質基準の主観性が高く、申込者の期待値とのギャップで揉める可能性
   - 「公開」「Hapbeat社も利用できる形」の権利関係が曖昧
   - 「公開したのにプレゼントが来ない」というクレームの温床
2. **「無償」と書きつつ「返送費はご負担」と注意書きしている → "無料" 解釈の余地**
3. **「Duo WL は潤沢」と書いている → 在庫変動時に虚偽表示リスク**（並行案件で在庫が動く可能性あり）
4. **「数か月長期OK」を申込時点の選択肢として提示** → 申込者に判断負荷を強いる
5. **応募者の本気度を申込時点で測ろうとしている** → エントリーハードルが上がる

### v4（新方針）のコンセプト
- **「資料請求レベル」の温度感**: 申込時点では使うかどうか分からなくてOK、軽く触ってもらう
- **2週間貸出後にメールで継続判断**: 本気度の選別は事後フォロー
- **プレゼント・進呈は完全に公開ページから消す**: 内部判断・個別相談で対応するため、ユーザーへの事前約束は一切しない
- **「無料」→「無償」に統一**: 返送料発生のため、誤解を招く表記を回避
- **在庫数の具体的言及を控える**: 「数量限定」「在庫状況によりお待ちいただく場合あり」程度に
- **借用条件は Google Form 側で同意取得**: LP本文には載せない

---

## 具体的な変更指示

### 削除する要素

#### ① Perk 03（プレゼント特典）まるごと削除
現状の以下のブロックを完全に削除する:

```html
<li class="campaign__perk campaign__perk--gift">
  <span class="campaign__perk-num">03</span>
  <div>
    <h3>
      条件次第で<strong>Duo WL / Band WL を１台プレゼント</strong>
      <span class="campaign__perk-tag campaign__perk-tag--gift">プレゼント</span>
    </h3>
    <p>
      作成したデモコンテンツを公開、または Hapbeat 社も利用できる形にしていただける場合、
      <strong>個人 / 非商用利用に限り</strong>進呈します。
    </p>
  </div>
</li>
```

→ Perk リストは **2項目体制**にする（後述）。`campaign__perk--gift` クラスや `campaign__perk-tag--gift` クラスを使っている CSS があれば、合わせて整理してよい。

#### ② サブコピーから「デバイスのプレゼント」言及を削除
現状:
```
条件を満たせば、デバイスのプレゼントも。
```
→ この一文を削除する。

#### ③「Duo WL は潤沢に在庫あり」表記を削除
現状の `campaign__fine` 内:
```
Duo WL は<strong>2台まで</strong>（潤沢に在庫あり）。
```
→ 「潤沢に在庫あり」を削除。台数上限のみ記載。

---

### 書き換える要素

#### ④ メインタイトル（h2）はほぼ維持で良い
現状の「Hapbeat を 無償で２週間試せるキャンペーン」は v4 方針と整合しているので維持。
ただし `<em>２週間試せる</em>` の表現が硬めなら「**Hapbeat を 無償で2週間お試しいただけます**」のような柔らかいトーンに微調整する余地あり（任意）。

#### ⑤ サブコピー
現状:
```
開発・デモ制作のために、ワイヤレス触覚デバイス Hapbeat を実機で評価できます。
条件を満たせば、デバイスのプレゼントも。
```
→ 以下に書き換え:
```
ゲーム開発者・VR/XRクリエイター・メディアアーティスト・研究者の方を対象に、
ワイヤレス触覚デバイス Hapbeat を実機で評価いただけます。
```

#### ⑥ Perk 01（無条件2週間試用）
タイトル・タグはほぼ維持で良い。本文を以下に微調整:

```html
<h3>
  <strong>無条件で2週間</strong>の無償貸出
  <span class="campaign__perk-tag">誰でも</span>
</h3>
<p>審査なし。届いた当日から実機で開発・評価いただけます。返送料はお客様負担となります。</p>
```

「無償試用」→「無償貸出」に統一（業務上のニュアンス整合）。

#### ⑦ Perk 02（長期利用）→ コンセプトを「2週間後のメールフォロー」に再フレーム

現状の「数か月単位の長期利用もOK」は維持しつつ、**申込時点で判断不要であることを強調する**書き方に変更:

```html
<li class="campaign__perk">
  <span class="campaign__perk-num">02</span>
  <div>
    <h3>
      2週間後、<strong>メールでご相談</strong>
      <span class="campaign__perk-tag">アフター</span>
    </h3>
    <p>
      お試し後、Hapbeat 社からメールでご連絡します。
      返却・継続利用のご相談はそのタイミングで。
      デモ制作等で長期利用ご希望の場合、<strong>無償での延長</strong>もご相談いただけます。
    </p>
  </div>
</li>
```

#### ⑧ CTA ノートの調整
現状:
```
所要 3 分 · 個人 / 法人どちらでも
```
→ 維持で良い。ただし「個人 / 法人どちらでも」は対象明示として残す価値あり。

#### ⑨ `campaign__fine` セクションに「商用利用」項目を追加

現状は「返送について」「在庫・上限」の2ブロック構成。**3ブロック目を追加**:

```html
<div class="campaign__fine-block">
  <span class="campaign__fine-label">商用利用について</span>
  <p>
    体験者・イベント運営者等から金銭を得る形でのご利用は、
    事前にHapbeat社へご相談ください。
    自社PR・社内利用は対象外です。
  </p>
</div>
```

CSS グリッドが2カラム前提なら、3カラムまたは2行構成に対応させる調整も合わせて行う（`campaign.css` 側で `grid-template-columns: repeat(auto-fit, minmax(...))` 等で対応可能なら自動調整）。

#### ⑩ 「在庫・上限」ブロックの書き換え
現状:
```
Duo WL は<strong>2台まで</strong>（潤沢に在庫あり）。
Band WL は<strong>1台まで</strong>かつ<strong>先着順</strong>で数量限定。
```
→ 以下に書き換え:
```
Duo WL は<strong>2台まで</strong>、Band WL は<strong>1台まで</strong>（数量限定・先着順）。
組み合わせ申込可・合計3台までご利用いただけます。
在庫状況によりお待ちいただく場合があります。
```

---

### 任意の追加要素（やる/やらないは判断委ねる）

#### a) 「お申込みから返却までの流れ」ステップ表示
別セクションとして以下4ステップを視覚化するブロックを Campaign.astro 内に追加してもよい。スペースが厳しいなら省略可:

1. フォームよりお申込み
2. 在庫を確認のうえ発送
3. 2週間お試し
4. メールでご相談（返却 or 継続）

#### b) FAQ への誘導
既に `Faq.astro` があるなら、CTAエリアまたはセクション末尾に「よくある質問はこちら」のリンクを置いてもよい。

---

## 完成後の Campaign.astro 全体イメージ（参考。これに忠実である必要はない）

```astro
---
interface Props {
  formUrl: string;
  accentEdge?: boolean;
}
const { formUrl, accentEdge = false } = Astro.props;
---

<section class:list={["campaign", accentEdge && "campaign--accent-left"]} aria-labelledby="campaign-title">
  <div class="campaign__ribbon">
    <span class="campaign__ribbon-dot"></span>
    OPEN CAMPAIGN · 開発者・クリエイター向け
  </div>

  <div class="campaign__grid">
    <div class="campaign__lede">
      <h2 id="campaign-title" class="campaign__title">
        <span class="campaign__title-pre">Hapbeat を</span>
        <span class="campaign__title-main">無償で<em>２週間</em>お試しいただけます</span>
      </h2>
      <p class="campaign__sub">
        ゲーム開発者・VR/XRクリエイター・メディアアーティスト・研究者の方を対象に、
        ワイヤレス触覚デバイス Hapbeat を実機で評価いただけます。
      </p>
      <div class="campaign__cta-row">
        <a class="btn btn--campaign" href={formUrl} target="_blank" rel="noopener">
          Google Form で応募する
          <!-- 矢印 svg は既存維持 -->
        </a>
        <span class="campaign__cta-note">所要 3 分 · 個人 / 法人どちらでも</span>
      </div>
    </div>

    <ol class="campaign__perks">
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
      <li class="campaign__perk">
        <span class="campaign__perk-num">02</span>
        <div>
          <h3>
            2週間後、<strong>メールでご相談</strong>
            <span class="campaign__perk-tag">アフター</span>
          </h3>
          <p>
            お試し後、Hapbeat 社からメールでご連絡します。
            返却・継続利用のご相談はそのタイミングで。
            デモ制作等で長期利用ご希望の場合、<strong>無償での延長</strong>もご相談いただけます。
          </p>
        </div>
      </li>
    </ol>
  </div>

  <div class="campaign__fine">
    <div class="campaign__fine-block">
      <span class="campaign__fine-label">返送について</span>
      <p>
        同梱された梱包物を用いて、<strong>クリックポスト（185円・税込）</strong>にてご返却ください。
        返送料はご負担となります。
      </p>
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
        体験者・イベント運営者等から金銭を得る形でのご利用は、
        事前にHapbeat社へご相談ください。
        自社PR・社内利用は対象外です。
      </p>
    </div>
  </div>
</section>
```

---

## CSS 側の調整（必要に応じて）

- `campaign__perk--gift` と `campaign__perk-tag--gift` のスタイル定義が `campaign.css` にあれば、未使用になるので削除してよい
- `campaign__fine` のグリッドカラム数を2→3対応にする（`auto-fit` か `repeat(3, 1fr)`、モバイルは1カラム）
- リボン文言 "LIMITED CAMPAIGN" → "OPEN CAMPAIGN" に変えるなら、リボンの色合いも軽い印象に微調整する余地あり（緊急感を出さない）

---

## やってはいけないこと

1. **「プレゼント」「進呈」「無償提供」などの単語を本文・CSS クラス・コメントに残さない**: grep で潰すこと
2. **「無料」表記を本文に追加しない**: "無償" で統一
3. **「Duo WL は潤沢」「在庫多数」など、在庫数を断言する表現を入れない**
4. **借用条件（分解禁止・転売禁止等）を LP 本文に書かない**: Google Form 側で同意取得するため
5. **新規ページを作らない**: スコープは Campaign.astro の改修のみ
6. **Astro の「ゼロJS デフォルト」を崩さない**: アニメーション等で重い JS を持ち込まない

---

## テスト・確認手順

1. `npm run dev` でローカル起動し、Campaign が表示されるページを確認
2. 各 breakpoint（mobile / tablet / desktop）でレイアウト崩れがないか目視
3. アクセシビリティ: heading 構造（h2 → h3）が崩れていないか、ARIA 属性が正しいか
4. `npm run build` が警告なく成功すること
5. Pagefind のインデックスに新文言が反映されているか（ビルド後）

---

## push 方針

- **完成しても自動 push しないでください**
- commit までで止め、依頼者（ユーザー）にレビューを依頼すること
- このリポジトリは Xserver に FTPS デプロイされるため、master への push が公開反映になる点に注意
- コミットメッセージ例: `Campaign: rework to v4 (resource-request-tone, remove gift terms)`

---

## 完了後の処理

このファイル（`instructions-campaign-rework-v4-202605221700.md`）は、完了後に `instructions/applied/` に移動してください（このリポジトリの既存運用に従う）。

---

## 関連リソース

- 現状ファイル: `src/components/Campaign.astro`
- 関連CSS: `src/styles/campaign.css`
- リポジトリ規約: `CLAUDE.md`
- ops 側の方針記録: `C:\GitHub\Hapbeat\hapbeat-ops\context\decisions\`（rental-pricing-policy / symdirect-rental-case などの隣接案件）

---

## 完了の定義

- [ ] Campaign.astro から「プレゼント」「進呈」関連の文言・クラスが完全に削除されている
- [ ] 「無料」表記がなく、「無償」に統一されている
- [ ] 「Duo WL 潤沢」などの在庫断言表現が削除されている
- [ ] Perk 02 が「2週間後にメールでフォロー」型に書き換えられている
- [ ] 「商用利用について」ブロックが追加されている
- [ ] CSS の未使用クラス（`--gift` 系）が整理されている
- [ ] `npm run build` が成功する
- [ ] commit までで止め、依頼者の push 承認を待っている
- [ ] このinstructions ファイルが `instructions/applied/` に移動されている
