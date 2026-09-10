import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { DOCS_SOURCES, REPO_CATEGORY_DIRS } from '../scripts/docs-source-registry.mjs';

// Exercise the actual config-time filter while generated content is absent,
// as it is during fetch-docs startup/reset. Only temporary fixtures are used.
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hapbeat-sidebar-'));
try {
  const site = path.join(root, 'repos-tools/site');
  const sdk = path.join(root, 'repos-sdk/hapbeat-unreal-sdk');
  fs.mkdirSync(path.join(sdk, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(sdk, 'docs/getting-started.md'), '---\ntitle: Getting Started\n---\n');
  fs.writeFileSync(path.join(sdk, 'docs/draft.md'), '---\ndraft: true\n---\n');
  fs.writeFileSync(path.join(sdk, 'CHANGELOG.md'), '# Changes\n');
  const config = fs.readFileSync(new URL('../astro.config.mjs', import.meta.url), 'utf8');
  const functions = config.slice(config.indexOf('function resolveSourceFile('), config.indexOf('// rehype plugin:'));
  const context = vm.createContext({
    __dirname: site, path, existsSync: fs.existsSync, readFileSync: fs.readFileSync,
    readdirSync: fs.readdirSync, DOCS_SOURCES, REPO_CATEGORY_DIRS, WORKSPACE_ROOT: root,
    process: { env: {} },
  });
  vm.runInContext(functions, context);
  for (const page of ['getting-started', 'changelog']) {
    const slug = `docs/sdk-integration/unreal-sdk/${page}`;
    assert.equal(context.pub(slug)?.slug, slug, `lost ${page} during generated-content reset`);
  }
  assert.equal(context.pub('docs/sdk-integration/unreal-sdk/draft'), null);
  assert.equal(context.pub('docs/sdk-integration/unreal-sdk/missing'), null);
  console.log('Sidebar source filtering: startup/reset, drafts and missing pages passed.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
