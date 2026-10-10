// AivisSpeech Engine（VOICEVOX 互換 API）の呼び出し。fetch は引数で受け取る（テストで差し替える）。

export const DEFAULT_ENGINE_URL = 'http://127.0.0.1:10101';

const trimUrl = (url) => url.trim().replace(/\/+$/, '');

/**
 * 接続状態を調べる。
 * - connected: /version が読めた
 * - cors: CORS では失敗したが no-cors（中身を読まない要求）は届いた = エンジンは動いているがこのオリジンを許可していない
 *   （エンジンは許可外のオリジンに 403 を返し、ブラウザには CORS エラーとして見える）
 * - down: no-cors でも届かない = 起動していない、URL が違う、またはブラウザがローカルネットワークへの接続を止めた
 */
export async function probeEngine(url, fetchImpl = fetch) {
  const base = trimUrl(url);
  try {
    const response = await fetchImpl(`${base}/version`, { cache: 'no-store' });
    if (!response.ok) return { state: 'error', detail: `HTTP ${response.status}` };
    const version = String(await response.json());
    return { state: 'connected', version };
  } catch {
    try {
      await fetchImpl(`${base}/version`, { mode: 'no-cors', cache: 'no-store' });
      return { state: 'cors' };
    } catch {
      return { state: 'down' };
    }
  }
}

async function readJson(response, label) {
  if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
  return response.json();
}

export async function fetchSpeakers(url, fetchImpl = fetch) {
  return readJson(await fetchImpl(`${trimUrl(url)}/speakers`, { cache: 'no-store' }), '/speakers');
}

/** /audio_query → speedScale / volumeScale を設定 → /synthesis。WAV の ArrayBuffer を返す（generate-voice.py synthesize と同じ）。 */
export async function synthesize(url, styleId, text, speed, volume, fetchImpl = fetch) {
  const base = trimUrl(url);
  const params = new URLSearchParams({ speaker: String(styleId), text });
  const query = await readJson(await fetchImpl(`${base}/audio_query?${params}`, { method: 'POST' }), '/audio_query');
  query.speedScale = speed;
  query.volumeScale = volume;
  const response = await fetchImpl(`${base}/synthesis?speaker=${encodeURIComponent(String(styleId))}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  });
  if (!response.ok) throw new Error(`/synthesis: HTTP ${response.status}`);
  return response.arrayBuffer();
}

/** エンジンの起動コマンド。公開サイト等（localhost 以外）から使うときはそのオリジンを --allow_origin で許可する。 */
export function engineStartCommand(pageOrigin, engineUrl = DEFAULT_ENGINE_URL) {
  let host = '127.0.0.1';
  let port = '10101';
  try {
    const parsed = new URL(engineUrl);
    host = parsed.hostname;
    port = parsed.port || port;
  } catch {
    /* URL が壊れていれば既定値で表示する */
  }
  const base = `& "$env:LOCALAPPDATA\\Programs\\AivisSpeech-Engine\\run.exe" --host ${host} --port ${port} --disable_sentry`;
  return isLocalOrigin(pageOrigin) ? base : `${base} --allow_origin ${pageOrigin}`;
}

/** エンジンの既定の CORS（localapps）が許可するオリジンか。 */
export function isLocalOrigin(origin) {
  try {
    const { protocol, hostname } = new URL(origin);
    return (protocol === 'http:' || protocol === 'https:') && (hostname === 'localhost' || hostname === '127.0.0.1');
  } catch {
    return false;
  }
}
