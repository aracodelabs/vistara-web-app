import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Check, MapPin, Sparkles } from "lucide-react";
import {
  SITE_CONFIG,
  buildServiceWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/config/site";
import {
  getActiveServices,
  getLocalizedServiceDescription,
  getLocalizedServiceTitle,
  getServiceBySlug,
} from "@/lib/services";
import { SERVICE_DETAIL_CONTENT } from "@/data/services-content";
import { buildPageMetadata } from "@/lib/seo";
import { routing } from "@/i18n/routing";
import { Breadcrumbs } from "@/components/sections/Breadcrumbs";
import { ServiceCard } from "@/components/sections/ServiceCard";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { JsonLd } from "@/components/seo/JsonLd";
import { WhatsAppIcon } from "@/components/whatsapp/WhatsAppIcon";

export async function generateStaticParams() {
  try {
    const allServices = await getActiveServices();
    return routing.locales.flatMap((locale) =>
      allServices.map((svc) => ({ locale, slug: svc.slug }))
    );
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const typedLocale = locale === "ar" ? "ar" : "en";
  const service = await getServiceBySlug(slug);

  if (!service) {
    return {};
  }

  const title = getLocalizedServiceTitle(service, typedLocale);
  const description = getLocalizedServiceDescription(service, typedLocale);

  return buildPageMetadata({
    locale: typedLocale,
    path: `/services/${service.slug}`,
    title:
      typedLocale === "ar"
        ? `${title} في قطر`
        : `${title} Service in Qatar`,
    description,
    image: service.image,
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const typedLocale = locale === "ar" ? "ar" : "en";
  setRequestLocale(typedLocale);

  const [service, allServices, servicesT, bcT, faqT] = await Promise.all([
    getServiceBySlug(slug),
    getActiveServices(),
    getTranslations("services"),
    getTranslations("breadcrumbs"),
    getTranslations("faq"),
  ]);

  if (!service) {
    notFound();
  }

  const title = getLocalizedServiceTitle(service, typedLocale);
  const description = getLocalizedServiceDescription(service, typedLocale);
  const details = SERVICE_DETAIL_CONTENT[service.slug];
  const includedList = details?.included[typedLocale] ?? [];
  const idealForList = details?.idealFor[typedLocale] ?? [];
  const processList = details?.process[typedLocale] ?? [];

  const serviceFaqs = (details?.faqs ?? []).map((item) => ({
    question: item.question[typedLocale],
    answer: item.answer[typedLocale],
  }));
  const generalFaqs = (
    faqT.raw("items") as { question: string; answer: string }[]
  ).slice(0, 3);
  const combinedFaqs = [...serviceFaqs, ...generalFaqs];

  const isCategoryOverview =
    service.slug === "residential-cleaning" ||
    service.slug === "commercial-cleaning";

  const targetCategory =
    service.slug === "residential-cleaning" ? "residential" : "commercial";

  const childServices = isCategoryOverview
    ? allServices.filter(
        (s) => s.category === targetCategory && s.slug !== service.slug
      )
    : [];

  const relatedServices = allServices
    .filter((s) => s.slug !== service.slug)
    .sort((a, b) =>
      a.category === service.category && b.category !== service.category
        ? -1
        : 1
    )
    .slice(0, 3);

  const whatsappUrl = buildWhatsAppUrl(
    buildServiceWhatsAppMessage(title, typedLocale)
  );

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: title,
    description,
    provider: {
      "@type": "LocalBusiness",
      name:
        typedLocale === "ar"
          ? SITE_CONFIG.brandFullName.ar
          : SITE_CONFIG.brandFullName.en,
      url: `${SITE_CONFIG.siteUrl}/${typedLocale}`,
    },
    areaServed: SITE_CONFIG.serviceAreas.map((a) => ({
      "@type": "City",
      name: typedLocale === "ar" ? a.ar : a.en,
    })),
    url: `${SITE_CONFIG.siteUrl}/${typedLocale}/services/${service.slug}`,
  };

  return (
    <>
      <JsonLd data={serviceJsonLd} />

      {/* Header Banner */}
      <section className="bg-[#F7F8F4] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            locale={typedLocale}
            items={[
              { label: bcT("home"), href: "/" },
              { label: bcT("services"), href: "/services" },
              { label: title },
            ]}
          />

          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F0E8] px-3.5 py-1 text-xs font-semibold text-[#014421]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{servicesT("detail.overview")}</span>
              </span>

              <h1 className="mt-4 text-3xl font-bold text-[#013220] sm:text-5xl">
                {title}
              </h1>

              <p className="mt-4 text-base leading-relaxed text-[#1B1F1C]/85 sm:text-lg">
                {description}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#014421] px-7 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#013220]"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  <span>{servicesT("detail.whatsappButton")}</span>
                </a>

                <Link
                  href={`/quote?service=${service.slug}`}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#013220]/25 bg-white px-7 text-sm font-semibold text-[#013220] transition-colors hover:bg-[#E8F0E8]"
                >
                  <span>{servicesT("detail.quoteButton")}</span>
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-[#355E3B]">
                {servicesT("detail.appointmentNote")}
              </p>
            </div>

            <div className="lg:col-span-6">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-[#013220]/10 shadow-xl">
                <Image
                  src={service.image}
                  alt={title}
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

      {/* Child services when viewing Residential or Commercial overview */}
      {childServices.length > 0 && (
        <section className="border-b border-[#013220]/10 bg-white py-14 sm:py-18">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[#013220] sm:text-3xl">
              {servicesT("detail.includedServicesTitle")}
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {childServices.map((child) => (
                <ServiceCard
                  key={child.slug}
                  service={child}
                  locale={typedLocale}
                  learnMoreLabel={servicesT("learnMore")}
                  whatsappLabel={servicesT("inquireWhatsapp")}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Details Grid */}
      <section className="bg-white py-14 sm:py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* What Is Included */}
            <div className="rounded-3xl border border-[#013220]/10 bg-[#F7F8F4] p-6 sm:p-8 lg:col-span-7">
              <h2 className="text-2xl font-bold text-[#013220]">
                {servicesT("detail.includedTitle")}
              </h2>
              <ul className="mt-6 space-y-3.5">
                {includedList.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm leading-relaxed text-[#1B1F1C] sm:text-base"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#014421] text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ideal Spaces & Areas */}
            <div className="space-y-6 lg:col-span-5">
              <div className="rounded-3xl border border-[#013220]/10 bg-[#E8F0E8]/55 p-6 sm:p-8">
                <h2 className="text-xl font-bold text-[#013220]">
                  {servicesT("detail.idealForTitle")}
                </h2>
                <ul className="mt-4 space-y-3">
                  {idealForList.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-[#1B1F1C] sm:text-base"
                    >
                      <Check className="mt-1 h-4 w-4 shrink-0 text-[#014421]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 border-t border-[#013220]/10 pt-5">
                  <div className="flex flex-wrap gap-2">
                    {SITE_CONFIG.serviceAreas.map((area) => (
                      <span
                        key={area.slug}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#013220]"
                      >
                        <MapPin className="h-3 w-3 text-[#014421]" />
                        <span>{typedLocale === "ar" ? area.ar : area.en}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-[#013220] p-6 text-white sm:p-8">
                <h2 className="text-xl font-bold text-white">
                  {servicesT("detail.ctaTitle")}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#E8F0E8]/85">
                  {servicesT("detail.ctaDescription")}
                </p>
                <div className="mt-5 flex flex-col gap-2.5">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#013220] transition-colors hover:bg-[#E8F0E8]"
                  >
                    <WhatsAppIcon className="h-4 w-4 text-[#014421]" />
                    <span>{servicesT("detail.whatsappButton")}</span>
                  </a>
                  <Link
                    href={`/quote?service=${service.slug}`}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-white/25 bg-[#014421] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#355E3B]"
                  >
                    {servicesT("detail.quoteButton")}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Process */}
          <div className="mt-14">
            <h2 className="text-2xl font-bold text-[#013220] sm:text-3xl">
              {servicesT("detail.processTitle")}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {processList.map((step, idx) => (
                <div
                  key={step}
                  className="rounded-2xl border border-[#013220]/10 bg-[#F7F8F4] p-5"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#014421] text-xs font-bold text-white">
                    0{idx + 1}
                  </span>
                  <p className="mt-3 text-sm leading-relaxed text-[#1B1F1C]">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Service FAQ */}
      <section className="bg-[#F7F8F4] py-14 sm:py-18">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-2xl font-bold text-[#013220] sm:text-3xl">
            {servicesT("detail.faqTitle")}
          </h2>
          <FaqAccordion items={combinedFaqs} />
        </div>
      </section>

      {/* Related Services */}
      <section className="bg-white py-14 sm:py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#013220] sm:text-3xl">
            {servicesT("detail.relatedTitle")}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedServices.map((rel) => (
              <ServiceCard
                key={rel.slug}
                service={rel}
                locale={typedLocale}
                learnMoreLabel={servicesT("learnMore")}
                whatsappLabel={servicesT("inquireWhatsapp")}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
