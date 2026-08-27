import assert from 'node:assert/strict';
import { access, mkdtemp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { copyGamesTree } from '../scripts/fetch-demos.mjs';

const FORBIDDEN_SEGMENTS = new Set([
  '.cache',
  '.git',
  '.mypy_cache',
  '.pytest_cache',
  '.ruff_cache',
  '.venv',
  '__pycache__',
  'build',
  'cache',
  'coverage',
  'dist',
  'node_modules',
  'out',
  'venv',
]);

async function findForbiddenPaths(dir, relativeDir = '') {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const relativePath = path.join(relativeDir, entry.name);
    if (FORBIDDEN_SEGMENTS.has(entry.name)) found.push(relativePath);
    if (entry.isDirectory()) found.push(...await findForbiddenPaths(path.join(dir, entry.name), relativePath));
  }
  return found;
}

test('copyGamesTree excludes development artifacts while preserving demo assets', async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'fetch-demos-test-'));
  const sourceRoot = path.join(tempRoot, 'games');
  const destinationRoot = path.join(tempRoot, 'public');
  try {
    await mkdir(path.join(sourceRoot, 'boxing', 'tracker', '.venv'), { recursive: true });
    await mkdir(path.join(sourceRoot, 'fps', 'venv'), { recursive: true });
    await mkdir(path.join(sourceRoot, 'shared', 'node_modules', 'package'), { recursive: true });
    await mkdir(path.join(sourceRoot, '.git', 'objects'), { recursive: true });
    await mkdir(path.join(sourceRoot, 'boxing', '__pycache__'), { recursive: true });
    await mkdir(path.join(sourceRoot, 'boxing', '.cache'), { recursive: true });
    await mkdir(path.join(sourceRoot, 'boxing', 'build'), { recursive: true });
    await mkdir(path.join(sourceRoot, 'boxing', 'dist'), { recursive: true });
    await writeFile(path.join(sourceRoot, 'boxing', 'index.html'), '<h1>Boxing</h1>');
    await writeFile(path.join(sourceRoot, 'boxing', 'tracker', '.venv', 'python.dll'), 'dev');
    await writeFile(path.join(sourceRoot, 'fps', 'venv', 'python.dll'), 'dev');
    await writeFile(path.join(sourceRoot, 'shared', 'node_modules', 'package', 'index.js'), 'dev');
    await writeFile(path.join(sourceRoot, '.git', 'objects', 'pack'), 'dev');
    await writeFile(path.join(sourceRoot, 'boxing', '__pycache__', 'tracker.pyc'), 'dev');
    await writeFile(path.join(sourceRoot, 'boxing', '.cache', 'state.json'), 'dev');
    await writeFile(path.join(sourceRoot, 'boxing', 'build', 'bundle.js'), 'dev');
    await writeFile(path.join(sourceRoot, 'boxing', 'dist', 'bundle.js'), 'dev');

    await copyGamesTree(sourceRoot, destinationRoot);

    assert.deepEqual(await findForbiddenPaths(destinationRoot), []);
    await assert.doesNotReject(() => access(path.join(destinationRoot, 'boxing', 'index.html')));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
