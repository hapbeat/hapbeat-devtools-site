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
//       "sessions": [                              // 体験できる時間帯 (1 件以上、時刻順)。日ごとに時間が違う複数日は日ごとに 1 つ
//         { "start": "2026-11-12T19:00:00+09:00",  // 開始 (タイムゾーン付き ISO 8601、または日付だけ YYYY-MM-DD)
//           "end": "2026-11-12T20:00:00+09:00" }   // 任意。終了 (start と同じ形式。時間の決まっていない複数日は日付だけで)
//       ],
//       "place": "LODGE（東京ガーデンテラス紀尾井町 17F）", // 会場 (オンラインなら「オンライン」)
//       "area": "東京都千代田区",                   // 任意。おおよその所在地 (都道府県＋市区町村)
//       "map": "https://www.google.com/maps/...",  // 任意。場所の Google マップ (https)
//       "url": "https://..."                       // イベントページ (https)
//     }
//   ]
// }
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const feed = JSON.parse(readFileSync(new URL('../public/demo-events.json', import.meta.url), 'utf8'));
const ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z))?$/;

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
    const extra = Object.keys(e).filter((k) => !['id', 'title', 'sessions', 'place', 'area', 'map', 'url'].includes(k));
    assert.deepEqual(extra, [], `${at}: unknown fields`);
    assert.match(e.id ?? '', /^[a-z0-9][a-z0-9-]{0,63}$/, `${at}: id`);
    assert.ok(!ids.has(e.id), `${at}: duplicate id`);
    ids.add(e.id);
    for (const k of ['title', 'place']) assert.ok(typeof e[k] === 'string' && e[k].trim(), `${at}: ${k}`);
    if (e.area !== undefined) assert.ok(typeof e.area === 'string' && e.area.trim(), `${at}: area`);
    assert.ok(Array.isArray(e.sessions) && e.sessions.length > 0, `${at}: sessions must be a non-empty array`);
    let prev = -Infinity;
    for (const [i, s] of e.sessions.entries()) {
      const sat = `${at} session ${i}`;
      const keys = Object.keys(s).filter((k) => !['start', 'end'].includes(k));
      assert.deepEqual(keys, [], `${sat}: unknown fields`);
      assert.match(s.start ?? '', ISO, `${sat}: start must be YYYY-MM-DD or a date-time with a time zone`);
      assert.ok(!Number.isNaN(Date.parse(s.start)), `${sat}: start`);
      if (s.end !== undefined) {
        assert.match(s.end, ISO, `${sat}: end needs a time zone`);
        assert.equal(s.end.includes('T'), s.start.includes('T'), `${sat}: start and end must both be dates or both be date-times`);
        assert.ok(Date.parse(s.end) >= Date.parse(s.start), `${sat}: end before start`);
      }
      assert.ok(Date.parse(s.start) > prev, `${sat}: sessions must be in time order`);
      prev = Date.parse(s.end ?? s.start);
    }
    assert.match(e.url ?? '', /^https:\/\/\S+$/, `${at}: url must be https`);
    if (e.map !== undefined) assert.match(e.map, /^https:\/\/(www\.)?google\.[a-z.]+\/maps|^https:\/\/maps\.app\.goo\.gl\//, `${at}: map must be a Google Maps https URL`);
  }
});
