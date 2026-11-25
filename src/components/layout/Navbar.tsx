"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { ChevronDown, Globe, Menu, X } from "lucide-react";
import {
  SITE_CONFIG,
  buildGeneralWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/config/site";
import { WhatsAppIcon } from "@/components/whatsapp/WhatsAppIcon";
import { cn } from "@/lib/utils";

interface NavServiceLink {
  slug: string;
  title_en: string;
  title_ar: string;
  category: string;
}

export function Navbar({ services }: { services: NavServiceLink[] }) {
  const t = useTranslations("nav");
  const locale = useLocale() as "en" | "ar";
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const nextLocale = locale === "en" ? "ar" : "en";
  const brandName =
    locale === "ar" ? SITE_CONFIG.brandName.ar : SITE_CONFIG.brandName.en;
  const whatsappHref = buildWhatsAppUrl(buildGeneralWhatsAppMessage(locale));

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDropdownOpen(false);
        setMobileOpen(false);
      }
    }
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function switchLanguage() {
    setMobileOpen(false);
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#013220]/10 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          aria-label={brandName}
          className="flex shrink-0 items-center gap-2.5 rounded-lg py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#014421]"
          onClick={() => setMobileOpen(false)}
        >
          <Image
            src="/images/vistara-logo.png"
            alt={brandName}
            width={140}
            height={84}
            priority
            className="h-11 w-auto object-contain sm:h-12"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}
          className="hidden items-center gap-1 lg:flex"
        >
          <Link
            href="/"
            className={cn(
              "rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-[#E8F0E8] hover:text-[#013220]",
              pathname === "/"
                ? "bg-[#E8F0E8] text-[#013220] font-semibold"
                : "text-[#1B1F1C]"
            )}
          >
            {t("home")}
          </Link>
          <Link
            href="/about"
            className={cn(
              "rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-[#E8F0E8] hover:text-[#013220]",
              pathname === "/about"
                ? "bg-[#E8F0E8] text-[#013220] font-semibold"
                : "text-[#1B1F1C]"
            )}
          >
            {t("about")}
          </Link>

          {/* Services Dropdown */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button
              type="button"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-[#E8F0E8] hover:text-[#013220] cursor-pointer",
                pathname.startsWith("/services")
                  ? "bg-[#E8F0E8] text-[#013220] font-semibold"
                  : "text-[#1B1F1C]"
              )}
            >
              <span>{t("services")}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  dropdownOpen && "rotate-180"
                )}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute start-0 top-full w-[520px] pt-2">
                <div className="rounded-2xl border border-[#013220]/12 bg-white p-5 shadow-xl shadow-[#013220]/10">
                  <div className="mb-3 flex items-center justify-between border-b border-[#013220]/10 pb-3">
                    <Link
                      href="/services"
                      onClick={() => setDropdownOpen(false)}
                      className="text-sm font-semibold text-[#013220] hover:text-[#014421] hover:underline"
                    >
                      {t("allServices")}
                    </Link>
                    <span className="rounded-full bg-[#E8F0E8] px-2.5 py-0.5 text-xs font-medium text-[#014421]">
                      {services.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {services.map((svc) => (
                      <Link
                        key={svc.slug}
                        href={`/services/${svc.slug}`}
                        onClick={() => setDropdownOpen(false)}
                        className="rounded-lg px-3 py-2 text-sm text-[#1B1F1C] transition-colors hover:bg-[#F7F8F4] hover:text-[#014421]"
                      >
                        {locale === "ar" ? svc.title_ar : svc.title_en}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/services/residential-cleaning"
            className={cn(
              "rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-[#E8F0E8] hover:text-[#013220]",
              pathname === "/services/residential-cleaning"
                ? "bg-[#E8F0E8] text-[#013220] font-semibold"
                : "text-[#1B1F1C]"
            )}
          >
            {t("residential")}
          </Link>
          <Link
            href="/services/commercial-cleaning"
            className={cn(
              "rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-[#E8F0E8] hover:text-[#013220]",
              pathname === "/services/commercial-cleaning"
                ? "bg-[#E8F0E8] text-[#013220] font-semibold"
                : "text-[#1B1F1C]"
            )}
          >
            {t("commercial")}
          </Link>
          <Link
            href="/contact"
            className={cn(
              "rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-[#E8F0E8] hover:text-[#013220]",
              pathname === "/contact"
                ? "bg-[#E8F0E8] text-[#013220] font-semibold"
                : "text-[#1B1F1C]"
            )}
          >
            {t("contact")}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={switchLanguage}
            aria-label={t("languageAria")}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#013220]/15 bg-[#F7F8F4] px-3 text-xs font-semibold text-[#013220] transition-colors hover:bg-[#E8F0E8] cursor-pointer sm:text-sm"
          >
            <Globe className="h-4 w-4 text-[#355E3B]" />
            <span>{t("languageLabel")}</span>
          </button>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-10 items-center gap-1.5 rounded-full border border-[#014421]/30 bg-white px-3.5 text-sm font-semibold text-[#014421] transition-colors hover:bg-[#E8F0E8] sm:inline-flex"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span>{t("whatsapp")}</span>
          </a>

          <Link
            href="/quote"
            className="hidden h-10 items-center rounded-full bg-[#014421] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#013220] md:inline-flex"
          >
            {t("quote")}
          </Link>

          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#013220]/15 bg-white text-[#013220] transition-colors hover:bg-[#E8F0E8] cursor-pointer lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-[#013220]/10 bg-white lg:hidden">
          <nav
            aria-label={locale === "ar" ? "قائمة الجوال" : "Mobile navigation"}
            className="mx-auto flex max-h-[calc(100dvh-4.5rem)] max-w-7xl flex-col gap-1 overflow-y-auto px-4 py-4 sm:px-6"
          >
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-medium text-[#1B1F1C] hover:bg-[#F7F8F4] hover:text-[#013220]"
            >
              {t("home")}
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-medium text-[#1B1F1C] hover:bg-[#F7F8F4] hover:text-[#013220]"
            >
              {t("about")}
            </Link>

            <div>
              <button
                type="button"
                aria-expanded={mobileServicesOpen}
                onClick={() => setMobileServicesOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-base font-medium text-[#1B1F1C] hover:bg-[#F7F8F4] hover:text-[#013220] cursor-pointer"
              >
                <span>{t("services")}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    mobileServicesOpen && "rotate-180"
                  )}
                />
              </button>
              {mobileServicesOpen && (
                <div className="ms-4 mt-1 flex flex-col gap-1 border-s border-[#013220]/15 ps-3">
                  <Link
                    href="/services"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-[#014421] hover:bg-[#F7F8F4]"
                  >
                    {t("allServices")}
                  </Link>
                  {services.map((svc) => (
                    <Link
                      key={svc.slug}
                      href={`/services/${svc.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-3 py-2 text-sm text-[#1B1F1C] hover:bg-[#F7F8F4]"
                    >
                      {locale === "ar" ? svc.title_ar : svc.title_en}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/services/residential-cleaning"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-medium text-[#1B1F1C] hover:bg-[#F7F8F4] hover:text-[#013220]"
            >
              {t("residential")}
            </Link>
            <Link
              href="/services/commercial-cleaning"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-medium text-[#1B1F1C] hover:bg-[#F7F8F4] hover:text-[#013220]"
            >
              {t("commercial")}
            </Link>
            <Link
              href="/faq"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-medium text-[#1B1F1C] hover:bg-[#F7F8F4] hover:text-[#013220]"
            >
              {t("faq")}
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-medium text-[#1B1F1C] hover:bg-[#F7F8F4] hover:text-[#013220]"
            >
              {t("contact")}
            </Link>

            <div className="mt-3 grid grid-cols-1 gap-2.5 border-t border-[#013220]/10 pt-4 sm:grid-cols-2">
              <Link
                href="/quote"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#014421] px-5 text-sm font-semibold text-white hover:bg-[#013220]"
              >
                {t("quote")}
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#014421] bg-[#E8F0E8] px-5 text-sm font-semibold text-[#013220] hover:bg-[#d8e6d8]"
              >
                <WhatsAppIcon className="h-4 w-4" />
                <span>{t("whatsapp")}</span>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
