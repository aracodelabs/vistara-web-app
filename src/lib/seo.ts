import type { Metadata } from "next";
import { SITE_CONFIG } from "@/config/site";

export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  image = "/images/hero-villa.jpg",
}: {
  locale: "en" | "ar";
  path: string;
  title: string;
  description: string;
  image?: string;
}): Metadata {
  const cleanPath = path === "/" ? "" : path;
  const canonicalUrl = `${SITE_CONFIG.siteUrl}/${locale}${cleanPath}`;
  const enUrl = `${SITE_CONFIG.siteUrl}/en${cleanPath}`;
  const arUrl = `${SITE_CONFIG.siteUrl}/ar${cleanPath}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: enUrl,
        ar: arUrl,
        "x-default": enUrl,
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "ar" ? "ar_QA" : "en_QA",
      alternateLocale: locale === "ar" ? ["en_QA"] : ["ar_QA"],
      url: canonicalUrl,
      siteName:
        locale === "ar"
          ? SITE_CONFIG.brandFullName.ar
          : SITE_CONFIG.brandFullName.en,
      title,
      description,
      images: [
        {
          url: `${SITE_CONFIG.siteUrl}${image}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_CONFIG.siteUrl}${image}`],
    },
  };
}
