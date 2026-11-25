import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check, MapPin } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { buildPageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/sections/Breadcrumbs";
import { CtaBanner } from "@/components/sections/CtaBanner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale === "ar" ? "ar" : "en";
  const t = await getTranslations({ locale: typedLocale, namespace: "about" });

  return buildPageMetadata({
    locale: typedLocale,
    path: "/about",
    title: t("pageTitle"),
    description: t("pageDescription"),
    image: "/images/about-team.jpg",
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const typedLocale = locale === "ar" ? "ar" : "en";
  setRequestLocale(typedLocale);

  const [aboutT, bcT, areasT] = await Promise.all([
    getTranslations("about"),
    getTranslations("breadcrumbs"),
    getTranslations("areas"),
  ]);

  const highlights = aboutT.raw("highlights") as string[];
  const pillars = aboutT.raw("pillars") as {
    title: string;
    description: string;
  }[];

  return (
    <>
      <section className="bg-[#F7F8F4] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            locale={typedLocale}
            items={[
              { label: bcT("home"), href: "/" },
              { label: bcT("about") },
            ]}
          />

          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6">
              <span className="text-xs font-semibold tracking-widest text-[#355E3B] uppercase">
                {aboutT("eyebrow")}
              </span>
              <h1 className="mt-2 text-3xl font-bold text-[#013220] sm:text-5xl">
                {aboutT("title")}
              </h1>
              <p className="mt-5 text-lg font-medium leading-relaxed text-[#013220]/90">
                {aboutT("lead")}
              </p>
              <p className="mt-3 text-base leading-relaxed text-[#1B1F1C]/85">
                {aboutT("body1")}
              </p>
              <p className="mt-3 text-base leading-relaxed text-[#1B1F1C]/85">
                {aboutT("body2")}
              </p>
            </div>

            <div className="lg:col-span-6">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-[#013220]/10 shadow-xl">
                <Image
                  src="/images/about-team.jpg"
                  alt={aboutT("imageAlt")}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#013220] sm:text-3xl">
            {aboutT("pillarsTitle")}
          </h2>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-2xl border border-[#013220]/10 bg-[#F7F8F4] p-6 sm:p-7"
              >
                <h3 className="text-xl font-bold text-[#013220]">
                  {pillar.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#1B1F1C]/85 sm:text-base">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-3xl border border-[#013220]/10 bg-[#E8F0E8]/55 p-6 sm:p-8">
            <h3 className="text-xl font-bold text-[#013220]">
              {aboutT("highlightsTitle")}
            </h3>
            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-[#1B1F1C] sm:text-base"
                >
                  <Check className="mt-1 h-4 w-4 shrink-0 text-[#014421]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 border-t border-[#013220]/10 pt-6">
              <p className="text-sm font-semibold text-[#013220]">
                {areasT("title")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SITE_CONFIG.serviceAreas.map((area) => (
                  <span
                    key={area.slug}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-[#013220] shadow-xs sm:text-sm"
                  >
                    <MapPin className="h-3.5 w-3.5 text-[#014421]" />
                    <span>{typedLocale === "ar" ? area.ar : area.en}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
