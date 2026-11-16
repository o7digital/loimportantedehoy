export const colorFields = ['color_fondo', 'color_superficie', 'color_texto', 'color_secundario', 'color_titulos', 'color_acento', 'color_lineas'];
export const styleFields = [...colorFields, 'fuente_titulos', 'fuente_texto', 'tamano_texto', 'titulos_dorados'];
export const instagramFields = ['instagram_titulo', 'instagram_subtitulo', 'instagram_destacado', 'instagram_biografia', 'instagram_titulo_hechos', 'instagram_titulo_detalles', 'instagram_dato'];
export const editionTextFields = ['fecha', 'slug', 'titulo', 'subtitulo', 'aniversario', 'categoria', 'foto_credito', 'foto_fuente', 'foto_posicion', ...instagramFields];
export const editionFileFields = ['portada', 'foto', 'imagen_recortada', 'instagram_foto'];
export const pageTextFields = ['slug', 'etiqueta', 'antetitulo', 'titulo', 'entradilla', 'contenido', 'cita', 'atribucion', 'foto_credito', 'foto_fuente', 'cancion_titulo', 'cancion_artista', 'cancion_album', 'cancion_nota', 'cancion_url'];
export const layouts = [{ value: 'story', name: 'Reportaje', icon: 'text', note: 'Texto y fotografía' }, { value: 'facts', name: 'Datos', icon: 'chart', note: 'Cifras y momentos' }, { value: 'quote', name: 'Cita', icon: 'quote', note: 'Palabras que inspiran' }, { value: 'music', name: 'Música', icon: 'music', note: 'Una canción y su historia' }];
const clone = value => JSON.parse(JSON.stringify(value));
let sequence = 0;
export function newPage(type = 'story', pages = []) {
  const names = { story: 'Su historia', facts: 'Momentos', quote: 'Palabras', music: 'Música' };
  const base = { story: 'historia', facts: 'momentos', quote: 'palabras', music: 'musica' }[type];
  let slug = base; let suffix = 2;
  while (pages.some(page => page.slug === slug)) slug = `${base}-${suffix++}`;
  return { id: `new-${++sequence}`, estado: 'draft', orden: pages.length, slug, etiqueta: names[type], tipo: type, titulo: names[type], antetitulo: '', entradilla: '', contenido: '', foto: null, cifras: [], entradas: [], cita: '', atribucion: '', cancion_titulo: '', cancion_artista: '', cancion_album: '', cancion_nota: '', cancion_url: '', foto_credito: '', foto_fuente: '' };
}
export function createDraft(raw) {
  const result = { id: raw.id, estado: raw.estado || 'draft', fuentes: clone(raw.fuentes || []), paginas: [] };
  for (const field of editionTextFields) result[field] = String(raw[field] || '');
  result.fecha = result.fecha.slice(0, 10);
  result.foto_posicion ||= '50% 50%';
  for (const field of editionFileFields) result[field] = raw[field] || null;
  for (const field of styleFields) result[field] = raw[field] ?? null;
  result.paginas = (raw.paginas || []).map((page, index) => {
    const item = { id: page.id || `new-${++sequence}`, estado: page.estado || 'draft', orden: page.orden ?? index, tipo: page.tipo || 'story', foto: page.foto || null, cifras: clone(page.cifras || []), entradas: clone(page.entradas || []) };
    for (const field of pageTextFields) item[field] = String(page[field] || '');
    return item;
  }).sort((a, b) => a.orden - b.orden);
  return result;
}
export const slugify = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 160);
export function blankEdition(title, date) {
  const pages = [newPage('story'), newPage('story'), newPage('quote'), newPage('music')];
  pages[0] = { ...pages[0], slug: 'portada', etiqueta: 'Portada', titulo: title };
  pages[1].slug = 'historia';
  pages.forEach((page, index) => { page.orden = index; });
  return createDraft({ titulo: title, fecha: date, slug: `${slugify(title)}-${date}`, categoria: 'Hechos y personajes', paginas: pages });
}
export class EditorValidationError extends Error {
  constructor(message, status = 422) { super(message); this.status = status; }
}
const fail = message => { throw new EditorValidationError(message); };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function text(value, field, maximum = 20000) {
  if (value == null) return '';
  if (typeof value !== 'string' || value.length > maximum) fail(`Revisa el texto de «${field}».`);
  return value;
}
export function sanitizeEdition(input, current = null, { strict = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('No se pudo leer la edición.');
  const output = {};
  for (const field of editionTextFields) output[field] = text(input[field] ?? current?.[field], field, ['subtitulo', ...instagramFields].includes(field) ? 4000 : field === 'foto_fuente' ? 2000 : 255);
  output.fecha = output.fecha.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(output.fecha) || Number.isNaN(Date.parse(output.fecha)) || new Date(output.fecha).toISOString().slice(0, 10) !== output.fecha) fail('Elige una fecha válida para la edición.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(output.slug)) fail('El enlace debe usar letras minúsculas, números y guiones.');
  if (strict && !output.titulo.trim()) fail('Escribe el título de esta edición.');
  for (const field of editionFileFields) {
    const value = input[field] ?? (Object.hasOwn(input, field) ? null : current?.[field]) ?? null;
    if (value !== null && !uuid.test(value)) fail('Selecciona una imagen válida de la biblioteca.');
    output[field] = value;
  }
  for (const field of colorFields) {
    const value = Object.hasOwn(input, field) ? input[field] : current?.[field] ?? null;
    if (value !== null && !/^#[0-9a-f]{6}$/i.test(value)) fail('Usa colores hexadecimales de seis cifras, como #091A38.');
    output[field] = value;
  }
  for (const field of ['fuente_titulos', 'fuente_texto']) {
    const value = Object.hasOwn(input, field) ? input[field] : current?.[field] ?? null;
    if (value !== null && !['clasica', 'editorial', 'moderna'].includes(value)) fail('Selecciona una tipografía de la lista.');
    output[field] = value;
  }
  output.tamano_texto = Object.hasOwn(input, 'tamano_texto') ? input.tamano_texto : current?.tamano_texto ?? null;
  if (output.tamano_texto !== null && (!Number.isFinite(output.tamano_texto) || output.tamano_texto < 16 || output.tamano_texto > 24)) fail('El tamaño del texto debe estar entre 16 y 24.');
  output.titulos_dorados = Object.hasOwn(input, 'titulos_dorados') ? input.titulos_dorados : current?.titulos_dorados ?? null;
  if (output.titulos_dorados !== null && typeof output.titulos_dorados !== 'boolean') fail('Revisa el efecto de los títulos.');
  output.estado = input.estado ?? current?.estado ?? 'draft';
  if (!['draft', 'published', 'archived'].includes(output.estado)) fail('Selecciona un estado válido.');
  output.fuentes = input.fuentes ?? current?.fuentes ?? [];
  if (!Array.isArray(output.fuentes) || output.fuentes.length > 30) fail('Revisa la lista de fuentes.');
  output.fuentes = output.fuentes.map(value => text(value, 'fuentes', 500)).filter(Boolean);
  const pages = input.paginas ?? current?.paginas ?? [];
  if (!Array.isArray(pages) || pages.length > 60) fail('La edición admite hasta 60 páginas, incluidas las retiradas.');
  const owned = new Set((current?.paginas || []).map(page => Number(page.id)));
  const ids = new Set(); const slugs = new Set();
  output.paginas = pages.map((page, index) => {
    const item = {};
    if (typeof page.id === 'number') {
      if (!Number.isInteger(page.id) || !owned.has(page.id) || ids.has(page.id)) fail('Esta página no pertenece a la edición seleccionada.');
      ids.add(page.id); item.id = page.id;
    } else if (page.id !== undefined && !/^new-[\w-]+$/.test(page.id)) fail('No se pudo identificar la página.');
    for (const field of pageTextFields) item[field] = text(page[field], field, ['contenido', 'entradilla', 'cancion_nota', 'cita'].includes(field) ? 20000 : 2000);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) || slugs.has(item.slug)) fail('Cada página necesita un enlace único dentro de la edición.');
    slugs.add(item.slug);
    item.estado = page.estado || 'draft';
    if (!['draft', 'published', 'archived'].includes(item.estado)) fail('Revisa el estado de las páginas.');
    item.tipo = page.tipo || 'story';
    if (!layouts.some(layout => layout.value === item.tipo)) fail('Selecciona una composición válida.');
    item.orden = index;
    item.foto = page.foto || null;
    if (item.foto && !uuid.test(item.foto)) fail('Selecciona una imagen válida para esta página.');
    for (const [field, keys] of [['cifras', ['value', 'label']], ['entradas', ['label', 'text']]]) {
      const rows = page[field] ?? [];
      if (!Array.isArray(rows) || rows.length > 30) fail('Revisa las cifras y los detalles de esta página.');
      item[field] = rows.map(row => Object.fromEntries(keys.map(key => [key, text(row?.[key], key, 3000)])));
    }
    return item;
  });
  const active = output.paginas.filter(page => page.estado !== 'archived');
  if (!active.length || active[0].slug !== 'portada') fail('La primera página debe ser la portada.');
  if (active.length > 16) fail('Una edición admite hasta 16 páginas activas.');
  if (strict && output.estado === 'published') {
    if (!output.foto && !output.imagen_recortada && !output.portada) fail('Añade una imagen de portada antes de publicar.');
    if (active.some(page => !page.titulo.trim())) fail('Escribe un título para cada página antes de publicar.');
    if (active.some(page => page.estado !== 'published')) fail('Publica las páginas de la edición antes de publicarla.');
  }
  return output;
}
