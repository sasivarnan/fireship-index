import type { APIRoute } from "astro";
import { site } from "../lib/site.ts";
export const prerender = true;
export const GET: APIRoute = () =>
  site.origin
    ? new Response(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${site.origin}/</loc></url></urlset>`,
        { headers: { "Content-Type": "application/xml; charset=utf-8" } },
      )
    : new Response(null, { status: 404 });
