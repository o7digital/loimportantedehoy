"use client";

import { type FormEvent, useEffect, useState } from "react";
import { site } from "../config/site";
import type { Magazine } from "../data/magazines";
import { resolveTheme, themeStyle } from "../lib/magazine-theme";

const benefits = [
  ["01", "La edición completa", "Historias cuidadas, personajes esenciales y contexto para comprender por qué importa."],
  ["02", "El archivo sin fin", "Regresa a cada edición y construye tu propia biblioteca de cultura y memoria."],
  ["03", "Lectura sin ruido", "Una experiencia limpia, íntima y sin publicidad invasiva, en cualquier dispositivo."],
];

function Arrow({ down = false }: { down?: boolean }) { return <span aria-hidden="true">{down ? "↓" : "↗"}</span>; }
function Prism() { return <span className="prism" aria-hidden="true"><span className="prism-beam" /></span>; }

export default function Home({ latestEdition, recentEditions = [] }: { latestEdition?: Magazine; recentEditions?: Magazine[] }) {
  const featureTheme = resolveTheme(latestEdition?.theme);
  const featurePath = latestEdition ? `/revista/${latestEdition.date}` : "/revista";
  const featureIntro = latestEdition?.chapters.find(page => page.intro)?.intro || latestEdition?.subtitle;
  const words = latestEdition?.chapters.map(page => [page.title, page.intro, ...(page.paragraphs || [])].filter(Boolean).join(" ")).join(" ").split(/\s+/).length || 0;
  const readingMinutes = Math.max(2, Math.ceil(words / 180));
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [joined, setJoined] = useState(false);
  useEffect(() => { document.body.style.overflow = modalOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [modalOpen]);
  function subscribe(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setJoined(true); }

  return (
    <main id="top">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Lo importante de hoy — inicio"><Prism /><span className="brand-copy">Lo <b>importante</b><br />de hoy</span></a>
        <nav className={menuOpen ? "nav open" : "nav"} aria-label="Navegación principal"><a href="/revista" onClick={() => setMenuOpen(false)}>La revista</a><a href="/ediciones" onClick={() => setMenuOpen(false)}>Ediciones</a><a href="#manifiesto" onClick={() => setMenuOpen(false)}>Manifiesto</a><a href="/membresia" onClick={() => setMenuOpen(false)}>Membresía</a></nav>
        <div className="header-actions"><a className="login-link" href="/acceder">Acceder</a><button className="header-cta" type="button" onClick={() => setModalOpen(true)}>Hazte miembro <Arrow /></button></div>
        <button className="menu-button" type="button" onClick={() => setMenuOpen((value) => !value)} aria-label="Abrir menú" aria-expanded={menuOpen}><span /><span /></button>
      </header>

      <section className="hero home-current-edition" style={themeStyle(featureTheme)}>
        <div className="hero-noise" />
        <div className="hero-copy"><div className="edition-label"><span>ÚLTIMA EDICIÓN PUBLICADA</span>{latestEdition && <time dateTime={latestEdition.date}>{latestEdition.dateLabel}</time>}</div><h1>{latestEdition ? <>{latestEdition.title}<em>{latestEdition.subtitle}</em></> : <>Una pausa para<br /><em>lo importante.</em></>}</h1><p className="hero-intro">{featureIntro || "Hechos y personajes importantes. Música que conecta. Palabras que inspiran."}</p>{latestEdition?.anniversary && <p className="home-feature-anniversary">{latestEdition.anniversary}</p>}<div className="hero-actions-row"><a className="button button-red" href={featurePath}>Hojear la edición completa <Arrow /></a><a className="discover-link" href="#ediciones">Otras ediciones <Arrow down /></a></div>{latestEdition && <div className="hero-meta"><span><b>{readingMinutes} min</b> para una buena historia</span><span><b>{latestEdition.chapters.length}</b> páginas para descubrir</span><span><b>1</b> canción para llevar contigo</span></div>}</div>
        {latestEdition && <div className="cover-stage home-feature-visual"><a href={featurePath} aria-label={`Leer la edición de ${latestEdition.title}`}><img className={latestEdition.coverCutout ? "home-feature-cutout" : "home-feature-photo"} src={latestEdition.coverCutout || latestEdition.photograph || latestEdition.image} alt={latestEdition.title} width="600" height="750" fetchPriority="high" /></a><div className="cover-note"><span>{latestEdition.category}</span><strong>{latestEdition.title}</strong><small>{latestEdition.dateLabel}</small></div></div>}
        <div className="hero-rail"><span>HECHOS</span><i /><span>PERSONAJES</span><i /><span>MÚSICA</span><i /><span>IDEAS</span></div>
      </section>

      {latestEdition && <a className="magazine-invitation" href="/revista"><img src={latestEdition.photograph || latestEdition.image} alt={latestEdition.title} width="80" height="100" loading="lazy" /><div><span>LA REVISTA · {latestEdition.dateLabel.toUpperCase()}</span><h2>{latestEdition.title}<em>{latestEdition.subtitle}</em></h2><p>La edición del día. Hechos, música y palabras para llevar contigo.</p></div><strong>Hojear la revista <Arrow /></strong></a>}

      <section className="intro" id="manifiesto">
        <div className="section-index">01 <span /> UNA PAUSA EN EL RUIDO</div>
        <div className="intro-grid"><h2>Todo el mundo te cuenta<br />qué pasó. Nosotros te contamos<br /><em>por qué aún importa.</em></h2><div className="intro-copy"><p>En una época de titulares que duran segundos, elegimos mirar más despacio. Cada edición conecta un hecho, una voz y una canción para convertir la información en memoria.</p><a href="#membresia">Conoce nuestra filosofía <Arrow /></a></div></div>
        <blockquote><span className="quote-mark">“</span><p>La cultura no debería sentirse como una tarea. Debería sentirse como una conversación que no quieres terminar.</p><cite>— La redacción</cite></blockquote>
      </section>

      <section className="editions" id="ediciones">
        <div className="editions-head"><div><div className="section-index light">02 <span /> EL ARCHIVO</div><h2>Ediciones para<br /><em>volver a ellas.</em></h2></div><p>Nuevas historias, todos los días.<br />Una colección que crece contigo.</p></div>
        <div className="edition-grid home-edition-grid">{recentEditions.slice(0, 4).map((edition, index) => <article className={`edition-card ${index === 0 ? "featured" : ""}`} key={edition.date}><a className="home-edition-art" href={`/revista/${edition.date}`} aria-label={`Leer ${edition.title}`}><img src={edition.coverCutout || edition.photograph || edition.image} className={edition.coverCutout ? "is-cutout" : ""} alt={edition.title} loading="lazy" /></a><div className="edition-info"><div><span>{index === 0 ? "ÚLTIMA EDICIÓN" : "EL ARCHIVO"}</span><time dateTime={edition.date}>{edition.dateLabel}</time></div><small>{edition.category}</small><h3>{edition.title}</h3><a href={`/revista/${edition.date}`}>Hojear la edición <Arrow /></a></div></article>)}</div>
      </section>

      <section className="membership" id="membresia">
        <div className="membership-copy"><div className="section-index light">03 <span /> EL CLUB DE LOS CURIOSOS</div><h2>Menos ruido.<br />Más mundo.</h2><p>Tu membresía mantiene viva una forma más humana de leer: con tiempo, criterio y belleza.</p><div className="benefit-list">{benefits.map(([number, title, text]) => <div className="benefit" key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></div>)}</div></div>
        <aside className="price-card"><div className="price-top"><span>MEMBRESÍA FUNDADORA</span><span>CUPO LIMITADO</span></div><div className="price-mark"><small>$</small><strong>{site.membership.price}</strong><span>{site.membership.currency}<br />al mes</span></div><p>Acceso completo a todas las ediciones y al archivo de Lo importante de hoy.</p><ul><li><span>✓</span> Ediciones completas</li><li><span>✓</span> Archivo para miembros</li><li><span>✓</span> Lectura sin publicidad</li><li><span>✓</span> Cancela cuando quieras</li></ul><button className="button button-cream" type="button" onClick={() => setModalOpen(true)}>Comenzar mi membresía <Arrow /></button><small className="secure-note">DEMOSTRACIÓN · SIN COBRO REAL</small></aside>
      </section>

      <section className="newsletter"><Prism /><span className="newsletter-kicker">UNA HISTORIA IMPORTANTE, CADA SEMANA</span><h2>Empieza por una buena lectura.</h2><p>Recibe una selección gratuita y descubre si esta revista también es para ti.</p>{joined ? <div className="success-message" role="status">Ya eres parte de la conversación. Revisa tu correo.</div> : <form onSubmit={subscribe}><label className="sr-only" htmlFor="newsletter-email">Tu correo electrónico</label><input id="newsletter-email" type="email" required placeholder="tu@email.com" /><button type="submit">Quiero recibirla <Arrow /></button></form>}<small>Sin spam. Solo historias que valen tu tiempo.</small></section>

      <footer><a className="brand footer-brand" href="#top"><Prism /><span className="brand-copy">Lo <b>importante</b><br />de hoy</span></a><div className="footer-statement">Hechos y personajes importantes.<br />Música que conecta. Palabras que inspiran.</div><div className="footer-links"><a href="#ediciones">Ediciones</a><a href="#manifiesto">Nosotros</a><a href="#membresia">Membresía</a><a href="https://www.instagram.com/loimportantehoyjerrymc/">Instagram</a></div><div className="footer-bottom"><span>© 2026 LO IMPORTANTE DE HOY</span><span>HECHO CON CURIOSIDAD EN MÉXICO</span></div></footer>

      {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setModalOpen(false)}><section className="member-modal" role="dialog" aria-modal="true" aria-labelledby="member-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setModalOpen(false)} aria-label="Cerrar">×</button><div className="modal-brand"><Prism /><span>DEMOSTRACIÓN DE MEMBRESÍA</span></div><h2 id="member-title">Haz espacio para<br /><em>lo importante.</em></h2><p>Accede a la edición de hoy y a todo el archivo por ${site.membership.price} {site.membership.currency} al mes.</p><form onSubmit={(event) => { event.preventDefault(); setModalOpen(false); }}><label>Correo electrónico<input type="email" required placeholder="tu@email.com" /></label><label>Tu nombre<input type="text" required placeholder="Nombre completo" /></label><button className="button button-red" type="submit">Continuar (demo) <Arrow /></button></form><small>No se realizará ningún cobro. Stripe aún no está conectado.</small></section></div>}
    </main>
  );
}
