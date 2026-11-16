import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";

const underConstruction = process.env.SITE_UNDER_CONSTRUCTION === "true";

export default defineConfig({
  ...(underConstruction ? { srcDir: "./maintenance", publicDir: "./maintenance/public" } : {}),
  devToolbar: { enabled: !underConstruction },
  integrations: [react()],
  output: "static",
  adapter: vercel(),
});
