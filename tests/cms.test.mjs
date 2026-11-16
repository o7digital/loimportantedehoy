import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const cms = (process.env.DIRECTUS_URL || process.env.PUBLIC_URL || "").replace(/\/$/, "");
const website = process.env.BASE_URL || "http://127.0.0.1:4321";
const configured = Boolean(cms);
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());

test("public editions are published, dated, ordered and have real media", { skip: !configured }, async () => {
  const response = await fetch(`${cms}/items/ediciones?fields=id,estado,fecha,foto,paginas.id&sort=-fecha`);
  assert.equal(response.status, 200);
  const { data } = await response.json();
  assert.ok(data.length > 0);
  for (const edition of data) { assert.equal(edition.estado, "published"); assert.ok(edition.fecha <= today); assert.ok(edition.paginas.length > 1); assert.ok(edition.foto); }
  assert.deepEqual(data.map(item => item.fecha), data.map(item => item.fecha).sort().reverse());
  const image = await fetch(`${cms}/assets/${data[0].foto}`);
  assert.equal(image.status, 200);
  assert.ok((await image.arrayBuffer()).byteLength > 0);
});

test("anonymous visitors cannot read users or create editions", { skip: !configured }, async () => {
  assert.equal((await fetch(`${cms}/users`)).status, 403);
  const response = await fetch(`${cms}/items/ediciones`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titulo: "Anonymous write must fail" }) });
  assert.equal(response.status, 403);
});

test("the client palette is persisted in Directus and visitors cannot change it", { skip: !configured }, async () => {
  const response = await fetch(`${cms}/items/apariencia`);
  assert.equal(response.status, 200);
  const { data } = await response.json();
  assert.ok(data.id);
  for (const key of ["color_fondo", "color_titulos", "color_texto", "color_acento"]) assert.match(data[key], /^#[0-9a-f]{6}$/i);
  const write = await fetch(`${cms}/items/apariencia`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ color_fondo: "#FFFFFF" }) });
  assert.equal(write.status, 403);
});

test("drafts and future issues stay private; publishing and editing reach SSR without a rebuild", { skip: !configured || process.env.RUN_CMS_WRITE_TESTS !== "1" || !process.env.ADMIN_PASSWORD }, async () => {
  const response = await fetch(`${cms}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) });
  assert.equal(response.status, 200);
  const { data: { access_token: token } } = await response.json();
  async function write(path, body, method = "POST") {
    const result = await fetch(cms + path, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
    assert.ok(result.ok, `${method} ${path}: ${result.status}`);
    return result.status === 204 ? undefined : (await result.json()).data;
  }
  const slug = `verification-${randomUUID()}`;
  let item;
  try {
    let day = 1, date;
    for (; day < 29; day++) {
      date = `1900-01-${String(day).padStart(2, "0")}`;
      const { data } = await (await fetch(`${cms}/items/ediciones?filter[fecha][_eq]=${date}`)).json();
      if (!data.length) break;
    }
    assert.ok(day < 29);
    const { data: [media] } = await (await fetch(`${cms}/items/ediciones?fields=foto,portada&limit=1`)).json();
    item = await write("/items/ediciones", { slug, fecha: date, titulo: slug, estado: "draft", subtitulo: "Verificación editorial", categoria: "Verificación", foto: media.foto, portada: media.portada });
    const cover = await write("/items/paginas", { edicion: item.id, estado: "published", orden: 0, slug: "portada", etiqueta: "Portada", titulo: slug, antetitulo: "Verificación" });
    await write("/items/paginas", { edicion: item.id, estado: "published", orden: 1, slug: "historia", etiqueta: "Historia", titulo: "Prueba de publicación", contenido: "Texto de verificación.", antetitulo: "Prueba" });
    assert.deepEqual((await (await fetch(`${cms}/items/ediciones?filter[id][_eq]=${item.id}`)).json()).data, []);
    assert.deepEqual((await (await fetch(`${cms}/items/paginas?filter[id][_eq]=${cover.id}`)).json()).data, []);
    assert.equal((await fetch(`${website}/revista/${date}`)).status, 404);
    await write(`/items/ediciones/${item.id}`, { estado: "published" }, "PATCH");
    let rendered = await fetch(`${website}/revista/${date}`);
    assert.equal(rendered.status, 200);
    assert.ok((await rendered.text()).includes(slug));
    const editedTitle = `Edición verificada ${randomUUID()}`;
    await write(`/items/ediciones/${item.id}`, { titulo: editedTitle }, "PATCH");
    rendered = await fetch(`${website}/revista/${date}`);
    assert.ok((await rendered.text()).includes(editedTitle));
    await write(`/items/ediciones/${item.id}`, { color_fondo: "#112244", color_titulos: "#FFE099", fuente_texto: "moderna", tamano_texto: 21, titulos_dorados: false }, "PATCH");
    rendered = await fetch(`${website}/revista/${date}`);
    let html = await rendered.text();
    assert.ok(html.includes("--j-paper:#112244"));
    assert.ok(html.includes("--j-gold:#FFE099"));
    assert.ok(html.includes("--j-body-size:21px"));
    assert.ok(html.includes('data-gold-headings="false"'));
    await write(`/items/ediciones/${item.id}`, { color_fondo: null, color_titulos: null, fuente_texto: null, tamano_texto: null, titulos_dorados: null }, "PATCH");
    rendered = await fetch(`${website}/revista/${date}`);
    html = await rendered.text();
    const { data: appearance } = await (await fetch(`${cms}/items/apariencia`)).json();
    assert.ok(html.includes(`--j-paper:${appearance.color_fondo.toUpperCase()}`));
    await write(`/items/ediciones/${item.id}`, { fecha: "2099-12-31" }, "PATCH");
    assert.deepEqual((await (await fetch(`${cms}/items/ediciones?filter[id][_eq]=${item.id}`)).json()).data, []);
    assert.equal((await fetch(`${website}/revista/2099-12-31`)).status, 404);
  } finally {
    if (item) await write(`/items/ediciones/${item.id}`, undefined, "DELETE");
  }
});
