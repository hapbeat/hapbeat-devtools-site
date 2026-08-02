#!/usr/bin/env node
// gen-release-feed.mjs
//
// 全ツール・SDK の「いま取得できる最新版」を 1 本の静的 JSON に集約する。
// 出力: public/releases.json → 配信 https://devtools.hapbeat.com/releases.json
//
// 消費者: Studio (ブラウザ) / hapbeat-helper (CLI) / Unity SDK (Editor) /
//         python-sdk・js-sdk (CLI)。仕様は hapbeat-contracts
//         specs/release-feed.md + schemas/release-feed.schema.json (DEC-053)。
//
// 情報源は GitHub のタグではなく **実際の配布チャネル** (PyPI / npm /
// PlatformIO registry)。タグは打ったが publish していない版を「最新」として
// 通知すると、ユーザーが upgrade コマンドを打っても上がらないため。
// 配布チャネルが git そのものである UPM (Unity) だけ GitHub Releases を見る。
//
// 取得に失敗した product は **エントリごと省略** する (古い値やプレースホルダを
// 載せない)。クライアントは欠落を「不明」として扱い何も表示しない — 「最新版を
// 取得できませんでした」という通知自体がノイズになるため。ビルドは止めない。

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'releases.json');

const SITE = 'https://devtools.hapbeat.com';
const TIMEOUT_MS = 8000;

/**
 * 重要な修正を含む版だけ severity を上げる手動オーバーライド。
 *   '<product-id>': { '<version>': 'recommended' }
 * 既定は 'info' (バッジ / 1 行ログ止まり)。'recommended' にすると
 * クライアントは dismissible バナーを出してよい (それでも 1 版 1 回)。
 */
const SEVERITY_OVERRIDES = {
  // 例: helper: { '0.4.0': 'recommended' },
};

const PRODUCTS = [
  {
    id: 'studio',
    name: 'Hapbeat Studio',
    channel: 'web',
    // Studio は Web 配信なので「デプロイされている版」が最新。CI が吐く
    // versions.json (凍結版一覧) の latest がそれ。
    source: { kind: 'studio-versions', url: 'https://studio.hapbeat.com/versions.json' },
    upgrade: 'https://studio.hapbeat.com/',
    notes: `${SITE}/docs/tools/studio/changelog/`,
  },
  {
    id: 'helper',
    name: 'hapbeat-helper',
    channel: 'pypi',
    source: { kind: 'pypi', pkg: 'hapbeat-helper' },
    upgrade: 'pipx upgrade hapbeat-helper',
    notes: `${SITE}/docs/tools/helper/changelog/`,
  },
  {
    id: 'unity-sdk',
    name: 'Hapbeat Unity SDK',
    channel: 'upm-git',
    source: { kind: 'github-release', repo: 'Hapbeat/hapbeat-unity-sdk' },
    upgradeTemplate: 'https://github.com/Hapbeat/hapbeat-unity-sdk.git#v{version}',
    notes: `${SITE}/docs/sdk-integration/unity-sdk/changelog/`,
  },
  {
    id: 'python-sdk',
    name: 'hapbeat-python-sdk',
    channel: 'pypi',
    source: { kind: 'pypi', pkg: 'hapbeat-python-sdk' },
    upgrade: 'pip install -U hapbeat-python-sdk',
    notes: `${SITE}/docs/sdk-integration/python-sdk/changelog/`,
  },
  {
    id: 'js-sdk',
    name: '@hapbeat/sdk',
    channel: 'npm',
    source: { kind: 'npm', pkg: '@hapbeat/sdk' },
    upgrade: 'npm install @hapbeat/sdk@latest',
    notes: `${SITE}/docs/sdk-integration/js-sdk/changelog/`,
  },
  {
    id: 'arduino',
    name: 'hapbeat/arduino',
    channel: 'platformio',
    source: { kind: 'platformio', owner: 'hapbeat', pkg: 'arduino' },
    upgrade: 'pio pkg update',
    notes: `${SITE}/docs/sdk-integration/arduino-sdk/changelog/`,
  },
];

/** 先頭の `v` を落として正準 semver にする (feed は常に v なしで持つ)。 */
function normalizeVersion(v) {
  return String(v ?? '').trim().replace(/^v/i, '');
}

async function getJson(url, headers = {}) {
  const res = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'hapbeat-devtools-site', ...headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** チャネルごとの取得。戻り値 { latest, published_at? }。失敗は throw。 */
const FETCHERS = {
  async pypi({ pkg }) {
    const d = await getJson(`https://pypi.org/pypi/${encodeURIComponent(pkg)}/json`);
    const latest = d?.info?.version;
    if (!latest) throw new Error('no info.version');
    // releases[<version>] は sdist/wheel の配列。最初のファイルの upload 時刻を
    // リリース日時とみなす (同一版のファイルは同時 upload されるため差は無視できる)。
    const files = d?.releases?.[latest];
    const published_at = Array.isArray(files) && files.length ? files[0].upload_time_iso_8601 : undefined;
    return { latest, published_at };
  },

  async npm({ pkg }) {
    const d = await getJson(`https://registry.npmjs.org/${pkg}`);
    const latest = d?.['dist-tags']?.latest;
    if (!latest) throw new Error('no dist-tags.latest');
    return { latest, published_at: d?.time?.[latest] };
  },

  async platformio({ owner, pkg }) {
    const d = await getJson(`https://api.registry.platformio.org/v3/packages/${owner}/library/${pkg}`);
    const latest = d?.version?.name;
    if (!latest) throw new Error('no version.name');
    return { latest, published_at: d?.version?.released_at };
  },

  async 'github-release'({ repo }) {
    // 未認証で叩く (public repo・1 build あたり数リクエストなので rate limit に
    // 収まる)。GITHUB_TOKEN があれば付けて上限を緩める。
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    const d = await getJson(
      `https://api.github.com/repos/${repo}/releases/latest`,
      token ? { authorization: `Bearer ${token}` } : {},
    );
    const latest = d?.tag_name;
    if (!latest) throw new Error('no tag_name');
    return { latest, published_at: d?.published_at };
  },

  async 'studio-versions'({ url }) {
    const d = await getJson(url);
    const latest = d?.latest;
    if (!latest) throw new Error('no latest');
    return { latest };
  },
};

async function resolveProduct(p) {
  const fetcher = FETCHERS[p.source.kind];
  if (!fetcher) throw new Error(`unknown source kind: ${p.source.kind}`);
  const { latest: raw, published_at } = await fetcher(p.source);
  const latest = normalizeVersion(raw);
  if (!/^\d+\.\d+\.\d+/.test(latest)) throw new Error(`unparseable version: ${raw}`);

  const upgrade = p.upgradeTemplate ? p.upgradeTemplate.replace('{version}', latest) : p.upgrade;
  const entry = {
    name: p.name,
    channel: p.channel,
    latest,
    severity: SEVERITY_OVERRIDES[p.id]?.[latest] ?? 'info',
  };
  if (published_at) entry.published_at = published_at;
  if (upgrade) entry.upgrade = upgrade;
  if (p.notes) entry.notes = p.notes;
  return entry;
}

async function main() {
  const products = {};
  const results = await Promise.all(
    PRODUCTS.map(async (p) => {
      try {
        return { id: p.id, entry: await resolveProduct(p) };
      } catch (e) {
        console.warn(`  skip: ${p.id} (${e.message})`);
        return null;
      }
    }),
  );
  // PRODUCTS の宣言順を保って出力する (JSON を目視 diff する時に安定させる)。
  for (const r of results) if (r) products[r.id] = r.entry;

  const feed = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    products,
  };

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(feed, null, 2)}\n`, 'utf8');

  const summary = Object.entries(products).map(([id, e]) => `${id}@${e.latest}`).join(' ');
  console.log(`release-feed: ${Object.keys(products).length}/${PRODUCTS.length} products → public/releases.json`);
  console.log(`  ${summary}`);
}

main().catch((e) => {
  // ここに来るのは書き込み失敗など致命的なケースのみ (取得失敗は product 単位で
  // skip 済み)。feed が無くてもサイト自体は成立するのでビルドは止めない。
  console.warn(`::warning::release feed generation failed: ${e.message}`);
});
