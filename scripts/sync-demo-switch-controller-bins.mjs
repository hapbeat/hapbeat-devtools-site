#!/usr/bin/env node
// Import locally built Demo Switch controller images into same-origin static
// assets. The committed copies are retained in standalone/CI builds, where the
// private firmware workspace is not available.

import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = path.resolve(root, '..', '..');
const sourceRoot = process.env.DEMO_SWITCH_CONTROLLER_DIST
  ? path.resolve(process.env.DEMO_SWITCH_CONTROLLER_DIST)
  : path.join(workspaceRoot, 'repos-firmware', 'hapbeat-demo-switch-controller-firmware', 'dist');
const pageRoot = path.join(root, 'public', 'tools', 'demo-switch-controller');
const parts = ['bootloader.bin', 'partitions.bin', 'boot_app0.bin', 'firmware.bin'];
const boards = {
  'm5stack-basic': 'ESP32',
  'm5stack-core2': 'ESP32',
  'm5stack-cores3': 'ESP32-S3',
};

const sha256 = (data) => createHash('sha256').update(data).digest('hex');

async function validateDistribution(source, environment) {
  const metadataPath = path.join(source, 'manifest.json');
  const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
  if (metadata.environment !== environment || typeof metadata.version !== 'string') {
    throw new Error(`${metadataPath} has unexpected environment/version metadata.`);
  }
  const expectedOffsets = [environment === 'm5stack-cores3' ? '0x0000' : '0x1000', '0x8000', '0xe000', '0x10000'];
  if (!Array.isArray(metadata.flash) || metadata.flash.length !== parts.length) {
    throw new Error(`${metadataPath} must describe exactly four flash parts.`);
  }
  const ranges = [];
  for (let index = 0; index < parts.length; index += 1) {
    const entry = metadata.flash[index];
    const file = path.join(source, parts[index]);
    if (entry.file !== parts[index] || entry.offset !== expectedOffsets[index]) {
      throw new Error(`${metadataPath} has an unexpected part or offset at index ${index}.`);
    }
    const data = await readFile(file);
    if (sha256(data) !== entry.sha256) throw new Error(`${file} does not match its SHA-256 metadata.`);
    const start = Number.parseInt(entry.offset, 16);
    const end = start + data.length;
    if (start < 0xe000 && end > 0x9000) throw new Error(`${file} overlaps the preserved NVS range.`);
    if (ranges.some((range) => start < range.end && end > range.start)) {
      throw new Error(`${file} overlaps another flash part.`);
    }
    ranges.push({ start, end });
  }
  return metadata;
}

async function importBoard(environment, chipFamily) {
  const source = path.join(sourceRoot, environment);
  const destination = path.join(pageRoot, 'bin', environment);
  const committedMetadata = path.join(destination, 'manifest.json');
  const localAvailable = existsSync(path.join(source, 'manifest.json'))
    && parts.every((part) => existsSync(path.join(source, part)));

  if (localAvailable) {
    await validateDistribution(source, environment);
    await mkdir(destination, { recursive: true });
    for (const part of [...parts, 'manifest.json']) {
      await copyFile(path.join(source, part), path.join(destination, part));
    }
    console.log(`  ✓ ${environment}: imported local firmware`);
  } else if (existsSync(committedMetadata) && parts.every((part) => existsSync(path.join(destination, part)))) {
    console.log(`  = ${environment}: retained committed firmware`);
  } else {
    throw new Error(
      `${environment} firmware is unavailable. Build and package it under ${source}, `
      + 'then commit the imported public assets before deploying.',
    );
  }

  const metadata = await validateDistribution(destination, environment);
  const webManifest = {
    name: `Hapbeat Demo Switch controller (${environment})`,
    version: metadata.version,
    // esp-web-tools otherwise erases the whole chip by default when the
    // firmware has no Improv Serial endpoint. Prompt with erase unchecked so
    // the normal path preserves NVS; erase remains an explicit recovery path.
    new_install_prompt_erase: true,
    new_install_improv_wait_time: 0,
    builds: [{
      chipFamily,
      parts: metadata.flash.map((entry) => ({
        path: `bin/${environment}/${entry.file}`,
        offset: Number.parseInt(entry.offset, 16),
      })),
    }],
  };
  await writeFile(
    path.join(pageRoot, `manifest-${environment}.json`),
    `${JSON.stringify(webManifest, null, 2)}\n`,
  );
}

await mkdir(path.join(pageRoot, 'bin'), { recursive: true });
for (const [environment, chipFamily] of Object.entries(boards)) {
  await importBoard(environment, chipFamily);
}
