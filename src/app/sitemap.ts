import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/config/site";
import { getActiveServices } from "@/lib/services";
import { routing } from "@/i18n/routing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/about",
    "/services",
    "/contact",
    "/quote",
    "/faq",
    "/privacy-policy",
    "/terms-and-conditions",
  ];

  let serviceSlugs: string[] = [];
  try {
    const active = await getActiveServices();
    serviceSlugs = active.map((s) => `/services/${s.slug}`);
  } catch {
    serviceSlugs = [];
  }

  const allPaths = [...staticPaths, ...serviceSlugs];
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const path of allPaths) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${SITE_CONFIG.siteUrl}/${locale}${path}`,
        lastModified: now,
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1.0 : path.startsWith("/services/") ? 0.85 : 0.7,
        alternates: {
          languages: {
            en: `${SITE_CONFIG.siteUrl}/en${path}`,
            ar: `${SITE_CONFIG.siteUrl}/ar${path}`,
          },
        },
      });
    }
  }

  return entries;
}
