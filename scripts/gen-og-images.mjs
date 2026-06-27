/**
 * gen-og-images.mjs
 *
 * 各 SDK の getting-started ページ用 OGP 画像 (1200×630 PNG) を生成する。
 *
 * 方針:
 *   - OGP は社会的クローラ (X / Slack / Facebook 等) が SVG を描画しないため
 *     必ず PNG にラスタライズする。
 *   - 各カードは「左: ツール名 + 説明 + 配布形態チップ」「右: ツールロゴ」の
 *     スプリットレイアウト。トップページ「対応 SDK」(SupportedSdks.astro) と
 *     同じブランド表現・同じロゴ利用許諾判断を踏襲する。
 *
 * ロゴ利用許諾 (詳細は public/sdk-logos/SOURCES.md):
 *   - Python     : PSF 商標ポリシーで未改変ロゴの互換性表示が可 (™ + 帰属)。公式ロゴを使用。
 *   - JavaScript : "JS" バッジは MIT (Chris Williams)。公式ロゴを使用。
 *   - Unity      : ブランドガイドラインが第三者の自社製品宣伝でのロゴ使用を認めないため、
 *                  ロゴではなく「正方形 + 文字」のワードマークタイルで表示する。
 *
 * 出力: public/og/<slug>.png  (slug = unity-sdk / python-sdk / js-sdk)
 * 参照: 各 getting-started.md の frontmatter head で og:image を上書き。
 *
 * 実行: npm run gen:og   (sharp で SVG→PNG。フォントは OS のサンセリフにフォールバック)
 */
import sharp from 'sharp';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LOGO_DIR = path.join(ROOT, 'public', 'sdk-logos');
const OUT_DIR = path.join(ROOT, 'public', 'og');

// ---- デザイントークン (custom.css の oklch を hex 近似したもの) -------------
const C = {
  bg: '#f5f3f0',
  plate: '#ffffff',
  line: '#e5e0d9',
  ink: '#1f2630',
  inkSoft: '#3b444f',
  inkMute: '#5d6670',
  inkFaint: '#8a909a',
  purple: '#9542a0',
};
const GRAD = ['#e22d3f', '#9542a0', '#00516d']; // brand gradient (red→purple→teal)

const W = 1200;
const H = 630;

// 右側ロゴプレート
const PLATE = { x: 720, y: 135, w: 360, h: 360, rx: 28 };
const LOGO = { size: 200 };
const LOGO_X = PLATE.x + (PLATE.w - LOGO.size) / 2; // 800
const LOGO_Y = PLATE.y + (PLATE.h - LOGO.size) / 2; // 215

const SDKS = [
  {
    slug: 'python-sdk',
    name: 'Python SDK',
    brand: 'Python',
    tm: true,
    logo: 'python.svg',
    logoRound: false,
    tagline: 'Haptics for research, prototyping & media art',
    chip: 'PyPI',
    credit: 'Python and the Python logo are trademarks of the Python Software Foundation.',
  },
  {
    slug: 'js-sdk',
    name: 'JavaScript SDK',
    brand: 'JavaScript',
    tm: false,
    logo: 'javascript.svg',
    logoRound: true,
    tagline: 'Haptics for Web, Node & Electron',
    chip: 'npm',
    credit: 'JavaScript logo by Chris Williams (MIT).',
  },
  {
    slug: 'unity-sdk',
    name: 'Unity SDK',
    brand: 'Unity',
    tm: true,
    logo: null, // ロゴ利用不可 → 正方形 + 文字タイル
    wordmark: 'Unity',
    tagline: 'Add haptics to Unity games & VR/MR apps',
    chip: 'UPM',
    credit: 'Unity is a trademark of Unity Technologies.',
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

/** タイトル (ブランド名 + 任意 ™ + "SDK") を tspan で描く。
 *  SVG は tspan 先頭の空白を畳むため、語間は dx で明示的に空ける。 */
function titleTspans(brand, tm, suffix) {
  if (tm) {
    // ™ を上付き (dy -26) にし、続く SDK で dy+26 で baseline を戻し dx で語間を確保
    return `${esc(brand)}<tspan font-size="32" dy="-26">™</tspan>` +
      `<tspan font-size="76" dy="26" dx="18">${esc(suffix)}</tspan>`;
  }
  return `${esc(brand)}<tspan dx="22">${esc(suffix)}</tspan>`;
}

/** Unity 用「正方形 + 文字」タイル (ロゴ代替) をプレート中央に描く */
function wordmarkTile(word) {
  const s = LOGO.size; // 200
  const x = LOGO_X;
  const y = LOGO_Y;
  return `
  <g>
    <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="22"
          fill="${C.bg}" stroke="url(#brand)" stroke-width="3"/>
    <text x="${x + s / 2}" y="${y + s / 2}" font-family="${FONT}" font-size="40"
          font-weight="800" fill="${C.ink}" text-anchor="middle"
          dominant-baseline="central" letter-spacing="-0.5">${esc(word)}</text>
  </g>`;
}

/** カード背景 SVG (ロゴ画像以外すべて) を組み立てる */
function buildCardSvg(sdk) {
  const chipW = sdk.chip.length * 13.5 + 44;
  const chipX = 84;
  const chipY = 372;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="brand" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${GRAD[0]}"/>
      <stop offset="50%" stop-color="${GRAD[1]}"/>
      <stop offset="100%" stop-color="${GRAD[2]}"/>
    </linearGradient>
  </defs>

  <!-- 背景 -->
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <!-- 上端ブランドバー -->
  <rect x="0" y="0" width="${W}" height="12" fill="url(#brand)"/>

  <!-- eyebrow -->
  ${brandMark(84, 92, 44)}
  <text x="148" y="126" font-family="${FONT}" font-size="21" font-weight="700"
        fill="${C.purple}" letter-spacing="3">HAPBEAT DEVTOOLS</text>

  <!-- タイトル -->
  <text x="84" y="252" font-family="${FONT}" font-size="76" font-weight="800"
        fill="${C.ink}" letter-spacing="-1.5">${titleTspans(sdk.brand, sdk.tm, 'SDK')}</text>

  <!-- 説明 -->
  <text x="86" y="322" font-family="${FONT}" font-size="28" font-weight="500"
        fill="${C.inkSoft}">${esc(sdk.tagline)}</text>

  <!-- 配布形態チップ -->
  <rect x="${chipX}" y="${chipY}" width="${chipW}" height="46" rx="23"
        fill="${C.plate}" stroke="${C.line}" stroke-width="1.5"/>
  <text x="${chipX + chipW / 2}" y="${chipY + 30}" font-family="ui-monospace, 'JetBrains Mono', monospace"
        font-size="22" font-weight="600" fill="${C.ink}" text-anchor="middle">${esc(sdk.chip)}</text>

  <!-- 帰属注記 -->
  <text x="84" y="586" font-family="${FONT}" font-size="17" font-weight="400"
        fill="${C.inkFaint}">${esc(sdk.credit)}</text>

  <!-- 右プレート (faux shadow + 本体) -->
  <rect x="${PLATE.x}" y="${PLATE.y + 8}" width="${PLATE.w}" height="${PLATE.h}" rx="${PLATE.rx}"
        fill="rgba(0,0,0,0.06)"/>
  <rect x="${PLATE.x}" y="${PLATE.y}" width="${PLATE.w}" height="${PLATE.h}" rx="${PLATE.rx}"
        fill="${C.plate}" stroke="${C.line}" stroke-width="1.5"/>
  ${sdk.logo ? '' : wordmarkTile(sdk.wordmark)}
</svg>`;
}

/** ロゴ SVG を size×size の透過 PNG に。logoRound のときは角丸マスクを適用 */
async function renderLogo(file, size, round) {
  const svg = await readFile(path.join(LOGO_DIR, file));
  let img = sharp(svg, { density: 384 }).resize(size, size, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
  let buf = await img.png().toBuffer();
  if (round) {
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
         <rect width="${size}" height="${size}" rx="22" fill="#fff"/>
       </svg>`
    );
    buf = await sharp(buf)
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer();
  }
  return buf;
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
