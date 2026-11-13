import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  site: "https://fireship-index.sasivarnan.com",
  adapter: cloudflare({ imageService: "passthrough" }),
  session: false,
  server: { host: "127.0.0.1", port: 5174 },
});
