import { normalizeEdition } from '../../../../src/lib/edition-model.ts';
import { resolveTheme, themeStyle } from '../../../../src/lib/magazine-theme.ts';
const assetVersion = Date.now().toString(36);
export const formats = { desktop: { width: 1440, height: 1000 }, mobile: { width: 390, height: 844 }, instagram: { width: 1080, height: 1350 } };
export class StudioValidationError extends Error {}
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
const image = (url, className = '') => url ? `<img class="${className}" src="${esc(url)}" alt="">` : '';
const fit = (text, className = '', min = 19) => `<div class="${className}" data-fit data-min="${min}">${esc(text)}</div>`;

function poster(edition, raw) {
  const chapters = edition.chapters;
  const story = chapters.find(page => page.id !== 'portada' && (page.layout === 'story' || (!page.entries && !page.quote && !page.song))) || chapters[1] || chapters[0];
  const facts = chapters.find(page => page.stats?.length) || chapters.find(page => page.entries?.length);
  const details = chapters.find(page => page.entries?.length && page !== facts);
  const quote = chapters.find(page => page.quote);
  const song = chapters.find(page => page.song)?.song;
  const style = Object.entries(themeStyle(resolveTheme(edition.theme))).map(([key, value]) => `${key}:${value}`).join(';');
  const asset = raw.instagram_foto ? new URL(`/assets/${encodeURIComponent(raw.instagram_foto)}`, edition.image || edition.photograph).href : edition.photograph;
  const signature = `<span class="p-signature">JerryMC</span>`;
  return `<article class="poster" style="${esc(style)}" data-gold="${edition.theme.titulos_dorados}">
    <header class="p-header"><time>${esc(edition.dateLabel.replace(/ de \d{4}$/, ''))}</time><div><strong>Lo importante de hoy</strong><em>Hechos y personajes importantes · Música que conecta · Palabras que inspiran</em></div><div class="p-brand"><span class="p-prism"><i></i></span>${signature}</div></header>
    <section class="p-hero"><div class="p-hero-copy"><div class="p-title-block">${fit(raw.instagram_titulo || edition.title, 'p-title', 55)}${fit(raw.instagram_subtitulo || edition.subtitle, 'p-deck', 25)}</div>${fit(edition.anniversary, 'p-anniversary', 20)}${fit(raw.instagram_destacado || story?.title, 'p-highlight', 24)}<div class="p-biography">${image(asset)}${fit(raw.instagram_biografia || story?.intro || edition.subtitle, 'p-bio', 19)}</div><div class="p-stats"><h2 data-fit data-min="22">${esc(facts?.kicker || 'Una historia que importa')}</h2><div>${(facts?.stats || []).slice(0, 3).map(stat => `<div><strong>${esc(stat.value)}</strong><span>${esc(stat.label)}</span></div>`).join('')}</div>${fit(facts?.intro || '', 'p-stats-note', 17)}</div></div><div class="p-hero-art ${edition.coverCutout ? 'p-cutout' : 'p-photo'}">${image(edition.coverCutout || edition.photograph || edition.image)}</div></section>
    <section class="p-columns"><div class="p-missions"><h2 data-fit data-min="22">${esc(raw.instagram_titulo_hechos || (facts?.stats ? 'Misiones que dejaron huella' : facts?.kicker) || 'Momentos importantes')}</h2><div class="p-entry-block" data-fit data-min="18">${(facts?.entries || []).map(entry => `<p><b>${esc(entry.label)}</b> · ${esc(entry.text)}</p>`).join('')}</div><h2 class="p-fact-label" data-fit data-min="22">Dato interesante</h2>${fit(raw.instagram_dato || details?.paragraphs?.[0] || facts?.paragraphs?.[0] || story?.paragraphs?.[0] || '', 'p-fact', 18)}</div><div class="p-details"><h2 data-fit data-min="22">${esc(raw.instagram_titulo_detalles || details?.kicker || 'Detrás de la historia')}</h2>${fit(details?.intro || quote?.paragraphs?.[0] || '', 'p-details-intro', 19)}<div class="p-details-entries" data-fit data-min="19">${(details?.entries || []).map(entry => `<p><b>${esc(entry.label)}:</b> ${esc(entry.text)}</p>`).join('')}</div></div></section>
    <section class="p-quote">${fit(quote?.quote ? `«${quote.quote}»` : story?.title || '', 'p-quote-text', 24)}<p>${esc(quote?.attribution || '')}</p></section>
    <section class="p-music"><div><h2 data-fit data-min="22">♫ Música que conecta</h2>${fit(song?.title || '', 'p-song', 27)}${fit(song ? [song.artist, song.album].filter(Boolean).join(' · ') : '', 'p-album', 16)}</div>${fit(song?.note || '', 'p-music-note', 21)}</section>
    <footer class="p-footer"><span>Fuentes: ${esc(edition.sources.join(' · '))}</span><span>◎ @loimportantehoyjerrymc</span><span>Lo importante de hoy</span>${signature}</footer>
  </article>`;
}

export function makeDocument(raw, appearance, baseUrl, format, page = '') {
  const edition = normalizeEdition(raw, baseUrl, resolveTheme(appearance), true);
  if (!edition.chapters.length) throw new StudioValidationError('Añade al menos una página a esta edición.');
  if (page && !edition.chapters.some(chapter => chapter.id === page)) throw new StudioValidationError('La página seleccionada ya no existe. Actualiza la vista previa.');
  const assets = `${baseUrl}/revista-studio/assets`;
  const isPoster = format === 'instagram';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(edition.title)} · ${esc(format)}</title><link rel="stylesheet" href="${assets}/${isPoster ? 'poster' : 'reader'}.css?v=${assetVersion}"></head><body>${isPoster ? poster(edition, raw) : '<div id="root"></div>'}<script type="application/json" id="studio-data">${json({ edition, page })}</script><script src="${assets}/${isPoster ? 'poster' : 'reader'}.js?v=${assetVersion}" defer></script></body></html>`;
}
