export const themeColors = {
  color_fondo: { label: "Fondo de la revista", value: "#091A38" },
  color_superficie: { label: "Fondo de recuadros y música", value: "#102747" },
  color_texto: { label: "Texto principal", value: "#F7F1DF" },
  color_secundario: { label: "Texto secundario", value: "#C6CCDA" },
  color_titulos: { label: "Títulos y cifras", value: "#F3CC57" },
  color_acento: { label: "Acentos y subtítulos", value: "#42E2C3" },
  color_lineas: { label: "Líneas y separadores", value: "#C6A34D" },
} as const;

export const themeFonts = {
  clasica: 'Georgia, "Times New Roman", serif',
  editorial: 'Editorial, Georgia, serif',
  moderna: 'JournalSans, Arial, sans-serif',
} as const;

export type MagazineTheme = Record<keyof typeof themeColors, string> & {
  fuente_titulos: keyof typeof themeFonts;
  fuente_texto: keyof typeof themeFonts;
  tamano_texto: number;
  titulos_dorados: boolean;
};

export const defaultTheme: MagazineTheme = {
  ...Object.fromEntries(Object.entries(themeColors).map(([key, field]) => [key, field.value])),
  fuente_titulos: "clasica", fuente_texto: "clasica", tamano_texto: 18, titulos_dorados: true,
} as MagazineTheme;

export function resolveTheme(settings: Partial<MagazineTheme> = {}, overrides: Partial<MagazineTheme> = {}): MagazineTheme {
  const result = { ...defaultTheme };
  for (const source of [settings, overrides]) {
    for (const key of Object.keys(themeColors) as (keyof typeof themeColors)[]) {
      const value = source[key];
      if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)) result[key] = value.toUpperCase();
    }
    for (const key of ["fuente_titulos", "fuente_texto"] as const) {
      if (source[key] && Object.hasOwn(themeFonts, source[key])) result[key] = source[key];
    }
    if (typeof source.tamano_texto === "number" && Number.isFinite(source.tamano_texto)) result.tamano_texto = Math.min(24, Math.max(16, source.tamano_texto));
    if (typeof source.titulos_dorados === "boolean") result.titulos_dorados = source.titulos_dorados;
  }
  return result;
}

export function themeStyle(theme: MagazineTheme): Record<string, string> {
  const hex = theme.color_titulos.slice(1);
  const luminance = [0, 2, 4].map(start => parseInt(hex.slice(start, start + 2), 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const light = luminance[0] * 0.2126 + luminance[1] * 0.7152 + luminance[2] * 0.0722;
  return {
    "--j-paper": theme.color_fondo, "--j-surface": theme.color_superficie,
    "--j-ink": theme.color_texto, "--j-muted": theme.color_secundario,
    "--j-gold": theme.color_titulos, "--j-red": theme.color_acento, "--j-line": theme.color_lineas,
    "--j-on-gold": light > 0.179 ? "#091A38" : "#FFFFFF",
    "--j-heading-font": themeFonts[theme.fuente_titulos], "--j-body-font": themeFonts[theme.fuente_texto],
    "--j-body-size": `${theme.tamano_texto}px`,
  };
}
