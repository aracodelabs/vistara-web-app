import React from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getActiveServices } from "@/lib/services";
import { buildPageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/sections/Breadcrumbs";
import { ServicesExplorer } from "@/components/sections/ServicesExplorer";
import { CtaBanner } from "@/components/sections/CtaBanner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale === "ar" ? "ar" : "en";
  const t = await getTranslations({ locale: typedLocale, namespace: "services" });

  return buildPageMetadata({
    locale: typedLocale,
    path: "/services",
    title: t("pageTitle"),
    description: t("pageDescription"),
  });
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const typedLocale = locale === "ar" ? "ar" : "en";
  setRequestLocale(typedLocale);

  const [servicesT, bcT, activeServices] = await Promise.all([
    getTranslations("services"),
    getTranslations("breadcrumbs"),
    getActiveServices(),
  ]);

  return (
    <>
      <section className="bg-[#F7F8F4] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            locale={typedLocale}
            items={[
              { label: bcT("home"), href: "/" },
              { label: bcT("services") },
            ]}
          />

          <span className="text-xs font-semibold tracking-widest text-[#355E3B] uppercase">
            {servicesT("eyebrow")}
          </span>
          <h1 className="mt-2 text-3xl font-bold text-[#013220] sm:text-5xl">
            {servicesT("pageTitle")}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#1B1F1C]/85 sm:text-lg">
            {servicesT("subtitle")}
          </p>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ServicesExplorer
            services={activeServices}
            locale={typedLocale}
            labels={{
              all: servicesT("filterAll"),
              residential: servicesT("filterResidential"),
              commercial: servicesT("filterCommercial"),
              specialized: servicesT("filterSpecialized"),
              learnMore: servicesT("learnMore"),
              inquireWhatsapp: servicesT("inquireWhatsapp"),
            }}
          />
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
