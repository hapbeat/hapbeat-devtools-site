// 書き込みダイアログの手数を減らす。
//
// esp-web-tools の既定は「ボタン → 確認画面で Install → 完了後に Next」の 3 手。
// このページはファームが 3 種類に決め打ちで、選ぶのは用途だけなので、確認画面は
// 情報を足さない（消える旨はボタンの上に常時書いてある）。完了後のダイアログも
// 残す意味がない。
//
//   1. 「Confirm Installation」が出たら自動で Install に進む
//   2. 書き込みが終わったら自動でダイアログを閉じる
//
// ダイアログの内部は minify 済みだが、Lit の private フィールド名
// (_state / _installConfirmed / _confirmInstall / _closeDialog / _installState)
// は残っている（vendor の install-dialog を確認済み）。名前が変わって取れなく
// なった場合は、何もしない＝従来どおり手動で進める形に落ちるだけにしてある。

const log = (t, kind) => window.flasherLog?.(t, kind);

// 「Erase User Data」の確認は自動化しない。同じ版を焼き直すときにだけ出る、
// ユーザーデータを消すかどうかの問いで、押す・押さないで結果が変わる。
function autoConfirm(dlg) {
  if (dlg._state !== 'INSTALL') return;
  if (dlg._installConfirmed) return;
  if (dlg._isSameVersion) return; // ← Erase User Data の分岐。手動のまま
  if (typeof dlg._confirmInstall !== 'function') return;
  if (!dlg._manifest) return; // manifest 取得前は進めない
  dlg._confirmInstall();
  log('確認をスキップして書き込みを開始しました。');
}

function autoClose(dlg) {
  if (dlg._installState?.state !== 'finished') return;
  if (dlg.__hbClosed) return;
  dlg.__hbClosed = true;
  if (typeof dlg._closeDialog !== 'function') return;
  // 完了表示を一瞬見せてから閉じる（何も見えないまま消えると失敗と紛らわしい）。
  setTimeout(() => {
    try {
      dlg._closeDialog();
      log('書き込みが完了しました。デバイスが再起動します。');
    } catch {
      /* 閉じられなくても実害はない */
    }
  }, 900);
}

function attach(dlg) {
  if (dlg.__hbAttached) return;
  dlg.__hbAttached = true;
  // Lit は状態変化のたびに再描画する。描画のたびに見て、条件が揃ったら進める。
  const tick = () => {
    try {
      autoConfirm(dlg);
      autoClose(dlg);
    } catch {
      /* 自動化の失敗で書き込み自体を壊さない */
    }
  };
  const orig = dlg.updated?.bind(dlg);
  dlg.updated = (changed) => {
    orig?.(changed);
    tick();
  };
  tick();
}

// ダイアログはボタンを押したときに body へ差し込まれる。
new MutationObserver((records) => {
  for (const rec of records) {
    for (const node of rec.addedNodes) {
      if (node.nodeType !== 1) continue;
      if (node.localName === 'ewt-install-dialog') attach(node);
    }
  }
}).observe(document.body, { childList: true, subtree: true });
