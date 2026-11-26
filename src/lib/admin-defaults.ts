import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import enMessages from "../../messages/en.json";
import arMessages from "../../messages/ar.json";
import { SITE_CONFIG } from "@/config/site";
import { DEFAULT_NAVIGATION_VISIBILITY } from "@/lib/navigation-visibility";

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function revalidatePublicSite(extraPaths: string[] = []): void {
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/en/services");
  revalidatePath("/ar/services");
  revalidatePath("/en/testimonials");
  revalidatePath("/ar/testimonials");
  for (const p of extraPaths) {
    revalidatePath(p);
  }
}

export const DEFAULT_CONTENT_SECTIONS = [
  {
    section_key: "hero",
    content_en: {
      eyebrow: enMessages.hero.eyebrow,
      title: enMessages.hero.title,
      description: enMessages.hero.description,
      primaryCta: enMessages.hero.primaryCta,
      secondaryCta: enMessages.hero.secondaryCta,
    },
    content_ar: {
      eyebrow: arMessages.hero.eyebrow,
      title: arMessages.hero.title,
      description: arMessages.hero.description,
      primaryCta: arMessages.hero.primaryCta,
      secondaryCta: arMessages.hero.secondaryCta,
    },
  },
  {
    section_key: "about",
    content_en: {
      eyebrow: enMessages.about.eyebrow,
      title: enMessages.about.title,
      lead: enMessages.about.lead,
      body1: enMessages.about.body1,
      body2: enMessages.about.body2,
    },
    content_ar: {
      eyebrow: arMessages.about.eyebrow,
      title: arMessages.about.title,
      lead: arMessages.about.lead,
      body1: arMessages.about.body1,
      body2: arMessages.about.body2,
    },
  },
  {
    section_key: "why_choose",
    content_en: {
      eyebrow: enMessages.whyChoose.eyebrow,
      title: enMessages.whyChoose.title,
      subtitle: enMessages.whyChoose.subtitle,
      items: enMessages.whyChoose.items,
    },
    content_ar: {
      eyebrow: arMessages.whyChoose.eyebrow,
      title: arMessages.whyChoose.title,
      subtitle: arMessages.whyChoose.subtitle,
      items: arMessages.whyChoose.items,
    },
  },
  {
    section_key: "contact",
    content_en: {
      eyebrow: enMessages.contact.eyebrow,
      title: enMessages.contact.title,
      subtitle: enMessages.contact.subtitle,
      whatsappCardTitle: enMessages.contact.whatsappCardTitle,
      whatsappCardDesc: enMessages.contact.whatsappCardDesc,
    },
    content_ar: {
      eyebrow: arMessages.contact.eyebrow,
      title: arMessages.contact.title,
      subtitle: arMessages.contact.subtitle,
      whatsappCardTitle: arMessages.contact.whatsappCardTitle,
      whatsappCardDesc: arMessages.contact.whatsappCardDesc,
    },
  },
  {
    section_key: "footer",
    content_en: {
      description: enMessages.footer.description,
      placeholderTag: enMessages.footer.placeholderTag,
    },
    content_ar: {
      description: arMessages.footer.description,
      placeholderTag: arMessages.footer.placeholderTag,
    },
  },
] as const;

export const DEFAULT_FAQS = enMessages.faq.items.map((item, idx) => ({
  question_en: item.question,
  answer_en: item.answer,
  question_ar: arMessages.faq.items[idx]?.question || item.question,
  answer_ar: arMessages.faq.items[idx]?.answer || item.answer,
  sort_order: idx + 1,
  is_active: true,
}));

export const DEFAULT_SEO_PAGES = [
  {
    page_key: "home",
    title_en: enMessages.metadata.defaultTitle,
    title_ar: arMessages.metadata.defaultTitle,
    description_en: enMessages.metadata.defaultDescription,
    description_ar: arMessages.metadata.defaultDescription,
    og_image: "/images/hero-villa.jpg",
    canonical_url: `${SITE_CONFIG.siteUrl}/en`,
  },
  {
    page_key: "about",
    title_en: enMessages.about.pageTitle,
    title_ar: arMessages.about.pageTitle,
    description_en: enMessages.about.pageDescription,
    description_ar: arMessages.about.pageDescription,
    og_image: "/images/about-team.jpg",
    canonical_url: `${SITE_CONFIG.siteUrl}/en/about`,
  },
  {
    page_key: "services",
    title_en: enMessages.services.pageTitle,
    title_ar: arMessages.services.pageTitle,
    description_en: enMessages.services.pageDescription,
    description_ar: arMessages.services.pageDescription,
    og_image: "/images/hero-villa.jpg",
    canonical_url: `${SITE_CONFIG.siteUrl}/en/services`,
  },
  {
    page_key: "testimonials",
    title_en: enMessages.testimonials.metadata.title,
    title_ar: arMessages.testimonials.metadata.title,
    description_en: enMessages.testimonials.metadata.description,
    description_ar: arMessages.testimonials.metadata.description,
    og_image: "/images/hero-villa.jpg",
    canonical_url: `${SITE_CONFIG.siteUrl}/en/testimonials`,
  },
  {
    page_key: "contact",
    title_en: enMessages.contact.pageTitle,
    title_ar: arMessages.contact.pageTitle,
    description_en: enMessages.contact.pageDescription,
    description_ar: arMessages.contact.pageDescription,
    og_image: "/images/hero-villa.jpg",
    canonical_url: `${SITE_CONFIG.siteUrl}/en/contact`,
  },
  {
    page_key: "quote",
    title_en: enMessages.quoteForm.pageTitle,
    title_ar: arMessages.quoteForm.pageTitle,
    description_en: enMessages.quoteForm.pageDescription,
    description_ar: arMessages.quoteForm.pageDescription,
    og_image: "/images/hero-villa.jpg",
    canonical_url: `${SITE_CONFIG.siteUrl}/en/quote`,
  },
  {
    page_key: "faq",
    title_en: enMessages.faq.pageTitle,
    title_ar: arMessages.faq.pageTitle,
    description_en: enMessages.faq.pageDescription,
    description_ar: arMessages.faq.pageDescription,
    og_image: "/images/hero-villa.jpg",
    canonical_url: `${SITE_CONFIG.siteUrl}/en/faq`,
  },
];

export const DEFAULT_WEBSITE_SETTINGS = {
  key: "primary",
  company_name_en: SITE_CONFIG.brandFullName.en,
  company_name_ar: SITE_CONFIG.brandFullName.ar,
  company_email: SITE_CONFIG.contactPlaceholders.email,
  whatsapp_number: SITE_CONFIG.whatsappNumber,
  contact_phone: SITE_CONFIG.contactPlaceholders.displayPhone,
  address_en: SITE_CONFIG.contactPlaceholders.address.en,
  address_ar: SITE_CONFIG.contactPlaceholders.address.ar,
  business_hours_en: SITE_CONFIG.contactPlaceholders.businessHours.en,
  business_hours_ar: SITE_CONFIG.contactPlaceholders.businessHours.ar,
  service_areas: [...SITE_CONFIG.serviceAreas],
  social_links: { ...SITE_CONFIG.socialLinks },
  google_review_url: SITE_CONFIG.googleReviewUrl || null,
  default_language: "en",
  navigation_visibility: { ...DEFAULT_NAVIGATION_VISIBILITY },
};
