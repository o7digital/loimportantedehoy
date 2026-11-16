import { readFile } from "node:fs/promises";
import { defaultTheme, themeColors } from "../src/lib/magazine-theme.ts";

const root = (process.env.PUBLIC_URL || process.env.DIRECTUS_URL || "").replace(/\/$/, "");
if (!root || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new Error("Load the private CMS environment.");
const login = await fetch(`${root}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) });
if (!login.ok) throw new Error(`CMS login: ${login.status}`);
const { data: { access_token: token } } = await login.json();
async function api(path, body, method = "GET") {
  const response = await fetch(root + path, { method, headers: { Authorization: `Bearer ${token}`, ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }) }, ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}) });
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${(await response.text()).slice(0, 400)}`);
  return response.status === 204 ? undefined : (await response.json()).data;
}
const label = translation => [{ language: "es-ES", translation }];
const presets = Object.values(themeColors).map(color => ({ name: color.label, color: color.value }));
function fields(overrides = false) {
  const colors = Object.entries(themeColors).map(([field, { label: name, value }]) => ({ field, type: "string", schema: { max_length: 7, is_nullable: true, default_value: overrides ? null : value }, meta: { interface: "select-color", display: "color", width: "half", translations: label(name), options: { opacity: false, presets }, note: overrides ? "Vacío: usar la identidad visual general." : "Color de la revista. Puedes elegir un color o escribir su código hexadecimal.", validation: { _or: [{ [field]: { _null: true } }, { [field]: { _regex: "^#[0-9A-Fa-f]{6}$" } }] }, validation_message: "Escribe un color hexadecimal de 6 dígitos, por ejemplo #091A38." } }));
  const fonts = [["fuente_titulos", "Tipografía de títulos"], ["fuente_texto", "Tipografía de lectura"]].map(([field, name]) => ({ field, type: "string", schema: { is_nullable: true, default_value: overrides ? null : "clasica" }, meta: { interface: "select-dropdown", width: "half", translations: label(name), note: overrides ? "Vacío: usar la identidad visual general." : "La tipografía clásica reproduce el estilo de las ediciones originales.", options: { allowNone: overrides, choices: [{ text: "Clásica · Georgia", value: "clasica" }, { text: "Editorial · Cormorant", value: "editorial" }, { text: "Moderna · DM Sans", value: "moderna" }] } } }));
  return [...colors, ...fonts,
    { field: "tamano_texto", type: "integer", schema: { is_nullable: true, default_value: overrides ? null : 18 }, meta: { interface: "input", width: "half", translations: label("Tamaño del texto de lectura"), note: "De 16 a 24 píxeles. Vacío: usar el tamaño general.", validation: { _or: [{ tamano_texto: { _null: true } }, { tamano_texto: { _between: [16, 24] } }] } } },
    { field: "titulos_dorados", type: "boolean", schema: { is_nullable: true, default_value: overrides ? null : true }, meta: { interface: "boolean", width: "half", translations: label("Degradado en títulos y cifras"), note: overrides ? "Vacío: heredar el estilo general. Activado: degradado; desactivado: color plano." : "Aplica el efecto dorado del cliente al color de los títulos." } },
  ];
}
const collections = await api("/collections");
if (!collections.some(collection => collection.collection === "apariencia")) await api("/collections", { collection: "apariencia", schema: {}, meta: { singleton: true, icon: "palette", color: "#F3CC57", sort: 1, translations: label("Identidad visual"), note: "Colores y tipografía de toda la revista. Guardar aplica los cambios sin modificar código." }, fields: [{ field: "id", type: "integer", schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true } }, ...fields()] }, "POST");
const current = await api("/items/apariencia");
if (!current?.id) await api("/items/apariencia", defaultTheme, "PATCH");
for (const field of fields()) await api(`/fields/apariencia/${field.field}`, { meta: field.meta }, "PATCH");
const existing = await api("/fields/ediciones");
if (!existing.some(field => field.field === "estilo_edicion")) await api("/fields/ediciones", { field: "estilo_edicion", type: "alias", meta: { special: ["alias", "no-data", "group"], interface: "group-detail", translations: label("Estilo de esta edición · Opcional"), options: { start: "closed" }, sort: 100 } }, "POST");
for (const [index, field] of fields(true).entries()) {
  const meta = { ...field.meta, group: "estilo_edicion", sort: 101 + index };
  if (!existing.some(item => item.field === field.field)) await api("/fields/ediciones", { ...field, meta }, "POST");
  else await api(`/fields/ediciones/${field.field}`, { meta }, "PATCH");
}
if (!existing.some(field => field.field === "imagen_recortada")) await api("/fields/ediciones", { field: "imagen_recortada", type: "uuid", schema: { is_nullable: true }, meta: { interface: "file-image", special: ["file"], translations: label("Ilustración de portada · PNG transparente"), note: "Opcional: el personaje recortado se coloca sobre el fondo de la revista. La fotografía original se conserva para las páginas interiores.", width: "full", sort: 15 } }, "POST");
const relations = await api("/relations");
if (!relations.some(item => item.collection === "ediciones" && item.field === "imagen_recortada")) await api("/relations", { collection: "ediciones", field: "imagen_recortada", related_collection: "directus_files", schema: { on_delete: "SET NULL" }, meta: {} }, "POST");
const policies = await api("/policies");
const policy = policies.find(policy => policy.name === "Public" || policy.name === "$t:public_label");
const permissions = await api(`/permissions?filter[policy][_eq]=${policy.id}`);
if (!permissions.some(permission => permission.collection === "apariencia" && permission.action === "read")) await api("/permissions", { policy: policy.id, collection: "apariencia", action: "read", fields: ["*"], permissions: {} }, "POST");
if (process.argv.includes("--upload-frida-cutout")) {
  const [frida] = await api("/items/ediciones?filter[slug][_eq]=frida&fields=id,imagen_recortada");
  if (frida && !frida.imagen_recortada) {
    const bytes = await readFile(new URL("../public/editorial/frida-client-cutout.png", import.meta.url));
    const form = new FormData(); form.set("title", "Frida · Ilustración del cliente, recortada"); form.set("description", "Recorte de la ilustración de JerryMC, a partir de la edición original proporcionada por el cliente."); form.set("file", new Blob([bytes], { type: "image/png" }), "frida-client-cutout.png");
    const file = await api("/files", form, "POST");
    await api(`/items/ediciones/${frida.id}`, { imagen_recortada: file.id }, "PATCH");
  }
}
console.log("Ready: Identidad visual, edition color overrides, typography and transparent cover illustrations. Existing content and settings retained.");
