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
import {
  DEFAULT_NAVIGATION_VISIBILITY,
  type NavigationVisibility,
} from "@/lib/navigation-visibility";
import { cn } from "@/lib/utils";

interface NavServiceLink {
  slug: string;
  title_en: string;
  title_ar: string;
  category: string;
}

export function Navbar({
  services,
  navVisibility = DEFAULT_NAVIGATION_VISIBILITY,
}: {
  services: NavServiceLink[];
  navVisibility?: NavigationVisibility;
}) {
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

  function navLinkClass(active: boolean) {
    return cn(
      "relative inline-flex shrink-0 items-center whitespace-nowrap py-2 text-[13px] font-medium transition-colors xl:text-sm",
      active
        ? "font-semibold text-[#013220] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-[#6BAE00]"
        : "text-[#1B1F1C]/80 hover:text-[#013220]"
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#013220]/10 bg-white/90 shadow-[0_1px_12px_rgba(1,50,32,0.04)] backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[1360px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
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
            className="h-10 w-auto object-contain xl:h-11"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}
          className="hidden items-center gap-4 lg:flex xl:gap-6"
        >
          <Link href="/" className={navLinkClass(pathname === "/")}>
            {t("home")}
          </Link>
          {navVisibility.about && (
            <Link href="/about" className={navLinkClass(pathname === "/about")}>
              {t("about")}
            </Link>
          )}

          {/* Services Dropdown */}
          {navVisibility.services && (
            <div
              ref={dropdownRef}
              className="relative shrink-0"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button
                type="button"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className={cn(
                  navLinkClass(pathname.startsWith("/services")),
                  "gap-1 cursor-pointer"
                )}
              >
                <span>{t("services")}</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
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
          )}

          {navVisibility.residential && (
            <Link
              href="/services/residential-cleaning"
              className={navLinkClass(
                pathname === "/services/residential-cleaning"
              )}
            >
              {t("residential")}
            </Link>
          )}
          {navVisibility.commercial && (
            <Link
              href="/services/commercial-cleaning"
              className={navLinkClass(
                pathname === "/services/commercial-cleaning"
              )}
            >
              {t("commercial")}
            </Link>
          )}
          {navVisibility.reviews && (
            <Link
              href="/testimonials"
              className={navLinkClass(pathname === "/testimonials")}
            >
              {t("testimonials")}
            </Link>
          )}
          {navVisibility.contact && (
            <Link
              href="/contact"
              className={navLinkClass(pathname === "/contact")}
            >
              {t("contact")}
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2 xl:gap-2.5">
          <span
            aria-hidden="true"
            className="hidden h-5 w-px bg-[#013220]/12 lg:block"
          />

          <button
            type="button"
            onClick={switchLanguage}
            aria-label={t("languageAria")}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#013220]/15 bg-[#F7F8F4] px-3 text-xs font-semibold text-[#013220] transition-colors hover:bg-[#E8F0E8] cursor-pointer xl:h-10"
          >
            <Globe className="h-3.5 w-3.5 shrink-0 text-[#355E3B]" />
            <span>{t("languageLabel")}</span>
          </button>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("whatsapp")}
            title={t("whatsapp")}
            className="hidden h-9 w-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[#014421]/25 bg-white text-xs font-semibold text-[#014421] transition-colors hover:bg-[#E8F0E8] sm:inline-flex xl:h-10 xl:w-10 2xl:w-auto 2xl:px-3.5"
          >
            <WhatsAppIcon className="h-4 w-4 shrink-0" />
            <span className="hidden 2xl:inline">{t("whatsapp")}</span>
          </a>

          {navVisibility.quote && (
            <Link
              href="/quote"
              className="hidden h-9 shrink-0 items-center whitespace-nowrap rounded-full bg-[#014421] px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#013220] md:inline-flex xl:h-10 xl:px-5 xl:text-sm"
            >
              {t("quote")}
            </Link>
          )}

          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#013220]/15 bg-white text-[#013220] transition-colors hover:bg-[#E8F0E8] cursor-pointer lg:hidden"
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
            {navVisibility.about && (
              <Link
                href="/about"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-[#1B1F1C] hover:bg-[#F7F8F4] hover:text-[#013220]"
              >
                {t("about")}
              </Link>
            )}

            {navVisibility.services && (
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
            )}

            {navVisibility.residential && (
              <Link
                href="/services/residential-cleaning"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-[#1B1F1C] hover:bg-[#F7F8F4] hover:text-[#013220]"
              >
                {t("residential")}
              </Link>
            )}
            {navVisibility.commercial && (
              <Link
                href="/services/commercial-cleaning"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-[#1B1F1C] hover:bg-[#F7F8F4] hover:text-[#013220]"
              >
                {t("commercial")}
              </Link>
            )}
            {navVisibility.reviews && (
              <Link
                href="/testimonials"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-[#1B1F1C] hover:bg-[#F7F8F4] hover:text-[#013220]"
              >
                {t("testimonials")}
              </Link>
            )}
            {navVisibility.faq && (
              <Link
                href="/faq"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-[#1B1F1C] hover:bg-[#F7F8F4] hover:text-[#013220]"
              >
                {t("faq")}
              </Link>
            )}
            {navVisibility.contact && (
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-[#1B1F1C] hover:bg-[#F7F8F4] hover:text-[#013220]"
              >
                {t("contact")}
              </Link>
            )}

            <div className="mt-3 grid grid-cols-1 gap-2.5 border-t border-[#013220]/10 pt-4 sm:grid-cols-2">
              {navVisibility.quote && (
                <Link
                  href="/quote"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#014421] px-5 text-sm font-semibold text-white hover:bg-[#013220]"
                >
                  {t("quote")}
                </Link>
              )}
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
