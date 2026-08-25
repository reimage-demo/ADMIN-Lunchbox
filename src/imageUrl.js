const publicSiteUrl =
  import.meta.env.VITE_PUBLIC_SITE_URL ||
  "https://lunchboxct.com/";

export function resolveMenuImageUrl(value = "") {
  if (!value || /^(?:https?:|blob:|data:)/i.test(value)) return value;
  return new URL(
    String(value).replace(/^\.\//, "").replace(/^\//, ""),
    publicSiteUrl.endsWith("/") ? publicSiteUrl : `${publicSiteUrl}/`,
  ).href;
}
