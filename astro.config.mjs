import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

export default defineConfig({
  output: "server",
  site: "https://fireship-index.vercel.app",
  adapter: vercel({
    isr: { expiration: 15 * 60, exclude: ["/api/feed"] },
  }),
  session: false,
  server: { host: "127.0.0.1", port: 5174 },
});
