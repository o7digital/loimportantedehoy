import { useEffect, useRef, useState } from "react";
import type { Magazine, MagazineChapter } from "../data/magazines";
import "../styles/magazine.css";

function Arrow({ previous = false }: { previous?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={previous ? "M19 12H5m6-6-6 6 6 6" : "M5 12h14m-6-6 6 6-6 6"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ChapterContent({ chapter, edition, nextEdition }: { chapter: MagazineChapter; edition: Magazine; nextEdition: Magazine }) {
  if (chapter.id === "portada") {
    return <div className="reader-cover-content">
      <div className="reader-cover-topline"><span>LA EDICIÓN DEL DÍA</span><span>JERRYMC ↗</span></div>
      <a className="reader-poster" href={edition.image} target="_blank" rel="noreferrer" aria-label={`Ver la portada original de ${edition.title} en tamaño completo`}>
        <img src={edition.image} alt={`Edición original de ${edition.title}, ${edition.dateLabel}`} width="1024" height="1280" fetchPriority="high" />
        <span>Ver original <span aria-hidden="true">↗</span></span>
      </a>
      <div className="reader-cover-heading"><p className="reader-kicker">{edition.category}</p><h1>{edition.title}</h1><p>{edition.subtitle}</p><span className="reader-anniversary">{edition.anniversary}</span></div>
      <p className="reader-swipe-hint"><span aria-hidden="true">⟷</span> Desliza y descubre la historia</p>
    </div>;
  }

  return <div className={`reader-chapter-content${chapter.quote ? " has-quote" : ""}${chapter.song ? " has-song" : ""}`}>
    <div className="reader-page-topline"><span>LO IMPORTANTE DE HOY</span><span>{edition.title}</span></div>
    <p className="reader-kicker">{chapter.kicker}</p>
    <h2>{chapter.title}</h2>
    {chapter.intro && <p className="reader-lead">{chapter.intro}</p>}
    {chapter.stats && <div className="reader-stats">{chapter.stats.map((stat) => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div>}
    {chapter.quote && <blockquote className="reader-quote"><span aria-hidden="true">“</span><p>{chapter.quote}</p><cite>{chapter.attribution}</cite></blockquote>}
    {chapter.entries && <dl className="reader-entries">{chapter.entries.map((entry, index) => <div key={entry.label}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><div><dt>{entry.label}</dt><dd>{entry.text}</dd></div></div>)}</dl>}
    {chapter.paragraphs?.map((paragraph) => <p className="reader-paragraph" key={paragraph}>{paragraph}</p>)}
    {chapter.song && <>
      <div className="reader-song">
        <div className="reader-record" aria-hidden="true"><span>LI<br />DH</span></div>
        <div className="reader-song-info"><span>LA CANCIÓN DE ESTA EDICIÓN</span><h3>{chapter.song.title}</h3><p>{chapter.song.artist}</p><small>{chapter.song.album}</small></div>
        <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${chapter.song.artist} ${chapter.song.title}`)}`} target="_blank" rel="noreferrer">Buscar en YouTube <span aria-hidden="true">↗</span></a>
      </div>
      <p className="reader-paragraph reader-song-note">{chapter.song.note}</p>
      <div className="reader-colophon"><p>FUENTES DE LA EDICIÓN ORIGINAL</p><span>{edition.sources.join(" · ")}</span><p>Una edición de JerryMC · Adaptada para lectura digital.</p><a href={edition.image} target="_blank" rel="noreferrer">Consultar la edición original ↗</a></div>
      <a className="reader-next-edition" href={`/revista/${nextEdition.slug}`}><span>OTRA HISTORIA TE ESPERA<strong>{nextEdition.title}</strong></span><Arrow /></a>
    </>}
    <div className="reader-page-signature"><span>Hechos. Música. Palabras.</span><span>JerryMC</span></div>
  </div>;
}

export default function MagazineReader({ edition, editions }: { edition: Magazine; editions: Magazine[] }) {
  const [current, setCurrent] = useState(0);
  const [ready, setReady] = useState(false);
  const [sheet, setSheet] = useState<"index" | "editions" | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const tabs = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const activeIndex = useRef(0);
  const nextEdition = editions[(editions.findIndex((item) => item.slug === edition.slug) + 1) % editions.length];

  function goTo(index: number, smooth = true) {
    const container = track.current;
    if (!container) return;
    const bounded = Math.max(0, Math.min(edition.chapters.length - 1, index));
    container.scrollTo({ left: bounded * container.clientWidth, behavior: smooth && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant" });
  }

  useEffect(() => {
    const container = track.current;
    if (!container) return;
    function fromHash() {
      const index = edition.chapters.findIndex((chapter) => `#${chapter.id}` === window.location.hash);
      goTo(Math.max(index, 0), false);
      activeIndex.current = Math.max(index, 0);
      setCurrent(activeIndex.current);
    }
    fromHash();
    setReady(true);
    window.addEventListener("hashchange", fromHash);
    let width = container.clientWidth;
    const observer = new ResizeObserver(() => {
      if (container.clientWidth !== width) {
        width = container.clientWidth;
        goTo(activeIndex.current, false);
      }
    });
    observer.observe(container);
    return () => { observer.disconnect(); window.removeEventListener("hashchange", fromHash); };
  }, [edition.slug]);

  useEffect(() => {
    if (!ready) return;
    activeIndex.current = current;
    window.history.replaceState(null, "", `#${edition.chapters[current].id}`);
    const button = tabs.current?.children[current] as HTMLElement | undefined;
    if (button && tabs.current) tabs.current.scrollTo({ left: button.offsetLeft - tabs.current.offsetLeft - 16, behavior: "instant" });
  }, [current, ready, edition]);

  useEffect(() => {
    if (sheet) dialog.current?.showModal();
    else dialog.current?.close();
  }, [sheet]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (sheet || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(current + (event.key === "ArrowRight" ? 1 : -1));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, sheet, edition.slug]);

  function chapterLinks(mobile = false) {
    return edition.chapters.map((chapter, index) => <a key={chapter.id} href={`#${chapter.id}`} aria-current={current === index ? "step" : undefined} onClick={(event) => { event.preventDefault(); goTo(index); if (mobile) setSheet(null); }}><span>{String(index + 1).padStart(2, "0")}</span>{chapter.label}<span aria-hidden="true">↗</span></a>);
  }

  return <main className="magazine-reader">
    <header className="reader-header">
      <a className="brand" href="/" aria-label="Lo importante de hoy — inicio"><span className="prism" aria-hidden="true"><span className="prism-beam" /></span><span className="brand-copy">Lo <b>importante</b><br />de hoy</span></a>
      <span className="reader-header-label">LA REVISTA DIGITAL</span>
      <a className="reader-back" href="/">Volver al inicio <span aria-hidden="true">↗</span></a>
    </header>

    <div className="reader-layout">
      <aside className="reader-sidebar">
        <p className="reader-kicker">UNA PAUSA EN EL RUIDO</p><h2>Un momento.<br /><em>Una buena historia.</em></h2><p className="reader-sidebar-intro">Hechos que importan, palabras que inspiran y una canción para llevar contigo.</p>
        <div className="reader-sidebar-label">EN ESTA EDICIÓN <span>{String(edition.chapters.length).padStart(2, "0")} PÁGINAS</span></div>
        <nav className="reader-contents" aria-label="Secciones de la edición">{chapterLinks()}</nav>
        <button className="reader-archive-button" type="button" onClick={() => setSheet("editions")}>Explorar otras ediciones <Arrow /></button>
        <div className="reader-sidebar-foot"><span>Una revista de</span><strong>JerryMC</strong><a href="https://www.instagram.com/loimportantehoyjerrymc/" target="_blank" rel="noreferrer">@loimportantehoyjerrymc ↗</a></div>
      </aside>

      <section className="reader-book" aria-label={`Revista: ${edition.title}`}>
        <div className="reader-toolbar"><button className="reader-edition-button" type="button" onClick={() => setSheet("editions")} aria-haspopup="dialog"><span className="reader-live-dot" /><time dateTime={edition.date}>{edition.dateLabel.replace(/ de \d{4}$/, "")}</time><span aria-hidden="true">⌄</span></button><button className="reader-index-button" type="button" onClick={() => setSheet("index")} aria-haspopup="dialog"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>Índice</button></div>
        <nav className="reader-tabs" aria-label="Páginas de la revista" ref={tabs}>{edition.chapters.map((chapter, index) => <a href={`#${chapter.id}`} key={chapter.id} aria-current={current === index ? "step" : undefined} onClick={(event) => { event.preventDefault(); goTo(index); }}><span>{String(index + 1).padStart(2, "0")}</span>{chapter.label}</a>)}</nav>
        <div className="reader-track" ref={track} tabIndex={0} aria-label="Desliza para cambiar de página o usa las flechas del teclado" onScroll={() => {
          const container = track.current;
          if (container) {
            const index = Math.max(0, Math.min(edition.chapters.length - 1, Math.round(container.scrollLeft / container.clientWidth)));
            activeIndex.current = index;
            setCurrent(index);
          }
        }}>
          {edition.chapters.map((chapter, index) => <article className={`reader-page${index === 0 ? " reader-cover" : ""}`} id={chapter.id} key={chapter.id} aria-label={`${index + 1} de ${edition.chapters.length}: ${chapter.label}`} aria-hidden={ready && current !== index ? true : undefined} inert={ready && current !== index ? true : undefined}>
            <ChapterContent chapter={chapter} edition={edition} nextEdition={nextEdition} />
          </article>)}
        </div>
        <div className="reader-progress" aria-hidden="true"><span style={{ width: `${((current + 1) / edition.chapters.length) * 100}%` }} /></div>
        <div className="reader-controls"><button type="button" onClick={() => goTo(current - 1)} disabled={current === 0} aria-label="Página anterior"><Arrow previous /><span>Anterior</span></button><span className="reader-page-count"><strong>{String(current + 1).padStart(2, "0")}</strong><span>/</span>{String(edition.chapters.length).padStart(2, "0")}</span><button type="button" onClick={() => goTo(current + 1)} disabled={current === edition.chapters.length - 1} aria-label="Página siguiente"><span>Siguiente</span><Arrow /></button></div>
      </section>
      <p className="reader-desktop-hint">LEE A TU RITMO <span>← →</span> USA LAS FLECHAS O DESLIZA</p>
    </div>
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">Página {current + 1} de {edition.chapters.length}: {edition.chapters[current].label}</div>
    <dialog className="reader-dialog" ref={dialog} onClose={() => setSheet(null)} onClick={(event) => { if (event.target === event.currentTarget) setSheet(null); }} aria-labelledby="reader-dialog-title">
      <div className="reader-dialog-inner"><button className="reader-dialog-close" type="button" aria-label="Cerrar" onClick={() => setSheet(null)}>×</button><p className="reader-kicker">LO IMPORTANTE DE HOY</p><h2 id="reader-dialog-title">{sheet === "editions" ? "Elige una historia." : "En esta edición."}</h2>
      {sheet === "editions" ? <div className="reader-edition-list">{editions.map((item) => <a href={`/revista/${item.slug}`} key={item.slug} aria-current={edition.slug === item.slug ? "page" : undefined}><img src={item.image} alt="" width="80" height="100" loading="lazy" /><div><time dateTime={item.date}>{item.dateLabel.replace(/ de \d{4}$/, "")}</time><h3>{item.title}</h3><p>{item.subtitle}</p></div><span aria-hidden="true">↗</span></a>)}</div> : <nav className="reader-contents" aria-label="Índice de la revista">{chapterLinks(true)}</nav>}
      </div>
    </dialog>
  </main>;
}
