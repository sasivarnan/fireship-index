import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import { cachedResponse } from "./lib/response-cache.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  if (
    context.request.method !== "GET" ||
    !["/", "/api/feed"].includes(context.url.pathname)
  )
    return next();
  const version =
    (env as unknown as { DEPLOYMENT?: { id?: string } }).DEPLOYMENT?.id ??
    "local";
  const url = new URL(context.url);
  url.pathname = `/.index-cache/${version}${url.pathname}`;
  url.search = "";
  let cache: Cache;
  try {
    cache = await caches.open("fireship-index-gauge-v16");
  } catch {
    return next();
  }
  return cachedResponse({
    cache,
    key: new Request(url),
    generate: next,
    waitUntil: (work) => context.locals.cfContext.waitUntil(work),
  });
});
