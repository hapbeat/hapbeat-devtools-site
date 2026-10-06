// remote-preset.mjs
//
// デモ一覧 (/demos/showcase/) で組んだプランを、展示用 Android リモコン
// (hapbeat-demos/android/demo-remote) のプリセットとして QR / リンクで渡すための
// 符号化・復号・検査。仕様の正本は hapbeat-contracts の specs/demo-session.md
// 「リモコンへのプリセット受け渡し（QR / リンク）」と
// schemas/demo-remote-preset.schema.json。ここはその Web 側の実装。
//
// ブラウザ (プラン作成ページ /demos/showcase/plan/ と受け取りページ /remote/preset)
// と node --test (tests/remote-preset.test.mjs) の両方から使うので、DOM にも
// Node 固有 API にも依存しない (TextEncoder / TextDecoder だけを使う)。

export const PAYLOAD_VERSION = 1;
export const MAX_PAYLOAD_BYTES = 700;
export const MAX_TOKEN_LENGTH = 937;
export const MAX_PRESETS = 3;
export const MAX_STEPS = 32;
export const MAX_NAME_CODE_POINTS = 40;
export const MAX_OPTIONS = 8;
export const PRESET_PAGE_URL = 'https://devtools.hapbeat.com/remote/preset';
export const APP_SCHEME = 'hapbeat-remote';
export const APP_PACKAGE = 'com.hapbeat.demoremote';

const TOKEN_PREFIX = 'v1.';
const TOKEN_RE = /^v1\.[A-Za-z0-9_-]+$/;
const IDENTIFIER_RE = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const OPTION_VALUE_RE = /^[a-z0-9][a-z0-9._-]{0,31}$/;
const NAME_FORBIDDEN_RE = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;
const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

/** プランを送る JSON 文字列 (空白なし)。キー順は version, presets / name, steps / demo_id, options, retry。 */
export function serializePayload(payload) {
  return JSON.stringify(payload);
}

/** UTF-8 にしたときのバイト数。 */
export function payloadByteLength(payload) {
  return utf8Encoder.encode(serializePayload(payload)).length;
}

function base64UrlEncode(bytes) {
  let out = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63] + B64URL[(n >> 6) & 63] + B64URL[n & 63];
  }
  const rest = bytes.length - i;
  if (rest === 1) {
    const n = bytes[i] << 16;
    out += B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63];
  } else if (rest === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63] + B64URL[(n >> 6) & 63];
  }
  return out;
}

function base64UrlDecode(text) {
  if (text.length % 4 === 1) throw new Error('base64url の長さが不正です');
  const bytes = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of text) {
    const v = B64URL.indexOf(ch);
    if (v < 0) throw new Error('base64url に使えない文字があります');
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

/**
 * ペイロード → トークン ("v1." + base64url、padding なし)。
 * 検査に通らないもの・700 bytes を超えるものは例外にする (QR にしない)。
 */
export function encodeToken(payload) {
  const errors = validatePayload(payload);
  if (errors.length > 0) throw new Error(errors[0]);
  return TOKEN_PREFIX + base64UrlEncode(utf8Encoder.encode(serializePayload(payload)));
}

/**
 * トークン → ペイロード。受け取り側の規則 (トークンの形・長さ、厳密な base64url と
 * UTF-8、700 bytes、重複キー、schema) をすべて検査し、違反は例外にする。
 */
export function decodeToken(token) {
  if (typeof token !== 'string' || token.length > MAX_TOKEN_LENGTH || !TOKEN_RE.test(token)) {
    throw new Error('トークンの形式が正しくありません');
  }
  const bytes = base64UrlDecode(token.slice(TOKEN_PREFIX.length));
  if (bytes.length > MAX_PAYLOAD_BYTES) throw new Error(`データが ${MAX_PAYLOAD_BYTES} bytes を超えています`);
  let text;
  try {
    text = utf8Decoder.decode(bytes);
  } catch {
    throw new Error('UTF-8 として読めないデータです');
  }
  const payload = parseJsonStrict(text);
  const errors = validatePayload(payload);
  if (errors.length > 0) throw new Error(errors[0]);
  return payload;
}

/** QR とリンクに使う https の URL。 */
export function presetPageUrl(token) {
  return `${PRESET_PAGE_URL}#${token}`;
}

/** Android の Chrome で「アプリで開く」に使う intent URL。アプリが無い端末は https のページに戻る。 */
export function intentUrl(token) {
  return `intent://preset?d=${token}#Intent;scheme=${APP_SCHEME};package=${APP_PACKAGE};S.browser_fallback_url=${encodeURIComponent(presetPageUrl(token))};end`;
}

/** アプリを開く通常のリンク。 */
export function appUrl(token) {
  return `${APP_SCHEME}://preset?d=${token}`;
}

function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function unknownKeys(obj, allowed) {
  return Object.keys(obj).filter((k) => !allowed.includes(k));
}

/** プリセット名の検査。問題があれば理由 (日本語) を返し、無ければ null。 */
export function nameProblem(name) {
  if (typeof name !== 'string') return '名前が文字列ではありません';
  const length = [...name].length;
  if (length < 1) return '名前が空です';
  if (length > MAX_NAME_CODE_POINTS) return `名前は ${MAX_NAME_CODE_POINTS} 文字までです`;
  if (!/\S/u.test(name)) return '名前が空白だけです';
  if (NAME_FORBIDDEN_RE.test(name)) return '名前に改行や制御文字は使えません';
  return null;
}

/**
 * schema (demo-remote-preset.schema.json) と 700 bytes の上限を検査する。
 * 違反の説明 (日本語) の配列を返す。空なら有効。
 */
export function validatePayload(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return ['データがオブジェクトではありません'];
  const extraTop = unknownKeys(payload, ['version', 'presets']);
  if (extraTop.length) errors.push(`未知のフィールドがあります: ${extraTop.join(', ')}`);
  if (payload.version !== PAYLOAD_VERSION) errors.push(`version は ${PAYLOAD_VERSION} だけを受け付けます`);
  const presets = payload.presets;
  if (!Array.isArray(presets)) {
    errors.push('presets がありません');
    return errors;
  }
  if (presets.length < 1 || presets.length > MAX_PRESETS) errors.push(`プリセットは 1〜${MAX_PRESETS} 件です`);
  presets.forEach((preset, pi) => {
    const at = `プリセット ${pi + 1}`;
    if (!isPlainObject(preset)) {
      errors.push(`${at}: 形式が正しくありません`);
      return;
    }
    const extra = unknownKeys(preset, ['name', 'steps']);
    if (extra.length) errors.push(`${at}: 未知のフィールドがあります: ${extra.join(', ')}`);
    const np = nameProblem(preset.name);
    if (np) errors.push(`${at}: ${np}`);
    const steps = preset.steps;
    if (!Array.isArray(steps) || steps.length < 1) {
      errors.push(`${at}: デモが 1 つもありません`);
      return;
    }
    if (steps.length > MAX_STEPS) errors.push(`${at}: デモは ${MAX_STEPS} 個までです`);
    steps.forEach((step, si) => {
      const sat = `${at} の ${si + 1} 番目`;
      if (!isPlainObject(step)) {
        errors.push(`${sat}: 形式が正しくありません`);
        return;
      }
      const extraStep = unknownKeys(step, ['demo_id', 'options', 'retry']);
      if (extraStep.length) errors.push(`${sat}: 未知のフィールドがあります: ${extraStep.join(', ')}`);
      if (typeof step.demo_id !== 'string' || !IDENTIFIER_RE.test(step.demo_id)) errors.push(`${sat}: demo_id が正しくありません`);
      if ('options' in step) {
        if (!isPlainObject(step.options)) {
          errors.push(`${sat}: options の形式が正しくありません`);
        } else {
          const entries = Object.entries(step.options);
          if (entries.length > MAX_OPTIONS) errors.push(`${sat}: 設定は ${MAX_OPTIONS} 個までです`);
          for (const [k, v] of entries) {
            if (!IDENTIFIER_RE.test(k)) errors.push(`${sat}: 設定名 ${k} が正しくありません`);
            if (typeof v !== 'string' || !OPTION_VALUE_RE.test(v)) errors.push(`${sat}: 設定 ${k} の値が正しくありません`);
          }
        }
      }
      if ('retry' in step && typeof step.retry !== 'boolean') errors.push(`${sat}: retry は true / false です`);
    });
  });
  if (errors.length === 0) {
    const bytes = payloadByteLength(payload);
    if (bytes > MAX_PAYLOAD_BYTES) errors.push(`データが ${bytes} bytes で、上限の ${MAX_PAYLOAD_BYTES} bytes を超えています`);
  }
  return errors;
}

/**
 * 重複したキーを拒否する JSON パーサ (JSON.parse は後勝ちで黙って通すため)。
 * RFC 8259 の文法どおりに読み、違反は例外にする。
 */
export function parseJsonStrict(text) {
  let i = 0;
  const fail = (msg) => {
    throw new Error(`JSON が正しくありません (${msg}, 位置 ${i})`);
  };
  const ws = () => {
    while (i < text.length && ' \t\n\r'.includes(text[i])) i++;
  };
  const literal = (word, value) => {
    if (text.startsWith(word, i)) {
      i += word.length;
      return value;
    }
    return fail('不明な値');
  };
  const string = () => {
    i++; // opening quote
    let out = '';
    while (true) {
      if (i >= text.length) fail('文字列が閉じていません');
      const ch = text[i];
      if (ch === '"') {
        i++;
        return out;
      }
      if (ch === '\\') {
        const esc = text[i + 1];
        const map = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
        if (esc in map) {
          out += map[esc];
          i += 2;
        } else if (esc === 'u') {
          const hex = text.slice(i + 2, i + 6);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) fail('\\u の後が不正');
          out += String.fromCharCode(parseInt(hex, 16));
          i += 6;
        } else {
          fail('不正なエスケープ');
        }
        continue;
      }
      if (ch < ' ') fail('文字列に制御文字');
      out += ch;
      i++;
    }
  };
  const number = () => {
    const m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i));
    if (!m) fail('不正な数値');
    i += m[0].length;
    return Number(m[0]);
  };
  const value = () => {
    ws();
    const ch = text[i];
    if (ch === '{') {
      i++;
      const obj = {};
      ws();
      if (text[i] === '}') {
        i++;
        return obj;
      }
      while (true) {
        ws();
        if (text[i] !== '"') fail('キーがありません');
        const key = string();
        if (Object.prototype.hasOwnProperty.call(obj, key)) fail(`キー ${key} が重複しています`);
        ws();
        if (text[i] !== ':') fail(': がありません');
        i++;
        const v = value();
        Object.defineProperty(obj, key, { value: v, enumerable: true, writable: true, configurable: true });
        ws();
        if (text[i] === ',') {
          i++;
          continue;
        }
        if (text[i] === '}') {
          i++;
          return obj;
        }
        fail(', か } がありません');
      }
    }
    if (ch === '[') {
      i++;
      const arr = [];
      ws();
      if (text[i] === ']') {
        i++;
        return arr;
      }
      while (true) {
        arr.push(value());
        ws();
        if (text[i] === ',') {
          i++;
          continue;
        }
        if (text[i] === ']') {
          i++;
          return arr;
        }
        fail(', か ] がありません');
      }
    }
    if (ch === '"') return string();
    if (ch === 't') return literal('true', true);
    if (ch === 'f') return literal('false', false);
    if (ch === 'n') return literal('null', null);
    return number();
  };
  const result = value();
  ws();
  if (i !== text.length) fail('末尾に余分なデータ');
  return result;
}
