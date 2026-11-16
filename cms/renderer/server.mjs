import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { firefox } from 'playwright';

const key = process.env.STUDIO_RENDER_KEY;
if (!key || key.length < 32) throw new Error('STUDIO_RENDER_KEY must be configured');
const origin = new URL(process.env.PUBLIC_URL).origin;
const sizes = { desktop: { width: 1440, height: 1000 }, mobile: { width: 390, height: 844 }, instagram: { width: 1080, height: 1350 } };
let browser;
let busy = false;
const json = (response, status, message) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ error: message })); };
const server = http.createServer(async (request, response) => {
  if (request.url === '/health' && request.method === 'GET') { response.end('ok'); return; }
  if (request.url !== '/render' || request.method !== 'POST') { json(response, 404, 'Not found'); return; }
  const supplied = Buffer.from(String(request.headers['x-studio-render-key'] || ''));
  const expected = Buffer.from(key);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) { json(response, 401, 'Unauthorized'); return; }
  if (busy) { json(response, 429, 'Otro archivo se está generando. Inténtalo de nuevo en unos segundos.'); return; }
  busy = true;
  let context;
  try {
    const chunks = [];
    let length = 0;
    for await (const part of request) {
      length += part.length;
      if (length > 1000000) throw new Error('La edición supera el tamaño permitido.');
      chunks.push(part);
    }
    const { format, html } = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!sizes[format] || typeof html !== 'string') { json(response, 400, 'Formato inválido'); return; }
    if (!browser?.isConnected()) browser = await firefox.launch({ headless: true });
    context = await browser.newContext({ viewport: sizes[format], deviceScaleFactor: format === 'mobile' ? 2 : 1, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if ((url.origin === origin && (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/revista-studio/assets/'))) || url.protocol === 'data:') await route.continue();
      else await route.abort();
    });
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForFunction(() => window.__STUDIO_READY__ || window.__STUDIO_ERROR__, null, { timeout: 25000 });
    const error = await page.evaluate(() => window.__STUDIO_ERROR__);
    if (error) { json(response, 422, error); return; }
    const png = await page.screenshot({ type: 'png', animations: 'disabled' });
    response.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store', 'Content-Length': png.length });
    response.end(png);
  } catch (error) {
    // Never log HTML, editorial drafts, request headers or credentials.
    console.error('Render failed:', error.name);
    json(response, 503, 'No se pudo generar la imagen. Actualiza la vista previa e inténtalo de nuevo.');
  } finally {
    await context?.close();
    busy = false;
  }
});
server.requestTimeout = 45000;
server.listen(Number(process.env.PORT || 3000), '0.0.0.0');
process.on('SIGTERM', async () => { server.close(); await browser?.close(); process.exit(0); });
