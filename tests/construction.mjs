import { firefox } from "playwright";
import assert from "node:assert/strict";
const base = process.env.BASE_URL || "http://127.0.0.1:4321";
for (const path of ["/", "/revista", "/revista/2026-11-15", "/revista/frida", "/ediciones", "/ediciones/the-doors-disolucion-1973", "/membresia", "/editorial/frida.jpg", "/sitemap.xml", "/missing-page"]) {
  const response = await fetch(base + path);
  assert.equal(response.status, 503, path);
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0", path);
  assert.match(response.headers.get("x-robots-tag"), /noindex/);
  assert.equal(response.headers.get("retry-after"), "3600");
  const html = await response.text();
  assert.ok(!html.includes("journal-page"), `No reader data in ${path}`);
  assert.ok(!html.includes("Frida") && !html.includes("The Doors"), `No editorial content in ${path}`);
}
const robots = await fetch(base + "/robots.txt");
assert.equal(robots.status, 200);
assert.match(await robots.text(), /Disallow: \//);
const browser = await firefox.launch();
try {
  const page = await browser.newPage();
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  for (const [width, height] of [[320, 568], [390, 844], [1440, 1000]]) {
    await page.setViewportSize({ width, height });
    const response = await page.goto(base + "/", { waitUntil: "domcontentloaded" });
    assert.equal(response.status(), 503);
    await page.getByRole("heading", { level: 1 }).waitFor({ state: "visible" });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    assert.equal(await page.locator("meta[name=robots]").getAttribute("content"), "noindex,nofollow,noarchive");
    await page.screenshot({ path: `/tmp/loimportante-construction-${width}.png`, fullPage: true });
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
console.log("PASS: home, direct links, legacy pages, static files and missing routes show the holding page; no editorial content, no caching/indexing and responsive at 320–1440px.");
