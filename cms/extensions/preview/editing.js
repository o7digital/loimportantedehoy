export function initEditing(snapshot) {
  if (!snapshot.editing) return;
  document.body.classList.add('studio-editing');
  const mark = (selector, target, field, page = '') => {
    document.querySelectorAll(selector).forEach(element => {
      element.dataset.studioTarget = target; element.dataset.studioField = field;
      if (page) element.dataset.studioPage = page;
      element.title = 'Editar este contenido';
    });
  };
  const edition = snapshot.edition;
  mark('.journal-cover-copy h1', 'edition', 'titulo');
  mark('.journal-cover-deck', 'edition', 'subtitulo');
  mark('.journal-cover-anniversary', 'edition', 'aniversario');
  mark('.journal-cover-visual .journal-photograph', 'edition', edition.coverCutout ? 'imagen_recortada' : 'foto');
  for (const chapter of edition.chapters) {
    const root = `.journal-page[id="${CSS.escape(chapter.id)}"]`;
    if (chapter.id === 'portada') continue;
    mark(`${root} h2`, 'page', 'titulo', chapter.id);
    mark(`${root} .journal-lead`, 'page', chapter.song ? 'cancion_nota' : 'entradilla', chapter.id);
    mark(`${root} .journal-body-text`, 'page', 'contenido', chapter.id);
    mark(`${root} .journal-photograph`, 'page', 'foto', chapter.id);
    mark(`${root} .journal-big-stats`, 'page', 'cifras', chapter.id);
    mark(`${root} .journal-entry-list`, 'page', 'entradas', chapter.id);
    mark(`${root} blockquote p`, 'page', 'cita', chapter.id);
    mark(`${root} blockquote cite`, 'page', 'atribucion', chapter.id);
    mark(`${root} .journal-music-art h2`, 'page', 'cancion_titulo', chapter.id);
  }
  const overrides = { '.p-title': 'instagram_titulo', '.p-deck': 'instagram_subtitulo', '.p-highlight': 'instagram_destacado', '.p-bio': 'instagram_biografia', '.p-fact': 'instagram_dato', '.p-missions>h2:first-child': 'instagram_titulo_hechos', '.p-details>h2': 'instagram_titulo_detalles' };
  for (const [selector, field] of Object.entries(overrides)) mark(selector, 'instagram', field);
  mark('.p-hero-art', 'edition', edition.coverCutout ? 'imagen_recortada' : 'foto');
  const music = edition.chapters.find(chapter => chapter.song);
  if (music) { mark('.p-song', 'page', 'cancion_titulo', music.id); mark('.p-music-note', 'page', 'cancion_nota', music.id); }
  const facts = edition.chapters.find(chapter => chapter.stats?.length) || edition.chapters.find(chapter => chapter.entries?.length);
  const details = edition.chapters.find(chapter => chapter.entries?.length && chapter !== facts);
  const quote = edition.chapters.find(chapter => chapter.quote);
  if (facts) { mark('.p-stats', 'page', 'cifras', facts.id); mark('.p-entry-block', 'page', 'entradas', facts.id); }
  if (details) mark('.p-details-entries', 'page', 'entradas', details.id);
  if (quote) mark('.p-quote-text', 'page', 'cita', quote.id);
  const track = document.querySelector('.journal-track');
  if (track) {
    let lastPage = '';
    const reportPage = () => {
      const current = track.querySelector('.journal-page[data-current=true]');
      if (!current || current.id === lastPage) return;
      lastPage = current.id;
      window.parent.postMessage({ type: 'revista-page', page: current.id }, '*');
    };
    new MutationObserver(reportPage).observe(track, { subtree: true, attributes: true, attributeFilter: ['data-current'] });
    reportPage();
  }
  document.addEventListener('click', event => {
    const element = event.target.closest?.('[data-studio-field]');
    if (!element) return;
    event.preventDefault(); event.stopImmediatePropagation();
    window.parent.postMessage({ type: 'revista-select', target: element.dataset.studioTarget, field: element.dataset.studioField, page: element.dataset.studioPage || '' }, '*');
  }, true);
}
