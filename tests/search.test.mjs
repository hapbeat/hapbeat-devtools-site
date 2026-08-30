import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright';
import { normalizeSearchTerm } from '../src/lib/search-metadata.mjs';

const distDir = path.resolve('dist');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
};

let browser;
let server;
let baseUrl;

function within(promise, milliseconds, label) {
  let timeout;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timeout = setTimeout(() => reject(new Error(`${label} timed out after ${milliseconds}ms`)), milliseconds);
    }),
  ]).finally(() => clearTimeout(timeout));
}

before(async () => {
  server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relativePath = pathname.endsWith('/')
      ? path.join(pathname.slice(1), 'index.html')
      : pathname.slice(1) || 'index.html';
    const filePath = path.resolve(distDir, relativePath);

    if (filePath !== distDir && !filePath.startsWith(`${distDir}${path.sep}`)) {
      response.writeHead(403).end();
      return;
    }

    try {
      const contents = await readFile(filePath);
      response.writeHead(200, {
        'content-type': contentTypes[path.extname(filePath)] ?? 'application/octet-stream',
      }).end(contents);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  await browser?.close();
  await new Promise((resolve, reject) => server?.close((error) => error ? reject(error) : resolve()));
});

async function topThreeUiUrls(page, query, expectedUrl) {
  const input = page.locator('#starlight__search input');
  await input.fill('');
  await page.locator('.pagefind-ui__result-link').first().waitFor({ state: 'detached' });
  await input.fill(query);
  try {
    await within(page.waitForFunction((expectedPath) => (
      [...new Set([...document.querySelectorAll('.pagefind-ui__result-link')]
        .map((link) => new URL(link.href).pathname))]
        .slice(0, 3)
        .includes(expectedPath)
    ), expectedUrl), 8_000, `Pagefind UI search for ${query}`);
  } catch (error) {
    const currentUrls = await page.locator('.pagefind-ui__result-link').evaluateAll((links) => (
      [...new Set(links.map((link) => new URL(link.href).pathname))].slice(0, 3)
    ));
    throw new Error(`${error.message}; current top three: ${currentUrls.join(', ')}`);
  }
  assert.equal(await input.inputValue(), query, 'the search box should keep the user-entered wording');
  return page.locator('.pagefind-ui__result-link').evaluateAll((links) => (
    [...new Set(links.map((link) => new URL(link.href).pathname))].slice(0, 3)
  ));
}

async function metadataForUrl(page, query, url) {
  return within(page.evaluate(async ({ searchQuery, expectedUrl }) => {
    const pagefind = await import('/pagefind/pagefind.js');
    const result = await pagefind.search(searchQuery);
    const records = await Promise.all(result.results.map((entry) => entry.data()));
    return records.find((record) => record.url === expectedUrl)?.meta.search_terms;
  }, { searchQuery: query, expectedUrl: url }), 8_000, `Pagefind metadata search for ${query}`);
}

test('search input survives an SPA navigation', { timeout: 20_000 }, async () => {
  const page = await browser.newPage();
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

  const searchButton = page.locator('site-search button[data-open-modal]');
  await assert.doesNotReject(searchButton.waitFor({ state: 'visible' }));
  await searchButton.click();
  await page.locator('#starlight__search input').waitFor({ state: 'visible' });
  assert.ok((await topThreeUiUrls(page, 'Hapbeatを初めて使う', '/docs/start-here/getting-started/')).includes('/docs/start-here/getting-started/'));
  await page.keyboard.press('Escape');

  const searchSentinel = await page.evaluate(() => {
    const value = crypto.randomUUID();
    window.__hbSearchDocumentSentinel = value;
    document.querySelector('site-search').dataset.hbSearchSentinel = value;
    return value;
  });

  await page.locator('.hb-topbar__nav--lvl1').click();
  await page.waitForURL('**/docs/start-here/getting-started/');
  assert.equal(await page.evaluate(() => window.__hbSearchDocumentSentinel), searchSentinel);
  assert.equal(await page.locator('site-search').getAttribute('data-hb-search-sentinel'), searchSentinel);
  await searchButton.click();
  await page.locator('#starlight__search input').waitFor({ state: 'visible' });
  assert.ok((await topThreeUiUrls(page, 'Hapbeatが振動しない', '/docs/hardware/troubleshooting/')).includes('/docs/hardware/troubleshooting/'));
  await page.keyboard.press('Escape');

  await page.locator('.hb-topbar__nav--lvl3').click();
  await page.waitForURL('**/docs/support/contact/');
  assert.equal(await page.evaluate(() => window.__hbSearchDocumentSentinel), searchSentinel);
  assert.equal(await page.locator('site-search').getAttribute('data-hb-search-sentinel'), searchSentinel);
  await searchButton.click();
  await page.locator('#starlight__search input').waitFor({ state: 'visible' });
  assert.ok((await topThreeUiUrls(page, 'Unity', '/docs/sdk-integration/unity-sdk/getting-started/')).includes('/docs/sdk-integration/unity-sdk/getting-started/'));
  await page.close();
});

test('search-only terms are indexed without changing visible content', { timeout: 30_000 }, async () => {
  assert.equal(normalizeSearchTerm('Hapbeatが振動しません'), 'トラブルを解決する');
  assert.equal(normalizeSearchTerm('use Hapbeat from Rust'), 'use Hapbeat from Rust');
  assert.equal(normalizeSearchTerm('use Hapbeat from C++'), 'use Hapbeat from C++');
  const jaChecks = [
    ['docs/start-here/getting-started', 'Hapbeatを初めて使う', '/docs/start-here/getting-started/'],
    ['docs/tools/studio/initial-setup', 'HapbeatをWi-Fiに接続したい', '/docs/tools/studio/initial-setup/'],
    ['docs/hardware/troubleshooting', 'Hapbeatが振動しない', '/docs/hardware/troubleshooting/'],
    ['docs/hardware/troubleshooting', 'Hapbeatが振動しません', '/docs/hardware/troubleshooting/'],
  ];
  const enChecks = [
    ['en/docs/start-here/getting-started', 'how do I get started with Hapbeat', '/en/docs/start-here/getting-started/'],
    ['en/docs/sdk-integration/unity-sdk/getting-started', 'make Unity vibrate', '/en/docs/sdk-integration/unity-sdk/getting-started/'],
    ['en/docs/hardware/troubleshooting', 'Hapbeat is not vibrating', '/en/docs/hardware/troubleshooting/'],
  ];

  const indexedOutputPaths = [
    'docs/start-here/getting-started',
    'docs/concepts/architecture',
    'docs/concepts/event-id-and-kit',
    'docs/tools/studio/initial-setup',
    'docs/tools/helper/getting-started',
    'docs/hardware/troubleshooting',
    'docs/sdk-integration/unity-sdk/getting-started',
    'docs/sdk-integration/unity-sdk/targeting',
    'docs/sdk-integration/python-sdk/getting-started',
    'docs/sdk-integration/js-sdk/getting-started',
    'docs/sdk-integration/arduino-sdk/getting-started',
    'en/docs/start-here/getting-started',
    'en/docs/concepts/architecture',
    'en/docs/concepts/event-id-and-kit',
    'en/docs/tools/studio/initial-setup',
    'en/docs/tools/helper/getting-started',
    'en/docs/hardware/troubleshooting',
    'en/docs/sdk-integration/unity-sdk/getting-started',
    'en/docs/sdk-integration/unity-sdk/targeting',
    'en/docs/sdk-integration/python-sdk/getting-started',
    'en/docs/sdk-integration/js-sdk/getting-started',
    'en/docs/sdk-integration/arduino-sdk/getting-started',
  ];

  for (const outputPath of indexedOutputPaths) {
    const output = await readFile(path.join(distDir, outputPath, 'index.html'), 'utf8');
    const searchTermsIndex = output.indexOf('data-pagefind-meta="search_terms"');
    assert.notEqual(searchTermsIndex, -1, `${outputPath} should contain weighted search terms`);
    const pagefindBodyIndex = output.indexOf('data-pagefind-body');
    assert.ok(pagefindBodyIndex >= 0 && pagefindBodyIndex < searchTermsIndex, `${outputPath} should place search terms in the Pagefind body`);
  }
  const jaPage = await browser.newPage();
  await jaPage.goto(`${baseUrl}/docs/start-here/getting-started/`, { waitUntil: 'domcontentloaded' });
  const searchTermsMetadata = jaPage.locator('[data-pagefind-meta="search_terms"]');
  assert.equal(await searchTermsMetadata.isVisible(), false);
  assert.equal(await searchTermsMetadata.getAttribute('aria-hidden'), 'true');
  assert.match(await metadataForUrl(jaPage, 'Getting Started', '/docs/start-here/getting-started/') ?? '', /Hapbeatを初めて使う/);
  for (const [, query, expectedUrl] of jaChecks) {
    await jaPage.locator('site-search button[data-open-modal]').click();
    const urls = await topThreeUiUrls(jaPage, query, expectedUrl);
    assert.ok(urls.includes(expectedUrl), `${query} should rank ${expectedUrl} in the top three: ${urls.join(', ')}`);
    await jaPage.keyboard.press('Escape');
  }
  await jaPage.close();

  const enPage = await browser.newPage();
  await enPage.goto(`${baseUrl}/en/`, { waitUntil: 'domcontentloaded' });
  for (const [, query, expectedUrl] of enChecks) {
    await enPage.locator('site-search button[data-open-modal]').click();
    const urls = await topThreeUiUrls(enPage, query, expectedUrl);
    assert.ok(urls.includes(expectedUrl), `${query} should rank ${expectedUrl} in the top three: ${urls.join(', ')}`);
    await enPage.keyboard.press('Escape');
  }
  await enPage.close();
});
