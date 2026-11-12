import type { APIRoute } from "astro";
import { site } from "../lib/site.ts";
export const prerender = true;
export const GET: APIRoute = () =>
  new Response(
    `User-agent: *\nAllow: /\nDisallow: /api/\n${site.origin ? `\nSitemap: ${site.origin}/sitemap.xml\n` : ""}`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
