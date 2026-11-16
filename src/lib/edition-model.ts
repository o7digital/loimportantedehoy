import type { Magazine, MagazineChapter } from "../data/magazines";
import { resolveTheme, type MagazineTheme } from "./magazine-theme.ts";

export type CMSPage = {
  id: number; slug: string; estado: string; orden: number; etiqueta: string; antetitulo: string;
  titulo: string; entradilla?: string; contenido?: string; cifras?: MagazineChapter["stats"];
  entradas?: MagazineChapter["entries"]; cita?: string; atribucion?: string;
  cancion_titulo?: string; cancion_artista?: string; cancion_album?: string; cancion_nota?: string; cancion_url?: string;
  foto?: string | null; foto_credito?: string; foto_fuente?: string; tipo?: MagazineChapter["layout"];
};
export type CMSEdition = Partial<MagazineTheme> & {
  id: number; slug: string; estado: string; fecha: string; titulo: string; subtitulo: string;
  aniversario: string; categoria: string; portada: string; foto: string; foto_credito?: string;
  foto_fuente?: string; foto_posicion?: string; fuentes?: string[]; paginas?: CMSPage[]; imagen_recortada?: string;
};

export const appearanceFields = "color_fondo,color_superficie,color_texto,color_secundario,color_titulos,color_acento,color_lineas,fuente_titulos,fuente_texto,tamano_texto,titulos_dorados";
export const editionFields = `id,slug,estado,fecha,titulo,subtitulo,aniversario,categoria,portada,foto,foto_credito,foto_fuente,foto_posicion,fuentes,imagen_recortada,${appearanceFields}`;

export function normalizeEdition(item: CMSEdition, baseUrl: string, theme = resolveTheme(), includeDrafts = false): Magazine {
  const asset = (id: string | null | undefined) => id ? `${baseUrl}/assets/${encodeURIComponent(id)}` : "";
  const date = item.fecha.slice(0, 10);
  return {
    slug: item.slug, date, dateLabel: new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00Z`)),
    title: item.titulo, subtitle: item.subtitulo, anniversary: item.aniversario || "", category: item.categoria,
    theme: resolveTheme(theme, item), coverCutout: asset(item.imagen_recortada) || undefined,
    image: asset(item.portada), photograph: asset(item.foto), photoCredit: item.foto_credito || "", photoSource: item.foto_fuente || "", photoPosition: item.foto_posicion || "50% 50%",
    sources: Array.isArray(item.fuentes) ? item.fuentes : [],
    chapters: (item.paginas || []).filter(page => page.estado === "published" || (includeDrafts && page.estado === "draft")).sort((a, b) => a.orden - b.orden).map(page => ({
      id: page.slug, label: page.etiqueta, kicker: page.antetitulo, title: page.titulo,
      intro: page.entradilla || undefined, paragraphs: page.contenido?.split(/\n\s*\n/).map(text => text.trim()).filter(Boolean),
      stats: page.cifras || undefined, entries: page.entradas || undefined, quote: page.cita || undefined,
      attribution: page.atribucion || undefined, layout: page.tipo || undefined, image: asset(page.foto) || undefined, photoCredit: page.foto_credito || undefined, photoSource: page.foto_fuente || undefined,
      ...(page.cancion_titulo ? { song: { title: page.cancion_titulo, artist: page.cancion_artista || "", album: page.cancion_album || "", note: page.cancion_nota || "", url: page.cancion_url || "" } } : {}),
    })),
  };
}
