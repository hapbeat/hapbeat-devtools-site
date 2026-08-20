#!/usr/bin/env node
// sync-modkit-tools.mjs
//
// hapbeat-modkit のブラウザツールを public/tools/ へ取り込む。
//
// なぜ「毎ビルド再生成」ではなく「コミット済みのコピー + 手動同期」なのか:
//   hapbeat-modkit は **private repo**。CI (GitHub Actions) からは clone できないので、
//   fetch-demos.mjs の js-sdk (public) のように build 時に取りに行く方式が使えない。
//   /tools/espnow-flasher/bin/ (ファーム repo が private) と同じく、
//   **取り込んだ結果を git にコミットしないとデプロイに乗らない**。
//   したがって public/tools/settings-editor/ は .gitignore 対象にせず追跡する。
//
// 使い方:
//   node scripts/sync-modkit-tools.mjs           modkit から取り込んで上書きする
//   node scripts/sync-modkit-tools.mjs --check   差分の有無だけ見る (書き込まない)
//                                                差分があれば exit 1
//
// modkit が手元に無い場合 (CI / modkit を clone していない環境) は、
// 何もせず exit 0 で抜ける。ビルドは既にコミット済みのコピーで通る。
//
// 取り込むファイルはバイト単位で modkit と同一に保つ。ホスト固有の案内文
// (file:// 不要・localStorage のオリジンが変わる 等) は、この HTML を書き換えず
// ポータル側の src/content/docs/tools.mdx に置くこと。ここを直接編集すると
// --check が差分として検出し、次の同期で黙って上書きされる。

import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// devtools-site は repos-tools/ 配下、workspace root は 2 階層上
// (fetch-docs.mjs / fetch-demos.mjs と同じ前提)。
const WORKSPACE_ROOT = path.resolve(ROOT, '..', '..');
const REPO_CATEGORY_DIRS = ['repos-core', 'repos-firmware', 'repos-sdk', 'repos-tools', '_legacy'];
const MODKIT_REPO = 'hapbeat-modkit';

// [modkit 内の相対パス, public/ 内の相対パス]
// 単一 HTML で外部依存もビルド工程も無いツールだけをここに並べる。
// アセットを伴うツールを足す場合はディレクトリ単位のコピーに拡張すること。
const FILES = [
  ['tools/settings-editor/index.html', 'tools/settings-editor/index.html'],
];

function resolveModkit() {
  for (const category of REPO_CATEGORY_DIRS) {
    const p = path.join(WORKSPACE_ROOT, category, MODKIT_REPO);
    if (existsSync(p)) return p;
  }
  return null;
}

async function main() {
  const check = process.argv.includes('--check');
  const modkit = resolveModkit();

  if (!modkit) {
    console.log(
      `[sync-modkit-tools] ${MODKIT_REPO} が repos-*/ に見つからない — スキップ` +
        ' (コミット済みの public/tools/ をそのまま使う)'
    );
    return;
  }

  let changed = 0;
  for (const [srcRel, destRel] of FILES) {
    const src = path.join(modkit, srcRel);
    const dest = path.join(ROOT, 'public', destRel);

    if (!existsSync(src)) {
      console.error(`[sync-modkit-tools] 取り込み元が無い: ${path.relative(WORKSPACE_ROOT, src)}`);
      process.exit(1);
    }

    const srcBuf = await readFile(src);
    const destBuf = existsSync(dest) ? await readFile(dest) : null;
    if (destBuf && srcBuf.equals(destBuf)) {
      console.log(`  同一: public/${destRel}`);
      continue;
    }

    changed += 1;
    if (check) {
      console.log(`  差分: public/${destRel} ← ${MODKIT_REPO}/${srcRel}`);
      continue;
    }

    await mkdir(path.dirname(dest), { recursive: true });
    await copyFile(src, dest);
    console.log(`  更新: public/${destRel} ← ${MODKIT_REPO}/${srcRel}`);
  }

  if (check && changed > 0) {
    console.error(
      `[sync-modkit-tools] ${changed} 件が modkit と乖離している。` +
        ' `npm run sync:modkit-tools` で取り込んでコミットすること。'
    );
    process.exit(1);
  }

  if (!check && changed > 0) {
    console.log('[sync-modkit-tools] 更新あり — git にコミットすること (private repo のため CI では取得できない)。');
  } else if (!check) {
    console.log('[sync-modkit-tools] 差分なし。');
  } else {
    console.log('[sync-modkit-tools] 差分なし。');
  }
}

main().catch((e) => {
  console.error('[sync-modkit-tools] fatal:', e);
  process.exit(1);
});
