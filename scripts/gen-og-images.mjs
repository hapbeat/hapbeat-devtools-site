/**
 * gen-og-images.mjs
 *
 * 各 SDK セクション用 OGP 画像 (1200×630 PNG) を生成する。
 *
 * 方針:
 *   - OGP は社会的クローラ (X / Slack / Facebook 等) が SVG を描画しないため
 *     必ず PNG にラスタライズする。
 *   - カードはトップページ「対応 SDK」(SupportedSdks.astro) と同じ表現:
 *     白いカード面 + 左端にプラットフォーム色の縦アクセントバー。
 *     ロゴ/ワードマークは右側のタイルに収める。
 *
 * ロゴ利用許諾 (一次ソースは public/sdk-logos/SOURCES.md。2026-06 に敵対的検証済):
 *   - Python     : PSF 商標ポリシー「Uses that Never Require Approval」で未改変ロゴの
 *                  互換性表示が商用含め可 (override 条項)。® + 帰属が条件。公式ロゴを使用。
 *   - JavaScript : "JS" バッジは MIT (Chris Williams 2011)。公式ロゴを使用。
 *   - Unity      : ブランドガイドが第三者製品宣伝でのロゴ使用を不許可 → ワードマーク。
 *   - Arduino    : 商標ガイドが互換製品でのロゴ使用を明確に禁止 → ワードマーク
 *                  ("Arduino" の語のみ可)。アクセント色のみ Arduino teal を使う。
 *
 * 出力: public/og/<slug>.png  (slug = python-sdk / js-sdk / unity-sdk / arduino-sdk)
 * 適用: src/components/Head.astro が pathname を見て og:image を差し替える
 *       (src/lib/sdk-og.ts のマップ。/docs/sdk-integration/<slug>/ 配下の全ページ)。
 *
 * 実行: npm run gen:og   (sharp で SVG→PNG。フォントは OS のサンセリフにフォールバック)
 */
import sharp from 'sharp';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LOGO_DIR = path.join(ROOT, 'public', 'sdk-logos');
const OUT_DIR = path.join(ROOT, 'public', 'og');

// ---- デザイントークン (custom.css の oklch を hex 近似したもの) -------------
const C = {
  card: '#ffffff', // カード面
  line: '#e5e0d9',
  ink: '#1f2630',
  inkSoft: '#3b444f',
  inkFaint: '#8a909a',
  purple: '#9542a0',
};
const BRAND_GRAD = ['#e22d3f', '#9542a0', '#00516d']; // Hapbeat ブランド (eyebrow マーク用)

const W = 1200;
const H = 630;
const BAR_W = 20; // 左端アクセント縦バーの幅

// 右側のロゴ/ワードマークタイル
const TILE = { x: 740, y: 145, w: 340, h: 340, rx: 28 };
const LOGO = { size: 200 };
const LOGO_X = TILE.x + (TILE.w - LOGO.size) / 2; // 810
const LOGO_Y = TILE.y + (TILE.h - LOGO.size) / 2; // 215

// mark: 商標表示 ('®' は登録商標。Python は PSF が ® を要求、Unity/Arduino も登録商標)
const SDKS = [
  {
    slug: 'python-sdk', name: 'Python SDK', brand: 'Python', mark: '®',
    logo: 'python.svg', logoRound: false, accent: '#3776ab',
    tagline: 'Haptics for research, prototyping & media art', chip: 'PyPI',
    credit: '"Python" and the Python logo are trademarks of the Python Software Foundation.',
  },
  {
    slug: 'js-sdk', name: 'JavaScript SDK', brand: 'JavaScript', mark: null,
    logo: 'javascript.svg', logoRound: true, accent: '#eab308',
    tagline: 'Haptics for Web, Node & Electron', chip: 'npm',
    credit: 'JavaScript logo © Chris Williams — MIT License.',
  },
  {
    slug: 'unity-sdk', name: 'Unity SDK', brand: 'Unity', mark: '®',
    logo: null, wordmark: 'Unity', accent: '#5D6670',
    tagline: 'Add haptics to Unity games & VR/MR apps', chip: 'UPM',
    credit: 'Unity is a trademark of Unity Technologies. Nominative use only.',
  },
  {
    slug: 'arduino-sdk', name: 'Arduino SDK', brand: 'Arduino', mark: '®',
    logo: null, wordmark: 'Arduino', accent: '#00878F',
    tagline: 'Haptics for Arduino, ESP32 & M5Stack', chip: ['Arduino IDE', 'PlatformIO'],
    credit: 'Arduino is a trademark of Arduino S.r.l. Nominative use only.',
  },
];

const FONT = "Inter, 'Segoe UI', 'Noto Sans JP', Arial, sans-serif";
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Hapbeat ブランドマーク (favicon の角丸グラデ + ">−" アロー) を任意座標・サイズで描く */
function brandMark(x, y, size) {
  const k = size / 32;
  return `
  <g transform="translate(${x},${y}) scale(${k})">
    <rect width="32" height="32" rx="7" fill="url(#brand)"/>
    <g fill="none" stroke="rgba(255,255,255,0.96)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 11 L15 16 L10 21"/>
      <path d="M17 21 L23 21"/>
    </g>
  </g>`;
}

/** タイトル (ブランド名 + 任意の登録/商標マーク + "SDK") を tspan で描く。
 *  SVG は tspan 先頭の空白を畳むため、語間は dx で明示的に空ける。 */
function titleTspans(brand, mark, suffix) {
  if (mark) {
    return `${esc(brand)}<tspan font-size="30" dy="-28">${mark}</tspan>` +
      `<tspan font-size="76" dy="28" dx="18">${esc(suffix)}</tspan>`;
  }
  return `${esc(brand)}<tspan dx="22">${esc(suffix)}</tspan>`;
}

/** ロゴ不可のプラットフォーム用「正方形 + 文字」: タイル中央にワードマークを描く */
function wordmarkText(word, accent) {
  const cx = TILE.x + TILE.w / 2;
  const cy = TILE.y + TILE.h / 2;
  return `
  <text x="${cx}" y="${cy}" font-family="${FONT}" font-size="50" font-weight="800"
        fill="${C.ink}" text-anchor="middle" dominant-baseline="central"
        letter-spacing="-0.5">${esc(word)}</text>`;
}

/** 配布形態チップ（1 つ以上）を左から並べて描く */
function chipsSvg(chip) {
  const chips = Array.isArray(chip) ? chip : [chip];
  const y = 372;
  let x = 96;
  let svg = '';
  for (const c of chips) {
    const w = c.length * 13.5 + 44;
    svg += `
  <rect x="${x}" y="${y}" width="${w}" height="46" rx="23"
        fill="${C.card}" stroke="${C.line}" stroke-width="1.5"/>
  <text x="${x + w / 2}" y="${y + 30}" font-family="ui-monospace, 'JetBrains Mono', monospace"
        font-size="22" font-weight="600" fill="${C.ink}" text-anchor="middle">${esc(c)}</text>`;
    x += w + 14;
  }
  return svg;
}

/** カード背景 SVG (ロゴ画像以外すべて) を組み立てる */
function buildCardSvg(sdk) {
  const isWordmark = !sdk.logo;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="brand" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${BRAND_GRAD[0]}"/>
      <stop offset="50%" stop-color="${BRAND_GRAD[1]}"/>
      <stop offset="100%" stop-color="${BRAND_GRAD[2]}"/>
    </linearGradient>
  </defs>

  <!-- カード面 -->
  <rect width="${W}" height="${H}" fill="${C.card}"/>
  <!-- 左端アクセント縦バー (プラットフォーム色) -->
  <rect x="0" y="0" width="${BAR_W}" height="${H}" fill="${sdk.accent}"/>

  <!-- eyebrow -->
  ${brandMark(96, 92, 44)}
  <text x="152" y="126" font-family="${FONT}" font-size="21" font-weight="700"
        fill="${C.purple}" letter-spacing="3">HAPBEAT DEVTOOLS</text>

  <!-- タイトル -->
  <text x="96" y="252" font-family="${FONT}" font-size="76" font-weight="800"
        fill="${C.ink}" letter-spacing="-1.5">${titleTspans(sdk.brand, sdk.mark, 'SDK')}</text>

  <!-- 説明 -->
  <text x="98" y="322" font-family="${FONT}" font-size="28" font-weight="500"
        fill="${C.inkSoft}">${esc(sdk.tagline)}</text>

  <!-- 配布形態チップ（1 つ以上） -->
  ${chipsSvg(sdk.chip)}

  <!-- 帰属注記 -->
  <text x="96" y="586" font-family="${FONT}" font-size="17" font-weight="400"
        fill="${C.inkFaint}">${esc(sdk.credit)}</text>

  <!-- 右タイル (faux shadow + アクセント淡塗り + アクセント枠) -->
  <rect x="${TILE.x}" y="${TILE.y + 8}" width="${TILE.w}" height="${TILE.h}" rx="${TILE.rx}"
        fill="rgba(0,0,0,0.05)"/>
  <rect x="${TILE.x}" y="${TILE.y}" width="${TILE.w}" height="${TILE.h}" rx="${TILE.rx}"
        fill="${sdk.accent}" fill-opacity="0.06" stroke="${sdk.accent}" stroke-opacity="0.30" stroke-width="2"/>
  ${isWordmark ? wordmarkText(sdk.wordmark, sdk.accent) : ''}
</svg>`;
}

/** ロゴ SVG を size×size の透過 PNG に。logoRound のときは角丸マスクを適用 */
async function renderLogo(file, size, round) {
  const svg = await readFile(path.join(LOGO_DIR, file));
  const buf0 = await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  if (!round) return buf0;
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
       <rect width="${size}" height="${size}" rx="22" fill="#fff"/>
     </svg>`
  );
  return sharp(buf0).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}

async function main() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

  for (const sdk of SDKS) {
    const base = sharp(Buffer.from(buildCardSvg(sdk)));
    const composites = [];
    if (sdk.logo) {
      const logoBuf = await renderLogo(sdk.logo, LOGO.size, sdk.logoRound);
      composites.push({ input: logoBuf, left: Math.round(LOGO_X), top: Math.round(LOGO_Y) });
    }
    const out = path.join(OUT_DIR, `${sdk.slug}.png`);
    await base.composite(composites).png().toFile(out);
    console.log(`  ok: public/og/${sdk.slug}.png`);
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
