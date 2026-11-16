import type { APIRoute } from "astro"; import { articles } from "../data/articles"; import { categories, site } from "../config/site";
import { getEditions, editionPath } from "../lib/directus";
export const prerender = false;
export const GET: APIRoute = async () => {
  const magazines = await getEditions();
  const paths = ["/", "/ediciones", "/revista", "/membresia", "/acceder", ...magazines.map(editionPath), ...articles.map(a => `/ediciones/${a.slug}`), ...categories.map(c => `/categorias/${c.slug}`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${site.url}${path}</loc></url>`).join("")}</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=0, s-maxage=30" } });
};
