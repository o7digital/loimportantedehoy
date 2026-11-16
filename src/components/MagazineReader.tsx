import { useEffect, useRef, useState } from "react";
import type { Magazine, MagazineChapter } from "../data/magazines";
import "../styles/magazine.css";
import { resolveTheme, themeStyle } from "../lib/magazine-theme";

const number = (value: number) => String(value).padStart(2, "0");
const path = (edition: Magazine) => `/revista/${edition.date}`;
function Arrow({ back = false }: { back?: boolean }) {
  return <svg viewBox="0 0 32 24" fill="none" aria-hidden="true"><path d={back ? "M29 12H3m9-9-9 9 9 9" : "M3 12h26m-9-9 9 9-9 9"} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function Photograph({ edition, chapter, cover = false }: { edition: Magazine; chapter?: MagazineChapter; cover?: boolean }) {
  const cutout = cover && edition.coverCutout;
  const credit = cutout ? "Ilustración de JerryMC" : chapter?.photoCredit || edition.photoCredit;
  const source = cutout ? edition.image : chapter?.photoSource || edition.photoSource;
  return <figure className={`journal-photograph${cutout ? " journal-cutout" : ""}`}><img src={cutout || chapter?.image || edition.photograph || edition.image} alt={cutout ? `${edition.title} · Ilustración de la edición original` : edition.title} style={{ objectPosition: edition.photoPosition || "50% 50%" }} loading={chapter ? "lazy" : "eager"} fetchPriority={chapter ? "auto" : "high"} /><figcaption>{credit}{source && <> · <a href={source} target="_blank" rel="noreferrer">Fuente ↗</a></>}</figcaption></figure>;
}
function MusicPlayer({ chapter }: { chapter: MagazineChapter }) {
  const [playing, setPlaying] = useState(false);
  const song = chapter.song!;
  const videoId = song.url?.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1];
  if (playing && videoId) return <iframe className="journal-player" src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`} title={`${song.artist} — ${song.title}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />;
  return videoId ? <button className="journal-listen" type="button" onClick={() => setPlaying(true)}><span className="journal-play" aria-hidden="true">▷</span>Escuchar {song.title}<span aria-hidden="true">↗</span></button> : <a className="journal-listen" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.artist} ${song.title}`)}`} target="_blank" rel="noreferrer"><span className="journal-play" aria-hidden="true">▷</span>Buscar la canción en YouTube<span aria-hidden="true">↗</span></a>;
}
function EditionPage({ chapter, edition, index, nextEdition }: { chapter: MagazineChapter; edition: Magazine; index: number; nextEdition?: Magazine }) {
  const layout = chapter.layout || (chapter.song ? "music" : chapter.quote ? "quote" : chapter.stats || chapter.entries ? "facts" : "story");
  if (index === 0) return <div className="journal-page-inner journal-cover-layout">
    <div className="journal-cover-copy"><p className="journal-eyebrow"><span />{edition.category}</p><span className="journal-cover-anniversary">{edition.anniversary}</span><h1>{edition.title}<span>.</span></h1><p className="journal-cover-deck">{edition.subtitle}</p><div className="journal-cover-rule" /><p className="journal-cover-intro">{edition.chapters.find(page => page.intro)?.intro}</p><div className="journal-byline"><span>POR JERRYMC</span><span>{edition.chapters.length} páginas · Una historia para llevar contigo</span></div></div>
    <div className={`journal-cover-visual${edition.coverCutout ? " journal-cover-illustration" : ""}`}><Photograph edition={edition} cover /><span className="journal-photo-label">LA HISTORIA<br />DE ESTE DÍA</span><span className="journal-cover-date">{edition.date.slice(8)}<small>{new Intl.DateTimeFormat("es", { month: "short", timeZone: "UTC" }).format(new Date(`${edition.date}T12:00:00Z`)).toUpperCase()}</small></span></div>
    <div className="journal-cover-bottom"><p>Hechos que importan.<br /><em>Historias que se quedan.</em></p><span>DESLIZA PARA COMENZAR <Arrow /></span></div>
  </div>;
  if (layout === "music" && chapter.song) return <div className="journal-page-inner journal-music-layout">
    <div className="journal-music-art"><div className="journal-vinyl"><div><span>LO IMPORTANTE<br />DE HOY</span><i /><small>{chapter.song.artist}</small></div></div><span className="journal-record-side">LADO A · LA CANCIÓN DEL DÍA</span><h2>{chapter.song.title}</h2><p>{chapter.song.artist}</p></div>
    <div className="journal-music-copy"><p className="journal-eyebrow">{number(index)} / {chapter.kicker}</p><h2>{chapter.title}</h2><p className="journal-lead">{chapter.song.note}</p><p className="journal-album">{chapter.song.album}</p><MusicPlayer chapter={chapter} /><div className="journal-endnote"><strong>Hasta la próxima historia.</strong><p>Una edición de JerryMC. Gracias por hacer una pausa para leer lo importante.</p><p className="journal-sources">Fuentes: {edition.sources.join(" · ")}</p><a href={edition.image} target="_blank" rel="noreferrer">Ver la edición gráfica original ↗</a></div>{nextEdition && <a className="journal-next-issue" href={path(nextEdition)}><span>OTRA FECHA, OTRA HISTORIA<strong>{nextEdition.title}</strong></span><Arrow /></a>}</div>
  </div>;
  if (layout === "quote" && chapter.quote) return <div className="journal-page-inner journal-quote-layout"><div className="journal-quote-main"><p className="journal-eyebrow">{number(index)} / {chapter.kicker}</p><span className="journal-opening-quote" aria-hidden="true">“</span><blockquote><p>{chapter.quote}</p><cite>{chapter.attribution}</cite></blockquote><div className="journal-quote-rule" /><p className="journal-quote-reflection">{chapter.paragraphs?.[0] || chapter.intro}</p></div><div className="journal-quote-visual"><Photograph edition={edition} chapter={chapter} /><span>Palabras<br /><em>que se quedan.</em></span></div></div>;
  if (layout === "facts") return <div className={`journal-page-inner journal-details-layout${chapter.stats ? " journal-has-stats" : ""}`}><div className="journal-details-heading"><p className="journal-eyebrow">{number(index)} / {chapter.kicker}</p><h2>{chapter.title}</h2>{chapter.intro && <p className="journal-lead">{chapter.intro}</p>}{chapter.stats && <div className="journal-big-stats">{chapter.stats.map(stat => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div>}{!chapter.stats && <Photograph edition={edition} chapter={chapter} />}</div><div className="journal-details-body"><span className="journal-section-caption">{chapter.stats ? "MISIONES QUE DEJARON HUELLA" : "LOS DETALLES TAMBIÉN CUENTAN"}</span><ol className="journal-entry-list">{chapter.entries?.map((entry, entryIndex) => <li key={entry.label}><span>{number(entryIndex + 1)}</span><div><h3>{entry.label}</h3><p>{entry.text}</p></div></li>)}</ol>{chapter.paragraphs?.map(paragraph => <p className="journal-body-text" key={paragraph}>{paragraph}</p>)}<span className="journal-handwritten">{edition.title}</span></div></div>;
  return <div className="journal-page-inner journal-story-layout"><div className="journal-story-heading"><p className="journal-eyebrow">{number(index)} / {chapter.kicker}</p><h2>{chapter.title}</h2><Photograph edition={edition} chapter={chapter} /></div><div className="journal-story-body"><span className="journal-section-caption">LA HISTORIA DETRÁS DEL NOMBRE</span>{chapter.intro && <p className="journal-lead">{chapter.intro}</p>}{chapter.paragraphs?.map((paragraph, i) => <p className={`journal-body-text${i === 0 ? " journal-dropcap" : ""}`} key={paragraph}>{paragraph}</p>)}<div className="journal-story-end"><span /><em>Lo importante permanece.</em></div></div></div>;
}

export default function MagazineReader({ edition, editions, syncUrl = true, initialChapter }: { edition: Magazine; editions: Magazine[]; syncUrl?: boolean; initialChapter?: string }) {
  const theme = resolveTheme(edition.theme);
  const [current, setCurrent] = useState(0);
  const [ready, setReady] = useState(false);
  const [sheet, setSheet] = useState<"index" | "editions" | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const tabs = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const active = useRef(0);
  const nextEdition = editions.length > 1 ? editions[(editions.findIndex(item => item.date === edition.date) + 1) % editions.length] : undefined;
  const weekday = new Intl.DateTimeFormat("es-MX", { weekday: "long", timeZone: "UTC" }).format(new Date(`${edition.date}T12:00:00Z`));
  function goTo(index: number, smooth = true) {
    const container = track.current;
    if (!container) return;
    const bounded = Math.max(0, Math.min(edition.chapters.length - 1, index));
    container.scrollTo({ left: bounded * container.clientWidth, behavior: smooth && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant" });
  }
  useEffect(() => {
    const container = track.current;
    if (!container) return;
    const fromHash = () => { const index = Math.max(0, edition.chapters.findIndex(chapter => initialChapter ? chapter.id === initialChapter : `#${chapter.id}` === location.hash)); active.current = index; goTo(index, false); setCurrent(index); };
    fromHash(); setReady(true); if (syncUrl) window.addEventListener("hashchange", fromHash);
    let width = container.clientWidth;
    const observer = new ResizeObserver(() => { if (width !== container.clientWidth) { width = container.clientWidth; goTo(active.current, false); } });
    observer.observe(container);
    return () => { observer.disconnect(); window.removeEventListener("hashchange", fromHash); };
  }, [edition.date, syncUrl, initialChapter]);
  useEffect(() => {
    if (!ready) return;
    active.current = current; if (syncUrl) history.replaceState(null, "", `#${edition.chapters[current].id}`);
    const tab = tabs.current?.children[current] as HTMLElement | undefined;
    if (tab && tabs.current) tabs.current.scrollTo({ left: tab.offsetLeft - tabs.current.offsetLeft - 20, behavior: "instant" });
  }, [current, ready, edition, syncUrl]);
  useEffect(() => { if (sheet) dialog.current?.showModal(); else dialog.current?.close(); }, [sheet]);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (sheet || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || (event.target instanceof HTMLElement && event.target.closest("input,textarea,select,[contenteditable='true']"))) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); goTo(current + (event.key === "ArrowRight" ? 1 : -1)); }
    };
    window.addEventListener("keydown", handle); return () => window.removeEventListener("keydown", handle);
  }, [current, sheet, edition.date]);
  return <main className={`journal journal-issue-${edition.slug}${edition.title.length > 10 ? " journal-long-title" : ""}`} style={themeStyle(theme)} data-gold-headings={theme.titulos_dorados}>
    <div className="journal-utility"><a href="/" aria-label="Volver a la landing">← El proyecto</a><span>UNA REVISTA DE JERRYMC</span><button type="button" onClick={() => setSheet("editions")} aria-haspopup="dialog">Otras ediciones <span aria-hidden="true">↗</span></button></div>
    <header className="journal-masthead"><div className="journal-masthead-brand"><a className="journal-wordmark" href="/revista">Lo importante <em>de hoy</em></a><p className="journal-client-tagline">Hechos y personajes importantes · Música que conecta · Palabras que inspiran</p></div><div className="journal-client-mark" aria-label="Una revista de JerryMC"><span className="prism" aria-hidden="true"><span className="prism-beam" /></span><span>JerryMC</span></div></header>
    <div className="journal-date-line"><span><span className="journal-today-dot" />{weekday.charAt(0).toUpperCase() + weekday.slice(1)}, <time dateTime={edition.date}>{edition.dateLabel}</time></span><span className="journal-date-caption">UNA HISTORIA. UNA CANCIÓN. UNA PAUSA.</span><button type="button" onClick={() => setSheet("index")} aria-haspopup="dialog"><span aria-hidden="true">☰</span> En esta edición</button></div>
    <nav className="journal-tabs" aria-label="Secciones de la revista" ref={tabs}>{edition.chapters.map((chapter, index) => <a key={chapter.id} href={`#${chapter.id}`} aria-current={index === current ? "step" : undefined} onClick={event => { event.preventDefault(); goTo(index); }}><span>{number(index)}</span>{chapter.label}</a>)}</nav>
    <div className="journal-track" ref={track} tabIndex={0} aria-label="Páginas de la revista. Desliza o usa las flechas para pasar de página." onScroll={() => { const container = track.current; if (container) { const index = Math.max(0, Math.min(edition.chapters.length - 1, Math.round(container.scrollLeft / container.clientWidth))); active.current = index; setCurrent(index); } }}>{edition.chapters.map((chapter, index) => <article id={chapter.id} key={chapter.id} className={`journal-page${chapter.quote && (!chapter.layout || chapter.layout === "quote") ? " journal-page-dark" : ""}`} data-current={current === index} aria-label={`${index + 1} de ${edition.chapters.length}: ${chapter.label}`} aria-hidden={ready && current !== index ? true : undefined} inert={ready && current !== index ? true : undefined}><EditionPage chapter={chapter} edition={edition} index={index} nextEdition={nextEdition} /></article>)}</div>
    <footer className="journal-controls"><button type="button" aria-label="Página anterior" disabled={current === 0} onClick={() => goTo(current - 1)}><Arrow back /><span>Anterior</span></button><div className="journal-folio"><span>{edition.chapters[current].label}</span><strong>{number(current + 1)} <i>/</i> {number(edition.chapters.length)}</strong><div className="journal-progress-dots" aria-hidden="true">{edition.chapters.map((chapter, index) => <span key={chapter.id} data-current={index === current} />)}</div></div><button type="button" aria-label="Página siguiente" disabled={current === edition.chapters.length - 1} onClick={() => goTo(current + 1)}><span>{current === 0 ? "Comenzar lectura" : "Siguiente página"}</span><Arrow /></button></footer>
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">Página {current + 1} de {edition.chapters.length}: {edition.chapters[current].label}</div>
    <dialog className="journal-dialog" ref={dialog} aria-labelledby="journal-dialog-title" onClose={() => setSheet(null)} onClick={event => { if (event.target === event.currentTarget) setSheet(null); }}><div className="journal-dialog-inner"><button className="journal-dialog-close" type="button" aria-label="Cerrar" onClick={() => setSheet(null)}>×</button><p className="journal-eyebrow">LO IMPORTANTE DE HOY</p><h2 id="journal-dialog-title">{sheet === "editions" ? <>Cada día,<br /><em>una nueva mirada.</em></> : <>En esta<br /><em>edición.</em></>}</h2>{sheet === "editions" ? <div className="journal-edition-list">{editions.map(item => <a href={path(item)} key={item.date} aria-current={item.date === edition.date ? "page" : undefined}><img src={item.photograph || item.image} alt="" width="100" height="100" loading="lazy" /><div><time dateTime={item.date}>{item.dateLabel}</time><h3>{item.title}</h3><p>{item.subtitle}</p></div><span aria-hidden="true">↗</span></a>)}</div> : <nav className="journal-toc" aria-label="Índice de la revista">{edition.chapters.map((chapter, index) => <a key={chapter.id} href={`#${chapter.id}`} aria-current={index === current ? "step" : undefined} onClick={event => { event.preventDefault(); goTo(index); setSheet(null); }}><span>{number(index + 1)}</span><div>{chapter.label}<small>{chapter.kicker}</small></div><span aria-hidden="true">↗</span></a>)}</nav>}</div></dialog>
  </main>;
}
