# The Fireship Index

A satire site that measures AI coverage in Fireship’s latest 15 uploads.
The score is not a forecast. This project is not affiliated with Fireship.

## Run locally

Use Node 22.23.4 or later. Use the pnpm version in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## Check

```sh
pnpm check
pnpm preview
```

With the preview server running, use `pnpm test:runtime` to check the feed API and page output.

## Deploy

Deploy to Cloudflare Workers with the `FEED_CACHE` KV binding in `wrangler.jsonc`.
Set `SITE_URL` to your public HTTPS origin before the build.

```sh
SITE_URL=https://your-domain.example pnpm build
pnpm run deploy
```

For Cloudflare Git builds, use `pnpm build` as the build command and `pnpm run deploy` as the deploy command.
Use Node 22.23.4 or later. The `packageManager` field sets the pnpm version.

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
If YouTube fails, the last valid reading stays visible with its original check time.

Keep `pnpm-lock.yaml` as the only package lockfile.
See [asset credits](docs/brand-assets.md) and [check records](docs/ux-audit.md).

Built by [Sasivarnan R](https://sasivarnan.com).
