import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraft, newPage } from '../cms/extensions/src/shared/editor-model.js';
const base = process.env.DIRECTUS_URL;

test('editor documents, composing, saving and exports all require authentication', { skip: !base }, async () => {
  for (const [path, method] of [['document/1', 'GET'], ['document/1', 'PATCH'], ['document', 'POST'], ['compose/1/mobile', 'POST'], ['export/1/mobile', 'POST']]) {
    const response = await fetch(`${base}/revista-studio/${path}`, { method });
    assert.equal(response.status, 401); await response.arrayBuffer();
  }
});

test('editor saves whole editions atomically, protects revisions and previews unsaved changes privately', { skip: process.env.RUN_CMS_WRITE_TESTS !== '1' || !base, timeout: 180000 }, async () => {
  const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) });
  assert.equal(login.status, 200); const { data: { access_token } } = await login.json();
  const headers = { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' };
  async function request(path, body, method = 'GET') { return fetch(base + path, { method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) }); }
  async function api(path, body, method = 'GET') { const response = await request(path, body, method); const text = await response.text(); assert.ok(response.ok, `${method} ${path}: ${response.status} ${text.slice(0, 300)}`); return response.status === 204 ? undefined : JSON.parse(text).data; }
  let id;
  try {
    const sources = await api('/items/ediciones?fields=id,fecha,foto,paginas.id&limit=1000');
    const used = new Set(sources.map(item => item.fecha.slice(0, 10)));
    const date = Array.from({ length: 28 }, (_, i) => `1900-03-${String(i + 1).padStart(2, '0')}`).find(date => !used.has(date));
    assert.ok(date);
    let record = await api('/revista-studio/document', { titulo: 'Edición de prueba del Studio', fecha: date }, 'POST');
    id = record.edition.id; assert.equal(record.edition.estado, 'draft'); assert.equal(record.edition.paginas.length, 4);
    let draft = createDraft(record.edition);
    const before = JSON.stringify(record.edition);
    const unsaved = structuredClone(draft); unsaved.titulo = 'Un título todavía sin guardar'; unsaved.color_titulos = '#E0B54D';
    let response = await request(`/revista-studio/compose/${id}/mobile`, { edition: unsaved, page: 'portada' }, 'POST');
    assert.equal(response.status, 200); const preview = await response.text(); assert.ok(preview.includes('Un título todavía sin guardar')); assert.ok(preview.includes('"editing":true'));
    assert.equal(JSON.stringify((await api(`/revista-studio/document/${id}`)).edition), before);
    assert.equal((await (await fetch(`${base}/items/ediciones?filter[id][_eq]=${id}`)).json()).data.length, 0);
    response = await request(`/revista-studio/export/${id}/mobile`, { edition: unsaved, page: 'portada' }, 'POST');
    assert.equal(response.status, 200); const png = Buffer.from(await response.arrayBuffer()); assert.equal(png.readUInt32BE(16), 780); assert.equal(png.readUInt32BE(20), 1688);
    assert.equal(JSON.stringify((await api(`/revista-studio/document/${id}`)).edition), before);
    // Bind nested page IDs to this edition before reaching the Directus mutation.
    const foreign = sources.find(item => item.paginas?.length)?.paginas[0].id;
    assert.ok(foreign); const malicious = structuredClone(draft); malicious.paginas[1].id = foreign;
    response = await request(`/revista-studio/document/${id}`, { edition: malicious, revision: record.revision }, 'PATCH'); assert.equal(response.status, 422); await response.arrayBuffer();
    assert.equal(JSON.stringify((await api(`/revista-studio/document/${id}`)).edition), before);
    // A nested invalid reference must roll back a changed parent title as well.
    const invalid = structuredClone(draft); invalid.titulo = 'Must not persist'; invalid.paginas[1].foto = '00000000-0000-4000-8000-000000000000';
    response = await request(`/revista-studio/document/${id}`, { edition: invalid, revision: record.revision }, 'PATCH'); assert.ok(response.status >= 400); await response.arrayBuffer();
    assert.equal(JSON.stringify((await api(`/revista-studio/document/${id}`)).edition), before);
    draft.titulo = 'Una edición guardada'; draft.paginas[1].contenido = 'El primer párrafo guardado.\n\nY el segundo, con acentos: México.';
    const extra = newPage('facts', draft.paginas); extra.cifras = [{ value: '12', label: 'historias que importan' }]; draft.paginas.push(extra);
    record = await api(`/revista-studio/document/${id}`, { edition: draft, revision: record.revision }, 'PATCH');
    assert.equal(record.edition.titulo, draft.titulo); assert.equal(record.edition.paginas.length, 5); assert.equal(record.edition.paginas[1].contenido, draft.paginas[1].contenido);
    assert.notEqual(record.revision.length, 0);
    const left = createDraft(record.edition); const right = createDraft(record.edition); left.subtitulo = 'Cambio A'; right.subtitulo = 'Cambio B';
    const results = await Promise.all([request(`/revista-studio/document/${id}`, { edition: left, revision: record.revision }, 'PATCH'), request(`/revista-studio/document/${id}`, { edition: right, revision: record.revision }, 'PATCH')]);
    assert.deepEqual(results.map(result => result.status).sort(), [200, 409]); await Promise.all(results.map(response => response.arrayBuffer()));
    record = await api(`/revista-studio/document/${id}`); draft = createDraft(record.edition);
    draft.estado = 'published'; draft.foto = sources.find(item => item.foto).foto; draft.paginas.forEach(page => { page.estado = 'published'; });
    record = await api(`/revista-studio/document/${id}`, { edition: draft, revision: record.revision }, 'PATCH'); assert.equal(record.edition.estado, 'published');
    assert.equal((await (await fetch(`${base}/items/ediciones?filter[id][_eq]=${id}`)).json()).data.length, process.env.SITE_UNDER_CONSTRUCTION === 'true' ? 0 : 1);
    // Withdrawal preserves the page and its text; it never deletes content.
    draft = createDraft(record.edition); const archivedId = draft.paginas[4].id; draft.paginas[4].estado = 'archived';
    record = await api(`/revista-studio/document/${id}`, { edition: draft, revision: record.revision }, 'PATCH');
    assert.equal(record.edition.paginas.length, 5); assert.equal(record.edition.paginas.find(page => page.id === archivedId).estado, 'archived');
  } finally {
    if (id) { const pages = await api(`/items/paginas?filter[edicion][_eq]=${id}&fields=id`); for (const page of pages) await api(`/items/paginas/${page.id}`, undefined, 'DELETE'); await api(`/items/ediciones/${id}`, undefined, 'DELETE'); }
  }
});
