<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { useApi } from '@directus/extensions-sdk';
import Icon from './studio-icon.vue';
import Field from './editable-field.vue';
import Media from './media-card.vue';
import { createDraft, newPage, layouts, styleFields, instagramFields } from '../shared/editor-model.js';
import { resolveTheme, defaultTheme } from '../../../../src/lib/magazine-theme.ts';
import './studio.css';

const api = useApi();
const router = useRouter();
const editions = ref([]); const selected = ref(''); const draft = ref(null); const savedEdition = ref(null); const revision = ref('');
const appearance = ref({}); const baseline = ref(''); const section = ref('edition'); const activeSlug = ref('portada');
const format = ref('mobile'); const html = ref(''); const busy = ref(false); const saving = ref(false); const generating = ref(false); const composing = ref(false);
const error = ref(''); const previewError = ref(''); const notice = ref(''); const noticeTimer = ref(null);
const search = ref(''); const sourceText = ref(''); const sidebarOpen = ref(false); const mobilePane = ref('editor');
const canvas = ref(); const frame = ref(); const scale = ref(.8); const zoom = ref('fit'); const editorForm = ref();
const discardDialog = ref(); const newDialog = ref(); const addDialog = ref(); const mediaDialog = ref(); const expandedDialog = ref();
const mediaError = ref(''); const mediaRows = ref([]); const mediaSearch = ref(''); const mediaBusy = ref(false); const mediaTarget = ref(null); const uploadInput = ref();
const newTitle = ref(''); const newDate = ref(today()); const creating = ref(false); const newError = ref('');
const newType = ref('story'); const pending = ref(null); const highlighted = ref('');
let pageFromPreview = false; let loadCounter = 0; let observer; let previewTimer; let previewCounter = 0; let mediaTimer; let mediaCounter = 0; let selectionTimer;
const formats = { desktop: { label: 'Desktop', icon: 'monitor', width: 1440, height: 1000, note: '1440 × 1000' }, mobile: { label: 'Mobile', icon: 'phone', width: 390, height: 844, note: '390 × 844 · PNG a 2×' }, instagram: { label: 'Instagram', icon: 'instagram', width: 1080, height: 1350, note: '1080 × 1350 · 4:5' } };
const size = computed(() => formats[format.value]);
const expandedHtml = computed(() => html.value.replace('"editing":true', '"editing":false'));
const dirty = computed(() => draft.value && JSON.stringify(draft.value) !== baseline.value);
const activePages = computed(() => (draft.value?.paginas || []).filter(page => page.estado !== 'archived'));
const archivedPages = computed(() => (draft.value?.paginas || []).filter(page => page.estado === 'archived'));
const activePage = computed(() => activePages.value.find(page => page.slug === activeSlug.value) || activePages.value[0]);
const shownEditions = computed(() => editions.value.filter(item => `${item.titulo} ${item.fecha}`.toLowerCase().includes(search.value.toLowerCase())));
const theme = computed(() => resolveTheme(appearance.value, draft.value || {}));
const saved = computed(() => savedEdition.value?.estado === 'published');
const publicUrl = computed(() => `https://loimportantedehoy.vercel.app/revista/${savedEdition.value?.fecha?.slice(0, 10) || ''}`);
const hasPublishedUrl = computed(() => saved.value && savedEdition.value.fecha.slice(0, 10) <= today());
const heading = computed(() => ({ edition: 'La portada', pages: activePage.value?.etiqueta || 'Las páginas', style: 'Colores y tipografía', instagram: 'Tu edición para Instagram' }[section.value]));
const instagramLabels = { instagram_titulo: 'Título del cartel', instagram_subtitulo: 'Subtítulo', instagram_destacado: 'Frase destacada', instagram_biografia: 'Biografía breve', instagram_titulo_hechos: 'Encabezado de hechos o misiones', instagram_titulo_detalles: 'Encabezado de detalles', instagram_dato: 'Dato interesante' };
const colorLabels = { color_fondo: 'Fondo', color_superficie: 'Recuadros', color_texto: 'Texto', color_secundario: 'Texto secundario', color_titulos: 'Títulos y cifras', color_acento: 'Acentos', color_lineas: 'Separadores' };
function today() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date()); }
function dateLabel(value) { return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`)); }
function statusLabel(item) { return item.estado === 'published' ? item.fecha.slice(0, 10) > today() ? 'Programada' : 'Publicada' : item.estado === 'archived' ? 'Archivada' : 'Borrador'; }
function thumb(item) { const id = item.imagen_recortada || item.foto || item.portada; return id ? `/assets/${encodeURIComponent(id)}?width=140&quality=75` : ''; }
function pageIcon(page) { return page.slug === 'portada' ? 'book' : layouts.find(layout => layout.value === page.tipo)?.icon || 'text'; }
async function explain(caught) {
  let data = caught?.response?.data;
  if (data instanceof Blob) { try { data = JSON.parse(await data.text()); } catch {} }
  const first = data?.errors?.[0] || caught?.errors?.[0];
  if (first?.extensions?.code === 'RECORD_NOT_UNIQUE') return 'Ya existe una edición para esa fecha o ese enlace. Elige otra fecha.';
  return first?.message || 'No se pudo completar la acción. Tus cambios siguen en el editor. Inténtalo de nuevo.';
}
function toast(text) { notice.value = text; clearTimeout(noticeTimer.value); noticeTimer.value = setTimeout(() => { notice.value = ''; }, 6000); }
function resize() { if (canvas.value) scale.value = zoom.value === 'fit' ? Math.min(1, Math.max(.15, (canvas.value.clientWidth - 56) / size.value.width)) : Number(zoom.value) / 100; }
function applyDocument(data) {
  if (String(router.currentRoute.value.query.edition || '') !== String(data.edition.id)) router.replace({ query: { ...router.currentRoute.value.query, edition: String(data.edition.id) } });
  savedEdition.value = data.edition; appearance.value = data.appearance || {}; revision.value = data.revision;
  draft.value = createDraft(data.edition); baseline.value = JSON.stringify(draft.value); sourceText.value = draft.value.fuentes.join('\n');
  if (!activePages.value.some(page => page.slug === activeSlug.value)) activeSlug.value = activePages.value[0]?.slug || 'portada';
  const row = { ...data.edition, paginas: data.edition.paginas || [] };
  const index = editions.value.findIndex(item => String(item.id) === String(row.id));
  if (index < 0) editions.value.unshift(row); else editions.value[index] = row;
  editions.value.sort((a, b) => b.fecha.localeCompare(a.fecha));
}
async function loadEdition(id) {
  const current = ++loadCounter; const previous = selected.value;
  busy.value = true; error.value = ''; sidebarOpen.value = false; selected.value = String(id);
  try {
    const { data } = await api.get(`/revista-studio/document/${id}`);
    if (current !== loadCounter) return;
    applyDocument(data.data); await nextTick();
  } catch (caught) { if (current === loadCounter) { selected.value = previous; error.value = await explain(caught); } }
  finally { if (current === loadCounter) { busy.value = false; schedulePreview(true); } }
}
function proceed(action) { if (saving.value || creating.value) { toast('Espera a que termine la acción para cambiar de edición.'); return; } if (dirty.value) { pending.value = action; discardDialog.value.showModal(); } else action(); }
function discardAndContinue() {
  if (savedEdition.value) { draft.value = createDraft(savedEdition.value); baseline.value = JSON.stringify(draft.value); sourceText.value = draft.value.fuentes.join('\n'); }
  discardDialog.value.close(); const action = pending.value; pending.value = null; action?.();
}
function goToDirectus(path) { proceed(() => window.location.assign(path)); }
function renamePage(value) { const page = activePage.value; page.slug = value; activeSlug.value = value; }
function chooseSection(value, page) { section.value = value; if (value === 'edition') activeSlug.value = 'portada'; if (page) activeSlug.value = page.slug; sidebarOpen.value = false; mobilePane.value = 'editor'; }
function schedulePreview(immediate = false) { clearTimeout(previewTimer); if (!draft.value || busy.value) return; previewTimer = setTimeout(compose, immediate ? 0 : 650); }
async function compose() {
  if (!draft.value) return;
  const current = ++previewCounter; previewError.value = '';
  try {
    const response = await api.post(`/revista-studio/compose/${selected.value}/${format.value}`, { edition: draft.value, page: format.value === 'instagram' ? '' : activeSlug.value }, { responseType: 'text' });
    if (current !== previewCounter) return;
    composing.value = true; html.value = ''; await nextTick(); html.value = response.data; await nextTick(); resize();
  } catch (caught) { if (current === previewCounter) { composing.value = false; previewError.value = await explain(caught); } }
}
async function previewLoaded(event) {
  const current = previewCounter; const target = event.target;
  for (let attempt = 0; attempt < 180 && current === previewCounter; attempt++) {
    const view = target.contentWindow;
    if (view?.__STUDIO_ERROR__) { previewError.value = view.__STUDIO_ERROR__; composing.value = false; return; }
    if (view?.__STUDIO_READY__) { composing.value = false; return; }
    await new Promise(resolve => setTimeout(resolve, 60));
  }
  if (current === previewCounter) { composing.value = false; previewError.value = 'La vista no terminó de cargar. Pulsa actualizar para volver a intentarlo.'; }
}
async function save(publish = false) {
  if (!draft.value || saving.value) return;
  if (editorForm.value && !editorForm.value.reportValidity()) return;
  saving.value = true; error.value = '';
  const payload = JSON.parse(JSON.stringify(draft.value));
  if (publish || payload.estado === 'published') { payload.estado = 'published'; payload.paginas.forEach(page => { if (page.estado !== 'archived') page.estado = 'published'; }); }
  try {
    const { data } = await api.patch(`/revista-studio/document/${selected.value}`, { edition: payload, revision: revision.value });
    applyDocument(data.data); toast(publish ? payload.fecha > today() ? 'Edición programada. Se mostrará cuando llegue su fecha.' : 'Edición publicada. La web se actualizará en unos instantes.' : 'Cambios guardados en Directus.'); schedulePreview(true);
  } catch (caught) { error.value = await explain(caught); }
  finally { saving.value = false; }
}
async function generate() {
  generating.value = true; error.value = '';
  try {
    const response = await api.post(`/revista-studio/export/${selected.value}/${format.value}`, { edition: draft.value, page: format.value === 'instagram' ? '' : activeSlug.value }, { responseType: 'blob', timeout: 45000 });
    const url = URL.createObjectURL(response.data); const link = document.createElement('a'); link.href = url;
    link.download = `${draft.value.fecha}-${format.value}${format.value === 'instagram' ? '' : `-${activeSlug.value}`}.png`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(dirty.value ? 'PNG listo. Tus cambios siguen sin guardar; la web no se ha modificado.' : 'Tu archivo está listo para descargar.');
  } catch (caught) { error.value = await explain(caught); }
  finally { generating.value = false; }
}
async function createEdition() {
  if (creating.value) return;
  creating.value = true; newError.value = '';
  try { const { data } = await api.post('/revista-studio/document', { titulo: newTitle.value, fecha: newDate.value }); selected.value = String(data.data.edition.id); section.value = 'edition'; activeSlug.value = 'portada'; applyDocument(data.data); newDialog.value.close(); sidebarOpen.value = false; schedulePreview(true); toast('Nueva edición creada en borrador. Empieza por su portada.'); }
  catch (caught) { newError.value = await explain(caught); }
  finally { creating.value = false; }
}
function addPage() { const page = newPage(newType.value, draft.value.paginas); draft.value.paginas.push(page); chooseSection('pages', page); addDialog.value.close(); reorder(); }
function reorder() { const ordered = [...activePages.value, ...archivedPages.value]; ordered.forEach((page, index) => { page.orden = index; }); draft.value.paginas = ordered; }
function movePage(page, direction) {
  const rows = [...activePages.value]; const index = rows.indexOf(page); const next = index + direction;
  if (index <= 0 || next <= 0 || next >= rows.length) return;
  [rows[index], rows[next]] = [rows[next], rows[index]]; draft.value.paginas = [...rows, ...archivedPages.value]; reorder();
}
function archivePage(page) { if (page.slug === 'portada') return; page.estado = 'archived'; activeSlug.value = activePages.value[0].slug; reorder(); toast('Página retirada de la edición. Puedes recuperarla abajo.'); }
function restorePage(page) { page.estado = 'draft'; reorder(); chooseSection('pages', page); }
function resetStyle() { for (const field of styleFields) draft.value[field] = null; }
function originalStyle() { Object.assign(draft.value, defaultTheme); }
function addRow(field) { activePage.value[field].push(field === 'cifras' ? { value: '', label: '' } : { label: '', text: '' }); }
async function openMedia(owner, field, page) { mediaError.value = ''; mediaTarget.value = { owner, field, page: page?.slug }; mediaSearch.value = ''; mediaDialog.value.showModal(); await loadMedia(); }
async function loadMedia() {
  const current = ++mediaCounter; mediaBusy.value = true;
  try { const { data } = await api.get('/files', { params: { fields: 'id,title,type,width,height,filename_download', filter: JSON.stringify({ type: { _starts_with: 'image/' } }), limit: 60, sort: '-uploaded_on', search: mediaSearch.value || undefined } }); if (current === mediaCounter) mediaRows.value = data.data; }
  catch (caught) { mediaError.value = await explain(caught); }
  finally { if (current === mediaCounter) mediaBusy.value = false; }
}
function pickMedia(item) { const target = mediaTarget.value; const owner = target.owner === 'page' ? draft.value.paginas.find(page => page.slug === target.page) : draft.value; if (owner) owner[target.field] = item.id; mediaDialog.value.close(); }
async function upload(event) {
  const file = event.target.files?.[0]; if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) || file.size > 15 * 1024 * 1024) { mediaError.value = 'Elige una imagen JPG, PNG, WebP o AVIF de hasta 15 MB.'; return; }
  mediaBusy.value = true;
  try { const form = new FormData(); form.append('title', file.name.replace(/\.[^.]+$/, '')); form.append('file', file); const { data } = await api.post('/files', form, { headers: { 'Content-Type': 'multipart/form-data' } }); pickMedia(data.data); toast('Imagen añadida a la biblioteca y seleccionada.'); }
  catch (caught) { mediaError.value = await explain(caught); }
  finally { mediaBusy.value = false; event.target.value = ''; }
}
async function selectFromPreview(event) {
  if (event.source !== frame.value?.contentWindow) return;
  if (event.data?.type === 'revista-page') {
    const page = activePages.value.find(page => page.slug === event.data.page);
    if (page && page.slug !== activeSlug.value) { pageFromPreview = true; activeSlug.value = page.slug; }
    return;
  }
  if (event.data?.type !== 'revista-select') return;
  const data = event.data;
  if (data.target === 'page') { const page = activePages.value.find(page => page.slug === data.page); if (!page) return; chooseSection('pages', page); if (data.field === 'foto') { await openMedia('page', 'foto', page); return; } }
  else if (data.target === 'edition') { chooseSection('edition'); if (['foto', 'imagen_recortada'].includes(data.field)) { await openMedia('edition', data.field); return; } }
  else if (data.target === 'instagram') chooseSection('instagram');
  else return;
  await nextTick();
  const safeField = String(data.field).replace(/[^a-z_]/g, '');
  const target = editorForm.value?.querySelector(`[data-editor-field="${safeField}"]`);
  target?.scrollIntoView({ behavior: 'smooth', block: 'center' }); target?.focus(); highlighted.value = safeField;
  clearTimeout(selectionTimer); selectionTimer = setTimeout(() => { highlighted.value = ''; }, 1800);
}
function unload(event) { if (dirty.value || saving.value) event.preventDefault(); }
onBeforeRouteLeave(() => !saving.value && !creating.value && (!dirty.value || window.confirm('Hay cambios sin guardar. ¿Quieres salir del editor?')));
onMounted(async () => {
  observer = new ResizeObserver(resize); if (canvas.value) observer.observe(canvas.value);
  window.addEventListener('beforeunload', unload); window.addEventListener('message', selectFromPreview);
  busy.value = true;
  try {
    const { data } = await api.get('/items/ediciones', { params: { fields: 'id,titulo,fecha,estado,foto,portada,imagen_recortada,paginas.id,paginas.estado', sort: '-fecha', limit: 1000 } }); editions.value = data.data;
    const requested = new URL(location.href).searchParams.get('edition');
    const initial = editions.value.find(item => String(item.id) === requested) || editions.value[0];
    if (initial) await loadEdition(initial.id);
  } catch (caught) { error.value = await explain(caught); }
  finally { busy.value = false; schedulePreview(true); }
});
watch(draft, () => schedulePreview(), { deep: true });
watch([format, activeSlug], () => { if (pageFromPreview) { pageFromPreview = false; return; } zoom.value = 'fit'; schedulePreview(true); });
watch(canvas, element => { observer?.disconnect(); if (element) observer?.observe(element); }, { flush: 'post' });
watch(zoom, resize);
watch(mediaSearch, () => { clearTimeout(mediaTimer); mediaTimer = setTimeout(loadMedia, 300); });
onBeforeUnmount(() => { observer?.disconnect(); clearTimeout(previewTimer); clearTimeout(mediaTimer); clearTimeout(selectionTimer); clearTimeout(noticeTimer.value); window.removeEventListener('beforeunload', unload); window.removeEventListener('message', selectFromPreview); });
</script>

<template>
  <div class="editorial-studio" :class="{ 'nav-open': sidebarOpen }">
    <button v-if="sidebarOpen" class="ed-nav-shade" aria-label="Cerrar navegación" @click="sidebarOpen = false" />
    <aside class="ed-sidebar">
      <a class="ed-brand" href="/admin/revista-studio" @click.prevent="editions.length && proceed(() => loadEdition(editions[0].id))"><span class="ed-brand-symbol">li<span>.</span></span><span>Lo importante<em>de hoy</em><small>STUDIO EDITORIAL · JERRYMC</small></span></a>
      <div class="ed-sidebar-scroll">
        <div class="ed-sidebar-heading"><span>MIS EDICIONES</span><button type="button" class="ed-icon-button" title="Nueva edición" aria-label="Nueva edición" @click="proceed(() => { newTitle = ''; newDate = today(); newError = ''; newDialog.showModal(); })"><Icon name="plus" /></button></div>
        <label class="ed-search"><Icon name="search" /><input v-model="search" aria-label="Buscar una edición" placeholder="Buscar una historia…" /></label>
        <nav class="ed-edition-list" aria-label="Ediciones del día"><button v-for="item in shownEditions" :key="item.id" type="button" class="ed-issue" :class="{ selected: String(item.id) === selected }" @click="proceed(() => loadEdition(item.id))"><span class="ed-issue-art"><img v-if="thumb(item)" :src="thumb(item)" alt="" /><Icon v-else name="book" /></span><span><strong>{{ item.titulo }}</strong><small>{{ dateLabel(item.fecha) }}</small><em :class="item.estado">{{ statusLabel(item) }}</em></span><Icon v-if="String(item.id) === selected" name="left" /></button><p v-if="!shownEditions.length" class="ed-side-empty">No hay ediciones con ese nombre.</p></nav>
        <template v-if="draft">
          <div class="ed-sidebar-heading ed-pages-heading"><span>EN ESTA EDICIÓN</span><small>{{ activePages.length }} páginas</small></div>
          <button class="ed-nav-item" :class="{ active: section === 'edition' }" type="button" @click="chooseSection('edition')"><Icon name="book" />Portada y edición</button>
          <nav class="ed-page-nav" aria-label="Páginas de la edición"><button v-for="(item, index) in activePages" :key="item.id" type="button" :class="{ active: section === 'pages' && activeSlug === item.slug }" @click="chooseSection('pages', item)"><span class="ed-page-index">{{ String(index + 1).padStart(2, '0') }}</span><Icon :name="pageIcon(item)" /><span>{{ item.etiqueta }}</span><i v-if="item.estado === 'draft'" title="Borrador" /></button></nav>
          <button class="ed-add-page" type="button" :disabled="activePages.length >= 16" @click="addDialog.showModal()"><Icon name="plus" />Añadir página</button>
          <div class="ed-sidebar-heading"><span>EL ESTILO DE TU REVISTA</span></div>
          <button type="button" class="ed-nav-item" :class="{ active: section === 'style' }" @click="chooseSection('style')"><Icon name="palette" />Colores y tipografía</button>
          <button type="button" class="ed-nav-item" :class="{ active: section === 'instagram' }" @click="chooseSection('instagram'); format = 'instagram'"><Icon name="instagram" />Versión Instagram</button>
        </template>
      </div>
      <footer class="ed-sidebar-footer"><a href="https://loimportantedehoy.vercel.app" target="_blank" rel="noopener">Visitar la revista<Icon name="external" /></a><a href="/admin/content" @click.prevent="goToDirectus('/admin/content')">Administración Directus<Icon name="grid" /></a><p><span>o7</span> Un espacio para tus historias.</p></footer>
    </aside>

    <div class="ed-workspace">
      <header class="ed-topbar"><button type="button" class="ed-icon-button ed-mobile-menu" aria-label="Abrir navegación" @click="sidebarOpen = true"><Icon name="menu" /></button><div class="ed-breadcrumb">La redacción <span>/</span><strong>{{ draft ? heading : 'Mis ediciones' }}</strong></div><div class="ed-top-actions"><span v-if="draft" class="ed-save-state" :class="{ dirty }"><i />{{ saving ? 'Guardando…' : dirty ? 'Cambios sin guardar' : 'Todo guardado' }}</span><a v-if="hasPublishedUrl" :href="publicUrl" target="_blank" rel="noopener" class="ed-button ed-quiet ed-view-site"><Icon name="external" />Ver revista</a><button v-if="draft" type="button" class="ed-button ed-save-button" :disabled="!dirty || saving || busy" @click="save(false)"><Icon name="save" /><span>{{ saving ? 'Guardando…' : 'Guardar cambios' }}</span></button><button v-if="draft && draft.estado !== 'published'" type="button" class="ed-button ed-gold" :disabled="saving || busy" @click="save(true)"><Icon name="check" />{{ draft.fecha > today() ? 'Programar' : 'Publicar' }}</button><span class="ed-avatar" title="Tu espacio editorial">JM</span></div></header>
      <main class="ed-main">
        <div v-if="error" class="ed-alert" role="alert"><Icon name="clock" /><p>{{ error }}</p><button type="button" class="ed-small-button" @click="proceed(() => loadEdition(selected))">Recargar edición</button><button class="ed-icon-button" aria-label="Cerrar aviso" @click="error = ''"><Icon name="close" /></button></div>
        <div v-if="busy && !draft" class="ed-welcome"><span class="ed-loader" /><h1>Preparando tu mesa de edición…</h1></div>
        <template v-else-if="draft">
          <header class="ed-edition-heading"><div><span class="ed-eyebrow"><i />TU REVISTA, EN TUS MANOS</span><h1>{{ draft.titulo || 'Tu próxima historia' }}<span>.</span></h1><p><span class="ed-status" :class="draft.estado">{{ statusLabel(draft) }}</span>{{ draft.fecha ? dateLabel(draft.fecha) : 'Elige una fecha' }}<span>·</span>{{ activePages.length }} páginas<span v-if="dirty" class="ed-heading-draft">· Vista de trabajo</span></p></div><div class="ed-edition-heading-note"><span>Una historia que importa.</span><strong>Tres maneras de compartirla.</strong><div class="ed-mini-formats"><Icon name="monitor" /><i /><Icon name="phone" /><i /><Icon name="instagram" /></div></div></header>
          <div class="ed-mobile-tabs"><button type="button" :class="{ active: mobilePane === 'editor' }" @click="mobilePane = 'editor'"><Icon name="pencil" />Editar contenido</button><button type="button" :class="{ active: mobilePane === 'preview' }" @click="mobilePane = 'preview'; nextTick(resize)"><Icon name="eye" />Vista previa</button></div>
          <div class="ed-editing-layout" :class="{ 'show-preview': mobilePane === 'preview' }">
            <section class="ed-inspector" :data-highlight="highlighted">
              <header class="ed-inspector-head"><span class="ed-inspector-symbol"><Icon :name="section === 'style' ? 'palette' : section === 'instagram' ? 'instagram' : section === 'edition' ? 'book' : pageIcon(activePage)" /></span><div><span>{{ section === 'pages' ? `PÁGINA ${activePages.indexOf(activePage) + 1} DE ${activePages.length}` : 'EL CONTENIDO DE TU EDICIÓN' }}</span><h2>{{ heading }}</h2></div></header>
              <p class="ed-editable-hint"><Icon name="pencil" />Los campos verdes se pueden editar.</p>
              <form ref="editorForm" class="ed-form" @submit.prevent="save(false)"><fieldset :disabled="saving || busy">
                <template v-if="section === 'edition'">
                  <Field v-model="draft.titulo" label="Personaje o tema" field="titulo" required placeholder="¿Qué historia vas a contar?" />
                  <Field v-model="draft.subtitulo" label="El título que acompaña la portada" field="subtitulo" multiline :rows="2" placeholder="Una frase que invite a descubrirla." />
                  <div class="ed-two-fields"><Field v-model="draft.fecha" label="Día de la edición" field="fecha" type="date" required /><Field v-model="draft.categoria" label="Sección o categoría" field="categoria" /></div>
                  <Field v-model="draft.aniversario" label="Efeméride o aniversario" field="aniversario" placeholder="Un motivo para recordarlo hoy." />
                  <Media :image="draft.imagen_recortada" label="Ilustración de portada" note="Un PNG transparente integra al personaje con los colores de la revista." transparent field="imagen_recortada" @choose="openMedia('edition', 'imagen_recortada')" @clear="draft.imagen_recortada = null" />
                  <Media :image="draft.foto" label="Fotografía de la edición" note="Se utiliza en las páginas interiores y cuando no hay ilustración recortada." field="foto" @choose="openMedia('edition', 'foto')" @clear="draft.foto = null" />
                  <details class="ed-details"><summary>Créditos, fuentes y otros detalles<Icon name="down" /></summary><Field v-model="draft.foto_credito" label="Crédito fotográfico" field="foto_credito" /><Field v-model="draft.foto_fuente" label="Enlace a la fuente de la imagen" field="foto_fuente" type="url" /><Field v-model="draft.foto_posicion" label="Encuadre de la fotografía" field="foto_posicion" note="Posición horizontal y vertical. Por ejemplo: 50% 35%." /><Field v-model="sourceText" label="Fuentes editoriales" field="fuentes" multiline :rows="4" note="Una fuente por línea." @update:model-value="draft.fuentes = $event.split('\n').map(value => value.trim()).filter(Boolean)" /><Field v-model="draft.slug" label="Enlace alternativo" field="slug" note="Letras minúsculas, números y guiones." /><Media :image="draft.portada" label="Original de referencia" note="Opcional. Se conserva como documento de referencia." @choose="openMedia('edition', 'portada')" @clear="draft.portada = null" /></details>
                </template>
                <template v-else-if="section === 'pages' && activePage">
                  <div class="ed-page-actions"><span>{{ activePage.slug === 'portada' ? 'La portada abre tu revista.' : 'Organiza el orden de lectura.' }}</span><button type="button" class="ed-icon-button" aria-label="Subir página" :disabled="activePages.indexOf(activePage) <= 1" @click="movePage(activePage, -1)"><Icon name="up" /></button><button type="button" class="ed-icon-button" aria-label="Bajar página" :disabled="activePages.indexOf(activePage) === 0 || activePages.indexOf(activePage) === activePages.length - 1" @click="movePage(activePage, 1)"><Icon name="down" /></button></div>
                  <p v-if="activePage.slug === 'portada'" class="ed-callout">Los textos y la imagen de esta página se editan en «Portada y edición».<button type="button" @click="chooseSection('edition')">Editar portada <Icon name="arrow" /></button></p>
                  <template v-else>
                    <label class="ed-label">Composición de la página</label><div class="ed-layout-choices"><button v-for="layout in layouts" :key="layout.value" type="button" :class="{ active: activePage.tipo === layout.value }" @click="activePage.tipo = layout.value"><Icon :name="layout.icon" /><strong>{{ layout.name }}</strong><small>{{ layout.note }}</small></button></div>
                    <Field v-model="activePage.titulo" label="Título de esta página" field="titulo" multiline :rows="2" />
                    <Field v-model="activePage.antetitulo" label="Antetítulo" field="antetitulo" />
                    <Field v-model="activePage.entradilla" label="Introducción" field="entradilla" multiline :rows="3" />
                    <template v-if="activePage.tipo === 'story' || activePage.tipo === 'facts'"><Field v-model="activePage.contenido" label="El texto de tu historia" field="contenido" multiline :rows="8" note="Separa los párrafos con una línea en blanco." /></template>
                    <template v-if="activePage.tipo === 'facts'">
                      <section class="ed-repeater" data-editor-field="cifras"><header><h3>Cifras que cuentan una historia</h3><button type="button" class="ed-small-button" @click="addRow('cifras')"><Icon name="plus" />Añadir cifra</button></header><div v-for="(row, index) in activePage.cifras" :key="index" class="ed-repeater-row"><Field v-model="row.value" label="Cifra" :field="`cifra-${index}`" /><Field v-model="row.label" label="Qué significa" :field="`cifra-label-${index}`" /><button type="button" class="ed-icon-button" :aria-label="`Quitar cifra ${index + 1}`" @click="activePage.cifras.splice(index, 1)"><Icon name="close" /></button></div><p v-if="!activePage.cifras.length">Personas, años, obras… destaca los números que importan.</p></section>
                      <section class="ed-repeater" data-editor-field="entradas"><header><h3>Hechos y momentos</h3><button type="button" class="ed-small-button" @click="addRow('entradas')"><Icon name="plus" />Añadir detalle</button></header><article v-for="(row, index) in activePage.entradas" :key="index"><Field v-model="row.label" label="Título o fecha" :field="`detalle-${index}`" /><Field v-model="row.text" label="El detalle" :field="`detalle-texto-${index}`" multiline :rows="2" /><button type="button" class="ed-remove" @click="activePage.entradas.splice(index, 1)">Quitar este detalle</button></article></section>
                    </template>
                    <template v-if="activePage.tipo === 'quote'"><Field v-model="activePage.cita" label="Las palabras que inspiran" field="cita" multiline :rows="4" /><Field v-model="activePage.atribucion" label="Quién las dijo" field="atribucion" /><Field v-model="activePage.contenido" label="Una reflexión para acompañarlas" field="contenido" multiline :rows="4" /></template>
                    <template v-if="activePage.tipo === 'music'"><Field v-model="activePage.cancion_titulo" label="La canción del día" field="cancion_titulo" /><Field v-model="activePage.cancion_artista" label="Artista" field="cancion_artista" /><Field v-model="activePage.cancion_album" label="Álbum o versión" field="cancion_album" /><Field v-model="activePage.cancion_url" label="Escuchar en YouTube" field="cancion_url" type="url" placeholder="https://www.youtube.com/watch?v=…" /><Field v-model="activePage.cancion_nota" label="Por qué conecta con esta historia" field="cancion_nota" multiline :rows="5" /></template>
                    <Media :image="activePage.foto" label="Imagen de esta página" note="Si la dejas vacía, se utiliza la fotografía de la edición." field="foto" @choose="openMedia('page', 'foto', activePage)" @clear="activePage.foto = null" />
                  </template>
                  <details class="ed-details"><summary>Nombre, enlace y créditos<Icon name="down" /></summary><Field v-model="activePage.etiqueta" label="Nombre en el índice" field="etiqueta" /><Field v-if="activePage.slug !== 'portada'" :model-value="activePage.slug" label="Enlace de esta página" field="slug" @update:model-value="renamePage" /><Field v-model="activePage.foto_credito" label="Crédito de la imagen" field="foto_credito" /><Field v-model="activePage.foto_fuente" label="Fuente de la imagen" field="foto_fuente" type="url" /></details>
                  <button v-if="activePage.slug !== 'portada'" type="button" class="ed-remove ed-archive-page" @click="archivePage(activePage)"><Icon name="archive" />Retirar esta página de la edición</button>
                  <details v-if="archivedPages.length" class="ed-details"><summary>Páginas retiradas · {{ archivedPages.length }}<Icon name="down" /></summary><div v-for="item in archivedPages" :key="item.id" class="ed-restore"><span>{{ item.etiqueta }}</span><button type="button" @click="restorePage(item)"><Icon name="undo" />Recuperar</button></div></details>
                </template>
                <template v-else-if="section === 'style'">
                  <p class="ed-form-intro">La identidad del cliente, a tu manera. Los cambios se aplican a esta edición y a sus tres formatos.</p>
                  <div class="ed-palette-preview" :style="{ background: theme.color_fondo, color: theme.color_texto, borderColor: theme.color_lineas }"><strong :style="{ color: theme.color_titulos }">{{ draft.titulo || 'Lo importante' }}</strong><span :style="{ color: theme.color_acento }">Historias que se quedan.</span><p>Una muestra de tus colores.</p></div>
                  <div class="ed-color-grid"><label v-for="(label, field) in colorLabels" :key="field" class="ed-color"><span>{{ label }}</span><div><input type="color" :value="theme[field]" :aria-label="label" @input="draft[field] = $event.target.value" /><input :value="draft[field] || theme[field]" :aria-label="`Código de ${label}`" maxlength="7" @input="draft[field] = $event.target.value" /></div></label></div>
                  <label class="ed-field"><span>Tipografía de títulos</span><select :value="draft.fuente_titulos || theme.fuente_titulos" @change="draft.fuente_titulos = $event.target.value"><option value="clasica">Clásica · Georgia</option><option value="editorial">Editorial · Cormorant</option><option value="moderna">Moderna · DM Sans</option></select></label>
                  <label class="ed-field"><span>Tipografía de lectura</span><select :value="draft.fuente_texto || theme.fuente_texto" @change="draft.fuente_texto = $event.target.value"><option value="clasica">Clásica · Georgia</option><option value="editorial">Editorial · Cormorant</option><option value="moderna">Moderna · DM Sans</option></select></label>
                  <label class="ed-range"><span>Tamaño del texto<strong>{{ draft.tamano_texto || theme.tamano_texto }} px</strong></span><input type="range" min="16" max="24" step="1" :value="draft.tamano_texto || theme.tamano_texto" @input="draft.tamano_texto = Number($event.target.value)" /></label>
                  <label class="ed-checkbox"><input type="checkbox" :checked="draft.titulos_dorados ?? theme.titulos_dorados" @change="draft.titulos_dorados = $event.target.checked" /><span>Efecto dorado en títulos y cifras</span></label>
                  <div class="ed-style-actions"><button type="button" class="ed-small-button" @click="originalStyle"><Icon name="palette" />Colores originales del cliente</button><button type="button" class="ed-small-button" @click="resetStyle"><Icon name="undo" />Usar la identidad general</button></div><a class="ed-text-link" href="/admin/content/apariencia" @click.prevent="goToDirectus('/admin/content/apariencia')">Editar la identidad de toda la revista<Icon name="external" /></a>
                </template>
                <template v-else-if="section === 'instagram'">
                  <p class="ed-form-intro">El cartel se compone con los textos de tu revista. Aquí puedes escribir una versión más breve para el formato 4:5.</p><span class="ed-format-tag"><Icon name="instagram" />1080 × 1350 · Una composición editorial</span>
                  <Field v-for="field in instagramFields" :key="field" v-model="draft[field]" :field="field" :label="instagramLabels[field]" :multiline="['instagram_biografia', 'instagram_dato', 'instagram_destacado'].includes(field)" :rows="3" placeholder="Usar el texto de la revista" note="Vacío: se utiliza el contenido de las páginas." />
                  <Media :image="draft.instagram_foto" label="Fotografía secundaria" note="Opcional. Se utiliza la foto de la edición si este campo queda vacío." @choose="openMedia('edition', 'instagram_foto')" @clear="draft.instagram_foto = null" />
                </template>
              </fieldset></form>
              <footer class="ed-inspector-footer"><Icon name="check" /><p>{{ saved ? 'Los cambios guardados se reflejarán en tu edición publicada.' : 'Tu borrador es privado. Solo se publicará cuando tú lo decidas.' }}</p></footer>
            </section>

            <section class="ed-preview-panel">
              <header class="ed-preview-toolbar"><div class="ed-format-switch" role="group" aria-label="Formato de vista previa"><button v-for="(item, key) in formats" :key="key" type="button" :aria-pressed="format === key" @click="format = key"><Icon :name="item.icon" /><span>{{ item.label }}</span></button></div><div class="ed-preview-actions"><button type="button" class="ed-icon-button" aria-label="Actualizar vista previa" @click="schedulePreview(true)"><Icon name="refresh" /></button><button type="button" class="ed-icon-button" aria-label="Ampliar vista previa" @click="expandedDialog.showModal()"><Icon name="expand" /></button></div></header>
              <div class="ed-preview-caption"><span><i :class="{ updating: composing }" />{{ composing ? 'Componiendo tu revista…' : 'Vista en vivo' }}</span><small>{{ format === 'instagram' ? 'Haz clic en un texto para editarlo.' : `${activePage?.etiqueta || 'Portada'} · Pasa las páginas o haz clic para editar.` }}</small></div>
              <div v-if="previewError" class="ed-preview-error" role="alert"><Icon name="eye" /><p>{{ previewError }}</p></div>
              <div ref="canvas" class="ed-canvas" :class="[`format-${format}`, { composing }]" :aria-busy="composing"><div v-if="html" class="ed-artboard" :style="{ width: `${size.width * scale}px`, height: `${size.height * scale}px` }"><iframe ref="frame" :key="html" :srcdoc="html" @load="previewLoaded" :title="`Vista previa ${size.label}`" :width="size.width" :height="size.height" :style="{ transform: `scale(${scale})` }" /></div><div v-else class="ed-canvas-empty"><Icon name="book" /><span>Tu historia toma forma aquí.</span></div></div>
              <footer class="ed-canvas-footer"><span>{{ size.note }}</span><label><span class="ed-sr-only">Zoom del lienzo</span><select v-model="zoom"><option value="fit">Ajustar</option><option value="50">50%</option><option value="75">75%</option><option value="100">100%</option></select></label><button type="button" class="ed-button ed-export-button" :disabled="generating || !html || saving" @click="generate"><Icon name="upload" /><span>{{ generating ? 'Creando archivo…' : format === 'instagram' ? 'Exportar Instagram' : 'Exportar vista · PNG' }}</span></button></footer>
            </section>
          </div>
        </template>
        <section v-else class="ed-welcome"><Icon name="book" /><h1>Una nueva historia empieza aquí.</h1><p>Crea tu primera edición y empieza a darle forma.</p><button type="button" class="ed-button ed-gold" @click="newDialog.showModal()"><Icon name="plus" />Crear una edición</button></section>
      </main>
    </div>
    <div v-if="notice" class="ed-toast" role="status"><Icon name="check" />{{ notice }}</div>

    <dialog ref="discardDialog" class="ed-dialog ed-small-dialog" @click.self="discardDialog.close()"><section><span class="ed-dialog-icon"><Icon name="pencil" /></span><h2>Tu historia aún tiene cambios.</h2><p>Guárdalos antes de salir o descártalos para continuar.</p><footer><button type="button" class="ed-button ed-quiet" @click="discardDialog.close()">Seguir editando</button><button type="button" class="ed-button" @click="discardAndContinue">Descartar cambios</button></footer></section></dialog>
    <dialog ref="newDialog" class="ed-dialog ed-small-dialog" @click.self="newDialog.close()"><form @submit.prevent="createEdition"><button type="button" class="ed-icon-button ed-dialog-close" aria-label="Cerrar" @click="newDialog.close()"><Icon name="close" /></button><span class="ed-eyebrow">UNA NUEVA JORNADA</span><h2>¿Qué historia importa hoy?</h2><p>Crea una edición privada con cuatro páginas listas para editar.</p><Field v-model="newTitle" label="Personaje o tema" field="nuevo-titulo" required placeholder="El nombre de tu próxima historia" /><Field v-model="newDate" label="Fecha de publicación" field="nueva-fecha" type="date" required /><p v-if="newError" class="ed-form-error" role="alert">{{ newError }}</p><footer><button type="button" class="ed-button ed-quiet" @click="newDialog.close()">Cancelar</button><button type="submit" class="ed-button ed-gold" :disabled="creating">{{ creating ? 'Creando…' : 'Crear borrador' }}<Icon name="arrow" /></button></footer></form></dialog>
    <dialog ref="addDialog" class="ed-dialog ed-small-dialog" @click.self="addDialog.close()"><section><span class="ed-eyebrow">UNA PÁGINA MÁS</span><h2>Elige cómo contarla.</h2><div class="ed-layout-choices ed-page-types"><button v-for="layout in layouts" :key="layout.value" type="button" :class="{ active: newType === layout.value }" @click="newType = layout.value"><Icon :name="layout.icon" /><strong>{{ layout.name }}</strong><small>{{ layout.note }}</small></button></div><footer><button type="button" class="ed-button ed-quiet" @click="addDialog.close()">Cancelar</button><button type="button" class="ed-button ed-gold" @click="addPage"><Icon name="plus" />Añadir página</button></footer></section></dialog>
    <dialog ref="mediaDialog" class="ed-dialog ed-library-dialog" @click.self="mediaDialog.close()"><section><header><div><span class="ed-eyebrow">TU BIBLIOTECA VISUAL</span><h2>La imagen también cuenta.</h2></div><button type="button" class="ed-icon-button" aria-label="Cerrar biblioteca" @click="mediaDialog.close()"><Icon name="close" /></button></header><div class="ed-library-tools"><label class="ed-search"><Icon name="search" /><input v-model="mediaSearch" aria-label="Buscar imágenes" placeholder="Buscar en tus imágenes…" /></label><button type="button" class="ed-button ed-gold" :disabled="mediaBusy" @click="uploadInput.click()"><Icon name="upload" />Subir una imagen</button><input ref="uploadInput" class="ed-sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif" @change="upload" /></div><p v-if="mediaError" class="ed-form-error" role="alert">{{ mediaError }}</p><p v-if="mediaBusy" class="ed-library-loading">Preparando tus imágenes…</p><div class="ed-media-grid"><button v-for="item in mediaRows" :key="item.id" type="button" @click="pickMedia(item)"><span><img :src="`/assets/${item.id}?width=280&quality=75`" :alt="item.title || item.filename_download" /></span><strong>{{ item.title || item.filename_download }}</strong><small>{{ item.width }} × {{ item.height }}</small></button></div><p v-if="!mediaBusy && !mediaRows.length" class="ed-library-loading">Todavía no hay imágenes. Sube la primera para tu historia.</p><footer><span>JPG, PNG, WebP o AVIF · Hasta 15 MB</span><button type="button" class="ed-button ed-quiet" @click="mediaDialog.close()">Volver a la edición</button></footer></section></dialog>
    <dialog ref="expandedDialog" class="ed-dialog ed-expanded" @click.self="expandedDialog.close()"><header><strong>{{ draft?.titulo }} · {{ size.label }}</strong><button type="button" class="ed-icon-button" aria-label="Cerrar vista ampliada" @click="expandedDialog.close()"><Icon name="close" /></button></header><iframe v-if="html" :srcdoc="expandedHtml" :title="`Vista ampliada ${size.label}`" /></dialog>
  </div>
</template>
