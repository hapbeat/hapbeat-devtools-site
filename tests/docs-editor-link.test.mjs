import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../src/components/DevDocsEditor.astro', import.meta.url), 'utf8');
const handler = source.match(/content\.addEventListener\('click', ([\s\S]*?), \{ signal: controller.signal \}\);/)[1]
  .replaceAll(' as Element', '');
const click = vm.runInNewContext(`(${handler})`);
for (const shared of [true, false]) {
  let prevented = false;
  const link = { closest: selector => selector === '[data-hb-shared-doc]' && shared ? {} : null };
  click({ target: { closest: selector => selector === 'a' ? link : null }, preventDefault() { prevented = true; } });
  assert.equal(prevented, !shared, 'Shared read-only links must navigate; editable links must retain editing behavior');
}
console.log('Docs editor: read-only shared links navigate; editable links remain editable.');
