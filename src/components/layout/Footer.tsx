import React from "react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import {
  SITE_CONFIG,
  buildGeneralWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/config/site";
import { WhatsAppIcon } from "@/components/whatsapp/WhatsAppIcon";
import {
  DEFAULT_NAVIGATION_VISIBILITY,
  type NavigationVisibility,
} from "@/lib/navigation-visibility";

export async function Footer({
  navVisibility = DEFAULT_NAVIGATION_VISIBILITY,
}: {
  navVisibility?: NavigationVisibility;
}) {
  const locale = (await getLocale()) as "en" | "ar";
  const t = await getTranslations("footer");
  const navT = await getTranslations("nav");

  const brandName =
    locale === "ar"
      ? SITE_CONFIG.brandFullName.ar
      : SITE_CONFIG.brandFullName.en;
  const whatsappHref = buildWhatsAppUrl(buildGeneralWhatsAppMessage(locale));
  const year = new Date().getFullYear();

  const popularServices = [
    { slug: "villa-cleaning", en: "Villa Cleaning", ar: "تنظيف الفلل" },
    { slug: "apartment-cleaning", en: "Apartment Cleaning", ar: "تنظيف الشقق" },
    { slug: "deep-cleaning", en: "Deep Cleaning", ar: "التنظيف العميق" },
    { slug: "sofa-cleaning", en: "Sofa Cleaning", ar: "تنظيف الكنب والمجالس" },
    { slug: "office-cleaning", en: "Office Cleaning", ar: "تنظيف المكاتب" },
    {
      slug: "water-tank-cleaning",
      en: "Water Tank Cleaning",
      ar: "تنظيف خزانات المياه",
    },
  ];

  return (
    <footer className="border-t border-[#013220]/10 bg-[#013220] text-[#F7F8F4]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center rounded-2xl bg-white px-4 py-2.5 shadow-sm transition-opacity hover:opacity-95"
            >
              <Image
                src="/images/vistara-logo.png"
                alt={brandName}
                width={150}
                height={90}
                className="h-12 w-auto object-contain"
              />
            </Link>
            <p className="text-sm leading-relaxed text-[#E8F0E8]/85">
              {t("description")}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#014421] px-4 text-xs font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-[#355E3B]"
              >
                <WhatsAppIcon className="h-4 w-4" />
                <span>{navT("whatsapp")}</span>
              </a>
              <a
                href={SITE_CONFIG.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center rounded-full border border-white/20 px-3.5 text-xs font-medium text-[#E8F0E8] transition-colors hover:bg-white/10"
              >
                Instagram
              </a>
              <a
                href={SITE_CONFIG.socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center rounded-full border border-white/20 px-3.5 text-xs font-medium text-[#E8F0E8] transition-colors hover:bg-white/10"
              >
                LinkedIn
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-white uppercase">
              {t("quickLinks")}
            </h3>
            <ul className="space-y-2.5 text-sm text-[#E8F0E8]/85">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  {navT("home")}
                </Link>
              </li>
              {navVisibility.about && (
                <li>
                  <Link
                    href="/about"
                    className="transition-colors hover:text-white"
                  >
                    {navT("about")}
                  </Link>
                </li>
              )}
              {navVisibility.services && (
                <li>
                  <Link
                    href="/services"
                    className="transition-colors hover:text-white"
                  >
                    {navT("allServices")}
                  </Link>
                </li>
              )}
              {navVisibility.quote && (
                <li>
                  <Link
                    href="/quote"
                    className="transition-colors hover:text-white"
                  >
                    {navT("quote")}
                  </Link>
                </li>
              )}
              {navVisibility.reviews && (
                <li>
                  <Link
                    href="/testimonials"
                    className="transition-colors hover:text-white"
                  >
                    {navT("testimonials")}
                  </Link>
                </li>
              )}
              {navVisibility.faq && (
                <li>
                  <Link
                    href="/faq"
                    className="transition-colors hover:text-white"
                  >
                    {navT("faq")}
                  </Link>
                </li>
              )}
              {navVisibility.contact && (
                <li>
                  <Link
                    href="/contact"
                    className="transition-colors hover:text-white"
                  >
                    {navT("contact")}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Popular Services */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-white uppercase">
              {t("servicesLinks")}
            </h3>
            <ul className="space-y-2.5 text-sm text-[#E8F0E8]/85">
              {popularServices.map((svc) => (
                <li key={svc.slug}>
                  <Link
                    href={`/services/${svc.slug}`}
                    className="transition-colors hover:text-white"
                  >
                    {locale === "ar" ? svc.ar : svc.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Placeholders */}
          <div className="space-y-3">
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-white uppercase">
              {t("contactTitle")}
            </h3>
            <ul className="space-y-3 text-sm text-[#E8F0E8]/85">
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#E8F0E8]" />
                <span dir="ltr">
                  {SITE_CONFIG.contactPlaceholders.displayPhone}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#E8F0E8]" />
                <span>{SITE_CONFIG.contactPlaceholders.email}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#E8F0E8]" />
                <span>
                  {locale === "ar"
                    ? SITE_CONFIG.contactPlaceholders.address.ar
                    : SITE_CONFIG.contactPlaceholders.address.en}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#E8F0E8]" />
                <span>
                  {locale === "ar"
                    ? SITE_CONFIG.contactPlaceholders.businessHours.ar
                    : SITE_CONFIG.contactPlaceholders.businessHours.en}
                </span>
              </li>
            </ul>
            <p className="pt-1 text-xs text-[#E8F0E8]/65">
              {t("placeholderTag")}
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/15 pt-8 text-xs text-[#E8F0E8]/75 sm:flex-row sm:items-center">
          <p>{t("copyright", { year })}</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link
              href="/privacy-policy"
              className="transition-colors hover:text-white"
            >
              {t("privacy")}
            </Link>
            <Link
              href="/terms-and-conditions"
              className="transition-colors hover:text-white"
            >
              {t("terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
