// Studio の各タブを Playwright で開き、要素の実座標に番号マーカーを合成して
// docs/assets/studio/ に注釈付き PNG を書き出す。
//
// 方針:
// - マーカーは言語中立の ①②③ だけを焼き込み、説明は各 md の番号付き凡例で書く。
// - 注釈は原則「ユーザーが操作する部分」だけに付ける（表示専用の見出し/情報には付けない）。
//   例外的に必ず説明したい重要な表示情報は青マーカー(BLUE)にする。
// - マーカーは対象要素の **左横（縦中央）** に置き、文字に被せない。左に余地が無ければ上へ。
//   数字は円の中心に置く。
// - Kit / Manage は `?demo=1`（demo モード）で匿名モックを seed して populated 表示にする。
//
// 使い方: STUDIO_URL=http://localhost:5174 node scripts/gen-studio-screenshots.mjs [tabFilter]
import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.resolve(__dirname, '..', 'docs', 'assets', 'studio')
const BASE = process.env.STUDIO_URL || 'http://localhost:5174'
const DSF = 2
const VW = 1440, VH = 900
const FILTER = process.argv[2] || ''
const RED = '#e8491d', BLUE = '#2f6fed'

// placed: [{n, cx, cy, color}] （cx/cy は CSS px の円中心）
function drawMarkers(width, height, placed, R) {
  const r = R * DSF, margin = r + 6 * DSF, fs = Math.round(R * 1.3 * DSF)
  const body = placed.map((m) => {
    const cx = Math.min(Math.max(m.cx * DSF, margin), width - margin)
    const cy = Math.min(Math.max(m.cy * DSF, margin), height - margin)
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${m.color}" stroke="#fff" stroke-width="${3 * DSF}"/>` +
      `<text x="${cx}" y="${cy}" dy="0.34em" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="${fs}" font-weight="700" text-anchor="middle">${m.n}</text>`
  }).join('')
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`)
}

// 対象要素 b の左横（縦中央）に。余地が無ければ左上の上側へ。
function place(b, clipX, clipY, R, n, color) {
  const GAP = 7
  const relx = b.x - clipX, rely = b.y - clipY
  const cy = rely + b.height / 2
  if (relx - GAP - 2 * R >= 2) return { n, color, cx: relx - GAP - R, cy } // 左横
  return { n, color, cx: relx + R, cy: rely - GAP - R }                     // 上
}

function locate(page, a) {
  let scope = a.within ? page.locator(a.within) : page
  let loc = a.text ? scope.getByText(a.text, { exact: !!a.exact }) : scope.locator(a.selector)
  if (a.hasText) loc = loc.filter({ hasText: a.hasText })
  return a.nth != null ? loc.nth(a.nth) : loc.first()
}
async function boxOf(page, a) {
  if (a.box) return a.box
  return await locate(page, a).boundingBox().catch(() => null)
}
async function gotoTab(page, tab) {
  await page.goto(BASE + '/?demo=1', { waitUntil: 'networkidle' }).catch(() => {})
  await page.waitForTimeout(600)
  await page.locator('button.tab-btn-stacked', { hasText: tab }).first().click()
  await page.waitForTimeout(900)
}
async function runPrepare(page, prepare) {
  for (const step of prepare || []) {
    await locate(page, step).click().catch((e) => console.warn('  ! prepare click 失敗:', e.message))
    await page.waitForTimeout(step.wait || 600)
  }
}

async function shootOverview(page, { file, anchors }) {
  const placed = []
  for (const a of anchors) {
    const b = await boxOf(page, a)
    if (!b) { console.warn(`  ! [${file}] ${a.n} (${a.label}) skip`); continue }
    placed.push(place(b, 0, 0, 17, a.n, a.color || RED))
  }
  const png = await page.screenshot({ type: 'png' })
  await sharp(png).composite([{ input: drawMarkers(VW * DSF, VH * DSF, placed, 17), top: 0, left: 0 }]).png().toFile(path.join(OUT_DIR, file))
  console.log(`  ✓ ${file}  (${placed.length}/${anchors.length})`)
}

async function shootDetail(page, { file, clip, anchors, vh = VH }) {
  let c
  if (clip.box) c = { ...clip.box }
  else {
    const b = await boxOf(page, clip)
    if (!b) { console.warn(`  ! [${file}] clip skip`); return }
    const pad = clip.pad ?? 12
    c = { x: b.x - pad, y: b.y - pad, width: b.width + pad * 2, height: b.height + pad * 2 }
  }
  const GUTTER = 26 // 上に余白（上フォールバック配置用）
  c.y -= GUTTER; c.height += GUTTER
  c.x = Math.max(0, Math.round(c.x)); c.y = Math.max(0, Math.round(c.y))
  c.width = Math.round(Math.min(c.width, VW - c.x)); c.height = Math.round(Math.min(c.height, vh - c.y))
  const placed = []
  for (const a of anchors) {
    const b = await boxOf(page, a)
    if (!b) { console.warn(`  ! [${file}] ${a.n} (${a.label}) skip`); continue }
    placed.push(place(b, c.x, c.y, 15, a.n, a.color || RED))
  }
  const png = await page.screenshot({ type: 'png', clip: c })
  await sharp(png).composite([{ input: drawMarkers(c.width * DSF, c.height * DSF, placed, 15), top: 0, left: 0 }]).png().toFile(path.join(OUT_DIR, file))
  console.log(`  ✓ ${file}  (${placed.length}/${anchors.length}, ${c.width}x${c.height})`)
}

// ================= shots（操作部のみ注釈） =================
const OVERVIEW = [
  { tab: 'UI', file: 'ui-tab-overview.png', anchors: [
    { n: 1, label: 'タブ切替', selector: 'button.tab-btn-stacked.active' },
    { n: 2, label: 'OLED(クリックで配置)', selector: '.device-grid-container' },
    { n: 3, label: 'ページタブ', selector: '.page-tabs' },
    { n: 4, label: 'モデル切替', selector: '.device-toggle-btn-single' },
    { n: 5, label: '初期化/向き/保存/読込', selector: '.btn-reset' },
    { n: 6, label: 'デバイスに書込', selector: '.btn-deploy' },
    { n: 7, label: '要素パレット', selector: '.element-palette' },
  ] },
  { tab: 'Kit', file: 'kit-tab-overview.png', anchors: [
    { n: 1, label: 'タブ切替', selector: 'button.tab-btn-stacked.active' },
    { n: 2, label: 'ツールバー', selector: '.view-mode-btn' },
    { n: 3, label: 'Libraryパネル', selector: '.kit-manager-left' },
    { n: 4, label: 'KitEditor', selector: '.kit-manager-right' },
    { n: 5, label: 'モード説明', selector: '.kit-events-mode-help-btn' },
    { n: 6, label: 'モード選択', selector: '.kit-event-side-mode' },
    { n: 7, label: 'Deploy', selector: 'button.library-btn.primary', hasText: 'Deploy' },
  ] },
  { tab: 'Manage', file: 'manage-tab-overview.png', anchors: [
    { n: 1, label: 'タブ切替', selector: 'button.tab-btn-stacked.active' },
    { n: 2, label: 'デバイス選択', selector: '[class*="device-row"]' },
    { n: 3, label: 'セクション切替', selector: '.device-subtab-btn.active' },
    { n: 4, label: '再スキャン', selector: '.devices-sidebar-refresh', nth: 0 },
    { n: 5, label: 'USB追加', selector: '.devices-sidebar-refresh', nth: 1 },
  ] },
]

const DETAIL = [
  // ---- UI ----
  { tab: 'UI', file: 'ui-detail-simulator.png', clip: { box: { x: 285, y: 96, width: 875, height: 300 } }, anchors: [
    { n: 1, label: 'OLED(配置)', selector: '.oled-screen' },
    { n: 2, label: '左ボタン', selector: '.inline-config-btn', hasText: 'Player +1' },
    { n: 3, label: '右ボタン', selector: '.inline-config-btn', hasText: 'Group +1' },
    { n: 4, label: '設定リンク', within: '.display-editor', text: 'Volume 設定' },
  ] },
  { tab: 'UI', file: 'ui-detail-controlbar.png', clip: { box: { x: 18, y: 285, width: 1404, height: 52 } }, anchors: [
    { n: 1, label: 'ページタブ', selector: '.page-tabs' },
    { n: 2, label: 'プリセット', selector: 'select', hasText: 'プリセット' },
    { n: 3, label: 'モデル切替', selector: '.device-toggle-btn-single' },
    { n: 4, label: '初期化', selector: '.btn-reset' },
    { n: 5, label: '向き', selector: 'button', hasText: '通常' },
    { n: 6, label: '保存/読込', selector: 'button', hasText: '保存' },
    { n: 7, label: '書込', selector: '.btn-deploy' },
  ] },
  { tab: 'UI', file: 'ui-detail-palette.png', vh: 1300, clip: { box: { x: 18, y: 340, width: 1404, height: 620 } }, anchors: [
    { n: 1, label: 'ステータス', text: 'ステータス' },
    { n: 2, label: '操作可能', text: '操作可能' },
    { n: 3, label: '識別', text: '識別' },
    { n: 4, label: 'ネットワーク', text: 'ネットワーク' },
    { n: 5, label: 'メタ', text: 'メタ' },
  ] },
  { tab: 'UI', file: 'ui-detail-modal-ui.png', prepare: [{ within: '.display-editor', text: 'UI 設定', exact: true }], clip: { selector: '.led-config-modal', pad: 8 }, anchors: [
    { n: 1, label: 'OLED輝度', selector: '.device-toggle', hasText: 'Low' },
    { n: 2, label: '発火時間', selector: '.ui-settings-slider', nth: 0 },
    { n: 3, label: '変化色', selector: '.ui-settings-color' },
    { n: 4, label: '明るさ', selector: '.ui-settings-slider', nth: 2 },
    { n: 5, label: 'OLED表示', selector: '.ui-settings-checkbox' },
  ] },
  { tab: 'UI', file: 'ui-detail-modal-led.png', prepare: [{ within: '.display-editor', text: 'LED 設定', exact: true }], clip: { selector: '.led-config-modal', pad: 8 }, anchors: [
    { n: 1, label: '全体の明るさ', selector: '.led-global-brightness input' },
    { n: 2, label: '各条件の設定', selector: '.led-rule', nth: 0 },
  ] },
  { tab: 'UI', file: 'ui-detail-modal-volume.png', prepare: [{ within: '.display-editor', text: 'Volume 設定', exact: true }], clip: { selector: '.led-config-modal', pad: 8 }, anchors: [
    { n: 1, label: '分割数', selector: '.volume-modal-row input[type="number"]' },
    { n: 2, label: '方向', selector: '.volume-modal-row select' },
    { n: 3, label: '固定値', selector: '.volume-modal-row input[type="range"]' },
  ] },

  // ---- Kit ----
  { tab: 'Kit', file: 'kit-detail-toolbar.png', clip: { box: { x: 24, y: 86, width: 1240, height: 42 } }, anchors: [
    { n: 1, label: '表示切替', selector: '.view-mode-btn' },
    { n: 2, label: '詳細', selector: '.info-toggle' },
    { n: 3, label: '操作説明', selector: '.shortcut-help-btn' },
  ] },
  { tab: 'Kit', file: 'kit-detail-library.png', clip: { box: { x: 22, y: 128, width: 672, height: 360 } }, anchors: [
    { n: 1, label: 'Libraryフォルダ', within: '.kit-manager-left', selector: '.workdir-icon-btn' },
    { n: 2, label: '検索', selector: 'input[placeholder="Search..."]' },
    { n: 3, label: '表示(flat/tree)', selector: '.panel-mode-btn' },
    { n: 4, label: 'Import', selector: '.library-btn', hasText: 'Import' },
    { n: 5, label: 'Ampプリセット', selector: '.library-btn', hasText: 'Save as' },
  ] },
  { tab: 'Kit', file: 'kit-detail-kitmeta.png', clip: { box: { x: 694, y: 129, width: 722, height: 340 } }, anchors: [
    { n: 1, label: 'Kit作成', within: '.kit-manager-right', selector: '.library-btn.primary', hasText: 'Create' },
    { n: 2, label: '容量ゲージ', text: 'Free', color: BLUE },
  ] },
  { tab: 'Kit', file: 'kit-detail-events.png', clip: { box: { x: 694, y: 355, width: 722, height: 285 } }, anchors: [
    { n: 1, label: 'モード説明', selector: '.kit-events-mode-help-btn' },
    { n: 2, label: '一括変更', selector: 'select', hasText: '一括変更' },
    { n: 3, label: 'イベント操作(Amp/Edit)', selector: '.clip-card-action-btn', hasText: 'Edit' },
    { n: 4, label: 'モード選択レール', selector: '.kit-event-side-mode' },
  ] },
  { tab: 'Kit', file: 'kit-detail-deploy.png', clip: { box: { x: 694, y: 796, width: 722, height: 48 } }, anchors: [
    { n: 1, label: 'Deploy', selector: 'button.library-btn.primary', hasText: 'Deploy' },
    { n: 2, label: 'SaveFolder', selector: 'button.library-btn', hasText: 'Save Folder' },
  ] },

  // ---- Manage ----
  { tab: 'Manage', file: 'manage-detail-sidebar.png', clip: { box: { x: 20, y: 86, width: 290, height: 470 } }, anchors: [
    { n: 1, label: 'デバイス選択', selector: '[class*="device-row"]' },
    { n: 2, label: '再スキャン', selector: '.devices-sidebar-refresh', nth: 0 },
    { n: 3, label: 'USB追加', selector: '.devices-sidebar-refresh', nth: 1 },
  ] },
  { tab: 'Manage', file: 'manage-detail-header.png', clip: { box: { x: 326, y: 115, width: 1090, height: 165 } }, anchors: [
    { n: 1, label: '読み込み', selector: '.form-button-secondary', hasText: 'デバイスから読み込み' },
    { n: 2, label: '再起動', selector: '.form-button-secondary', hasText: '再起動' },
    { n: 3, label: 'セクション切替', selector: '.device-subtab-btn.active' },
  ] },
  { tab: 'Manage', file: 'manage-detail-wifi.png', prepare: [{ selector: '.device-subtab-btn', hasText: 'Wi-Fi' }], clip: { box: { x: 326, y: 282, width: 1090, height: 470 } }, anchors: [
    { n: 1, label: 'プロファイル接続', selector: '.wifi-profile-btn', hasText: '接続', nth: 0 },
    { n: 2, label: '追加', selector: '.form-button', hasText: '新規追加' },
    { n: 3, label: 'Wi-Fiモード切替', selector: '.form-button-secondary', hasText: 'AP モードに切り替え' },
    { n: 4, label: 'APパスワード', selector: '.form-button', hasText: 'Set' },
  ] },
  { tab: 'Manage', file: 'manage-detail-settings.png', prepare: [{ selector: '.device-subtab-btn', hasText: '設定' }], clip: { box: { x: 326, y: 282, width: 1090, height: 470 } }, anchors: [
    { n: 1, label: '名前変更', selector: '.form-button', hasText: '変更' },
    { n: 2, label: 'アドレス設定', selector: '.form-button', hasText: '設定' },
    { n: 3, label: 'UI Config書込', selector: '.form-button', hasText: '書込' },
    { n: 4, label: 'デバッグ取得', selector: '.form-button-secondary', hasText: '取得' },
  ] },
  { tab: 'Manage', file: 'manage-detail-kit.png', prepare: [{ selector: '.device-subtab-btn', hasText: 'Kit' }], clip: { box: { x: 326, y: 282, width: 1090, height: 270 } }, anchors: [
    { n: 1, label: '一覧取得', selector: '.form-button-secondary', hasText: '一覧取得' },
    { n: 2, label: 'FIRE発火テスト', selector: '.installed-kit-event-btn', nth: 0 },
    { n: 3, label: 'EventIDコピー', selector: '.installed-kit-event-copy', nth: 0 },
  ] },
  { tab: 'Manage', file: 'manage-detail-test.png', prepare: [{ selector: '.device-subtab-btn', hasText: '再生テスト' }], vh: 1050, clip: { box: { x: 326, y: 282, width: 1090, height: 720 } }, anchors: [
    { n: 1, label: 'フォルダ選択', selector: '.form-button-secondary', hasText: '参照' },
    { n: 2, label: 'ストリーム再生', selector: '.form-button', hasText: '再生 (stream)' },
    { n: 3, label: '送信テスト', selector: '.form-button', hasText: 'PLAY' },
  ] },
  { tab: 'Manage', file: 'manage-detail-firmware.png', prepare: [{ selector: '.device-subtab-btn', hasText: 'ファームウェア' }], vh: 1100, clip: { box: { x: 326, y: 282, width: 1090, height: 760 } }, anchors: [
    { n: 1, label: '更新', selector: '.form-button-secondary', hasText: '更新' },
    { n: 2, label: '種別', selector: '.firmware-lib-toggle-btn', nth: 1 },
    { n: 3, label: 'バリアント', selector: '.firmware-variant-cell', nth: 1 },
    { n: 4, label: 'ローカルbin参照', selector: '.form-button-secondary', hasText: '参照', nth: 0 },
    { n: 5, label: 'OTA書き込み', selector: '.form-button', hasText: 'OTA 書き込み' },
  ] },
]

await mkdir(OUT_DIR, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: DSF })
for (const s of OVERVIEW) {
  if (FILTER && s.tab.toLowerCase() !== FILTER) continue
  console.log(`${s.tab} overview:`)
  await gotoTab(page, s.tab)
  await shootOverview(page, s)
}
for (const s of DETAIL) {
  if (FILTER && s.tab.toLowerCase() !== FILTER) continue
  console.log(`${s.tab} detail ${s.file}:`)
  const vh = s.vh || VH
  if (vh !== VH) await page.setViewportSize({ width: VW, height: vh })
  await gotoTab(page, s.tab)
  await runPrepare(page, s.prepare)
  await shootDetail(page, s)
  if (vh !== VH) await page.setViewportSize({ width: VW, height: VH })
}
await browser.close()
console.log('done ->', OUT_DIR)
