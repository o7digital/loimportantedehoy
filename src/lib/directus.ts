import { magazines as sampleEditions, type Magazine } from "../data/magazines";
import { resolveTheme, type MagazineTheme } from "./magazine-theme";
import { type CMSEdition, appearanceFields, editionFields, normalizeEdition } from "./edition-model";

const cmsUrl = () => (import.meta.env.DIRECTUS_URL || process.env.DIRECTUS_URL || "").replace(/\/$/, "");
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());
const published = () => ({ _and: [{ estado: { _eq: "published" } }, { fecha: { _lte: today() } }] });


async function request<T>(collection: string, params: Record<string, string>): Promise<T[]> {
  const url = new URL(`${cmsUrl()}/items/${collection}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Directus ${collection}: HTTP ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload.data)) throw new Error(`Directus ${collection}: invalid response`);
  return payload.data;
}

async function getAppearance(): Promise<MagazineTheme> {
  if (!cmsUrl()) return resolveTheme();
  const response = await fetch(`${cmsUrl()}/items/apariencia?fields=${appearanceFields}`, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Directus apariencia: HTTP ${response.status}`);
  const { data } = await response.json();
  return resolveTheme(data || {});
}

export async function getEditions(): Promise<Magazine[]> {
  if (!cmsUrl()) {
    if (import.meta.env.PROD) throw new Error("DIRECTUS_URL is not configured");
    return sampleEditions;
  }
  const items = await request<CMSEdition>("ediciones", { fields: editionFields, sort: "-fecha", limit: "100", filter: JSON.stringify(published()) });
  return items.map(item => normalizeEdition(item, cmsUrl()));
}

export async function getEdition(key?: string): Promise<Magazine | undefined> {
  if (!cmsUrl()) {
    if (import.meta.env.PROD) throw new Error("DIRECTUS_URL must be configured in production");
    return key ? sampleEditions.find(edition => edition.slug === key || edition.date === key) : sampleEditions[0];
  }
  const dateKey = key && /^\d{4}-\d{2}-\d{2}$/.test(key) && !Number.isNaN(Date.parse(key)) && new Date(key).toISOString().slice(0, 10) === key;
  const keyFilter = key ? { _or: [{ slug: { _eq: key } }, ...(dateKey ? [{ fecha: { _eq: key } }] : [])] } : {};
  const filter = { _and: [published(), keyFilter] };
  const [items, theme] = await Promise.all([request<CMSEdition>("ediciones", { fields: `${editionFields},paginas.*`, sort: "-fecha", limit: "1", filter: JSON.stringify(filter), "deep[paginas][_sort]": "orden", "deep[paginas][_filter][estado][_eq]": "published" }), getAppearance()]);
  const [item] = items;
  if (!item) return undefined;
  const edition = normalizeEdition(item, cmsUrl(), theme);
  if (!edition.chapters.length || edition.chapters[0].id !== "portada") throw new Error("The edition needs a published cover page");
  return edition;
}

export const editionPath = (edition: Pick<Magazine, "date">) => `/revista/${edition.date}`;
