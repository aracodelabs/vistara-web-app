import React from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getActiveServices } from "@/lib/services";
import { buildPageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/sections/Breadcrumbs";
import { QuoteForm } from "@/components/forms/QuoteForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale === "ar" ? "ar" : "en";
  const t = await getTranslations({
    locale: typedLocale,
    namespace: "quoteForm",
  });

  return buildPageMetadata({
    locale: typedLocale,
    path: "/quote",
    title: t("pageTitle"),
    description: t("pageDescription"),
  });
}

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { locale } = await params;
  const { service } = await searchParams;
  const typedLocale = locale === "ar" ? "ar" : "en";
  setRequestLocale(typedLocale);

  const [quoteT, bcT, activeServices] = await Promise.all([
    getTranslations("quoteForm"),
    getTranslations("breadcrumbs"),
    getActiveServices(),
  ]);

  const serviceOptions = activeServices.map((s) => ({
    slug: s.slug,
    title_en: s.title_en,
    title_ar: s.title_ar,
  }));

  const defaultSlug =
    service && serviceOptions.some((s) => s.slug === service) ? service : "";

  return (
    <section className="bg-[#F7F8F4] py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          locale={typedLocale}
          items={[
            { label: bcT("home"), href: "/" },
            { label: bcT("quote") },
          ]}
        />

        <span className="text-xs font-semibold tracking-widest text-[#355E3B] uppercase">
          {quoteT("eyebrow")}
        </span>
        <h1 className="mt-2 text-3xl font-bold text-[#013220] sm:text-5xl">
          {quoteT("title")}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[#1B1F1C]/85 sm:text-lg">
          {quoteT("subtitle")}
        </p>

        <div className="mt-8">
          <QuoteForm
            services={serviceOptions}
            defaultServiceSlug={defaultSlug}
          />
        </div>
      </div>
    </section>
  );
}
