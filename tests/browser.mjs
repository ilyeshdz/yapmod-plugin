import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { chromium } from 'playwright';
import { build } from 'esbuild';

const response = await fetch(
  'https://github.com/yapmod/client/releases/download/v1.2.0/yapmod-client.js',
);
if (!response.ok) throw new Error(`Client bundle: HTTP ${response.status}`);
const client = await response.text();
const plugin = await readFile('dist/saved-replies/plugin.js', 'utf8');
const manifest = JSON.parse(await readFile('dist/saved-replies/plugin.json', 'utf8'));
const host = await build({
  stdin: {
    resolveDir: process.cwd(),
    loader: 'jsx',
    contents: `
    import React, { useState } from 'react';
    import { createRoot } from 'react-dom/client';
    function Composer({ id }) {
      const [text, setText] = useState('');
      globalThis['setDraft' + id] = setText;
      return <div className="composer-box" style={{width: '600px'}}>
        <textarea className="msg-input" aria-label={'Composer ' + id} value={text} onChange={e => setText(e.target.value)} />
        <div className="composer-tools"><button onClick={() => globalThis.sent++}>Send</button></div>
        <output id={'draft-' + id}>{text}</output>
      </div>;
    }
    globalThis.sent = 0;
    createRoot(document.getElementById('host')).render(<><Composer id="A"/><Composer id="B"/></>);
  `,
  },
  bundle: true,
  write: false,
  format: 'iife',
  define: { 'process.env.NODE_ENV': '"production"' },
});
const html = `<!doctype html><style>
body{font-family:sans-serif}.overlay{position:fixed;inset:0;background:#0005;display:grid;place-items:center}
.modal{background:white;padding:24px;width:600px;max-height:90vh;overflow:auto}.modal-x{float:right}
button,input,textarea{font:inherit}textarea{display:block}button{cursor:pointer}
</style><div id="host"></div><script src="/host.js"></script>`;
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/host.js' ? 'text/javascript' : 'text/html');
  res.end(req.url === '/host.js' ? host.outputFiles[0].text : html);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.evaluate(
    ({ plugin, manifest }) => {
      localStorage.setItem(
        'yapmod.plugins.v1',
        JSON.stringify({
          plugins: [
            { id: 'saved-test', local: true, on: true, update: false, js: plugin, manifest },
          ],
        }),
      );
    },
    { plugin, manifest },
  );
  const boot = () => page.addScriptTag({ content: client });
  await boot();
  const tool = () => page.getByRole('button', { name: 'Saved Replies', exact: true });
  await tool().nth(0).click();
  await page.getByRole('button', { name: 'New reply', exact: true }).click();
  await page.getByLabel('Title', { exact: true }).fill('Welcome');
  await page.getByLabel('Message', { exact: true }).fill('dear friend');
  await page.getByRole('button', { name: 'Save reply', exact: true }).click();
  await page.getByRole('button', { name: 'Insert Welcome', exact: true }).waitFor();
  await page.keyboard.press('Escape');

  const a = page.getByRole('textbox', { name: 'Composer A', exact: true });
  const b = page.getByRole('textbox', { name: 'Composer B', exact: true });
  await a.fill('Hello !');
  await a.evaluate((input) => input.setSelectionRange(6, 6));
  await b.fill('Other draft');
  await tool().nth(0).click();
  await page.getByRole('button', { name: 'Insert Welcome', exact: true }).press('Enter');
  await page.waitForFunction(
    () => document.querySelector('#draft-A').textContent === 'Hello dear friend!',
  );
  assert.equal(await b.inputValue(), 'Other draft');
  assert.equal(await a.evaluate((input) => document.activeElement === input), true);
  assert.equal(await page.evaluate(() => globalThis.sent), 0);

  // An edit made by the host after opening the picker must not be overwritten.
  await tool().nth(0).click();
  await page.evaluate(() => globalThis.setDraftA('Changed: '));
  await page.waitForFunction(() => document.querySelector('#draft-A').textContent === 'Changed: ');
  await page.getByRole('button', { name: 'Insert Welcome', exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector('#draft-A').textContent === 'Changed: dear friend',
  );

  // The host modal's close button participates in keyboard focus wrapping.
  await tool().nth(0).click();
  const dialog = page.getByRole('dialog', { name: 'Saved Replies', exact: true });
  await dialog.getByRole('button').last().focus();
  await page.keyboard.press('Tab');
  assert.equal(
    await dialog
      .getByRole('button', { name: 'Close', exact: true })
      .evaluate((el) => el === document.activeElement),
    true,
  );

  // The public client dispose/reinject cycle exercises cleanup with an open picker.
  await page.evaluate(() => globalThis.YapmodClient.dispose());
  assert.equal(await tool().count(), 0);
  assert.equal(await page.getByRole('dialog').count(), 0);
  await boot();
  await tool().nth(0).click();
  assert.equal(await tool().count(), 2);
  await page.getByRole('button', { name: 'Edit Welcome', exact: true }).click();
  await page.getByLabel('Message', { exact: true }).fill('Updated reply');
  await page.getByRole('button', { name: 'Save reply', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.reload();
  await boot();
  await tool().nth(1).click();
  await page.getByRole('button', { name: 'Insert Welcome', exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector('#draft-B').textContent === 'Updated reply',
  );

  // Reject over-limit insertion without truncating either the reply or draft.
  await b.evaluate((input) => {
    input.maxLength = 5;
  });
  await tool().nth(1).click();
  await page.getByRole('button', { name: 'Insert Welcome', exact: true }).click();
  await page.getByText(/exceed the message length limit/).waitFor();
  assert.equal(await b.inputValue(), 'Updated reply');
  await page.keyboard.press('Escape');
  await b.evaluate((input) => input.removeAttribute('maxlength'));

  // A conversation navigation while the picker is open cannot change the draft.
  await tool().nth(1).click();
  await page.evaluate(() => history.pushState(null, '', '/other-conversation'));
  await page.getByRole('button', { name: 'Insert Welcome', exact: true }).click();
  await page.getByText(/conversation or composer changed/).waitFor();
  assert.equal(await b.inputValue(), 'Updated reply');
  await page.keyboard.press('Escape');
  await page.evaluate(() => history.replaceState(null, '', '/'));

  // Simulate the client's swallowed quota error and verify the editor stays open.
  await tool().nth(1).click();
  await page.getByRole('button', { name: 'Edit Welcome', exact: true }).click();
  await page.getByLabel('Message', { exact: true }).fill('Unsaved reply');
  await page.evaluate(() => {
    globalThis.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'yapmod.plugins.data.v1') throw new DOMException('Full', 'QuotaExceededError');
      return globalThis.originalSetItem.call(this, key, value);
    };
  });
  await page.getByRole('button', { name: 'Save reply', exact: true }).click();
  await page.getByText(/Could not save replies/).waitFor();
  assert.equal(await page.getByLabel('Message', { exact: true }).inputValue(), 'Unsaved reply');
  await page.evaluate(() => {
    Storage.prototype.setItem = globalThis.originalSetItem;
  });
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();

  await page.getByRole('button', { name: 'Delete Welcome', exact: true }).click();
  await page.getByRole('button', { name: 'Delete reply', exact: true }).click();
  await page.reload();
  await boot();
  await tool().nth(0).click();
  await page.getByText(/No saved replies yet/).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    'Client 1.2.0 + React integration passed: CRUD, persistence, insertion, draft isolation, quota failure, cleanup, no sends.',
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
