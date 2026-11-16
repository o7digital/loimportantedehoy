import { readFile } from "node:fs/promises";
import { magazines } from "../src/data/magazines.ts";

const root = (process.env.PUBLIC_URL || process.env.DIRECTUS_URL || "").replace(/\/$/, "");
if (!root || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new Error("Load the private Directus admin environment before running bootstrap.");
const login = await fetch(`${root}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) });
if (!login.ok) throw new Error(`Directus login: HTTP ${login.status}`);
const { data: { access_token: token } } = await login.json();
async function api(path, options = {}) {
  const isForm = options.body instanceof FormData;
  const response = await fetch(`${root}${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, ...(!isForm ? { "Content-Type": "application/json" } : {}) }, body: options.body ? isForm ? options.body : JSON.stringify(options.body) : undefined });
  if (!response.ok) throw new Error(`Directus ${options.method || "GET"} ${path}: ${response.status} ${(await response.text()).slice(0, 700)}`);
  if (response.status === 204) return;
  return (await response.json()).data;
}
const field = (name, type, label, extra = {}) => ({ field: name, type, meta: { interface: "input", translations: [{ language: "es-ES", translation: label }], ...extra.meta }, schema: { is_nullable: true, ...extra.schema } });
const id = () => ({ field: "id", type: "integer", schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true, readonly: true, interface: "input" } });
const status = () => field("estado", "string", "Publicación", { schema: { default_value: "draft" }, meta: { interface: "select-dropdown", width: "half", options: { choices: [{ text: "Borrador", value: "draft" }, { text: "Publicado", value: "published" }, { text: "Archivado", value: "archived" }] } } });
const fileField = (name, label) => field(name, "uuid", label, { meta: { interface: "file-image", special: ["file"], width: "half" } });
const paragraph = (name, label) => field(name, "text", label, { meta: { interface: "input-multiline" } });
const list = (name, label, fields) => field(name, "json", label, { meta: { interface: "list", options: { fields: fields.map(([field, label]) => ({ field, name: label, type: "string", meta: { interface: "input", width: "half" } })), template: `{{ ${fields[0][0]} }}` } } });
const collections = await api("/collections");
const names = new Set(collections.map(collection => collection.collection));
if (!names.has("ediciones")) await api("/collections", { method: "POST", body: {
  collection: "ediciones", schema: {}, meta: { icon: "auto_stories", note: "Una fecha, una edición. Las páginas se ordenan en el campo Páginas.", display_template: "{{fecha}} · {{titulo}}", sort_field: "fecha", archive_field: "estado", archive_value: "archived", unarchive_value: "draft", versioning: true, translations: [{ language: "es-ES", translation: "Ediciones del día" }] },
  fields: [id(), status(), field("fecha", "date", "Fecha de la edición", { schema: { is_unique: true }, meta: { interface: "datetime", width: "half", required: true } }), field("slug", "string", "Identificador", { schema: { is_unique: true }, meta: { note: "Enlace alternativo: frida, leon-russell…", required: true } }), field("titulo", "string", "Personaje o tema", { meta: { required: true } }), paragraph("subtitulo", "Título de portada"), field("aniversario", "string", "Efeméride / aniversario"), field("categoria", "string", "Antetítulo de portada"), fileField("portada", "Edición gráfica original"), fileField("foto", "Fotografía de portada"), field("foto_credito", "string", "Crédito fotográfico"), field("foto_fuente", "string", "Enlace a la fuente fotográfica"), field("foto_posicion", "string", "Encuadre de fotografía", { schema: { default_value: "50% 50%" }, meta: { note: "Posición horizontal y vertical, por ejemplo 38% 38%." } }), field("fuentes", "json", "Fuentes editoriales", { meta: { interface: "tags" } }), { field: "paginas", type: "alias", meta: { special: ["o2m"], interface: "list-o2m", translations: [{ language: "es-ES", translation: "Páginas de la edición" }] } }],
} });
if (!names.has("paginas")) await api("/collections", { method: "POST", body: {
  collection: "paginas", schema: {}, meta: { icon: "article", display_template: "{{orden}} · {{etiqueta}}", sort_field: "orden", archive_field: "estado", archive_value: "archived", unarchive_value: "draft", translations: [{ language: "es-ES", translation: "Páginas y secciones" }] },
  fields: [id(), status(), field("edicion", "integer", "Edición", { meta: { interface: "select-dropdown-m2o", special: ["m2o"], required: true } }), field("orden", "integer", "Orden de lectura", { schema: { default_value: 0 }, meta: { width: "half" } }), field("slug", "string", "Ancla de página", { meta: { note: "La primera página debe usar portada. Las demás: historia, musica…", width: "half", required: true } }), field("etiqueta", "string", "Nombre en el índice"), field("tipo", "string", "Composición", { meta: { interface: "select-dropdown", options: { choices: [{ text: "Reportaje", value: "story" }, { text: "Datos y detalles", value: "facts" }, { text: "Cita", value: "quote" }, { text: "Música", value: "music" }] } } }), field("antetitulo", "string", "Rubrica / antetítulo"), paragraph("titulo", "Título"), paragraph("entradilla", "Entradilla"), field("contenido", "text", "Cuerpo del artículo", { meta: { interface: "input-multiline", note: "Separar los párrafos con una línea vacía. La revista compone la tipografía automáticamente." } }), fileField("foto", "Fotografía de esta página"), list("cifras", "Cifras destacadas", [["value", "Cifra"], ["label", "Descripción"]]), list("entradas", "Cronología / detalles", [["label", "Título o fecha"], ["text", "Texto"]]), paragraph("cita", "Cita destacada"), field("atribucion", "string", "Autor de la cita"), field("cancion_titulo", "string", "Canción: título"), field("cancion_artista", "string", "Canción: artista"), field("cancion_album", "string", "Canción: álbum / versión"), field("cancion_url", "string", "Canción: vídeo oficial de YouTube"), paragraph("cancion_nota", "Canción: nota editorial")],
} });
const relations = await api("/relations");
const pageFields = await api("/fields/paginas");
for (const item of [field("foto_credito", "string", "Crédito fotográfico de esta página"), field("foto_fuente", "string", "Fuente de la fotografía")]) {
  if (!pageFields.some(existing => existing.field === item.field)) await api("/fields/paginas", { method: "POST", body: item });
}
await api("/collections/ediciones", { method: "PATCH", body: { meta: { sort_field: null } } });
for (const [collection, field, related_collection, meta] of [["ediciones", "portada", "directus_files", {}], ["ediciones", "foto", "directus_files", {}], ["paginas", "foto", "directus_files", {}], ["paginas", "edicion", "ediciones", { one_field: "paginas", sort_field: "orden", one_deselect_action: "delete" }]]) {
  if (!relations.some(relation => relation.collection === collection && relation.field === field)) await api("/relations", { method: "POST", body: { collection, field, related_collection, schema: { on_delete: field === "edicion" ? "CASCADE" : "SET NULL" }, meta } });
}
const policies = await api("/policies");
let publicPolicy = policies.find(policy => policy.name === "Public" || policy.name === "$t:public_label");
if (!publicPolicy) { publicPolicy = await api("/policies", { method: "POST", body: { name: "Public", app_access: false, admin_access: false } }); await api("/access", { method: "POST", body: { policy: publicPolicy.id, role: null, user: null } }); }
const permissions = await api(`/permissions?filter[policy][_eq]=${publicPolicy.id}`);
const visibleEdition = { _and: [{ estado: { _eq: "published" } }, { fecha: { _lte: "$NOW(-6 hours)" } }] };
for (const [collection, filter] of [["ediciones", visibleEdition], ["paginas", { _and: [{ estado: { _eq: "published" } }, { edicion: visibleEdition }] }], ["directus_files", {}]]) {
  const existingPermission = permissions.find(permission => permission.collection === collection && permission.action === "read");
  const body = { policy: publicPolicy.id, collection, action: "read", fields: collection === "directus_files" ? ["id", "filename_download", "title", "description", "type", "width", "height", "filesize", "storage", "filename_disk", "modified_on", "uploaded_on", "focal_point_x", "focal_point_y"] : ["*"], permissions: filter };
  await api(existingPermission ? `/permissions/${existingPermission.id}` : "/permissions", { method: existingPermission ? "PATCH" : "POST", body });
}
await api("/settings", { method: "PATCH", body: { project_name: "Lo importante de hoy · Redacción", project_color: "#9E3128", default_language: "es-ES", project_descriptor: "Hechos que importan. Historias que se quedan." } });
const existing = await api("/items/ediciones?fields=id,slug&limit=-1");
const uploaded = new Map();
async function upload(path, title) {
  if (!path) return null;
  if (uploaded.has(path)) return uploaded.get(path);
  const file = await readFile(new URL(`../public${path}`, import.meta.url));
  const form = new FormData(); form.set("title", title); form.set("file", new Blob([file], { type: "image/jpeg" }), path.split("/").pop());
  const item = await api("/files", { method: "POST", body: form }); uploaded.set(path, item.id); return item.id;
}
for (const edition of magazines) {
  if (existing.some(item => item.slug === edition.slug)) { console.log(`Retained existing edition: ${edition.slug}`); continue; }
  const item = await api("/items/ediciones", { method: "POST", body: { slug: edition.slug, estado: "draft", fecha: edition.date, titulo: edition.title, subtitulo: edition.subtitle, aniversario: edition.anniversary, categoria: edition.category, portada: await upload(edition.image, `${edition.title} · original JerryMC`), foto: await upload(edition.photograph, `${edition.title} · ${edition.photoCredit}`), foto_credito: edition.photoCredit, foto_fuente: edition.photoSource, foto_posicion: edition.photoPosition, fuentes: edition.sources } });
  for (const [index, chapter] of edition.chapters.entries()) await api("/items/paginas", { method: "POST", body: { edicion: item.id, estado: "published", orden: index, slug: chapter.id, etiqueta: chapter.label, antetitulo: chapter.kicker, titulo: chapter.title, entradilla: chapter.intro, contenido: chapter.paragraphs?.join("\n\n"), tipo: chapter.song ? "music" : chapter.quote ? "quote" : chapter.entries ? "facts" : "story", foto: await upload(chapter.image, `${edition.title} · ${chapter.label}`), cifras: chapter.stats, entradas: chapter.entries, cita: chapter.quote, atribucion: chapter.attribution, cancion_titulo: chapter.song?.title, cancion_artista: chapter.song?.artist, cancion_album: chapter.song?.album, cancion_nota: chapter.song?.note, cancion_url: chapter.song?.url } });
  await api(`/items/ediciones/${item.id}`, { method: "PATCH", body: { estado: "published" } });
  console.log(`Published ${edition.date}: ${edition.title} (${edition.chapters.length} pages)`);
}
console.log("Directus ready. Admin credentials remain in the private environment file.");
const teamPages = await api("/items/paginas?filter[slug][_eq]=equipo&filter[edicion][slug][_eq]=frida&fields=id,foto_credito");
for (const page of teamPages) if (!page.foto_credito) await api(`/items/paginas/${page.id}`, { method: "PATCH", body: { foto_credito: "Secretaría de Marina / Gobierno de México", foto_fuente: "https://www.gob.mx/semar/galerias/develacion-de-la-escultura-de-frida-elemento-canino-de-busqueda-y-rescate" } });
