const configuredOrigin = import.meta.env.SITE?.trim();
if (configuredOrigin) {
  const url = new URL(configuredOrigin);
  if (
    url.protocol !== "https:" ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  )
    throw new Error("Astro site must be a public HTTPS origin.");
}
export const site = {
  name: "The Fireship Index",
  title: "The Fireship Index | Unofficial AI Coverage Score",
  description:
    "An unofficial, satirical score of AI coverage and posting pace across up to 15 recent Fireship YouTube uploads, using titles and descriptions.",
  origin: configuredOrigin ? new URL(configuredOrigin).origin : undefined,
};
