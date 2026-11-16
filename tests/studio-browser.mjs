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
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  const errors = []; page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
  await page.goto(`${base}/admin/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[type=email]').fill(process.env.ADMIN_EMAIL);
  await page.locator('input[type=password]').fill(process.env.ADMIN_PASSWORD);
  await page.locator('button[type=submit]').click();
  await page.waitForURL(url => !url.pathname.includes('/login'), { waitUntil: 'domcontentloaded' });
  const later = page.getByRole('button', { name: 'Remind Later', exact: true });
  await later.waitFor({ timeout: 10000 }).then(() => later.click()).catch(() => {});
  await page.goto(`${base}/admin/revista-studio?edition=1`, { waitUntil: 'domcontentloaded' });
  await page.locator('.ed-artboard iframe').waitFor();
  async function ready() {
    await page.waitForFunction(() => {
      const frame = document.querySelector('.ed-artboard iframe');
      return frame?.contentWindow?.__STUDIO_READY__ || frame?.contentWindow?.__STUDIO_ERROR__;
    });
    assert.equal(await page.locator('.ed-artboard iframe').evaluate(frame => frame.contentWindow.__STUDIO_ERROR__), undefined);
    await page.waitForFunction(() => !document.querySelector('.ed-canvas.composing'));
  }
  async function refresh(action) {
    const previous = await page.locator('.ed-artboard iframe').elementHandle();
    await action();
    await page.waitForFunction(previous => { const current = document.querySelector('.ed-artboard iframe'); return current && current !== previous; }, previous);
    await previous.dispose(); await ready();
  }
  const preview = () => page.frameLocator('.ed-artboard iframe');
  await ready();
  assert.equal(await page.locator('.ed-form').getByLabel('Personaje o tema', { exact: true }).inputValue(), 'Frida');
  const mediaFits = await page.locator('.ed-media-picture').first().evaluate(button => { const image = button.querySelector('img'); return !image || image.getBoundingClientRect().height <= button.getBoundingClientRect().height + 1; });
  assert.ok(mediaFits, 'The full photograph fits inside its editor card.');
  await page.screenshot({ path: '/tmp/revista-editor-desktop.png', animations: 'disabled' });
  if (process.env.STUDIO_LAYOUT_ONLY !== '1') {
    await refresh(() => page.locator('.ed-form').getByLabel('Personaje o tema', { exact: true }).fill('Frida test'));
    assert.ok((await preview().locator('.journal-cover-copy h1').innerText()).includes('Frida test'));
    await preview().locator('.journal-cover-copy h1').click();
    await page.waitForFunction(() => document.activeElement?.dataset.editorField === 'titulo');
    const live = await (await fetch(`${base}/items/ediciones/1?fields=titulo`)).json(); assert.equal(live.data.titulo, 'Frida');
    await refresh(() => page.locator('.ed-page-nav').getByRole('button').filter({ hasText: 'Su historia' }).click());
    await refresh(() => page.locator('.ed-form').getByLabel('El texto de tu historia', { exact: true }).fill('Un párrafo de prueba todavía sin guardar.'));
    assert.ok((await preview().locator('.journal-page[data-current=true]').innerText()).includes('Un párrafo de prueba todavía sin guardar.'));
    await preview().locator('.journal-page[data-current=true] h2').click();
    await page.waitForFunction(() => document.activeElement?.dataset.editorField === 'titulo');
    await page.getByRole('button', { name: 'Colores y tipografía', exact: true }).click();
    await refresh(() => page.getByRole('textbox', { name: 'Código de Fondo', exact: true }).fill('#112244'));
    assert.equal(await preview().locator('.journal').evaluate(node => node.style.getPropertyValue('--j-paper')), '#112244');
    await page.getByRole('button', { name: 'Portada y edición', exact: true }).click();
    await ready();
    const photo = page.locator('.ed-media').filter({ has: page.locator('.ed-media-label', { hasText: 'Fotografía de la edición' }) });
    await photo.getByRole('button', { name: /Cambiar imagen/ }).click();
    await page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'La imagen también cuenta.' }) }).locator('.ed-media-grid button').first().waitFor();
    await page.getByRole('button', { name: 'Cerrar biblioteca' }).click();
    console.log('PASS: unsaved text edits, canvas selection, page editing, colors and image library. Published content retained.');
    for (const [format, width, height] of [['Desktop', 1440, 1000], ['Mobile', 780, 1688], ['Instagram', 1080, 1350]]) {
      const button = page.getByRole('button', { name: format, exact: true });
      if (await button.getAttribute('aria-pressed') !== 'true') await refresh(() => button.click());
      else await ready();
      const downloaded = page.waitForEvent('download');
      await page.locator('.ed-export-button').click(); const download = await downloaded;
      assert.equal(await download.failure(), null); const png = await readFile(await download.path());
      assert.equal(png.readUInt32BE(16), width); assert.equal(png.readUInt32BE(20), height);
      console.log(`PASS: unsaved ${format} export ${width}×${height}.`);
    }
    await page.locator('.ed-issue').filter({ hasText: 'Leon Russell' }).click();
    await page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Tu historia aún tiene cambios.' }) }).waitFor();
    await page.getByRole('button', { name: 'Seguir editando', exact: true }).click();
    assert.ok((await page.locator('.ed-edition-heading h1').innerText()).includes('Frida test'));
    await page.locator('.ed-issue').filter({ hasText: 'Leon Russell' }).click();
    await refresh(() => page.getByRole('button', { name: 'Descartar cambios', exact: true }).click());
    console.log('PASS: unsaved-change guard keeps the draft until an explicit discard.');
  }
  if (await page.getByRole('button', { name: 'Instagram', exact: true }).getAttribute('aria-pressed') !== 'true') await refresh(() => page.getByRole('button', { name: 'Instagram', exact: true }).click());
  for (const title of ['Leon Russell', 'Abbey Road Studios']) {
    const issue = page.locator('.ed-issue').filter({ hasText: title });
    if (!(await issue.getAttribute('class')).includes('selected')) await refresh(() => issue.click());
    assert.equal(await preview().locator('.p-title').innerText(), title);
    const overflow = await page.locator('.ed-artboard iframe').evaluate(frame => [...frame.contentDocument.querySelectorAll('[data-fit]')].filter(block => { const box = block.getBoundingClientRect(); return box.right > 1081 || box.left < -1; }).map(block => block.className));
    assert.deepEqual(overflow, [], title);
  }
  for (const [width, height] of [[1440, 1000], [1024, 768], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    if (width < 760) {
      await page.getByRole('button', { name: 'Vista previa', exact: true }).click();
      await page.getByRole('button', { name: 'Editar contenido', exact: true }).click();
      await page.getByRole('button', { name: 'Abrir navegación', exact: true }).click();
      await page.waitForFunction(() => Math.abs(document.querySelector('.ed-sidebar').getBoundingClientRect().left) < 1);
      assert.ok(Math.abs(await page.locator('.ed-sidebar').evaluate(node => node.getBoundingClientRect().left)) < 1);
      await page.getByRole('button', { name: 'Cerrar navegación', exact: true }).click({ position: { x: width - 10, y: 100 } });
      await page.waitForFunction(() => document.querySelector('.ed-sidebar').getBoundingClientRect().right < 1);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: '/tmp/revista-editor-mobile.png' });
  assert.deepEqual(errors, []);
  console.log('PASS: long Instagram headlines, responsive editor at 320–1600px, mobile navigation and no browser errors.');
} finally { await browser.close(); }
