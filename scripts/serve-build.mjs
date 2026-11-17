import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { pathToFileURL } from "node:url";

const directory = resolve(".vercel/output");
const functionDirectory = resolve(directory, "functions/_render.func");
const config = JSON.parse(
  await readFile(resolve(functionDirectory, ".vc-config.json"), "utf8"),
);
const { default: handler } = await import(
  pathToFileURL(resolve(functionDirectory, config.handler)).href
);
const staticDirectory = resolve(directory, "static");
const contentTypes = {
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
};
const port = Number(process.env.PORT || 5174);
const origin = `http://127.0.0.1:${port}`;
createServer(async (request, response) => {
  try {
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    const url = new URL(request.url, origin);
    const path = resolve(
      staticDirectory,
      `.${decodeURIComponent(url.pathname)}`,
    );
    if (path.startsWith(`${staticDirectory}${sep}`)) {
      const file = await stat(path).catch(() => null);
      if (file?.isFile()) {
        response.writeHead(200, {
          "Content-Type":
            contentTypes[extname(path)] ?? "application/octet-stream",
        });
        response.end(
          request.method === "HEAD" ? undefined : await readFile(path),
        );
        return;
      }
    }
    const result = await handler.fetch(
      new Request(url, { method: request.method, headers: request.headers }),
    );
    response.writeHead(result.status, Object.fromEntries(result.headers));
    response.end(
      request.method === "HEAD"
        ? undefined
        : Buffer.from(await result.arrayBuffer()),
    );
  } catch {
    console.error("Local build request failed.");
    response.writeHead(500).end("Local build request failed.");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(
    `Built Vercel function: ${origin} (local only; ISR is not simulated).`,
  );
});
