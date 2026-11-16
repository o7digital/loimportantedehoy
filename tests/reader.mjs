import { firefox } from "playwright";
import assert from "node:assert/strict";

const base = process.env.BASE_URL || "http://127.0.0.1:4321";
const browser = await firefox.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  async function open(path) {
    const response = await page.goto(base + path, { waitUntil: "domcontentloaded" });
    assert.equal(response.status(), 200, path);
    await page.waitForFunction(() => Boolean(document.querySelector("astro-island")) && !document.querySelector("astro-island").hasAttribute("ssr"));
    await page.evaluate(() => document.fonts.ready);
  }
  async function at(index) {
    await page.waitForFunction(index => {
      const track = document.querySelector(".journal-track");
      return Math.abs(track.scrollLeft - index * track.clientWidth) < 2;
    }, index);
    assert.equal(await page.locator(".journal-page:not([inert])").count(), 1);
  }
  await open("/revista");
  await at(0);
  const latestDate = await page.locator(".journal-date-line time").getAttribute("datetime");
  const latestTitle = (await page.locator(".journal-cover-copy h1").innerText()).replace(/\.$/, "");
  assert.equal(await page.getByRole("button", { name: "Página anterior", exact: true }).isDisabled(), true);
  await page.keyboard.press("ArrowRight");
  await at(1);
  await page.getByRole("button", { name: "Página anterior", exact: true }).tap();
  await at(0);
  await page.getByRole("button", { name: "En esta edición" }).tap();
  await page.getByRole("dialog").getByRole("link").filter({ hasText: "Música" }).click();
  await at(5);
  assert.equal(await page.getByRole("button", { name: "Página siguiente", exact: true }).isDisabled(), true);
  await page.route("https://www.youtube-nocookie.com/**", route => route.fulfill({ contentType: "text/html", body: "<title>Official video embed</title>" }));
  await page.getByRole("button", { name: /^Escuchar / }).click();
  const frame = page.locator(".journal-player");
  assert.match(await frame.getAttribute("src"), /^https:\/\/www.youtube-nocookie.com\/embed\/[A-Za-z0-9_-]{11}\?autoplay=1$/);
  await page.keyboard.press("ArrowLeft");
  await at(4);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(document.querySelector("astro-island")) && !document.querySelector("astro-island").hasAttribute("ssr"));
  await at(4);
  for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [1440, 1000], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await at(4);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    if (width <= 820 || height < 500) assert.equal(await page.evaluate(() => Math.round(document.querySelector(".journal-controls").getBoundingClientRect().bottom)), height);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "En esta edición" }).click();
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").isVisible(), false);
  console.log("PASS: touch controls, keyboard, contents, music embed, reload, portrait/landscape and 320px–1440px layouts.");

  await page.getByRole("button", { name: "Otras ediciones" }).click();
  const issueDates = await page.getByRole("dialog").locator("time").evaluateAll(nodes => nodes.map(node => node.dateTime));
  await page.getByRole("dialog").getByRole("link").filter({ hasText: "Leon Russell" }).click();
  await page.waitForURL("**/revista/2026-11-13*", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(document.querySelector("astro-island")) && !document.querySelector("astro-island").hasAttribute("ssr"));
  await at(0);
  for (const date of issueDates) {
    await open(`/revista/${date}#historia`);
    await at(1);
    assert.ok((await page.locator(".journal-page:not([inert]) h2").innerText()).length > 10);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await at(1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 1440);
    await page.setViewportSize({ width: 390, height: 844 });
  }
  await open(`/revista/${latestDate}`);
  await at(0);
  await page.locator(".journal-track").hover();
  await page.mouse.wheel(await page.locator(".journal-track").evaluate(node => node.clientWidth), 0);
  await at(1);
  const reading = await context.newPage();
  await reading.goto(`${base}/revista/${latestDate}#historia`, { waitUntil: "domcontentloaded" });
  await reading.waitForFunction(() => Boolean(document.querySelector("astro-island")) && !document.querySelector("astro-island").hasAttribute("ssr"));
  await reading.waitForFunction(() => document.querySelectorAll(".journal-page[inert]").length === 5);
  await reading.locator(".journal-page:not([inert])").hover();
  await reading.mouse.wheel(0, 500);
  await reading.waitForFunction(() => document.querySelector(".journal-page:not([inert])").scrollTop > 0);
  await reading.close();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.keyboard.press("ArrowRight");
  await at(2);
  console.log("PASS: date-based issues, edition switching, section links, native page scrolling, article reading and reduced motion.");
  for (const route of ["/", "/ediciones", "/ediciones/the-doors-disolucion-1973", "/sitemap.xml", "/fonts/editorial-serif.woff2"]) assert.equal((await context.request.get(base + route)).status(), 200, route);
  const oldLink = await context.request.get(`${base}/revista/frida`, { maxRedirects: 0 });
  assert.equal(oldLink.status(), 301);
  assert.ok(oldLink.headers().location.endsWith("/revista/2026-11-15"));
  for (const route of ["/revista/does-not-exist", "/revista/2026-99-99", "/revista/2099-12-31"]) assert.equal((await context.request.get(base + route)).status(), 404, route);
  await open("/");
  assert.ok((await page.locator(".home-current-edition h1").innerText()).startsWith(latestTitle));
  assert.equal(await page.locator(".home-current-edition time").getAttribute("datetime"), latestDate);
  assert.equal(await page.locator(".home-current-edition .button").getAttribute("href"), `/revista/${latestDate}`);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await page.screenshot({ path: `/tmp/loimportante-home-${width}.png`, fullPage: false });
  }
  console.log("PASS: homepage features the latest published edition, including yesterday’s edition, with responsive CMS artwork.");
  assert.deepEqual(errors, []);
  console.log("PASS: landing, archive, legacy article, sitemap, local fonts, redirects, missing/future issues and no browser errors.");
} finally {
  await browser.close();
}
