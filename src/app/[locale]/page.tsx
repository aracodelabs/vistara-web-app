import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  Home,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import {
  SITE_CONFIG,
  buildGeneralWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/config/site";
import { getActiveServices } from "@/lib/services";
import { buildPageMetadata } from "@/lib/seo";
import { WhatsAppIcon } from "@/components/whatsapp/WhatsAppIcon";
import { ServiceCard } from "@/components/sections/ServiceCard";
import { FaqAccordion, type FaqItem } from "@/components/sections/FaqAccordion";
import { MotionReveal } from "@/components/sections/MotionReveal";
import { CtaBanner } from "@/components/sections/CtaBanner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale === "ar" ? "ar" : "en";
  const t = await getTranslations({ locale: typedLocale, namespace: "metadata" });

  return buildPageMetadata({
    locale: typedLocale,
    path: "/",
    title: t("defaultTitle"),
    description: t("defaultDescription"),
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const typedLocale = locale === "ar" ? "ar" : "en";
  setRequestLocale(typedLocale);

  const [
    heroT,
    trustT,
    aboutT,
    servicesT,
    whyT,
    howT,
    segT,
    areasT,
    faqT,
    activeServices,
  ] = await Promise.all([
    getTranslations("hero"),
    getTranslations("trust"),
    getTranslations("about"),
    getTranslations("services"),
    getTranslations("whyChoose"),
    getTranslations("howItWorks"),
    getTranslations("segments"),
    getTranslations("areas"),
    getTranslations("faq"),
    getActiveServices(),
  ]);

  const trustItems = trustT.raw("items") as {
    title: string;
    description: string;
  }[];
  const aboutHighlights = aboutT.raw("highlights") as string[];
  const whyItems = whyT.raw("items") as {
    title: string;
    description: string;
  }[];
  const howSteps = howT.raw("steps") as {
    number: string;
    title: string;
    description: string;
  }[];
  const resBullets = segT.raw("residential.bullets") as string[];
  const comBullets = segT.raw("commercial.bullets") as string[];
  const faqItems = (faqT.raw("items") as FaqItem[]).slice(0, 6);

  const whatsappHref = buildWhatsAppUrl(
    buildGeneralWhatsAppMessage(typedLocale)
  );

  const trustIcons = [Home, Sparkles, CalendarClock, MessageCircle];
  const whyIcons = [
    ShieldCheck,
    Sparkles,
    CalendarClock,
    MessageCircle,
    Wrench,
    CheckCircle2,
  ];

  return (
    <>
      {/* B. HERO SECTION */}
      <section className="relative overflow-hidden bg-[#F7F8F4] pb-16 pt-10 sm:pb-20 sm:pt-14 lg:pb-24 lg:pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#E8F0E8] px-4 py-1.5 text-xs font-semibold tracking-wide text-[#014421]">
                <MapPin className="h-3.5 w-3.5" />
                <span>{heroT("eyebrow")}</span>
              </span>

              <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-[#013220] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.12]">
                {heroT("title")}
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#1B1F1C]/85 sm:text-lg">
                {heroT("description")}
              </p>

              <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
                <Link
                  href="/services"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#014421] px-7 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#013220]"
                >
                  <span>{heroT("primaryCta")}</span>
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>

                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#013220]/25 bg-white px-7 text-sm font-semibold text-[#013220] shadow-xs transition-colors hover:bg-[#E8F0E8]"
                >
                  <WhatsAppIcon className="h-5 w-5 text-[#014421]" />
                  <span>{heroT("secondaryCta")}</span>
                </a>
              </div>

              <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[#013220]/10 bg-white/80 p-4 backdrop-blur-xs">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F0E8] text-[#014421]">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#013220]">
                    {heroT("badgeLabel")}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#355E3B]">
                    {heroT("badgeSub")}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-[#013220]/10 shadow-2xl shadow-[#013220]/15 sm:aspect-[16/11] lg:aspect-[4/3]">
                <Image
                  src="/images/hero-villa.jpg"
                  alt={heroT("imageAlt")}
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

      {/* C. TRUST SECTION */}
      <section className="border-y border-[#013220]/10 bg-white py-14 sm:py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold tracking-widest text-[#355E3B] uppercase">
              {trustT("eyebrow")}
            </span>
            <h2 className="mt-2 text-2xl font-bold text-[#013220] sm:text-3xl">
              {trustT("title")}
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item, idx) => {
              const Icon = trustIcons[idx % trustIcons.length];
              return (
                <MotionReveal key={item.title} delay={idx * 0.05}>
                  <div className="h-full rounded-2xl border border-[#013220]/10 bg-[#F7F8F4] p-6 transition-colors hover:border-[#014421]/30">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F0E8] text-[#014421]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-[#013220]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#1B1F1C]/80">
                      {item.description}
                    </p>
                  </div>
                </MotionReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* D. ABOUT THE COMPANY */}
      <section className="bg-[#F7F8F4] py-16 sm:py-22">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <MotionReveal className="lg:col-span-5">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-[#013220]/10 shadow-lg">
                <Image
                  src="/images/about-team.jpg"
                  alt={aboutT("imageAlt")}
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />
              </div>
            </MotionReveal>

            <MotionReveal className="lg:col-span-7" delay={0.08}>
              <span className="text-xs font-semibold tracking-widest text-[#355E3B] uppercase">
                {aboutT("eyebrow")}
              </span>
              <h2 className="mt-2 text-3xl font-bold text-[#013220] sm:text-4xl">
                {aboutT("title")}
              </h2>
              <p className="mt-4 text-base font-medium leading-relaxed text-[#013220]/90 sm:text-lg">
                {aboutT("lead")}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#1B1F1C]/80 sm:text-base">
                {aboutT("body1")}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#1B1F1C]/80 sm:text-base">
                {aboutT("body2")}
              </p>

              <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {aboutHighlights.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2.5 text-sm text-[#1B1F1C]"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E8F0E8] text-[#014421]">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link
                  href="/about"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[#014421] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#013220]"
                >
                  <span>{aboutT("cta")}</span>
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </div>
            </MotionReveal>
          </div>
        </div>
      </section>

      {/* E. SERVICES SECTION */}
      <section className="bg-white py-16 sm:py-22">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold tracking-widest text-[#355E3B] uppercase">
                {servicesT("eyebrow")}
              </span>
              <h2 className="mt-2 text-3xl font-bold text-[#013220] sm:text-4xl">
                {servicesT("title")}
              </h2>
              <p className="mt-3 text-base text-[#1B1F1C]/80">
                {servicesT("subtitle")}
              </p>
            </div>
            <Link
              href="/services"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-[#013220]/20 bg-[#F7F8F4] px-5 text-sm font-semibold text-[#013220] transition-colors hover:bg-[#E8F0E8]"
            >
              <span>{servicesT("viewAll")}</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activeServices.map((service) => (
              <ServiceCard
                key={service.slug}
                service={service}
                locale={typedLocale}
                learnMoreLabel={servicesT("learnMore")}
                whatsappLabel={servicesT("inquireWhatsapp")}
              />
            ))}
          </div>
        </div>
      </section>

      {/* F. WHY CHOOSE US */}
      <section className="bg-[#F7F8F4] py-16 sm:py-22">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold tracking-widest text-[#355E3B] uppercase">
              {whyT("eyebrow")}
            </span>
            <h2 className="mt-2 text-3xl font-bold text-[#013220] sm:text-4xl">
              {whyT("title")}
            </h2>
            <p className="mt-3 text-base text-[#1B1F1C]/80">
              {whyT("subtitle")}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {whyItems.map((item, idx) => {
              const Icon = whyIcons[idx % whyIcons.length];
              return (
                <MotionReveal key={item.title} delay={idx * 0.04}>
                  <div className="h-full rounded-2xl border border-[#013220]/10 bg-white p-6 shadow-xs">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F0E8] text-[#014421]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-[#013220]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#1B1F1C]/80">
                      {item.description}
                    </p>
                  </div>
                </MotionReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* G. HOW IT WORKS */}
      <section className="bg-white py-16 sm:py-22">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold tracking-widest text-[#355E3B] uppercase">
              {howT("eyebrow")}
            </span>
            <h2 className="mt-2 text-3xl font-bold text-[#013220] sm:text-4xl">
              {howT("title")}
            </h2>
            <p className="mt-3 text-base text-[#1B1F1C]/80">
              {howT("subtitle")}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {howSteps.map((step, idx) => (
              <MotionReveal key={step.number} delay={idx * 0.05}>
                <div className="flex h-full flex-col rounded-2xl border border-[#013220]/12 bg-[#F7F8F4] p-6">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#014421] text-sm font-bold text-white">
                    {step.number}
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-[#013220]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#1B1F1C]/80">
                    {step.description}
                  </p>
                </div>
              </MotionReveal>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-3xl rounded-2xl border border-[#014421]/15 bg-[#E8F0E8]/60 px-5 py-3.5 text-center text-xs font-medium text-[#013220] sm:text-sm">
            {howT("note")}
          </p>
        </div>
      </section>

      {/* H. RESIDENTIAL & COMMERCIAL SERVICES */}
      <section className="bg-[#F7F8F4] py-16 sm:py-22">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold tracking-widest text-[#355E3B] uppercase">
              {segT("eyebrow")}
            </span>
            <h2 className="mt-2 text-3xl font-bold text-[#013220] sm:text-4xl">
              {segT("title")}
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Residential Card */}
            <div className="flex flex-col overflow-hidden rounded-3xl border border-[#013220]/10 bg-white shadow-sm">
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src="/images/service-apartment.jpg"
                  alt={segT("residential.imageAlt")}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#E8F0E8] px-3.5 py-1 text-xs font-semibold text-[#014421]">
                  <Home className="h-3.5 w-3.5" />
                  <span>{segT("residential.badge")}</span>
                </span>
                <h3 className="mt-4 text-2xl font-bold text-[#013220]">
                  {segT("residential.title")}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#1B1F1C]/80 sm:text-base">
                  {segT("residential.description")}
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {resBullets.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-[#1B1F1C]"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#014421]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-7">
                  <Link
                    href="/services/residential-cleaning"
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[#014421] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#013220]"
                  >
                    <span>{segT("residential.cta")}</span>
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Commercial Card */}
            <div className="flex flex-col overflow-hidden rounded-3xl border border-[#013220]/10 bg-white shadow-sm">
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src="/images/service-office.jpg"
                  alt={segT("commercial.imageAlt")}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#E8F0E8] px-3.5 py-1 text-xs font-semibold text-[#014421]">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{segT("commercial.badge")}</span>
                </span>
                <h3 className="mt-4 text-2xl font-bold text-[#013220]">
                  {segT("commercial.title")}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#1B1F1C]/80 sm:text-base">
                  {segT("commercial.description")}
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {comBullets.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-[#1B1F1C]"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#014421]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-7">
                  <Link
                    href="/services/commercial-cleaning"
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[#355E3B] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#013220]"
                  >
                    <span>{segT("commercial.cta")}</span>
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Service Areas Strip */}
          <div className="mt-12 rounded-3xl border border-[#013220]/10 bg-white p-6 text-center sm:p-8">
            <span className="text-xs font-semibold tracking-widest text-[#355E3B] uppercase">
              {areasT("eyebrow")}
            </span>
            <h3 className="mt-1.5 text-2xl font-bold text-[#013220]">
              {areasT("title")}
            </h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-[#1B1F1C]/80">
              {areasT("description")}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2.5">
              {SITE_CONFIG.serviceAreas.map((area) => (
                <span
                  key={area.slug}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F0E8] px-4 py-2 text-xs font-semibold text-[#013220] sm:text-sm"
                >
                  <MapPin className="h-3.5 w-3.5 text-[#014421]" />
                  <span>{typedLocale === "ar" ? area.ar : area.en}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* I. FAQ SECTION */}
      <section className="bg-white py-16 sm:py-22">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold tracking-widest text-[#355E3B] uppercase">
              {faqT("eyebrow")}
            </span>
            <h2 className="mt-2 text-3xl font-bold text-[#013220] sm:text-4xl">
              {faqT("title")}
            </h2>
            <p className="mt-3 text-base text-[#1B1F1C]/80">
              {faqT("subtitle")}
            </p>
          </div>

          <div className="mt-10">
            <FaqAccordion items={faqItems} />
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/faq"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[#013220]/20 bg-[#F7F8F4] px-6 text-sm font-semibold text-[#013220] transition-colors hover:bg-[#E8F0E8]"
            >
              <span>{faqT("viewAll")}</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>

      {/* J. FINAL CTA */}
      <CtaBanner />
    </>
  );
}
