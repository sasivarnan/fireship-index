const configuredOrigin = import.meta.env.SITE_URL?.trim();
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
    throw new Error("SITE_URL must be a public HTTPS origin.");
}
export const site = {
  name: "The Fireship Index",
  description:
    "A satirical score based on how often Fireship covers AI. Recent YouTube videos, checked using titles and descriptions.",
  origin: configuredOrigin ? new URL(configuredOrigin).origin : undefined,
};
