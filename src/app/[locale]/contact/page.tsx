import React from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import {
  SITE_CONFIG,
  buildGeneralWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/config/site";
import { getActiveServices } from "@/lib/services";
import { buildPageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/sections/Breadcrumbs";
import { QuoteForm } from "@/components/forms/QuoteForm";
import { WhatsAppIcon } from "@/components/whatsapp/WhatsAppIcon";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale === "ar" ? "ar" : "en";
  const t = await getTranslations({ locale: typedLocale, namespace: "contact" });

  return buildPageMetadata({
    locale: typedLocale,
    path: "/contact",
    title: t("pageTitle"),
    description: t("pageDescription"),
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const typedLocale = locale === "ar" ? "ar" : "en";
  setRequestLocale(typedLocale);

  const [contactT, bcT, activeServices] = await Promise.all([
    getTranslations("contact"),
    getTranslations("breadcrumbs"),
    getActiveServices(),
  ]);

  const whatsappHref = buildWhatsAppUrl(
    buildGeneralWhatsAppMessage(typedLocale)
  );
  const serviceOptions = activeServices.map((s) => ({
    slug: s.slug,
    title_en: s.title_en,
    title_ar: s.title_ar,
  }));

  return (
    <section className="bg-[#F7F8F4] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          locale={typedLocale}
          items={[
            { label: bcT("home"), href: "/" },
            { label: bcT("contact") },
          ]}
        />

        <span className="text-xs font-semibold tracking-widest text-[#355E3B] uppercase">
          {contactT("eyebrow")}
        </span>
        <h1 className="mt-2 text-3xl font-bold text-[#013220] sm:text-5xl">
          {contactT("title")}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#1B1F1C]/85 sm:text-lg">
          {contactT("subtitle")}
        </p>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Contact Details Sidebar */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-3xl bg-[#013220] p-6 text-white shadow-lg sm:p-8">
              <h2 className="text-2xl font-bold text-white">
                {contactT("whatsappCardTitle")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#E8F0E8]/85 sm:text-base">
                {contactT("whatsappCardDesc")}
              </p>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#013220] transition-colors hover:bg-[#E8F0E8]"
              >
                <WhatsAppIcon className="h-5 w-5 text-[#014421]" />
                <span>{contactT("whatsappButton")}</span>
              </a>
            </div>

            <div className="rounded-3xl border border-[#013220]/10 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-bold text-[#013220]">
                {contactT("detailsTitle")}
              </h2>

              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#014421]" />
                  <div>
                    <dt className="font-semibold text-[#013220]">
                      {contactT("phoneLabel")}
                    </dt>
                    <dd dir="ltr" className="text-[#1B1F1C]/80">
                      {SITE_CONFIG.contactPlaceholders.displayPhone}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#014421]" />
                  <div>
                    <dt className="font-semibold text-[#013220]">
                      {contactT("emailLabel")}
                    </dt>
                    <dd className="text-[#1B1F1C]/80">
                      {SITE_CONFIG.contactPlaceholders.email}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#014421]" />
                  <div>
                    <dt className="font-semibold text-[#013220]">
                      {contactT("addressLabel")}
                    </dt>
                    <dd className="text-[#1B1F1C]/80">
                      {typedLocale === "ar"
                        ? SITE_CONFIG.contactPlaceholders.address.ar
                        : SITE_CONFIG.contactPlaceholders.address.en}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#014421]" />
                  <div>
                    <dt className="font-semibold text-[#013220]">
                      {contactT("hoursLabel")}
                    </dt>
                    <dd className="text-[#1B1F1C]/80">
                      {typedLocale === "ar"
                        ? SITE_CONFIG.contactPlaceholders.businessHours.ar
                        : SITE_CONFIG.contactPlaceholders.businessHours.en}
                    </dd>
                  </div>
                </div>
              </dl>

              <div className="mt-6 border-t border-[#013220]/10 pt-5">
                <p className="text-xs font-semibold tracking-wide text-[#355E3B] uppercase">
                  {contactT("areasLabel")}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {SITE_CONFIG.serviceAreas.map((area) => (
                    <span
                      key={area.slug}
                      className="rounded-full bg-[#E8F0E8] px-3 py-1 text-xs font-semibold text-[#013220]"
                    >
                      {typedLocale === "ar" ? area.ar : area.en}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="lg:col-span-7">
            <QuoteForm services={serviceOptions} />
          </div>
        </div>
      </div>
    </section>
  );
}
