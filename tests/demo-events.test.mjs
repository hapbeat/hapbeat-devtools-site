// public/demo-events.json (Hapbeat を体験できるイベントの予定) の形式検査。
// hapbeat.com のトップページがブラウザから読み、終わっていない予定を日付順に表示する。
// 形式の説明は workspace の dev-notes/devtools-site/demo-events-feed.md。
//
// {
//   "version": 1,
//   "updated": "YYYY-MM-DD",
//   "events": [
//     {
//       "id": "lodge-xr-talk-2026-11",            // 英小文字・数字・-、重複なし
//       "title": "LODGE XR Talk Vol.45",           // イベント名
//       "start": "2026-11-12T19:00:00+09:00",      // 開始 (タイムゾーン付き ISO 8601)
//       "end": "2026-11-12T21:00:00+09:00",        // 任意。終了
//       "place": "LODGE（東京・紀尾井町）",          // 場所 (オンラインなら「オンライン」)
//       "url": "https://...",                      // イベントページ (https)
//       "note": "Hapbeat のデモを展示します"          // 任意。一言 (料金は書かない)
//     }
//   ]
// }
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const feed = JSON.parse(readFileSync(new URL('../public/demo-events.json', import.meta.url), 'utf8'));
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)$/;

test('feed header', () => {
  assert.deepEqual(Object.keys(feed).sort(), ['events', 'updated', 'version']);
  assert.equal(feed.version, 1);
  assert.match(feed.updated, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(Array.isArray(feed.events));
});

test('events are well formed', () => {
  const ids = new Set();
  for (const e of feed.events) {
    const at = `event ${e.id ?? '(no id)'}`;
    const extra = Object.keys(e).filter((k) => !['id', 'title', 'start', 'end', 'place', 'url', 'note'].includes(k));
    assert.deepEqual(extra, [], `${at}: unknown fields`);
    assert.match(e.id ?? '', /^[a-z0-9][a-z0-9-]{0,63}$/, `${at}: id`);
    assert.ok(!ids.has(e.id), `${at}: duplicate id`);
    ids.add(e.id);
    for (const k of ['title', 'place']) assert.ok(typeof e[k] === 'string' && e[k].trim(), `${at}: ${k}`);
    assert.match(e.start ?? '', ISO, `${at}: start needs a time zone`);
    assert.ok(!Number.isNaN(Date.parse(e.start)), `${at}: start`);
    if (e.end !== undefined) {
      assert.match(e.end, ISO, `${at}: end needs a time zone`);
      assert.ok(Date.parse(e.end) >= Date.parse(e.start), `${at}: end before start`);
    }
    assert.match(e.url ?? '', /^https:\/\/\S+$/, `${at}: url must be https`);
    if (e.note !== undefined) assert.ok(typeof e.note === 'string' && e.note.length <= 80, `${at}: note`);
  }
});
