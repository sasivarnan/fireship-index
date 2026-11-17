# The Fireship Index

A satire site that measures AI coverage in Fireship’s latest 15 uploads.
The score is not a forecast. This project is not affiliated with Fireship.

## Run locally

Use Node 24.x. Use the pnpm version in `package.json`.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

## Check

```sh
pnpm check
pnpm preview
```

`pnpm preview` serves the built Vercel function on localhost. With it running, use
`pnpm test:runtime` to check the feed API and page output.
Use `PORT` to change the local port and `BASE_URL` to point runtime checks at it.
`pnpm check` also runs built-function tests with local fixtures and simulated storage.
Local checks do not test Vercel ISR. The preview command uses a local helper because
the Vercel adapter does not support `astro preview`.

## Vercel setup

Use the Astro preset, Node 24.x, and this project root.
Use `pnpm install --frozen-lockfile` to install and `pnpm build` to build.
The adapter creates Vercel functions and static assets in `.vercel/output`.
Do not publish only the static assets.

Create a **private Vercel Blob store** in your Vercel dashboard and connect it to
this project. This uses your Vercel account; no separate provider signup is needed.
Set `BLOB_READ_WRITE_TOKEN` on the server in each required Vercel environment and
in local `.env`. Use the read/write token from the connected store.
Do not add a `PUBLIC_` prefix. No store is created by this code.
Restart the local server after a token change. The server reads the token through
Astro’s server-only secret API, which supports local `.env` files and Vercel settings.

Use a separate private store for preview tests. The shared snapshot file is
`feed-snapshots/fireship:feed:v3.json`. It is replaced after a valid feed fetch.
It has no expiry, so an upstream failure can use the last valid reading.
Reads bypass Blob's file cache to get the latest saved snapshot.
Each store operation has a 1.5-second deadline. Both RSS attempts share eight seconds.
Store errors are logged. A valid upstream reading can still be shown, but storage
must work to keep that reading for later requests or other function instances.
The new store starts empty; existing KV or Redis snapshots are not copied automatically.

The production URL is `https://fireship-index.vercel.app`. It is set once in
`astro.config.mjs`. Metadata, robots, and sitemap all use this value.

Deployment, DNS changes, commits, and pushes require separate requests.
Keep the existing Cloudflare deployment and snapshot until the Vercel release is accepted.

## Score and feed

The site checks titles and descriptions for AI terms. Edit `src/lib/keywords.ts` to change the terms.

```text
days = max(1, days since the oldest upload)
AI share = matched uploads / sampled uploads
weekly rate = matched uploads / days × 7
pressure = min(1, weekly rate / 3)
score = round(100 × (0.6 × AI share + 0.4 × pressure))
```

The server uses YouTube RSS. It checks for updates on request after 15 minutes.
Vercel ISR caches `/` for 900 seconds. After expiration, a request can get the
saved page while Vercel builds the next one. This is not a scheduled fetch.
`/api/feed` is excluded from ISR and returns `Cache-Control: no-store`.
Refresh reads the shared snapshot; it does not bypass its 15-minute freshness window.
A page rendered from an old snapshot can be cached for another 15 minutes.
Refresh can still attempt recovery through the API during this interval.
If YouTube fails, the last valid reading stays visible with its original check time.

Keep `pnpm-lock.yaml` as the only package lockfile.
See [asset credits](docs/brand-assets.md) and [current check records](docs/ux-audit.md).

Built by [Sasivarnan R](https://sasivarnan.com).
