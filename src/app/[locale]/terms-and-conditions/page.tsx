import React from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/sections/Breadcrumbs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale === "ar" ? "ar" : "en";
  const t = await getTranslations({
    locale: typedLocale,
    namespace: "legal.terms",
  });

  return buildPageMetadata({
    locale: typedLocale,
    path: "/terms-and-conditions",
    title: t("title"),
    description: t("description"),
  });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const typedLocale = locale === "ar" ? "ar" : "en";
  setRequestLocale(typedLocale);

  const [t, bcT] = await Promise.all([
    getTranslations("legal.terms"),
    getTranslations("breadcrumbs"),
  ]);

  const sections = t.raw("sections") as { heading: string; body: string }[];

  return (
    <section className="bg-[#F7F8F4] py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          locale={typedLocale}
          items={[
            { label: bcT("home"), href: "/" },
            { label: bcT("terms") },
          ]}
        />

        <div className="rounded-3xl border border-[#013220]/10 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="text-3xl font-bold text-[#013220] sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-xs font-medium text-[#355E3B]">
            {t("lastUpdated")}
          </p>

          <div className="mt-8 space-y-7">
            {sections.map((section) => (
              <div key={section.heading}>
                <h2 className="text-lg font-bold text-[#013220] sm:text-xl">
                  {section.heading}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#1B1F1C]/85 sm:text-base">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
