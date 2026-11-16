import { magazines as sampleEditions, type Magazine, type MagazineChapter } from "../data/magazines";

type CMSPage = {
  id: number; slug: string; estado: string; orden: number; etiqueta: string; antetitulo: string;
  titulo: string; entradilla?: string; contenido?: string; cifras?: MagazineChapter["stats"];
  entradas?: MagazineChapter["entries"]; cita?: string; atribucion?: string;
  cancion_titulo?: string; cancion_artista?: string; cancion_album?: string; cancion_nota?: string; cancion_url?: string;
  foto?: string | null; foto_credito?: string; foto_fuente?: string; tipo?: MagazineChapter["layout"];
};
type CMSEdition = {
  id: number; slug: string; estado: string; fecha: string; titulo: string; subtitulo: string;
  aniversario: string; categoria: string; portada: string; foto: string; foto_credito?: string;
  foto_fuente?: string; foto_posicion?: string; fuentes?: string[]; paginas?: CMSPage[];
};

const editionFields = "id,slug,estado,fecha,titulo,subtitulo,aniversario,categoria,portada,foto,foto_credito,foto_fuente,foto_posicion,fuentes";
const cmsUrl = () => (import.meta.env.DIRECTUS_URL || process.env.DIRECTUS_URL || "").replace(/\/$/, "");
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());
const published = () => ({ _and: [{ estado: { _eq: "published" } }, { fecha: { _lte: today() } }] });

function asset(id: string | null | undefined): string {
  return id ? `${cmsUrl()}/assets/${encodeURIComponent(id)}` : "";
}

async function request<T>(collection: string, params: Record<string, string>): Promise<T[]> {
  const url = new URL(`${cmsUrl()}/items/${collection}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Directus ${collection}: HTTP ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload.data)) throw new Error(`Directus ${collection}: invalid response`);
  return payload.data;
}

function normalize(item: CMSEdition): Magazine {
  const date = item.fecha.slice(0, 10);
  return {
    slug: item.slug, date, dateLabel: new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00Z`)),
    title: item.titulo, subtitle: item.subtitulo, anniversary: item.aniversario || "", category: item.categoria,
    image: asset(item.portada), photograph: asset(item.foto), photoCredit: item.foto_credito || "", photoSource: item.foto_fuente || "", photoPosition: item.foto_posicion || "50% 50%",
    sources: Array.isArray(item.fuentes) ? item.fuentes : [],
    chapters: (item.paginas || []).filter(page => page.estado === "published").sort((a, b) => a.orden - b.orden).map(page => ({
      id: page.slug, label: page.etiqueta, kicker: page.antetitulo, title: page.titulo,
      intro: page.entradilla || undefined, paragraphs: page.contenido?.split(/\n\s*\n/).map(text => text.trim()).filter(Boolean),
      stats: page.cifras || undefined, entries: page.entradas || undefined, quote: page.cita || undefined,
      attribution: page.atribucion || undefined, layout: page.tipo || undefined, image: asset(page.foto) || undefined, photoCredit: page.foto_credito || undefined, photoSource: page.foto_fuente || undefined,
      ...(page.cancion_titulo ? { song: { title: page.cancion_titulo, artist: page.cancion_artista || "", album: page.cancion_album || "", note: page.cancion_nota || "", url: page.cancion_url || "" } } : {}),
    })),
  };
}

export async function getEditions(): Promise<Magazine[]> {
  if (!cmsUrl()) {
    if (import.meta.env.PROD) throw new Error("DIRECTUS_URL is not configured");
    return sampleEditions;
  }
  const items = await request<CMSEdition>("ediciones", { fields: editionFields, sort: "-fecha", limit: "100", filter: JSON.stringify(published()) });
  return items.map(normalize);
}

export async function getEdition(key?: string): Promise<Magazine | undefined> {
  if (!cmsUrl()) {
    if (import.meta.env.PROD) throw new Error("DIRECTUS_URL must be configured in production");
    return key ? sampleEditions.find(edition => edition.slug === key || edition.date === key) : sampleEditions[0];
  }
  const dateKey = key && /^\d{4}-\d{2}-\d{2}$/.test(key) && !Number.isNaN(Date.parse(key)) && new Date(key).toISOString().slice(0, 10) === key;
  const keyFilter = key ? { _or: [{ slug: { _eq: key } }, ...(dateKey ? [{ fecha: { _eq: key } }] : [])] } : {};
  const filter = { _and: [published(), keyFilter] };
  const [item] = await request<CMSEdition>("ediciones", { fields: `${editionFields},paginas.*`, sort: "-fecha", limit: "1", filter: JSON.stringify(filter), "deep[paginas][_sort]": "orden", "deep[paginas][_filter][estado][_eq]": "published" });
  if (!item) return undefined;
  const edition = normalize(item);
  if (!edition.chapters.length || edition.chapters[0].id !== "portada") throw new Error("The edition needs a published cover page");
  return edition;
}

export const editionPath = (edition: Pick<Magazine, "date">) => `/revista/${edition.date}`;
