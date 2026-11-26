import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ExternalLink, MessageSquarePlus } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { getActiveServices } from "@/lib/services";
import { getNavigationVisibility } from "@/lib/site-settings";
import {
  getApprovedReviewSummary,
  getApprovedTestimonials,
} from "@/lib/testimonials";
import { buildPageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/sections/Breadcrumbs";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { JsonLd } from "@/components/seo/JsonLd";
import { ReviewSummary } from "@/components/testimonials/ReviewSummary";
import { TestimonialsList } from "@/components/testimonials/TestimonialsList";
import { TestimonialForm } from "@/components/forms/TestimonialForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale === "ar" ? "ar" : "en";
  const t = await getTranslations({
    locale: typedLocale,
    namespace: "testimonials.metadata",
  });

  return buildPageMetadata({
    locale: typedLocale,
    path: "/testimonials",
    title: t("title"),
    description: t("description"),
  });
}

export default async function TestimonialsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const typedLocale = locale === "ar" ? "ar" : "en";
  setRequestLocale(typedLocale);

  const navVisibility = await getNavigationVisibility();
  if (!navVisibility.reviews) {
    notFound();
  }

  const [t, bcT, initialData, summary, activeServices] = await Promise.all([
    getTranslations("testimonials"),
    getTranslations("breadcrumbs"),
    getApprovedTestimonials({ page: 1, pageSize: 9 }),
    getApprovedReviewSummary(),
    getActiveServices(),
  ]);

  const serviceOptions = activeServices.map((s) => ({
    slug: s.slug,
    title_en: s.title_en,
    title_ar: s.title_ar,
  }));

  const collectionSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("metadata.title"),
    description: t("metadata.description"),
    url: `${SITE_CONFIG.siteUrl}/${typedLocale}/testimonials`,
    inLanguage: typedLocale === "ar" ? "ar-QA" : "en-QA",
  };

  // Emit AggregateRating and Review schema ONLY when genuine approved reviews exist
  const businessReviewsSchema: Record<string, unknown> | null =
    summary.totalApproved > 0 && summary.averageRating !== null
      ? {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name:
            typedLocale === "ar"
              ? SITE_CONFIG.brandFullName.ar
              : SITE_CONFIG.brandFullName.en,
          url: `${SITE_CONFIG.siteUrl}/${typedLocale}`,
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: summary.averageRating,
            reviewCount: summary.totalApproved,
            bestRating: 5,
            worstRating: 1,
          },
          review: initialData.items.map((item) => ({
            "@type": "Review",
            author: {
              "@type": "Person",
              name: item.customerName,
            },
            datePublished: item.createdAt,
            reviewBody: item.review,
            reviewRating: {
              "@type": "Rating",
              ratingValue: item.rating,
              bestRating: 5,
              worstRating: 1,
            },
          })),
        }
      : null;

  return (
    <>
      <JsonLd data={collectionSchema} />
      {businessReviewsSchema && <JsonLd data={businessReviewsSchema} />}

      {/* Hero Section */}
      <section className="bg-[#F7F8F4] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            locale={typedLocale}
            items={[
              { label: bcT("home"), href: "/" },
              { label: bcT("testimonials") },
            ]}
          />

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#6BAE00]/30 bg-[#E8F0E8] px-4 py-1.5 text-xs font-semibold tracking-wide text-[#014421]">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[#6BAE00]"
              />
              <span>{t("hero.eyebrow")}</span>
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#013220] sm:text-5xl">
              {t("hero.title")}
            </h1>

            <p className="mt-4 text-base leading-relaxed text-[#1B1F1C]/85 sm:text-lg">
              {t("hero.subtitle")}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <a
                href="#submit-review"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#014421] px-7 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#013220]"
              >
                <MessageSquarePlus className="h-4 w-4" />
                <span>{t("hero.submitCta")}</span>
              </a>

              {SITE_CONFIG.googleReviewUrl && (
                <a
                  href={SITE_CONFIG.googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#013220]/25 bg-white px-7 text-sm font-semibold text-[#013220] transition-colors hover:bg-[#E8F0E8]"
                >
                  <span>{t("hero.googleCta")}</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Review Summary */}
          <div className="mt-10">
            <ReviewSummary summary={summary} />
          </div>
        </div>
      </section>

      {/* Filterable Approved Reviews */}
      <section className="bg-white py-14 sm:py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TestimonialsList initialData={initialData} locale={typedLocale} />
        </div>
      </section>

      {/* Review Submission Section */}
      <section
        id="submit-review"
        className="scroll-mt-24 border-t border-[#013220]/10 bg-[#F7F8F4] py-14 sm:py-18"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold tracking-widest text-[#355E3B] uppercase">
            {t("form.eyebrow")}
          </span>
          <h2 className="mt-2 text-3xl font-bold text-[#013220] sm:text-4xl">
            {t("form.title")}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#1B1F1C]/85">
            {t("form.subtitle")}
          </p>

          <div className="mt-8">
            <TestimonialForm services={serviceOptions} />
          </div>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
