/**
 * Local-only source editor for the documentation portal.
 *
 * The portal normally renders a generated copy in `src/content/docs/`. This
 * dev-server middleware resolves a displayed route back to its source Markdown
 * file and is intentionally registered only for `astro dev`; built and hosted
 * sites have neither this endpoint nor a browser editor.
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  DEVTOOLS_ROOT,
  DOCS_SOURCES,
  REPO_CATEGORY_DIRS,
  WORKSPACE_ROOT,
} from './docs-source-registry.mjs';

const ENDPOINT = '/__hapbeat/docs-editor';
const MAX_BODY_BYTES = 2 * 1024 * 1024;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function contentHash(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

// HTMLTextAreaElement normalizes line endings to LF. Keep a CRLF source file
// CRLF when its author saves it unchanged through the browser editor, so a
// no-op save never creates a line-ending-only diff.
function preserveLineEndings(content, currentContent) {
  if (currentContent.includes('\r\n')) return content.replace(/\r?\n/g, '\r\n');
  return content.replace(/\r\n/g, '\n');
}

function appendInternalNote(currentContent, note) {
  // HTML comments are invisible in the published Markdown, but live beside the
  // source text so a later agent or reviewer can find the request naturally.
  const safeNote = note.replace(/-->/g, '—>');
  const separator = currentContent.endsWith('\n') ? '\n' : '\n\n';
  return `${currentContent}${separator}<!-- hapbeat-doc-note\n${safeNote}\n-->\n`;
}

function routeSegments(requestPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestPath, 'http://localhost').pathname);
  } catch {
    return null;
  }

  const prefix = pathname.startsWith('/en/docs/')
    ? '/en/docs/'
    : pathname.startsWith('/docs/')
      ? '/docs/'
      : null;
  if (!prefix) return null;

  const segments = pathname.slice(prefix.length).split('/').filter(Boolean);
  if (segments.length === 0 || segments.some((segment) => (
    segment === '.' || segment === '..' || segment.includes('\\') || segment.includes('\0')
  ))) {
    return null;
  }
  return { locale: prefix === '/en/docs/' ? 'en' : 'ja', segments };
}

async function isDirectory(candidate) {
  try {
    return (await stat(candidate)).isDirectory();
  } catch {
    return false;
  }
}

async function findSiblingDocs(repo) {
  for (const category of REPO_CATEGORY_DIRS) {
    for (const directory of ['docs~', 'docs']) {
      const candidate = path.join(WORKSPACE_ROOT, category, repo, directory);
      if (await isDirectory(candidate)) return candidate;
    }
  }
  return null;
}

async function findMarkdownFile(root, segments) {
  const relativePath = path.join(...segments);
  const directCandidates = [
    `${relativePath}.md`,
    `${relativePath}.mdx`,
    path.join(relativePath, 'index.md'),
    path.join(relativePath, 'index.mdx'),
  ];
  for (const relative of directCandidates) {
    const candidate = path.resolve(root, relative);
    const relativeToRoot = path.relative(root, candidate);
    if (!relativeToRoot.startsWith('..') && !path.isAbsolute(relativeToRoot) && existsSync(candidate)) {
      return candidate;
    }
  }

  // The portal accepts `01-getting-started.md` as `/getting-started/`.
  const dir = path.resolve(root, path.dirname(relativePath));
  const stem = path.basename(relativePath);
  const relativeToRoot = path.relative(root, dir);
  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot) || !(await isDirectory(dir))) {
    return null;
  }
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const match = entry.name.match(/^\d+[-_](.+)\.(md|mdx)$/i);
    if (match?.[1] === stem) return path.join(dir, entry.name);
  }
  return null;
}

async function resolveSourceDocument(requestPath) {
  const route = routeSegments(requestPath);
  if (!route) return null;

  for (const source of DOCS_SOURCES) {
    const prefix = source.short.split('/');
    const matches = prefix.every((segment, index) => route.segments[index] === segment);
    if (!matches || route.segments.length <= prefix.length) continue;
    const docsRoot = await findSiblingDocs(source.repo);
    if (!docsRoot) return null;
    const file = await findMarkdownFile(docsRoot, route.segments.slice(prefix.length));
    if (file) return file;
    return null;
  }

  const localeRoot = path.join(DEVTOOLS_ROOT, 'docs', route.locale);
  return findMarkdownFile(localeRoot, route.segments);
}

async function readJsonBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('The document is too large to save.');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('The request body must be valid JSON.');
  }
}

async function writeAtomically(filePath, content) {
  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(temporaryPath, content, 'utf8');
    await rename(temporaryPath, filePath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

function localDocsEditorMiddleware() {
  return {
    name: 'hapbeat-local-docs-editor',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(ENDPOINT, async (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'POST') {
          next();
          return;
        }

        const requestUrl = new URL(req.url || ENDPOINT, 'http://localhost');
        const requestPath = requestUrl.searchParams.get('path');
        if (!requestPath) {
          sendJson(res, 400, { ok: false, error: 'A document path is required.' });
          return;
        }

        const sourcePath = await resolveSourceDocument(requestPath);
        if (!sourcePath) {
          sendJson(res, 404, { ok: false, error: 'This page has no editable local Markdown source.' });
          return;
        }

        if (req.method === 'GET') {
          const content = await readFile(sourcePath, 'utf8');
          sendJson(res, 200, {
            ok: true,
            content,
            hash: contentHash(content),
            sourcePath: path.relative(WORKSPACE_ROOT, sourcePath).split(path.sep).join('/'),
          });
          return;
        }

        try {
          const body = await readJsonBody(req);
          const isDocumentSave = typeof body.content === 'string';
          const isNoteSave = typeof body.note === 'string' && body.note.trim().length > 0;
          if ((isDocumentSave === isNoteSave) || !/^[a-f0-9]{64}$/i.test(body.hash || '')) {
            sendJson(res, 400, { ok: false, error: 'Provide either a document body or a note with its original version.' });
            return;
          }

          const currentContent = await readFile(sourcePath, 'utf8');
          if (contentHash(currentContent) !== body.hash) {
            sendJson(res, 409, {
              ok: false,
              error: 'The source changed after it was opened. Reload it before saving.',
            });
            return;
          }

          const savedContent = isNoteSave
            ? appendInternalNote(currentContent, body.note.trim())
            : preserveLineEndings(body.content, currentContent);
          await writeAtomically(sourcePath, savedContent);
          sendJson(res, 200, {
            ok: true,
            hash: contentHash(savedContent),
            sourcePath: path.relative(WORKSPACE_ROOT, sourcePath).split(path.sep).join('/'),
          });
        } catch (error) {
          sendJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : 'Could not save the document.',
          });
        }
      });
    },
  };
}

/** Registers the editor only while running `astro dev`. */
export default function localDocsEditor() {
  return {
    name: 'hapbeat-local-docs-editor',
    hooks: {
      'astro:config:setup': ({ command, updateConfig }) => {
        if (command !== 'dev') return;
        updateConfig({ vite: { plugins: [localDocsEditorMiddleware()] } });
      },
    },
  };
}
