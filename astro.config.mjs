// @ts-check
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://andorlabs.ca",
  integrations: [mdx(), sitemap()],
  // Pages stay prerendered; only routes with `prerender = false`
  // (src/pages/api/*) run on the Worker per request.
  output: "static",
  adapter: cloudflare(),
  trailingSlash: "ignore",
  devToolbar: { enabled: false },
});
