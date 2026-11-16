<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';
const api = useApi();
const editions = ref([]);
const selected = ref('');
const format = ref('instagram');
const pages = ref([]);
const page = ref('');
const html = ref('');
const loading = ref(false);
const generating = ref(false);
const composing = ref(false);
const error = ref('');
const message = ref('');
const updated = ref('');
const stage = ref();
const scale = ref(.55);
let observer;
let revision = 0;
const formats = { desktop: { label: 'Desktop', width: 1440, height: 1000, note: 'Lector completo · 1440 × 1000', export: 'Exportar esta página · PNG' }, mobile: { label: 'Mobile', width: 390, height: 844, note: 'Lector completo · 390 × 844 · PNG a 2×', export: 'Exportar esta página · PNG' }, instagram: { label: 'Instagram', width: 1080, height: 1350, note: 'Composición editorial · 1080 × 1350 · 4:5', export: 'Generar Instagram · PNG' } };
const size = computed(() => formats[format.value]);
const edition = computed(() => editions.value.find(item => String(item.id) === selected.value));
function resize() { if (stage.value) scale.value = Math.min(1, Math.max(.15, (stage.value.clientWidth - 48) / size.value.width)); }
async function explain(caught) {
  let data = caught.response?.data;
  if (data instanceof Blob) { try { data = JSON.parse(await data.text()); } catch {} }
  return data?.errors?.[0]?.message || 'No se pudo cargar la edición. Comprueba tu conexión y tus permisos.';
}
async function refresh(resetPage = false) {
  if (!selected.value) return;
  const current = ++revision;
  loading.value = true; composing.value = false; error.value = ''; message.value = '';
  try {
    const { data } = await api.get(`/items/ediciones/${selected.value}`, { params: { fields: 'id,titulo,fecha,estado,paginas.slug,paginas.etiqueta,paginas.estado,paginas.orden' } });
    if (current !== revision) return;
    const index = editions.value.findIndex(item => String(item.id) === selected.value);
    if (index >= 0) editions.value[index] = { id: data.data.id, titulo: data.data.titulo, fecha: data.data.fecha, estado: data.data.estado };
    pages.value = (data.data.paginas || []).filter(item => item.estado !== 'archived').sort((a, b) => a.orden - b.orden);
    if (resetPage || !pages.value.some(item => item.slug === page.value)) page.value = pages.value[0]?.slug || '';
    const response = await api.get(`/revista-studio/preview/${selected.value}/${format.value}`, { params: { chapter: format.value === 'instagram' ? '' : page.value }, responseType: 'text' });
    if (current !== revision) return;
    composing.value = true;
    html.value = '';
    await nextTick();
    html.value = response.data;
    updated.value = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    await nextTick(); resize();
  } catch (caught) { if (current === revision) { html.value = ''; composing.value = false; error.value = await explain(caught); } }
  finally { if (current === revision) loading.value = false; }
}
async function previewLoaded(event) {
  const frame = event.target;
  const current = revision;
  for (let attempt = 0; attempt < 200 && current === revision; attempt++) {
    const preview = frame.contentWindow;
    if (preview?.__STUDIO_ERROR__) { error.value = preview.__STUDIO_ERROR__; composing.value = false; return; }
    if (preview?.__STUDIO_READY__) { composing.value = false; return; }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  if (current === revision) { composing.value = false; error.value = 'La vista previa no terminó de cargar. Actualiza para intentarlo de nuevo.'; }
}
async function generate() {
  generating.value = true; error.value = ''; message.value = '';
  try {
    // Read the saved edition again on the server for each generation.
    const response = await api.post(`/revista-studio/generate/${selected.value}/${format.value}`, { page: format.value === 'instagram' ? '' : page.value }, { responseType: 'blob', timeout: 45000 });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a'); link.href = url;
    link.download = `${edition.value.fecha.slice(0, 10)}-${format.value}${format.value !== 'instagram' ? `-${page.value}` : ''}.png`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    message.value = 'Imagen generada con el contenido guardado. Descarga lista.';
  } catch (caught) { error.value = await explain(caught); }
  finally { generating.value = false; }
}
onMounted(async () => {
  observer = new ResizeObserver(resize);
  if (stage.value) observer.observe(stage.value);
  try {
    const { data } = await api.get('/items/ediciones', { params: { fields: 'id,titulo,fecha,estado', sort: '-fecha', limit: 100 } });
    editions.value = data.data; selected.value = String(data.data[0]?.id || '');
    if (selected.value) await refresh(true);
  } catch (caught) { error.value = await explain(caught); }
});
watch(stage, element => { observer?.disconnect(); if (element) observer?.observe(element); }, { flush: 'post' });
onBeforeUnmount(() => observer?.disconnect());
</script>
<template>
  <private-view title="Studio de publicación">
    <div class="publication-studio">
      <section class="studio-intro"><span>LO IMPORTANTE DE HOY · JERRYMC</span><h1>Una edición. Tres formatos.</h1><p>Edita los textos, las imágenes y la identidad visual en Directus. Guarda los cambios y actualiza aquí para revisar y generar cada versión.</p></section>
      <div class="studio-toolbar">
        <label>Edición<select v-model="selected" @change="refresh(true)"><option v-for="item in editions" :key="item.id" :value="String(item.id)">{{ item.fecha.slice(0, 10) }} · {{ item.titulo }}{{ item.estado !== 'published' ? ' · Borrador' : '' }}</option></select></label>
        <div class="studio-actions"><a v-if="selected" :href="`/admin/content/ediciones/${selected}`">Editar edición ↗</a><a href="/admin/content/apariencia">Colores y tipografía ↗</a><button type="button" :disabled="loading || generating || !selected" @click="refresh()">{{ loading ? 'Actualizando…' : 'Actualizar vista previa' }}</button></div>
      </div>
      <nav class="format-tabs" aria-label="Formato de publicación"><button v-for="(item, key) in formats" :key="key" type="button" :aria-pressed="format === key" :disabled="loading || generating" @click="format = key; refresh()">{{ item.label }}<small>{{ key === 'instagram' ? '1080 × 1350' : key === 'mobile' ? '390 × 844' : '1440 × 1000' }}</small></button></nav>
      <div class="studio-export-bar"><div><strong>{{ size.note }}</strong><p v-if="updated">Contenido guardado · Vista actualizada a las {{ updated }}<span v-if="edition?.estado !== 'published'"> · Borrador privado</span></p></div><label v-if="format !== 'instagram'" class="page-select">Página a previsualizar y exportar<select v-model="page" @change="refresh()"><option v-for="item in pages" :key="item.slug" :value="item.slug">{{ item.etiqueta }}</option></select></label><button type="button" class="generate-button" :disabled="!html || generating || loading || composing" @click="generate">{{ generating ? 'Generando imagen…' : size.export }}</button></div>
      <p v-if="format === 'instagram'" class="studio-help">El cartel se compone con el contenido de esta edición y sus colores. Para ajustar la versión corta, abre «Formato Instagram» en Editar edición.</p><p v-else class="studio-help">Puedes pasar las páginas dentro del lector. El selector indica la página que se descargará. Al publicar la edición, la web utiliza este mismo lector y se adapta a la pantalla.</p>
      <p v-if="error" class="studio-error" role="alert">{{ error }}</p><p v-if="message" class="studio-success" role="status">{{ message }}</p>
      <div ref="stage" class="studio-stage" :aria-busy="loading || composing"><div v-if="html" class="studio-frame-wrap" :style="{ width: `${size.width * scale}px`, height: `${size.height * scale}px` }"><iframe :key="html" :srcdoc="html" @load="previewLoaded" :title="`Vista previa ${size.label}`" :width="size.width" :height="size.height" :style="{ transform: `scale(${scale})` }" /></div><p v-else-if="!loading">Selecciona una edición con páginas para comenzar.</p><span v-if="loading || composing" class="studio-loading">{{ loading ? "Cargando la edición…" : "Componiendo la edición…" }}</span></div>
    </div>
  </private-view>
</template>
<style scoped>
.publication-studio{padding:0 32px 48px;max-width:1700px;color:var(--theme--foreground);font-family:var(--theme--fonts--sans--font-family)}.studio-intro{background:#091a38;color:#f7f1df;border:1px solid #c6a34d;border-radius:12px;padding:24px 28px;margin-bottom:24px}.studio-intro>span{font-size:11px;letter-spacing:2px;color:#f3cc57}.studio-intro h1{font:38px/1.1 Georgia,serif;color:#f3cc57;margin:8px 0 12px}.studio-intro p{max-width:830px;line-height:1.55}.studio-toolbar{display:flex;justify-content:space-between;gap:24px;align-items:end;flex-wrap:wrap}.publication-studio label{display:grid;gap:8px;font-size:13px;font-weight:600}.publication-studio select{border:1px solid var(--theme--border-color);border-radius:7px;background:var(--theme--background);color:inherit;padding:11px 14px;min-width:240px;font:inherit}.studio-actions{display:flex;gap:18px;align-items:center;flex-wrap:wrap}.studio-actions a{font-size:13px;color:var(--theme--primary);text-decoration:underline;text-underline-offset:4px}.publication-studio button{border:1px solid var(--theme--border-color);background:var(--theme--background);color:inherit;border-radius:7px;padding:11px 17px;cursor:pointer;font-weight:600}.publication-studio button:disabled{opacity:.5;cursor:wait}.format-tabs{display:flex;gap:12px;margin:25px 0 18px;border-bottom:1px solid var(--theme--border-color);padding-bottom:15px}.format-tabs button{min-width:145px;text-align:left}.format-tabs button[aria-pressed=true]{background:#091a38;color:#f3cc57;border-color:#c6a34d}.format-tabs small{display:block;font-size:11px;opacity:.7;font-weight:400;margin-top:4px}.studio-export-bar{display:flex;align-items:center;gap:24px;justify-content:space-between;flex-wrap:wrap}.studio-export-bar strong{font-size:14px}.studio-export-bar p{font-size:12px;opacity:.7;margin-top:4px}.studio-export-bar .generate-button{background:#f3cc57;border-color:#c6a34d;color:#091a38}.studio-help{font-size:13px;line-height:1.5;opacity:.75;margin:14px 0}.studio-stage{position:relative;display:flex;justify-content:center;align-items:start;padding:24px;background:var(--theme--background-subdued);border:1px solid var(--theme--border-color);border-radius:10px;overflow:auto;min-height:280px}.studio-frame-wrap{position:relative;flex:none;box-shadow:0 10px 30px #0003}.studio-stage iframe{position:absolute;top:0;left:0;border:0;transform-origin:top left;background:#091a38;max-width:none}.studio-error,.studio-success{padding:14px 18px;border-radius:8px;margin:12px 0}.studio-error{background:#c43b331a;color:var(--theme--danger)}.studio-success{background:#23814a1a;color:var(--theme--success)}.studio-loading{position:absolute;inset:0;display:grid;place-items:center;background:var(--theme--background);opacity:.9;font-size:18px}@media(max-width:800px){.publication-studio{padding-inline:14px}.format-tabs{gap:7px}.format-tabs button{min-width:0;flex:1}.studio-intro h1{font-size:30px}.studio-actions{gap:12px}}
</style>
