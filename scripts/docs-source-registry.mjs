/**
 * Portal route prefixes and their source-of-truth repositories.
 *
 * `fetch-docs.mjs` copies these documents into Astro's generated content
 * collection. Local editing must use this same registry so it never writes to
 * generated files under `src/content/docs/`.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DEVTOOLS_ROOT = path.resolve(__dirname, '..');
export const WORKSPACE_ROOT = path.resolve(DEVTOOLS_ROOT, '..', '..');
export const REPO_CATEGORY_DIRS = [
  'repos-core',
  'repos-firmware',
  'repos-sdk',
  'repos-tools',
  '_legacy',
];

export const DOCS_SOURCES = [
  {
    short: 'concepts/contracts',
    label: 'Contracts (仕様)',
    repo: 'hapbeat-contracts',
    url: 'https://github.com/Hapbeat/hapbeat-contracts.git',
  },
  {
    short: 'tools/web-runtime',
    label: 'Web Runtime',
    repo: 'hapbeat-web-runtime',
    url: 'https://github.com/Hapbeat/hapbeat-web-runtime.git',
  },
  {
    short: 'sdk-integration/unreal-sdk',
    label: 'Unreal SDK',
    repo: 'hapbeat-unreal-sdk',
    url: 'https://github.com/Hapbeat/hapbeat-unreal-sdk.git',
  },
];
