import React from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/sections/Breadcrumbs";
import { FaqAccordion, type FaqItem } from "@/components/sections/FaqAccordion";
import { CtaBanner } from "@/components/sections/CtaBanner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale === "ar" ? "ar" : "en";
  const t = await getTranslations({ locale: typedLocale, namespace: "faq" });

  return buildPageMetadata({
    locale: typedLocale,
    path: "/faq",
    title: t("pageTitle"),
    description: t("pageDescription"),
  });
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const typedLocale = locale === "ar" ? "ar" : "en";
  setRequestLocale(typedLocale);

  const [faqT, bcT] = await Promise.all([
    getTranslations("faq"),
    getTranslations("breadcrumbs"),
  ]);

  const items = faqT.raw("items") as FaqItem[];

  return (
    <>
      <section className="bg-[#F7F8F4] py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            locale={typedLocale}
            items={[
              { label: bcT("home"), href: "/" },
              { label: bcT("faq") },
            ]}
          />

          <span className="text-xs font-semibold tracking-widest text-[#355E3B] uppercase">
            {faqT("eyebrow")}
          </span>
          <h1 className="mt-2 text-3xl font-bold text-[#013220] sm:text-5xl">
            {faqT("pageTitle")}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[#1B1F1C]/85 sm:text-lg">
            {faqT("subtitle")}
          </p>

          <div className="mt-10">
            <FaqAccordion items={items} />
          </div>
        </div>
      </section>
      <CtaBanner />
    </>
  );
}
