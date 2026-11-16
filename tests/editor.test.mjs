import test from 'node:test';
import assert from 'node:assert/strict';
import { blankEdition, createDraft, sanitizeEdition, newPage } from '../cms/extensions/src/shared/editor-model.js';
import { editionRevision } from '../cms/extensions/src/endpoint/editor.js';

test('new editions start as private, ordered four-page magazines', () => {
  const draft = blankEdition('La música y México', '2026-11-16');
  const payload = sanitizeEdition(draft, null, { strict: true });
  assert.equal(payload.estado, 'draft'); assert.equal(payload.paginas.length, 4);
  assert.equal(payload.paginas[0].slug, 'portada');
  assert.equal(new Set(payload.paginas.map(page => page.slug)).size, 4);
  assert.ok(payload.paginas.every(page => !page.id && page.estado === 'draft'));
  assert.equal(payload.slug, 'la-musica-y-mexico-2026-11-16');
});
test('editing preserves content and refuses cross-edition page IDs and unsafe styling', () => {
  const current = blankEdition('Una historia', '2026-11-15');
  current.id = 42; current.paginas.forEach((page, i) => { page.id = i + 200; });
  const draft = createDraft(current); draft.paginas[1].contenido = 'Primer párrafo.\n\nSegundo párrafo con acentos: México.';
  draft.paginas[1].entradas = [{ label: '2009', text: 'Una historia que empieza.' }];
  const payload = sanitizeEdition(draft, current, { strict: true });
  assert.equal(payload.paginas[1].contenido, draft.paginas[1].contenido);
  assert.deepEqual(payload.paginas[1].entradas, draft.paginas[1].entradas);
  draft.paginas[1].id = 9999;
  assert.throws(() => sanitizeEdition(draft, current), /no pertenece/);
  draft.paginas[1].id = 201; draft.color_fondo = 'url(https://example.test)';
  assert.throws(() => sanitizeEdition(draft, current), /hexadecimales/);
});
test('publishing requires a cover image, published pages and valid dates', () => {
  const draft = blankEdition('Por publicar', '2026-11-16'); draft.estado = 'published';
  assert.throws(() => sanitizeEdition(draft, null, { strict: true }), /imagen de portada/);
  draft.foto = '00000000-0000-4000-8000-000000000001';
  assert.throws(() => sanitizeEdition(draft, null, { strict: true }), /Publica las páginas/);
  draft.paginas.forEach(page => { page.estado = 'published'; });
  assert.equal(sanitizeEdition(draft, null, { strict: true }).estado, 'published');
  draft.fecha = '2026-02-30'; assert.throws(() => sanitizeEdition(draft), /fecha válida/);
});
test('new pages have unique anchors and save revisions ignore property insertion order', () => {
  const first = newPage('story'); const second = newPage('story', [first]);
  assert.notEqual(first.slug, second.slug);
  assert.equal(editionRevision({ id: 1, title: 'A' }), editionRevision({ title: 'A', id: 1 }));
  assert.notEqual(editionRevision({ id: 1, title: 'A' }), editionRevision({ id: 1, title: 'B' }));
});
