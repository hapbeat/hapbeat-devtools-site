// Post-build checks for Unreal documentation navigation and reference exports.
// Run after npm run build. No browser or device connections are made.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const dist = path.resolve('dist');
const prefix = '/docs/sdk-integration/unreal-sdk/';
const kinds = {
  'getting-started': 'tutorial', 'basic-example': 'tutorial',
  'showcase-unreal': 'tutorial', 'vr-config-example': 'howto',
  'event-map-and-playback': 'howto', 'targeting-and-multi-hmd': 'explanation',
  'unity-to-unreal-codex': 'explanation', 'unreal-build': 'howto',
  'cpp-api': 'reference', 'blueprint-nodes': 'reference', 'editor-menus': 'reference',
  'changelog': 'reference',
};
const readPage = route => fs.readFileSync(path.join(dist, route, route.endsWith('.html') ? '' : 'index.html'), 'utf8');
const errors = [];
let links = 0;
for (const [slug, kind] of Object.entries(kinds)) {
  const route = prefix + slug + '/';
  const html = readPage(route);
  assert.ok(html.includes(`data-kind="${kind}"`), `${slug}: missing ${kind} badge`);
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, `${slug}: duplicate title`);
  const body = html.match(/<div[^>]*class="[^"]*sl-markdown-content[^>]*>([\s\S]*?)<footer/)?.[1] ?? html;
  for (const match of body.matchAll(/href="([^"]+)"/g)) {
    const href = match[1].replaceAll('&amp;', '&');
    if (/^(?:https?:|mailto:)/.test(href)) continue;
    const url = new URL(href, 'https://local.invalid' + route);
    if (!url.pathname.startsWith('/docs/')) continue;
    links++;
    try {
      const target = readPage(decodeURIComponent(url.pathname));
      const id = decodeURIComponent(url.hash.slice(1));
      if (id && !target.includes(`id="${id}"`)) errors.push(`${slug}: missing anchor ${href}`);
    } catch { errors.push(`${slug}: missing page ${href}`); }
  }
  const sampleSections = [...html.matchAll(/<div class="sample-section\b[^"]*"[^>]*>[\s\S]*?<\/ul>\s*<\/div>/g)].map(match => match[0]);
  const sampleSection = sampleSections.find(section => section.includes(prefix));
  const unitySamples = sampleSections.find(section => section.includes('/docs/sdk-integration/unity-sdk/'));
  assert.ok(unitySamples && !unitySamples.includes('<details'), 'Unity Samples must be a static group');
  for (const page of ['showcase/overview', 'showcase/walkthrough', 'showcase/wiring', 'showcase/method-choice', 'vr-config-example', 'xri-handdemo-quickstart', 'xri-handdemo-apk']) {
    assert.ok(unitySamples.includes(`/docs/sdk-integration/unity-sdk/${page}/`), `Unity Samples missing ${page}`);
  }
  assert.ok(sampleSection?.includes('class="sample-label'), `${slug}: missing Samples heading`);
  assert.ok(!sampleSection.includes('<details'), `${slug}: Samples must not collapse`);
  for (const sample of ['basic-example', 'showcase-unreal', 'vr-config-example']) {
    const anchor = html.match(new RegExp(`<a[^>]*href="${prefix}${sample}/"[^>]*>[\\s\\S]*?</a>`))?.[0];
    assert.ok(anchor && sampleSection.includes(anchor), `${slug}: missing grouped sample ${sample}`);
    assert.ok(!anchor.includes('starlight-aside') && !anchor.includes('sl-badge'), `${slug}: unexpected sample badge`);
  }
  if (slug === 'targeting-and-multi-hmd') {
    assert.equal((html.match(/id="構成別の使い分け"/g) ?? []).length, 1);
    assert.ok(!html.includes('id="構成別の使い分け-1"'), 'duplicate shared targeting section');
  }
}
assert.equal(errors.length, 0, errors.join('\n'));
const ai = fs.readFileSync(path.join(dist, '_llms-txt/unreal-sdk.txt'), 'utf8');
for (const name of ['PlayHapbeatEvent', 'EvaluateNow', 'FindById', 'NoResolvedEndpoint']) {
  assert.ok(ai.includes(name), `AI export missing ${name}`);
}
console.log(`Unreal docs: ${Object.keys(kinds).length} pages; ${links} internal links; kind badges, static Samples group, titles and AI export verified.`);
