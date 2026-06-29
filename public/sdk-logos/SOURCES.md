# SDK ロゴの出所・ライセンス・商標表示

トップページ「対応 SDK」セクション（`src/components/SupportedSdks.astro`）と
各 SDK セクションの OGP 画像（`scripts/gen-og-images.mjs` → `public/og/<slug>.png`）で
使用する各 SDK のブランド表示。Hapbeat が対応する環境を示す目的（指名的表示）で、
利用が許諾されている公式/標準ロゴのみを画像として配置する。

| ファイル | 対象 | 出所 | 利用条件 / ライセンス |
|---|---|---|---|
| `python.svg` | Python | Wikimedia Commons `Python-logo-notext.svg`（公式カラー） | PSF 商標ポリシー「Uses that Never Require Approval」により、**未改変**のロゴで互換性表示に利用可（商用含む。override 条項）。**® 併記 + 帰属注記**が条件。https://www.python.org/psf/trademarks/ |
| `javascript.svg` | JavaScript | 標準の "JS" バッジ（Chris Williams / JSConf, 2011） | **MIT ライセンス**で自由利用可（著作権表示の保持が条件）。https://github.com/voodootikigod/logo.js |

Unity・Arduino はロゴ画像を持たず、**文字ワードマーク**で表示する（下記）。

## Unity はロゴを使わない（規約上の判断・2026-06-22）

Unity Technologies のブランドガイドラインは、第三者が **Unity ロゴを自社製品の宣伝に
使うことを認めていない**（"allows the use of its logos only for the promotion of Unity
products… not for promoting your own… products" — https://unity.com/legal/branding-trademarks）。
名称 "Unity" を**文字で**互換性表記するのは指名的利用として許容されるため、Unity カードは
ロゴ画像ではなく**テキストのワードマーク**で表示している。Unity の書面許可を取得した場合は
公式ロゴへ差し替え可能。

## Arduino はロゴを使わない（規約上の判断・2026-06-29、敵対的検証済）

Arduino の商標ガイドラインは、第三者の**互換製品でのロゴ使用を明確に禁止**している:

- Compatible products guide: *"You are not allowed to use the Arduino logo in connection
  with the compatible product you have developed"*（製品・パッケージ・販促物・SNS いずれも不可）
- Logo guide: *"The Arduino Logo (with or without the word 'Arduino') cannot be used to
  identify or advertise third-party products and/or services; this includes compatible products."*

許可されるのは**名称 "Arduino" の語のみ**（"compatible with Arduino" のように後置）。
別途配布される *Arduino Community Logo* は CC BY-NC-SA 3.0 だが**商用/製品では使用不可**。
そのため Arduino カードはロゴではなく**テキストのワードマーク**で表示し、
アクセント色にのみ Arduino teal (`#00878F`) を用いる。

一次ソース:
- https://www.arduino.cc/en/trademark/
- https://www.arduino.cc/en/trademark/guides/trademark-guide-for-compatible-products/
- https://www.arduino.cc/en/trademark/guides/arduino-and-community-logos/

## 商標・帰属注記（セクション下部・OGP カード下部に表示済み）

- Python および Python ロゴは Python Software Foundation の商標（® 併記）。
- JavaScript ロゴは Chris Williams 作（MIT）。
- Unity は Unity Technologies の商標。
- Arduino は Arduino S.r.l. の商標。

差し替え・追加時は、必ず**利用許諾を確認**し、可能な限り公式/権威あるソースの実ファイルを
使うこと（手描き再現はしない）。

## OGP 画像（各 SDK セクション）

`scripts/gen-og-images.mjs` が各 SDK の OGP 画像（`public/og/<slug>.png`, 1200×630）を
生成する。デザインはトップの「対応 SDK」カードに合わせ、白いカード面 + **左端に
プラットフォーム色の縦アクセントバー**、右側のタイルにロゴ/ワードマーク、下部に帰属注記。
ロゴの利用許諾判断は上表と同一（未改変ロゴのみ / Unity・Arduino はワードマーク）。

適用は **frontmatter ではなく** `src/components/Head.astro` が pathname を見て
`/docs/sdk-integration/<slug>/` 配下（ja/en 両方）の**全ページ**の `og:image` /
`twitter:image` を差し替える方式（マップは `src/lib/sdk-og.ts`）。割り当ての無いページは
全体 OGP（`og-image.png`）。

更新時は `npm run gen:og` で再生成すること。新規 SDK 追加の一連手順は
`add-sdk-platform` skill を参照。
