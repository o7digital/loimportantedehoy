"use client";

import { type FormEvent, useEffect, useState } from "react";
import { site } from "../config/site";
import { latestMagazine } from "../data/magazines";

const editions = [
  { number: "Nº 218", date: "30 AGO 1973", title: "El día en que The Doors anunció su disolución", category: "Música e Historia", featured: true },
  { number: "Nº 217", date: "29 AGO 2026", title: "Ingrid Bergman: una vida fuera del guion", category: "Personajes" },
  { number: "Nº 216", date: "28 AGO 2026", title: "La ciudad que aprendió a mirar hacia arriba", category: "Historia" },
  { number: "Nº 215", date: "27 AGO 2026", title: "Las canciones que cambiaron una generación", category: "Cultura sonora" },
];

const benefits = [
  ["01", "La edición completa", "Historias cuidadas, personajes esenciales y contexto para comprender por qué importa."],
  ["02", "El archivo sin fin", "Regresa a cada edición y construye tu propia biblioteca de cultura y memoria."],
  ["03", "Lectura sin ruido", "Una experiencia limpia, íntima y sin publicidad invasiva, en cualquier dispositivo."],
];

function Arrow({ down = false }: { down?: boolean }) { return <span aria-hidden="true">{down ? "↓" : "↗"}</span>; }
function Prism() { return <span className="prism" aria-hidden="true"><span className="prism-beam" /></span>; }

export default function Home() {
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

      <section className="hero">
        <div className="hero-noise" />
        <div className="hero-copy"><div className="edition-label"><span>30 DE AGOSTO DE 1973</span></div><h1>El día en que<br />The Doors anunció<br /><em>su disolución.</em></h1><p className="hero-intro">Tras la muerte de Jim Morrison, los miembros sobrevivientes de The Doors intentaron continuar como trío y publicaron dos nuevos álbumes. Sin embargo, la esencia del grupo ya no era la misma. El 30 de agosto de 1973 se anunció oficialmente su disolución.</p><div className="hero-actions-row"><a className="button button-red" href="/ediciones/the-doors-disolucion-1973">Leer el artículo completo <Arrow /></a><a className="discover-link" href="#ediciones">Descubrir la revista <Arrow down /></a></div><div className="hero-meta"><span><b>8 min</b> lectura principal</span><span><b>4</b> historias nuevas</span><span><b>1</b> edición para guardar</span></div></div>
        <div className="cover-stage"><div className="cover-shadow" /><article className="typographic-cover" aria-label="Composición editorial The Doors — 1973"><small>HISTORIA DE LA MÚSICA</small><span>THE</span><strong>DOORS</strong><i></i><b>1973</b><p>EL DÍA EN QUE<br />SE CERRÓ UNA ERA</p></article><div className="cover-note"><span>ARTÍCULO PRINCIPAL</span><strong>The Doors</strong><small>El final de una banda que cambió el rostro del rock.</small></div></div>
        <div className="hero-rail"><span>HECHOS</span><i /><span>PERSONAJES</span><i /><span>MÚSICA</span><i /><span>IDEAS</span></div>
      </section>

      <a className="magazine-invitation" href="/revista"><img src={latestMagazine.image} alt="Portada de la revista de Frida" width="80" height="100" loading="lazy" /><div><span>LA REVISTA · {latestMagazine.dateLabel.toUpperCase()}</span><h2>{latestMagazine.title}<em>{latestMagazine.subtitle}</em></h2><p>Una historia, página a página. Hecha para leer en tu móvil.</p></div><strong>Hojear la revista <Arrow /></strong></a>

      <section className="intro" id="manifiesto">
        <div className="section-index">01 <span /> UNA PAUSA EN EL RUIDO</div>
        <div className="intro-grid"><h2>Todo el mundo te cuenta<br />qué pasó. Nosotros te contamos<br /><em>por qué aún importa.</em></h2><div className="intro-copy"><p>En una época de titulares que duran segundos, elegimos mirar más despacio. Cada edición conecta un hecho, una voz y una canción para convertir la información en memoria.</p><a href="#membresia">Conoce nuestra filosofía <Arrow /></a></div></div>
        <blockquote><span className="quote-mark">“</span><p>La cultura no debería sentirse como una tarea. Debería sentirse como una conversación que no quieres terminar.</p><cite>— La redacción</cite></blockquote>
      </section>

      <section className="editions" id="ediciones">
        <div className="editions-head"><div><div className="section-index light">02 <span /> EL ARCHIVO</div><h2>Ediciones para<br /><em>volver a ellas.</em></h2></div><p>Nuevas historias, todos los días.<br />Una colección que crece contigo.</p></div>
        <div className="edition-grid">{editions.map((edition, index) => { const slugs = ["the-doors-disolucion-1973", "ingrid-bergman-una-vida-fuera-del-guion", "la-ciudad-que-aprendio-a-mirar-hacia-arriba", "las-canciones-que-cambiaron-una-generacion"]; return <article className={`edition-card ${edition.featured ? "featured" : ""}`} key={edition.number}><div className={`edition-art art-${index}`} aria-hidden="true"><span>{index === 0 ? "The Doors — 1973" : edition.category.split(" ")[0]}</span><i /></div><div className="edition-info"><div><span>{edition.number}</span><span>{edition.date}</span></div><small>{edition.category}</small><h3>{edition.title}</h3><a href={`/ediciones/${slugs[index]}`}>Abrir edición <Arrow /></a></div></article>; })}</div>
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
