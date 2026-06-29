/**
 * SDK セクションごとの OGP 画像マッピング。
 *
 * `/docs/sdk-integration/<slug>/` 配下 (および `/en/docs/sdk-integration/<slug>/`)
 * の **全ページ** に、その SDK 専用の OGP 画像を割り当てる。
 * 適用は src/components/Head.astro が pathname を見て route head を上書きする形で行う
 * (frontmatter は使わない = 1 ページずつ書かなくてよい)。
 *
 * 画像本体は scripts/gen-og-images.mjs が生成し public/og/<slug>.png に置く。
 * 新しい SDK を足すときは:
 *   1. ここに 1 行追加
 *   2. scripts/gen-og-images.mjs の SDKS に 1 件追加して `npm run gen:og`
 *   3. src/components/SupportedSdks.astro にカードを 1 件追加
 * (詳細は add-sdk-platform skill を参照)
 *
 * 割り当ての無いページは astro.config.mjs の全体 OGP (og-image.png) を使う。
 */
export const OG_ORIGIN = 'https://devtools.hapbeat.com';

/** sdk-integration の slug → public 配下の OGP 画像パス */
export const SDK_OG_IMAGES: Record<string, string> = {
  'python-sdk': '/og/python-sdk.png',
  'js-sdk': '/og/js-sdk.png',
  'unity-sdk': '/og/unity-sdk.png',
  'arduino-sdk': '/og/arduino-sdk.png',
};

/**
 * pathname から該当 SDK の OGP 画像 (絶対 URL) を返す。
 * 該当しなければ null (= 全体 default を使う)。
 * ja (root) / en どちらのロケールにも、末尾スラッシュ有無どちらにも対応。
 */
export function ogImageForPath(pathname: string): string | null {
  const m = pathname.match(/\/docs\/sdk-integration\/([^/]+)(?:\/|$)/);
  if (!m) return null;
  const img = SDK_OG_IMAGES[m[1]];
  return img ? OG_ORIGIN + img : null;
}
