// Idempotent migration. Existing content and module-bar entries are preserved.
const root = (process.env.PUBLIC_URL || process.env.DIRECTUS_URL || '').replace(/\/$/, '');
if (!root || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new Error('Load the private CMS environment.');
const login = await fetch(`${root}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) });
if (!login.ok) throw new Error(`Login: HTTP ${login.status}`);
const { data: { access_token: token } } = await login.json();
async function api(path, body, method = 'GET') {
  const response = await fetch(root + path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!response.ok) throw new Error(`${method} ${path}: HTTP ${response.status} ${(await response.text()).slice(0, 250)}`);
  return response.status === 204 ? undefined : (await response.json()).data;
}
const label = translation => [{ language: 'es-ES', translation }];
const existing = await api('/fields/ediciones');
if (!existing.some(item => item.field === 'formato_instagram')) await api('/fields/ediciones', { field: 'formato_instagram', type: 'alias', meta: { special: ['alias', 'no-data', 'group'], interface: 'group-detail', translations: label('Formato Instagram · Textos cortos opcionales'), options: { start: 'closed' }, note: 'El studio genera el cartel con tus páginas. Usa estos campos para adaptar el texto al formato 4:5. Vacío: usar el contenido de la revista.', sort: 140 } }, 'POST');
const fields = [
  ['instagram_titulo', 'Título del cartel', 'Vacío: título de la edición.'],
  ['instagram_subtitulo', 'Subtítulo del cartel', 'Una frase breve debajo del título.'],
  ['instagram_destacado', 'Frase destacada', 'Vacío: título de la historia. Dos líneas como máximo.'],
  ['instagram_biografia', 'Biografía breve', 'Texto junto a la foto secundaria. Puedes incluir fechas y lugar. Se recomiendan 180 caracteres.'],
  ['instagram_titulo_hechos', 'Encabezado de hechos o misiones', 'Vacío: encabezado de la página de cifras.'],
  ['instagram_titulo_detalles', 'Encabezado de detalles o equipo', 'Vacío: encabezado de la página de detalles.'],
  ['instagram_dato', 'Dato interesante', 'Vacío: primer párrafo de la página de detalles. Se recomiendan 160 caracteres.'],
];
for (const [index, [field, title, note]] of fields.entries()) {
  const definition = { field, type: 'text', schema: { is_nullable: true }, meta: { interface: field === 'instagram_biografia' || field === 'instagram_dato' ? 'input-multiline' : 'input', width: 'full', translations: label(title), note, group: 'formato_instagram', sort: 141 + index } };
  if (!existing.some(item => item.field === field)) await api('/fields/ediciones', definition, 'POST');
  else await api(`/fields/ediciones/${field}`, { meta: definition.meta }, 'PATCH');
}
if (!existing.some(item => item.field === 'instagram_foto')) {
  await api('/fields/ediciones', { field: 'instagram_foto', type: 'uuid', schema: { is_nullable: true }, meta: { interface: 'file-image', special: ['file'], translations: label('Foto secundaria para Instagram'), note: 'Opcional. Vacío: usar la fotografía de la edición.', group: 'formato_instagram', sort: 149 } }, 'POST');
  await api('/relations', { collection: 'ediciones', field: 'instagram_foto', related_collection: 'directus_files', schema: { on_delete: 'SET NULL' }, meta: {} }, 'POST');
}
const { module_bar } = await api('/settings?fields=module_bar');
const defaults = [
  ...['content', 'visual', 'users', 'files', 'insights', 'deployments'].map(id => ({ type: 'module', id, enabled: !['visual', 'deployments'].includes(id) })),
  { type: 'link', id: 'docs', enabled: true, name: '$t:documentation', icon: 'help', url: 'https://docs.directus.io' },
  { type: 'module', id: 'settings', enabled: true, locked: true },
];
const bar = module_bar ?? defaults;
const studio = bar.find(item => item.type === 'module' && item.id === 'revista-studio');
if (studio) studio.enabled = true;
else bar.splice(1, 0, { type: 'module', id: 'revista-studio', enabled: true });
await api('/settings', { module_bar: bar }, 'PATCH');
console.log('Ready: Studio de publicación, saved-content previews and Instagram text controls.');
