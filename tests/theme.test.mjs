import test from "node:test";
import assert from "node:assert/strict";
import { defaultTheme, resolveTheme, themeStyle } from "../src/lib/magazine-theme.ts";

test("the default identity follows the client navy, gold, ivory and turquoise palette", () => {
  assert.equal(defaultTheme.color_fondo, "#091A38");
  assert.equal(defaultTheme.color_titulos, "#F3CC57");
  assert.equal(defaultTheme.color_texto, "#F7F1DF");
  assert.equal(defaultTheme.color_acento, "#42E2C3");
  assert.equal(themeStyle(defaultTheme)["--j-body-size"], "18px");
});

test("edition styling overrides global styling and null values inherit it", () => {
  const theme = resolveTheme({ color_fondo: "#112233", color_titulos: "#abcdef", tamano_texto: 20 }, { color_fondo: "#223344", color_titulos: null, tamano_texto: null, titulos_dorados: false });
  assert.equal(theme.color_fondo, "#223344");
  assert.equal(theme.color_titulos, "#ABCDEF");
  assert.equal(theme.tamano_texto, 20);
  assert.equal(theme.titulos_dorados, false);
});

test("invalid CSS colors and font expressions cannot enter the page", () => {
  const theme = resolveTheme({ color_fondo: "red; background:url(https://invalid.test)", color_titulos: "#123", fuente_titulos: "url(https://invalid.test)", fuente_texto: "__proto__", tamano_texto: NaN });
  assert.deepEqual(theme, defaultTheme);
  assert.equal(resolveTheme({ tamano_texto: 500 }).tamano_texto, 24);
  assert.equal(resolveTheme({ tamano_texto: 1 }).tamano_texto, 16);
  assert.ok(themeStyle(theme)["--j-heading-font"].includes("Georgia"));
});

test("the title badge uses a readable foreground for light and dark title colors", () => {
  assert.equal(themeStyle(resolveTheme({ color_titulos: "#FFFFFF" }))["--j-on-gold"], "#091A38");
  assert.equal(themeStyle(resolveTheme({ color_titulos: "#000000" }))["--j-on-gold"], "#FFFFFF");
});
