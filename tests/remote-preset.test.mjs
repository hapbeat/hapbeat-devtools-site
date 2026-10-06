// src/lib/remote-preset.mjs が hapbeat-contracts の仕様どおりに符号化・復号・検査するか。
// fixtures/sample-demo-remote-preset.json は hapbeat-contracts の同名ファイルのコピー
// (specs/demo-session.md「リモコンへのプリセット受け渡し」、contracts commit 2e2561d)。
// 仕様が変わったらコピーし直す。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  MAX_PAYLOAD_BYTES,
  decodeToken,
  encodeToken,
  intentUrl,
  parseJsonStrict,
  presetPageUrl,
  validatePayload,
} from '../src/lib/remote-preset.mjs';

const fixtures = JSON.parse(readFileSync(new URL('./fixtures/sample-demo-remote-preset.json', import.meta.url), 'utf8').replace(/^﻿/, ''));

const b64url = (text) => Buffer.from(text, 'utf8').toString('base64url');

test('valid payloads pass the schema checks', () => {
  assert.deepEqual(validatePayload(fixtures.valid), []);
  assert.deepEqual(validatePayload(fixtures.valid_token_json), []);
});

test('every invalid payload in the fixtures is rejected', () => {
  fixtures.invalid.forEach((payload, i) => {
    assert.notDeepEqual(validatePayload(payload), [], `invalid[${i}] passed: ${JSON.stringify(payload)}`);
    assert.throws(() => encodeToken(payload), `invalid[${i}] was encoded`);
  });
});

test('more than three presets are rejected', () => {
  const one = fixtures.valid.presets[0];
  assert.notDeepEqual(validatePayload({ version: 1, presets: [one, one, one, one] }), []);
});

test('token round trip matches the reference encoder', () => {
  assert.equal(encodeToken(fixtures.valid_token_json), fixtures.valid_token);
  assert.deepEqual(decodeToken(fixtures.valid_token), fixtures.valid_token_json);
  assert.deepEqual(decodeToken(encodeToken(fixtures.valid)), fixtures.valid);
});

test('token is url safe and unpadded', () => {
  const token = encodeToken(fixtures.valid);
  assert.match(token, /^v1\.[A-Za-z0-9_-]+$/);
});

test('every invalid token in the fixtures is rejected', () => {
  for (const token of fixtures.invalid_tokens) {
    assert.throws(() => decodeToken(token), `accepted: ${token.slice(0, 24)}`);
  }
});

test('duplicate keys are rejected', () => {
  assert.throws(() => decodeToken('v1.' + b64url('{"version":1,"version":1,"presets":[{"name":"a","steps":[{"demo_id":"fps"}]}]}')));
  assert.throws(() => parseJsonStrict('{"a":1,"a":2}'));
  assert.deepEqual(parseJsonStrict('{"a":[1,"x",true,null]}'), { a: [1, 'x', true, null] });
});

test('payloads over 700 bytes are not encoded', () => {
  const steps = Array.from({ length: 32 }, () => ({ demo_id: 'trex-encounter', options: { tutorial: 'off' } }));
  const payload = { version: 1, presets: [{ name: 'big', steps }] };
  assert.ok(Buffer.byteLength(JSON.stringify(payload)) > MAX_PAYLOAD_BYTES);
  assert.notDeepEqual(validatePayload(payload), []);
  assert.throws(() => encodeToken(payload));
});

test('names count code points and reject whitespace-only and separators', () => {
  const ok = (name) => validatePayload({ version: 1, presets: [{ name, steps: [{ demo_id: 'fps' }] }] });
  assert.deepEqual(ok('😀'.repeat(40)), []);
  assert.notDeepEqual(ok('😀'.repeat(41)), []);
  assert.notDeepEqual(ok('   '), []);
  assert.notDeepEqual(ok('a\u2028b'), []);
  assert.notDeepEqual(ok('a\u0085b'), []);
});

test('links follow the contract', () => {
  const token = fixtures.valid_token;
  assert.equal(presetPageUrl(token), `https://devtools.hapbeat.com/remote/preset#${token}`);
  assert.equal(
    intentUrl(token),
    `intent://preset?d=${token}#Intent;scheme=hapbeat-remote;package=com.hapbeat.demoremote;S.browser_fallback_url=${encodeURIComponent(`https://devtools.hapbeat.com/remote/preset#${token}`)};end`,
  );
});
