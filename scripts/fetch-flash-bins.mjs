#!/usr/bin/env node
// fetch-flash-bins.mjs
//
// /tools/espnow-flasher/ が配る ESP-NOW 送信機ファームのバイナリを取り込む。
//
// GitHub のリリース資産はブラウザ fetch から CORS で読めない (実測:
// access-control-allow-origin が付かない)。したがって esp-web-tools に
// リリース URL を直接食わせることはできず、**ページと同一オリジンの静的
// アセットとして同梱する**。その取り込みがこのスクリプト。
//
// 使い方:
//   node scripts/fetch-flash-bins.mjs --local <hapbeat-transmitter-firmware のパス>
//       repo の dist/<env>/firmware_full_serial.bin をコピーする (手元ビルド)
//
//   node scripts/fetch-flash-bins.mjs
//       GitHub Releases から取る (既定)。repo hapbeat/hapbeat-espnow-tx、
//       タグ tx/<env>/v*、資産 <env>_firmware_full_serial.bin。
//       ※ repo が private の間は 404 になる。private token があれば
//          GITHUB_TOKEN 環境変数で渡せる。
//
//   node scripts/fetch-flash-bins.mjs --local-rx <hapbeat-espnow-rx のパス>
//       受信機 (M5Unified_Speaker) を取り込む。先に rx repo 側で
//       `node extras/flasher/build-flasher-bins.mjs` を実行しておくこと。
//       送信機・リピータとは独立に指定でき、--local / 既定と併用できる。
//
// 出力 (いずれも public/tools/espnow-flasher/):
//   bin/<env>.bin          merged image (bootloader + partitions + app、offset 0)
//   bin/rx/<board>/*.bin   受信機は merged image ではなく 4 パート (offset 付き)
//   bin/versions.json      ページのバージョン表示用
//   manifest-*.json        version フィールドだけを実バージョンで書き換える
//
// bin/ は git 管理対象。CI はファーム repo を参照できない (private) ので、
// 取り込んだ結果をコミットしないとデプロイに乗らない。

import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PAGE_DIR = path.join(ROOT, 'public', 'tools', 'espnow-flasher');
const BIN_DIR = path.join(PAGE_DIR, 'bin');
const RX_BIN_DIR = path.join(BIN_DIR, 'rx');

const GH_REPO = 'hapbeat/hapbeat-espnow-tx';

// ページのボタン 2 つが指す env。増やすときは manifest-*.json と
// public/tools/espnow-flasher/versions.js も合わせて直す。
const MANIFESTS = {
  'manifest-tx.json': ['m5stack_audio_tx', 'm5stack_cores3_audio_tx'],
  'manifest-repeater.json': ['m5stack_repeater', 'xiao_c6_repeater'],
};
const ENVS = Object.values(MANIFESTS).flat();

function parseArgs(argv) {
  const args = { local: null, localRx: null, github: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--local') {
      args.local = argv[i + 1];
      if (!args.local) throw new Error('--local にはファーム repo のパスが必要です');
      i += 1;
    } else if (argv[i] === '--github') {
      args.github = true;
    } else if (argv[i] === '--local-rx') {
      args.localRx = argv[i + 1];
      if (!args.localRx) throw new Error('--local-rx には hapbeat-espnow-rx のパスが必要です');
      i += 1;
    }
  }
  return args;
}

const sha256 = (buf) => `sha256:${createHash('sha256').update(buf).digest('hex')}`;

// --- 手元の dist から ------------------------------------------------------

async function fromLocal(repoPath, env) {
  const dist = path.resolve(repoPath, 'dist', env);
  const binPath = path.join(dist, 'firmware_full_serial.bin');
  const bin = await readFile(binPath);

  // variant.json は同じ dist に必ず出る (ファーム側 scripts/gen_variant.py)。
  let variant = {};
  try {
    variant = JSON.parse(await readFile(path.join(dist, 'variant.json'), 'utf-8'));
  } catch {
    console.warn(`  ! ${env}: variant.json が無い (バージョン不明のまま続行)`);
  }

  return { bin, variant, source: `local:${binPath}` };
}

// --- GitHub Releases から ---------------------------------------------------

function ghHeaders(accept) {
  const headers = { accept };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function fromGithub(env, releases) {
  // タグは tx/<env>/v*。リリース一覧 (新しい順) から該当 env の先頭を採る。
  const prefix = `tx/${env}/v`;
  const release = releases.find((r) => typeof r.tag_name === 'string' && r.tag_name.startsWith(prefix));
  if (!release) throw new Error(`${prefix}* のリリースが見つからない`);

  const wanted = `${env}_firmware_full_serial.bin`;
  const asset = release.assets?.find((a) => a.name === wanted);
  if (!asset) throw new Error(`${release.tag_name} に ${wanted} が無い`);

  const res = await fetch(asset.url, { headers: ghHeaders('application/octet-stream') });
  if (!res.ok) throw new Error(`資産の取得に失敗 (HTTP ${res.status}): ${wanted}`);
  const bin = Buffer.from(await res.arrayBuffer());

  // variant.json が同梱されていればそれを、無ければタグから版数を起こす。
  let variant = { fwVersion: release.tag_name.slice(prefix.length) };
  const variantAsset = release.assets?.find((a) => a.name === `${env}_variant.json`);
  if (variantAsset) {
    const vr = await fetch(variantAsset.url, { headers: ghHeaders('application/octet-stream') });
    if (vr.ok) variant = { ...variant, ...JSON.parse(await vr.text()) };
  }

  return { bin, variant, source: `github:${release.tag_name}/${wanted}` };
}

async function listReleases() {
  const url = `https://api.github.com/repos/${GH_REPO}/releases?per_page=100`;
  const res = await fetch(url, { headers: ghHeaders('application/vnd.github+json') });
  if (!res.ok) throw new Error(`GitHub API ${res.status} ${res.statusText}: ${url}`);
  return res.json();
}

// --- 受信機 (hapbeat-espnow-rx) --------------------------------------------
//
// 送信機と違い merged image ではなく 4 パート (bootloader / partitions /
// boot_app0 / app) をそれぞれの offset で書く。offset は rx repo のビルドが
// 実際の esptool 引数から書き出したもの (extras/flasher/build-flasher-bins.mjs)
// なので、ここでは build-info.json をそのまま信じてコピーするだけ。

async function importRx(rxRepoPath) {
  const outDir = path.resolve(rxRepoPath, 'extras', 'flasher', 'out');
  const info = JSON.parse(await readFile(path.join(outDir, 'build-info.json'), 'utf-8'));

  await rm(RX_BIN_DIR, { recursive: true, force: true });

  const boards = {};
  for (const [board, entry] of Object.entries(info.boards ?? {})) {
    await mkdir(path.join(RX_BIN_DIR, board), { recursive: true });
    const parts = [];
    for (const part of entry.parts) {
      const bin = await readFile(path.join(outDir, part.path));
      await writeFile(path.join(RX_BIN_DIR, part.path), bin);
      if (sha256(bin) !== part.sha256) {
        throw new Error(`${part.path}: build-info.json の sha256 と一致しない`);
      }
      parts.push({ path: `bin/rx/${part.path}`, offset: part.offset, offsetHex: part.offsetHex });
    }
    boards[board] = { chipFamily: entry.chipFamily, covers: entry.covers, parts };
    console.log(`  ✓ rx/${board}  ${parts.length} parts`);
  }

  return {
    libraryVersion: info.libraryVersion ?? null,
    buildCommit: info.buildCommit ?? null,
    builtAt: info.generatedAt ?? null,
    source: `local:${outDir}`,
    boards,
  };
}

// manifest-rx.json は手書き。offset や parts がビルド結果とずれていたら、
// 書き込んでから気づくことになるので、ここで突き合わせて落とす。
async function syncRxManifest(rx) {
  const manifestPath = path.join(PAGE_DIR, 'manifest-rx.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));

  for (const build of manifest.builds) {
    const board = Object.values(rx.boards).find((b) => b.chipFamily === build.chipFamily);
    if (!board) throw new Error(`manifest-rx.json の ${build.chipFamily} に対応するビルドが無い`);
    const want = board.parts.map((p) => `${p.path}@${p.offsetHex}`).join(', ');
    const have = build.parts
      .map((p) => `${p.path}@0x${p.offset.toString(16).padStart(4, '0')}`)
      .join(', ');
    if (want !== have) {
      throw new Error(`manifest-rx.json の ${build.chipFamily} が実ビルドと違う\n  manifest: ${have}\n  build:    ${want}`);
    }
  }

  manifest.version = rx.libraryVersion
    ? `${rx.libraryVersion}${rx.buildCommit ? ` (${rx.buildCommit})` : ''}`
    : 'unknown';
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

// --- 本体 ------------------------------------------------------------------

const { local, localRx, github } = parseArgs(process.argv.slice(2));

// 送信機側のソースは明示されたときだけ取り込む。GitHub を無言の既定にすると、
// --local-rx 単独実行のとき、唯一残っている古いリリース (v0.1.0) が手元の
// 新しいビルドを黙ってダウングレードする（実際に起きた）。リリースタグ運用が
// 正になったら既定を --github に戻してよい。
const txSource = local ? 'local' : (github ? 'github' : null);
console.log(`[fetch-flash-bins] tx source: ${txSource ?? 'なし（前回の取り込みを維持）'}${local ? ` (${local})` : github ? ` (${GH_REPO})` : ''}`);

let releases = null;
if (txSource === 'github') {
  releases = await listReleases(); // ここで落ちたら env ごとに握り潰さず全体を止める
}

// bin/ を丸ごと消さない・先に消さない: 置き換えは env ごとに「取り込みが
// 成功したときだけ」行う。ソースを渡していない実行（例: --local-rx のみ）で
// 既存の bin を先に消すと、該当基板の書き込みボタンが 404 になったまま
// deploy されうる（実際に --local-rx 単独実行で送信機 3 本が消えた）。
await mkdir(BIN_DIR, { recursive: true });

// 失敗した env は前回の取り込み結果（bin + versions.json の記述）を引き継ぐ。
let prevBuilds = {};
try {
  prevBuilds = JSON.parse(await readFile(path.join(BIN_DIR, 'versions.json'), 'utf-8')).builds ?? {};
} catch { /* 初回 */ }

const builds = {};

for (const env of ENVS) {
  if (!txSource) {
    const kept = prevBuilds[env];
    if (kept && existsSync(path.join(BIN_DIR, `${env}.bin`))) {
      builds[env] = kept;
      console.log(`  = ${env}: 前回の取り込みを維持 (${kept.fwVersion ?? '版数不明'})`);
    } else {
      console.warn(`  ! ${env}: 取り込み履歴が無い — --local か --github を指定して取り込むこと`);
    }
    continue;
  }
  try {
    const { bin, variant, source } = local ? await fromLocal(local, env) : await fromGithub(env, releases);
    await writeFile(path.join(BIN_DIR, `${env}.bin`), bin);
    builds[env] = {
      label: variant.label ?? env,
      board: variant.board ?? null,
      fwVersion: variant.fwVersion ?? null,
      buildCommit: variant.buildCommit ?? null,
      bytes: bin.length,
      sha256: sha256(bin),
      source,
    };
    console.log(`  ✓ ${env}  ${bin.length.toLocaleString()} B  ${variant.fwVersion ?? '(版数不明)'}`);
  } catch (e) {
    const kept = prevBuilds[env];
    if (kept && existsSync(path.join(BIN_DIR, `${env}.bin`))) {
      builds[env] = kept;
      console.log(`  = ${env}: 前回の取り込みを維持 (${kept.fwVersion ?? '版数不明'}) — ${e.message}`);
    } else {
      console.warn(`  ! ${env}: 取り込めなかった — ${e.message}`);
    }
  }
}

// 受信機。--local-rx が無い実行では、前回取り込んだ内容を versions.json に
// 引き継ぐ (bin/rx/ を消していないので、記述だけ落ちると版数が「不明」になる)。
let rx = null;
if (localRx) {
  rx = await importRx(localRx);
} else {
  try {
    rx = JSON.parse(await readFile(path.join(BIN_DIR, 'versions.json'), 'utf-8')).rx ?? null;
  } catch {
    /* 初回 */
  }
}

await writeFile(
  path.join(BIN_DIR, 'versions.json'),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), builds, rx }, null, 2)}\n`,
);

if (rx) await syncRxManifest(rx);

// manifest の version を実バージョンに合わせる。builds[] の構造は手書きのまま
// (bin が欠けた env を勝手に消すと、次に成功したとき戻し忘れる)。
for (const [file, envs] of Object.entries(MANIFESTS)) {
  const manifestPath = path.join(PAGE_DIR, file);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
  const versions = [...new Set(envs.map((env) => builds[env]?.fwVersion).filter(Boolean))];
  manifest.version = versions.length > 0 ? versions.join(' / ') : 'unknown';
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

const missing = ENVS.filter((env) => !builds[env]);
console.log(`[fetch-flash-bins] 出力: ${path.relative(ROOT, BIN_DIR)} (${ENVS.length - missing.length}/${ENVS.length})`);
if (missing.length > 0) {
  console.warn(`[fetch-flash-bins] 未取り込み: ${missing.join(', ')} — 該当基板は書き込めない`);
}
