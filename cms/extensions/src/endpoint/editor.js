import { createHash } from 'node:crypto';
import { sanitizeEdition, EditorValidationError, blankEdition } from '../shared/editor-model.js';
import { makeDocument, formats } from './document.js';

const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
export const editionRevision = edition => createHash('sha256').update(JSON.stringify(canonical(edition))).digest('hex');

export function installEditor(router, context, baseUrl, renderPng) {
  const { services: { ItemsService }, getSchema, database } = context;
  async function readEdition(id, options) {
    return new ItemsService('ediciones', options).readOne(id, { fields: ['*', 'paginas.*'], deep: { paginas: { _sort: ['orden', 'id'] } } });
  }
  function idFor(request) {
    if (!/^\d+$/.test(request.params.id)) throw new EditorValidationError('Selecciona una edición válida.', 400);
    const id = Number(request.params.id);
    if (!Number.isSafeInteger(id) || id < 1) throw new EditorValidationError('Selecciona una edición válida.', 400);
    return id;
  }
  async function optionsFor(request, knex) { return { schema: await getSchema(), accountability: request.accountability, ...(knex ? { knex } : {}) }; }
  const snapshot = async (id, options) => {
    const edition = await readEdition(id, options);
    const appearance = await new ItemsService('apariencia', options).readSingleton({ fields: ['*'] });
    return { edition, appearance, revision: editionRevision(edition) };
  };
  router.get('/document/:id', async (request, response, next) => {
    try { response.json({ data: await snapshot(idFor(request), await optionsFor(request)) }); } catch (error) { next(error); }
  });
  router.post('/document', async (request, response, next) => {
    try {
      const { titulo, fecha } = request.body || {};
      if (typeof titulo !== 'string' || !titulo.trim() || typeof fecha !== 'string') throw new EditorValidationError('Escribe un título y elige la fecha de la nueva edición.');
      const payload = sanitizeEdition(blankEdition(titulo.trim(), fecha), null, { strict: true });
      const options = await optionsFor(request);
      const id = await new ItemsService('ediciones', options).createOne(payload);
      response.status(201).json({ data: await snapshot(id, options) });
    } catch (error) { next(error); }
  });
  router.patch('/document/:id', async (request, response, next) => {
    try {
      const id = idFor(request);
      if (typeof request.body?.revision !== 'string') throw new EditorValidationError('Vuelve a cargar la edición antes de guardar.', 428);
      const options = await optionsFor(request);
      await database.transaction(async trx => {
        // Serialize competing saves; all actual reads/writes below use Directus ACLs.
        await trx('ediciones').where({ id }).forUpdate().first('id');
        await trx('paginas').where({ edicion: id }).forUpdate().select('id');
        const scoped = { ...options, knex: trx };
        const current = await readEdition(id, scoped);
        if (request.body.revision !== editionRevision(current)) throw new EditorValidationError('Esta edición cambió en otra pestaña. Tus textos siguen aquí. Recarga la edición antes de guardar de nuevo.', 409);
        const payload = sanitizeEdition(request.body.edition, current, { strict: true });
        // Explicit O2M updates preserve omitted/archived pages. Nothing is deleted.
        const pages = payload.paginas; delete payload.paginas;
        payload.paginas = { update: pages.filter(page => page.id), create: pages.filter(page => !page.id) };
        await new ItemsService('ediciones', scoped).updateOne(id, payload);
      });
      response.json({ data: await snapshot(id, options) });
    } catch (error) { next(error); }
  });
  async function compose(request, editing) {
    const id = idFor(request);
    if (!Object.hasOwn(formats, request.params.format)) throw new EditorValidationError('Selecciona un formato válido.', 400);
    const { edition, appearance } = await snapshot(id, await optionsFor(request));
    const draft = sanitizeEdition(request.body?.edition || edition, edition);
    const page = String(request.body?.page || '');
    return { draft, page, html: makeDocument(draft, appearance, baseUrl, request.params.format, page, { editing }) };
  }
  router.post('/compose/:id/:format', async (request, response, next) => {
    try { response.type('html').send((await compose(request, true)).html); } catch (error) { next(error); }
  });
  router.post('/export/:id/:format', async (request, response, next) => {
    try {
      const { draft, page, html } = await compose(request, false);
      await renderPng(response, html, request.params.format, draft.fecha, page);
    } catch (error) { next(error); }
  });
}
