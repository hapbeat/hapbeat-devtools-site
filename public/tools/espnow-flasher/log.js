// 書き込みログをページに常設する。
//
// esp-web-tools は進捗をモーダル内にしか出さず、閉じると何が起きたか辿れない。
// 失敗の切り分け（チップが違う / ポートが掴めない / 途中で切れた）に効くのは
// esptool-js が console へ出している行そのものなので、それを横取りして
// ページのログ欄にも流す。
//
// バンドルは minify 済みで内部 API は当てにできない（クラス名も関数名も
// ビルドごとに変わる）。console の差し替えなら、その影響を受けない。

const MAX_LINES = 400;

const el = document.getElementById('log');
const stamp = () =>
  new Date().toLocaleTimeString('ja-JP', { hour12: false });

function append(kind, text) {
  if (!el || !text) return;
  const line = document.createElement('div');
  line.className = `log__line log__line--${kind}`;
  const time = document.createElement('span');
  time.className = 'log__time';
  time.textContent = stamp();
  line.append(time, document.createTextNode(text));
  el.appendChild(line);
  while (el.childElementCount > MAX_LINES) el.removeChild(el.firstChild);
  // 追従スクロール。利用者が上に遡っている間は動かさない。
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  if (nearBottom) el.scrollTop = el.scrollHeight;
}

/** ページ自身からの通知（バージョン読み込みなど）。 */
export function log(text, kind = 'info') {
  append(kind, text);
}
window.flasherLog = log;

// --- console の横取り --------------------------------------------------------
// 元の実装は残す（devtools でも従来どおり見える）。
for (const [method, kind] of [
  ['log', 'info'],
  ['info', 'info'],
  ['warn', 'warn'],
  ['error', 'error'],
]) {
  const original = console[method].bind(console);
  console[method] = (...args) => {
    original(...args);
    try {
      const text = args
        .map((a) => {
          if (typeof a === 'string') return a;
          if (a instanceof Error) return a.message;
          if (a && typeof a === 'object') {
            try {
              return JSON.stringify(a);
            } catch {
              return String(a);
            }
          }
          return String(a);
        })
        .join(' ')
        .trim();
      // Vite/Astro の HMR など、書き込みと無関係な行は落とす。
      if (!text || text.startsWith('[vite]')) return;
      append(kind, text);
    } catch {
      /* ログ表示のために本処理を壊さない */
    }
  };
}

document.getElementById('log-clear')?.addEventListener('click', () => {
  if (el) el.textContent = '';
  append('info', 'ログを消去しました。');
});

append('info', '準備完了。上のボタンから書き込みを開始してください。');
