const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

export const BAUD_RATE = 115200;
export const SERIAL_LINE_LIMIT = 3072;
export const REQUEST_TIMEOUT_MS = 5000;
export const REQUEST_RETRY_COUNT = 1;

class ProvisioningTimeoutError extends Error {
  constructor(type) {
    super(`Timed out waiting for ${type}.`);
    this.name = 'ProvisioningTimeoutError';
  }
}

export class ProvisioningResponseError extends Error {
  constructor(response) {
    super(response.error?.message || response.error?.code || 'Controller rejected the request.');
    this.name = 'ProvisioningResponseError';
    this.code = response.error?.code;
    this.response = response;
  }
}

export class NdjsonFrameReader {
  #bytes = new Uint8Array();
  #discardingOverlong = false;

  push(chunk) {
    let incoming = chunk;
    const events = [];
    if (this.#discardingOverlong) {
      const lineEnd = incoming.indexOf(0x0a);
      if (lineEnd === -1) return events;
      this.#discardingOverlong = false;
      incoming = incoming.slice(lineEnd + 1);
    }

    const next = new Uint8Array(this.#bytes.length + incoming.length);
    next.set(this.#bytes);
    next.set(incoming, this.#bytes.length);
    this.#bytes = next;

    let lineEnd;
    while ((lineEnd = this.#bytes.indexOf(0x0a)) !== -1) {
      const line = this.#bytes.slice(0, lineEnd + 1);
      this.#bytes = this.#bytes.slice(lineEnd + 1);
      if (line.length > SERIAL_LINE_LIMIT) {
        events.push({ kind: 'line-too-long' });
        continue;
      }

      let text;
      try {
        text = decoder.decode(line.slice(0, -1)).replace(/\r$/, '');
      } catch {
        events.push({ kind: 'invalid-json' });
        continue;
      }
      if (!text) {
        events.push({ kind: 'invalid-json' });
        continue;
      }
      try {
        events.push({ kind: 'frame', frame: JSON.parse(text) });
      } catch {
        events.push({ kind: 'invalid-json' });
      }
    }

    if (this.#bytes.length >= SERIAL_LINE_LIMIT) {
      // A future LF would make this line exceed the limit, which includes LF.
      this.#bytes = new Uint8Array();
      this.#discardingOverlong = true;
      events.push({ kind: 'line-too-long' });
    }
    return events;
  }
}

export function redactedSetConfigFields(config) {
  return Object.keys(config).map((field) => {
    if (field === 'wifi_profiles') return 'wifi_profiles';
    if (field === 'shared_secret') return 'shared_secret_set';
    return field;
  });
}

export class SerialProvisioningClient {
  #port;
  #reader;
  #writer;
  #pending = new Map();
  #sequence = 0;
  #closed = false;
  #readTask;

  constructor(port, { timeoutMs = REQUEST_TIMEOUT_MS, onEvent = () => {} } = {}) {
    this.#port = port;
    this.timeoutMs = timeoutMs;
    this.onEvent = onEvent;
  }

  async open() {
    await this.#port.open({ baudRate: BAUD_RATE });
    this.#reader = this.#port.readable.getReader();
    this.#writer = this.#port.writable.getWriter();
    this.#readTask = this.#readLoop();
  }

  async close() {
    if (this.#closed) return;
    this.#closed = true;
    for (const { reject, timer } of this.#pending.values()) {
      clearTimeout(timer);
      reject(new Error('Serial connection was closed.'));
    }
    this.#pending.clear();
    try { await this.#reader?.cancel(); } catch { /* Port may already be gone. */ }
    try { await this.#readTask; } catch { /* Read errors are reported by the loop. */ }
    this.#reader?.releaseLock();
    this.#writer?.releaseLock();
    try { await this.#port.close(); } catch { /* A disconnected USB port is already closed. */ }
  }

  getConfig() { return this.request('get_config'); }
  factoryReset() { return this.request('factory_reset'); }
  reboot() { return this.request('reboot'); }
  setConfig(config) { return this.request('set_config', { config }); }

  async request(type, extra = {}) {
    if (this.#closed || !this.#writer) throw new Error('Serial connection is not open.');
    const id = `request-${Date.now().toString(36)}-${++this.#sequence}`;
    const frame = { version: 1, type, id, ...extra };
    const line = `${JSON.stringify(frame)}\n`;
    if (encoder.encode(line).length > SERIAL_LINE_LIMIT) {
      throw new Error('The request exceeds the 3072-byte serial line limit.');
    }

    const encoded = encoder.encode(line);
    for (let attempt = 0; attempt <= REQUEST_RETRY_COUNT; ++attempt) {
      try {
        return await this.#sendAndWait(id, type, encoded);
      } catch (error) {
        if (!(error instanceof ProvisioningTimeoutError) || attempt === REQUEST_RETRY_COUNT) throw error;
      }
    }
    throw new Error('Provisioning request retry loop ended unexpectedly.');
  }

  async #sendAndWait(id, type, encoded) {
    const response = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#pending.delete(id);
        reject(new ProvisioningTimeoutError(type));
      }, this.timeoutMs);
      this.#pending.set(id, { resolve, reject, timer, requestType: type });
    });
    try {
      await this.#writer.write(encoded);
    } catch (error) {
      const pending = this.#pending.get(id);
      if (pending) {
        clearTimeout(pending.timer);
        this.#pending.delete(id);
        pending.reject(error);
      }
    }
    return response;
  }

  async #readLoop() {
    const lines = new NdjsonFrameReader();
    try {
      while (!this.#closed) {
        const { value, done } = await this.#reader.read();
        if (done) break;
        for (const event of lines.push(value)) this.#handleEvent(event);
      }
    } catch (error) {
      if (!this.#closed) this.onEvent({ kind: 'read-error', error });
    }
  }

  #handleEvent(event) {
    this.onEvent(event);
    if (event.kind !== 'frame') return;
    const pending = this.#pending.get(event.frame.id);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.#pending.delete(event.frame.id);
    const frame = event.frame;
    if (!frame || frame.version !== 1 || frame.type !== 'response') {
      pending.reject(new Error('Controller returned an invalid response envelope.'));
      return;
    }
    if (frame.response === 'error') {
      if (!frame.error || typeof frame.error.code !== 'string' || typeof frame.error.message !== 'string') {
        pending.reject(new Error('Controller returned an invalid error response.'));
      } else {
        pending.reject(new ProvisioningResponseError(frame));
      }
      return;
    }

    const expected = {
      get_config: { response: 'config' },
      set_config: { response: 'status', command: 'set_config', state: 'updated' },
      factory_reset: { response: 'status', command: 'factory_reset', state: 'reset' },
      reboot: { response: 'status', command: 'reboot', state: 'rebooting' },
    }[pending.requestType];
    const validConfig = frame.response !== 'config' || (frame.config && typeof frame.config === 'object');
    const validStatus = frame.response !== 'status' || (
      frame.status && frame.status.command === expected?.command && frame.status.state === expected?.state
    );
    if (!expected || frame.response !== expected.response || !validConfig || !validStatus) {
      pending.reject(new Error(`Controller returned an unexpected response for ${pending.requestType}.`));
      return;
    }
    pending.resolve(frame);
  }
}
