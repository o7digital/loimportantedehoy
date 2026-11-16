import test from 'node:test';
import assert from 'node:assert/strict';
import { makeDocument } from '../cms/extensions/src/endpoint/document.js';
const base = process.env.DIRECTUS_URL;
const edition = { id: 1, slug: 'test', fecha: '2026-11-15', estado: 'draft', titulo: 'Prueba', subtitulo: 'Texto', categoria: 'Historia', paginas: [{ slug: 'portada', estado: 'draft', orden: 0, titulo: 'Prueba', etiqueta: 'Portada' }] };

test('studio previews include drafts only when explicitly requested; scripts and CSS remain inert', () => {
  const raw = { ...edition, titulo: '</script><script>alert(1)</script>', color_fondo: 'red; background:url(https://evil.test)' };
  const html = makeDocument(raw, {}, 'https://cms.test', 'desktop');
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('\\u003c/script>'));
  assert.ok(!html.includes('https://evil.test'));
  assert.ok(html.includes('"id":"portada"'));
  assert.ok(!makeDocument(raw, {}, 'https://cms.test', 'instagram').includes('<script>alert(1)</script>'));
  assert.throws(() => makeDocument({ ...edition, paginas: [] }, {}, 'https://cms.test', 'mobile'), /Añade al menos/);
  assert.throws(() => makeDocument(edition, {}, 'https://cms.test', 'mobile', 'missing'), /ya no existe/);
});

test('anonymous visitors cannot preview or generate unpublished editions', { skip: !base }, async () => {
  for (const [path, method] of [['/preview/1/instagram', 'GET'], ['/generate/1/instagram', 'POST']]) {
    const response = await fetch(`${base}/revista-studio${path}`, { method });
    assert.equal(response.status, 401);
    await response.arrayBuffer();
  }
  const assets = await fetch(`${base}/revista-studio/assets/reader.js`);
  assert.equal(assets.status, 200);
  const js = await assets.text();
  assert.ok(!js.includes('ADMIN_PASSWORD'));
  assert.equal((await fetch(`${base}/revista-studio/assets/private.env`)).status, 404);
});

test('saved drafts and color changes produce private previews and real PNGs in three formats', { skip: process.env.RUN_CMS_WRITE_TESTS !== '1' || !base, timeout: 180000 }, async () => {
  const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) });
  assert.equal(login.status, 200);
  const { data: { access_token: token } } = await login.json();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  async function api(path, body, method = 'GET') {
    const response = await fetch(base + path, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
    assert.ok(response.ok, `${method} ${path}: ${response.status}`);
    return response.status === 204 ? undefined : (await response.json()).data;
  }
  let id;
  const { normalizeEdition } = await import('../src/lib/edition-model.ts');
  assert.equal(normalizeEdition(edition, base).chapters.length, 0);
  assert.equal(normalizeEdition(edition, base, undefined, true).chapters.length, 1);
  try {
    const [source] = await api('/items/ediciones?sort=-fecha&limit=1&fields=foto,imagen_recortada,portada');
    const record = await api('/items/ediciones', { ...source, estado: 'draft', fecha: '1900-02-17', slug: `studio-qa-${Date.now()}`, titulo: 'Studio privado', subtitulo: 'Prueba de composición', aniversario: 'Una edición para verificar', categoria: 'Verificación', color_fondo: '#101E30' }, 'POST');
    id = record.id;
    await api('/items/paginas', { edicion: id, estado: 'draft', orden: 0, slug: 'portada', etiqueta: 'Portada', tipo: 'story', titulo: 'Studio privado' }, 'POST');
    let response = await fetch(`${base}/revista-studio/preview/${id}/instagram`, { headers });
    assert.equal(response.status, 200);
    const before = await response.text();
    const chapterPreview = await fetch(`${base}/revista-studio/preview/${id}/mobile?chapter=portada`, { headers });
    assert.equal(chapterPreview.status, 200);
    assert.ok((await chapterPreview.text()).includes('\"page\":\"portada\"'));
    assert.ok(before.includes('Studio privado'));
    assert.ok(before.includes('--j-paper:#101E30'));
    await api(`/items/ediciones/${id}`, { instagram_titulo: 'Cambio guardado', color_titulos: '#D8AF62' }, 'PATCH');
    response = await fetch(`${base}/revista-studio/preview/${id}/instagram`, { headers });
    const after = await response.text();
    assert.ok(after.includes('Cambio guardado'));
    assert.ok(after.includes('--j-gold:#D8AF62'));
    assert.notEqual(before, after);
    assert.equal((await (await fetch(`${base}/items/ediciones?filter[id][_eq]=${id}`)).json()).data.length, 0);
    for (const [format, width, height] of [['instagram', 1080, 1350], ['desktop', 1440, 1000], ['mobile', 780, 1688]]) {
      response = await fetch(`${base}/revista-studio/generate/${id}/${format}`, { method: 'POST', headers, body: '{}' });
      assert.equal(response.status, 200, `${format}: ${response.status}`);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      const png = Buffer.from(await response.arrayBuffer());
      assert.equal(png.subarray(1, 4).toString(), 'PNG');
      assert.equal(png.readUInt32BE(16), width); assert.equal(png.readUInt32BE(20), height);
    }
    // A longer poster must report what to shorten, never silently clip content.
    await api(`/items/ediciones/${id}`, { instagram_biografia: 'Un texto demasiado largo. '.repeat(200) }, 'PATCH');
    response = await fetch(`${base}/revista-studio/generate/${id}/instagram`, { method: 'POST', headers, body: '{}' });
    assert.equal(response.status, 422);
    assert.match((await response.json()).errors[0].message, /Acorta estos textos/);
  } finally {
    if (id) {
      const pages = await api(`/items/paginas?filter[edicion][_eq]=${id}&fields=id`);
      for (const page of pages) await api(`/items/paginas/${page.id}`, undefined, 'DELETE');
      await api(`/items/ediciones/${id}`, undefined, 'DELETE');
    }
  }
});
