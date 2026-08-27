import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import {
  NdjsonFrameReader,
  SERIAL_LINE_LIMIT,
  SerialProvisioningClient,
  redactedSetConfigFields,
} from '../public/tools/demo-switch-controller/protocol.js';

const valid = [
  { frame: { version: 1, type: 'get_config', id: 'read-001' } },
  {
    frame: {
      version: 1,
      type: 'response',
      id: 'read-001',
      response: 'config',
      config: {
        wifi_profiles: [{ ssid: 'DemoLan', open: false, wifi_password_set: true }, { ssid: 'Guest', open: true, wifi_password_set: false }], hmd_ip: '192.168.10.20', controller_id: 'm5-main',
        target_a_demo_id: 'gloveball', target_b_demo_id: 'handdemo', target_c_demo_id: null,
        shared_secret_set: true, allow_unsigned: false, isolated_lan: false, next_sequence: 43,
      },
    },
  },
];
const encoder = new TextEncoder();
const decoder = new TextDecoder();

class FakePort {
  constructor() {
    this.sent = [];
    this.readable = new ReadableStream({
      start: (controller) => { this.controller = controller; },
      cancel: () => { this.closed = true; },
    });
    this.writable = new WritableStream({ write: (chunk) => this.sent.push(decoder.decode(chunk)) });
  }
  async open(options) { this.options = options; }
  async close() {
    if (!this.closed) {
      this.closed = true;
      this.controller.close();
    }
  }
  receive(frame) { this.controller.enqueue(encoder.encode(`${JSON.stringify(frame)}\n`)); }
}

test('contract fixtures parse as NDJSON frames', () => {
  const reader = new NdjsonFrameReader();
  for (const { frame } of valid) {
    const events = reader.push(encoder.encode(`${JSON.stringify(frame)}\n`));
    assert.deepEqual(events, [{ kind: 'frame', frame }]);
  }
});

test('reader rejects overlong lines and resynchronizes at the next LF', () => {
  const reader = new NdjsonFrameReader();
  const tooLong = new Uint8Array(SERIAL_LINE_LIMIT + 1).fill(0x61);
  tooLong[tooLong.length - 1] = 0x0a;
  assert.deepEqual(reader.push(tooLong), [{ kind: 'line-too-long' }]);
  const frame = valid[0].frame;
  assert.deepEqual(reader.push(encoder.encode(`${JSON.stringify(frame)}\n`)), [{ kind: 'frame', frame }]);
});

test('reader discards an overlong line split across chunks, then resumes after LF', () => {
  const reader = new NdjsonFrameReader();
  assert.deepEqual(reader.push(new Uint8Array(SERIAL_LINE_LIMIT).fill(0x61)), [{ kind: 'line-too-long' }]);
  const frame = valid[0].frame;
  assert.deepEqual(
    reader.push(encoder.encode(`discarded\n${JSON.stringify(frame)}\n`)),
    [{ kind: 'frame', frame }],
  );
});

test('client correlates a response by request id', async () => {
  const port = new FakePort();
  const client = new SerialProvisioningClient(port, { timeoutMs: 100 });
  await client.open();
  const request = client.getConfig();
  const sent = JSON.parse(port.sent[0]);
  assert.equal(port.options.baudRate, 115200);
  port.receive({ ...valid[1].frame, id: sent.id });
  assert.equal((await request).config.controller_id, 'm5-main');
  await client.close();
});

test('client rejects a response that does not match the request command', async () => {
  const port = new FakePort();
  const client = new SerialProvisioningClient(port, { timeoutMs: 100 });
  await client.open();
  const request = client.setConfig({ wifi_profiles: [{ ssid: 'DemoLan', wifi_password: 'input-only' }] });
  const sent = JSON.parse(port.sent[0]);
  port.receive({
    version: 1,
    type: 'response',
    id: sent.id,
    response: 'status',
    status: { command: 'reboot', state: 'rebooting' },
  });
  await assert.rejects(request, /unexpected response/);
  await client.close();
});

test('client retries a timed-out request with the same id and body', async () => {
  const port = new FakePort();
  const client = new SerialProvisioningClient(port, { timeoutMs: 20 });
  await client.open();
  const request = client.getConfig();
  for (let attempt = 0; attempt < 100 && port.sent.length < 2; ++attempt) {
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
  assert.equal(port.sent.length, 2);
  assert.equal(port.sent[0], port.sent[1]);
  const sent = JSON.parse(port.sent[1]);
  port.receive({ ...valid[1].frame, id: sent.id });
  assert.equal((await request).config.controller_id, 'm5-main');
  await client.close();
});

test('secret updates are represented by redacted presence fields only', () => {
  assert.deepEqual(
    redactedSetConfigFields({ wifi_profiles: [{ ssid: 'DemoLan', wifi_password: 'never-log' }], shared_secret: 'never-log' }),
    ['wifi_profiles', 'shared_secret_set'],
  );
});

test('Wi-Fi profile submit path has no legacy password controls', async () => {
  const app = await readFile(new URL('../public/tools/demo-switch-controller/app.js', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /elements\.namedItem\('wifi_password'\)/);
  assert.doesNotMatch(app, /elements\.namedItem\('clear_wifi_password'\)/);
});
