#!/usr/bin/env node
// sync-flasher-vendor.mjs
//
// esp-web-tools (npm、固定版) を /tools/espnow-flasher/vendor/ へ複製する。
// CDN は踏まない (配信元の停止・改変に書き込み経路を預けないため)。
//
// install-button.js は単体では完結せず、ダイアログ本体とチップごとの stub を
// 動的 import する。したがって **dist/web をフォルダごと**置く必要がある。
//
// 出力先は .gitignore 対象。fetch-demos.mjs の public/tools/vendor/ と同じく
// build 時に再生成する (npm run build が呼ぶ)。

import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PKG_DIR = path.join(ROOT, 'node_modules', 'esp-web-tools');
const SRC = path.join(PKG_DIR, 'dist', 'web');
const DEST = path.join(ROOT, 'public', 'tools', 'espnow-flasher', 'vendor', 'esp-web-tools');

if (!existsSync(SRC)) {
  throw new Error('esp-web-tools が見つからない。npm install を先に実行すること');
}

await rm(DEST, { recursive: true, force: true });
await mkdir(path.dirname(DEST), { recursive: true });
await cp(SRC, DEST, { recursive: true });

// Apache-2.0 なので、複製先にライセンス全文を同梱する
// (表記はページのフッターにも出している)。
await cp(path.join(PKG_DIR, 'LICENSE'), path.join(DEST, 'LICENSE'));

console.log(`[sync-flasher-vendor] 出力: ${path.relative(ROOT, DEST)}`);
