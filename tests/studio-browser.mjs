import { firefox } from 'playwright';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const base = process.env.PUBLIC_URL;
if (!base || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new Error('Load the private CMS environment.');
for (let attempt = 0; attempt < 30; attempt++) {
  if ((await fetch(`${base}/server/health`).catch(() => ({ status: 0 }))).status === 200) break;
  if (attempt === 29) throw new Error('Directus is not ready.');
  await new Promise(resolve => setTimeout(resolve, 1000));
}
const browser = await firefox.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/admin/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[type=email]').fill(process.env.ADMIN_EMAIL);
  await page.locator('input[type=password]').fill(process.env.ADMIN_PASSWORD);
  await page.locator('button[type=submit]').click();
  await page.waitForURL(url => !url.pathname.includes('/login'), { waitUntil: 'domcontentloaded' });
  // Dismiss the optional project-owner reminder without accepting any terms.
  const later = page.getByRole('button', { name: 'Remind Later', exact: true });
  await later.waitFor({ timeout: 10000 }).then(() => later.click()).catch(() => {});
  await page.goto(`${base}/admin/revista-studio`, { waitUntil: 'domcontentloaded' });
  await page.locator('.publication-studio iframe').waitFor();
  async function ready() {
    await page.waitForFunction(() => {
      const frame = document.querySelector('.publication-studio iframe');
      return frame?.contentWindow?.__STUDIO_READY__ || frame?.contentWindow?.__STUDIO_ERROR__;
    });
    assert.equal(await page.locator('iframe').evaluate(frame => frame.contentWindow.__STUDIO_ERROR__), undefined);
    await page.waitForFunction(() => !document.querySelector('.studio-loading'));
  }
  async function refresh(action) {
    const oldFrame = await page.locator('.publication-studio iframe').elementHandle();
    await action();
    await page.waitForFunction(previous => {
      const current = document.querySelector('.publication-studio iframe');
      return current && current !== previous;
    }, oldFrame);
    await oldFrame.dispose();
    await ready();
  }
  await ready();
  const selector = page.locator('.studio-toolbar select');
  assert.ok((await selector.locator('option').count()) >= 3);
  assert.ok(await page.getByRole('link', { name: 'Editar edición' }).isVisible());
  await page.screenshot({ path: '/tmp/revista-studio-final.png', fullPage: true });
  for (const [format, width, height] of [['Instagram', 1080, 1350], ['Desktop', 1440, 1000], ['Mobile', 780, 1688]]) {
    if (format !== 'Instagram') {
      await refresh(() => page.getByRole('button', { name: new RegExp(`^${format}`) }).click());
      if (await page.locator('.page-select select').inputValue() !== 'portada') await refresh(() => page.locator('.page-select select').selectOption('portada'));
      assert.equal(await page.frameLocator('iframe').locator('.journal-page').count(), 6);
      await page.frameLocator('iframe').getByRole('button', { name: 'Página siguiente', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('iframe').contentDocument.querySelector('.journal-page[data-current=true]')?.id === 'historia');
      await refresh(() => page.locator('.page-select select').selectOption('historia'));
      assert.equal(await page.frameLocator('iframe').locator('.journal-page[data-current=true]').getAttribute('id'), 'historia');
    }
    const downloaded = page.waitForEvent('download');
    await page.locator('.generate-button').click();
    const download = await downloaded;
    assert.equal(await download.failure(), null);
    const png = await readFile(await download.path());
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), width); assert.equal(png.readUInt32BE(20), height);
    console.log(`PASS: native ${format} preview and authenticated ${width}×${height} PNG download.`);
  }
  await refresh(() => page.getByRole('button', { name: /^Instagram/ }).click());
  for (const [label, title] of [['2026-11-13 · Leon Russell', 'Leon Russell'], ['2026-11-12 · Abbey Road Studios', 'Abbey Road Studios']]) {
    await refresh(() => selector.selectOption({ label }));
    assert.equal(await page.frameLocator('iframe').locator('.p-title').innerText(), title);
    const overflow = await page.locator('iframe').evaluate(frame => [...frame.contentDocument.querySelectorAll('[data-fit]')].filter(block => {
      const box = block.getBoundingClientRect();
      return box.right > 1081 || box.left < -1;
    }).map(block => block.className));
    assert.deepEqual(overflow, [], title);
  }
  assert.deepEqual(errors, []);
  console.log('PASS: edition switching, interactive page turning, page selection and no browser errors.');
} finally { await browser.close(); }
