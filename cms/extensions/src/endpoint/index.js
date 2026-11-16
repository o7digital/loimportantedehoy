import { readFile } from 'node:fs/promises';
import { installEditor } from './editor.js';
import { EditorValidationError } from '../shared/editor-model.js';
import { makeDocument, formats, StudioValidationError } from './document.js';

export default (router, context) => {
  const { services, getSchema, env } = context;
  const { ItemsService } = services;
  const baseUrl = String(env.PUBLIC_URL).replace(/\/$/, '');
  const assets = new Map([['reader.js', 'text/javascript'], ['poster.js', 'text/javascript'], ['reader.css', 'text/css'], ['poster.css', 'text/css']]);
  router.get('/assets/:name', async (request, response, next) => {
    try {
      const mime = assets.get(request.params.name);
      if (!mime) { response.sendStatus(404); return; }
      const file = await readFile(new URL(`./assets/${request.params.name}`, import.meta.url));
      response.set({ 'Content-Type': mime, 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*', 'Cross-Origin-Resource-Policy': 'cross-origin' }).send(file);
    } catch (error) { next(error); }
  });
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store');
    if (!request.accountability?.user) { response.status(401).json({ errors: [{ message: 'Inicia sesión en Directus para usar el studio.' }] }); return; }
    next();
  });
  async function snapshot(request) {
    if (!/^\d+$/.test(request.params.id) || !formats[request.params.format]) {
      const error = new Error('Edición o formato inválido.'); error.status = 400; throw error;
    }
    const options = { schema: await getSchema(), accountability: request.accountability };
    // ItemsService applies the signed-in user's collection and field permissions,
    // including nested pages. Drafts are never read with elevated accountability.
    const [edition, appearance] = await Promise.all([
      new ItemsService('ediciones', options).readOne(request.params.id, { fields: ['*', 'paginas.*'], deep: { paginas: { _sort: ['orden'] } } }),
      new ItemsService('apariencia', options).readSingleton({ fields: ['*'] }),
    ]);
    const page = String(request.method === 'GET' ? request.query.chapter || '' : request.body?.page || '');
    return { html: makeDocument(edition, appearance, baseUrl, request.params.format, page), edition, page };
  }
  router.get('/preview/:id/:format', async (request, response, next) => {
    try { const { html } = await snapshot(request); response.type('html').send(html); }
    catch (error) { next(error); }
  });
  async function renderPng(response, html, format, date, page) {
    const render = await fetch(`${env.STUDIO_RENDER_URL}/render`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-studio-render-key': env.STUDIO_RENDER_KEY }, body: JSON.stringify({ html, format }), signal: AbortSignal.timeout(40000) });
    if (!render.ok) {
      const payload = await render.json().catch(() => ({}));
      response.status(render.status).json({ errors: [{ message: payload.error || 'El generador no está disponible. Inténtalo de nuevo.' }] }); return;
    }
    const filename = `${date.slice(0, 10)}-${format}${page ? `-${page.replace(/[^a-z0-9-]/gi, '')}` : ''}.png`;
    response.set({ 'Content-Type': 'image/png', 'Content-Disposition': `attachment; filename="${filename}"` }).send(Buffer.from(await render.arrayBuffer()));
  }
  router.post('/generate/:id/:format', async (request, response, next) => {
    try { const { html, edition, page } = await snapshot(request); await renderPng(response, html, request.params.format, edition.fecha, page); }
    catch (error) { next(error); }
  });
  installEditor(router, context, baseUrl, renderPng);
  router.use((error, request, response, next) => {
    if (error instanceof StudioValidationError || error instanceof EditorValidationError) response.status(error.status || 422).json({ errors: [{ message: error.message }] });
    else next(error);
  });
};
