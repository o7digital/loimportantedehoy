import { chromium, firefox, webkit } from "playwright";
import assert from "node:assert/strict";

const base = process.env.BASE_URL || "http://127.0.0.1:4321";
const selected = (process.env.READER_BROWSERS || "firefox,chromium,webkit").split(",");
for (const name of selected) {
  const browser = await ({ chromium, firefox, webkit }[name]).launch();
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, ...(name !== "firefox" ? { isMobile: true } : {}) });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${base}/revista/2026-11-15`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.querySelector(".journal-track")?.dataset.pageTurn === "true");
    await page.evaluate(() => document.fonts.ready);
    async function at(index) {
      try {
        await page.waitForFunction(index => {
          const track = document.querySelector(".journal-track");
          const active = document.querySelectorAll(".journal-page")[index];
          return Math.abs(track.scrollLeft - index * track.clientWidth) < 1 && active.dataset.current === "true" && getComputedStyle(active).visibility === "visible";
        }, index);
      } catch (error) {
        console.error(name, { expected: index, viewport: page.viewportSize(), state: await page.evaluate(() => ({ left: document.querySelector(".journal-track").scrollLeft, width: document.querySelector(".journal-track").clientWidth, current: document.querySelector(".journal-page[data-current=true]")?.id })) });
        await page.screenshot({ path: `/tmp/revista-page-turn-${name}-failure.png` });
        throw error;
      }
      assert.equal(await page.locator(".journal-page:not([inert])").count(), 1);
    }
    const session = name === "chromium" ? await context.newCDPSession(page) : null;
    async function touch(x, y, endX, endY, steps = 14) {
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      for (let i = 1; i <= steps; i++) {
        await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + (endX - x) * i / steps, y: y + (endY - y) * i / steps }] });
        await page.waitForTimeout(20);
      }
      // A release at rest tests the dragged distance rather than a synthetic fling.
      await page.waitForTimeout(100);
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    }
    async function turn(direction) {
      if (session) await touch(direction > 0 ? 320 : 70, 470, direction > 0 ? 70 : 320, 470);
      else if (name === "webkit") {
        // Playwright does not expose wheel/swipe injection on mobile WebKit.
        // Exercise native scrolling here; Chromium above exercises real pans.
        await page.locator(".journal-track").evaluate((track, direction) => track.scrollBy({ left: direction * track.clientWidth, behavior: "smooth" }), direction);
      }
      else {
        // Firefox's synthetic wheel events have no gesture-end phase. Let its
        // wheel transaction expire before starting a different gesture.
        if (name === "firefox") await page.waitForTimeout(1600);
        await page.locator(".journal-track").hover({ position: { x: 170, y: 200 } });
        await page.mouse.wheel(direction * await page.locator(".journal-track").evaluate(track => track.clientWidth), 0);
      }
    }
    await at(0);
    console.log(`${name}: reader ready; checking the paper fold and native gestures.`);
    assert.equal(await page.locator(".journal-swipe-hint").isVisible(), true);
    assert.ok(await page.locator(".journal-turn-corner").evaluate(button => button.clientWidth >= 44 && button.clientHeight >= 44));

    // Mid-turn geometry: the upcoming page rests under the rotating current leaf.
    await page.evaluate(() => { const track = document.querySelector(".journal-track"); track.style.scrollSnapType = "none"; track.scrollLeft = track.clientWidth * .3; });
    await page.waitForFunction(() => {
      const angle = Number(document.querySelector(".journal-page").style.transform.match(/rotateY\(([-\d.]+)deg\)/)?.[1]);
      return angle < -45 && angle > -65;
    });
    const leaves = await page.locator(".journal-page").evaluateAll(pages => pages.slice(0, 2).map(page => ({ left: page.getBoundingClientRect().left, transform: page.style.transform })));
    assert.ok(Math.abs(leaves[0].left - leaves[1].left) < 1, "Leaves share the binding edge.");
    await page.screenshot({ path: `/tmp/revista-page-turn-${name}.png` });
    await page.evaluate(() => { const track = document.querySelector(".journal-track"); track.scrollTo({ left: 0, behavior: "instant" }); track.style.scrollSnapType = ""; });
    await at(0);
    if (session) {
      await touch(250, 470, 225, 470, 10);
      await at(0);
    }
    await turn(1);
    await at(1);
    assert.ok(page.url().endsWith("#historia"));
    if (session) await touch(190, 650, 190, 340);
    else if (name === "webkit") await page.locator(".journal-page[data-current=true]").evaluate(article => article.scrollBy({ top: 450, behavior: "instant" }));
    else { await page.waitForTimeout(1600); await page.locator(".journal-page[data-current=true]").hover(); await page.mouse.wheel(0, 450); }
    await page.waitForFunction(() => document.querySelector(".journal-page[data-current=true]").scrollTop > 50);
    const readingPosition = await page.locator(".journal-page[data-current=true]").evaluate(article => article.scrollTop);
    await turn(1); await at(2);
    await turn(-1); await at(1);
    console.log(`${name}: forward/reverse paging and vertical article reading passed.`);
    assert.ok(Math.abs(await page.locator(".journal-page[data-current=true]").evaluate(article => article.scrollTop) - readingPosition) < 2, "Returning preserves the article's reading position.");
    await page.getByRole("button", { name: "Doblar la esquina para pasar de página" }).tap();
    await at(2);
    await page.getByRole("button", { name: "En esta edición" }).tap();
    await page.getByRole("dialog").getByRole("link").filter({ hasText: "Música" }).tap();
    await at(5);
    assert.equal(await page.locator(".journal-turn-corner").count(), 0);
    await turn(1); await at(5);
    await turn(-1); await at(4);

    for (const [width, height] of [[844, 390], [320, 568], [390, 844]]) {
      await page.setViewportSize({ width, height });
      await at(4);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      assert.equal(await page.evaluate(() => Math.round(document.querySelector(".journal-controls").getBoundingClientRect().bottom)), height);
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(() => document.querySelector(".journal-track").dataset.pageTurn === "false");
    await page.getByRole("button", { name: "Página anterior", exact: true }).tap();
    await at(3);
    assert.equal(await page.locator(".journal-page[data-current=true]").evaluate(article => article.style.transform), "");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForFunction(() => document.querySelector(".journal-track").dataset.pageTurn === "true");
    await at(3);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.querySelector(".journal-track")?.dataset.pageTurn === "true");
    await at(3);
    assert.deepEqual(errors, []);
    console.log(`PASS ${name}: ${session ? "native touch swipes, cancelled drag, vertical touch reading" : "native scrolling and touch controls"}, page fold, reverse, boundaries, contents, reading position, rotation, reduced motion and reload.`);
  } finally { await browser.close(); }
}
