import assert from 'node:assert/strict';
const base = process.argv[2] ?? 'http://localhost:1313';
const prefix = '/docs/sdk-integration/unreal-sdk/';
const response = await fetch(base + prefix + 'getting-started/');
assert.equal(response.status, 200);
const html = await response.text();
const sidebar = html.match(/<sl-sidebar-state-persist\b[^>]*>([\s\S]*?)<\/sl-sidebar-state-persist>/)?.[1];
assert.ok(sidebar, 'Missing sidebar');
for (const page of ['getting-started', 'event-map-and-playback', 'basic-example',
  'showcase-unreal', 'vr-config-example', 'targeting-and-multi-hmd',
  'unity-to-unreal-codex', 'cpp-api', 'blueprint-nodes', 'editor-menus', 'changelog']) {
  assert.ok(sidebar.includes(`href="${prefix}${page}/"`), `Missing sidebar link: ${page}`);
}
console.log('Live Unreal sidebar: all 11 links present.');
