import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import {
  Cairo,
  Cormorant_Garamond,
  Plus_Jakarta_Sans,
} from "next/font/google";
import { routing } from "@/i18n/routing";
import { SITE_CONFIG } from "@/config/site";
import { getActiveServices } from "@/lib/services";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/whatsapp/FloatingWhatsApp";
import { JsonLd } from "@/components/seo/JsonLd";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    metadataBase: new URL(SITE_CONFIG.siteUrl),
    title: {
      default: isAr
        ? "فيستارا | خدمات التنظيف الفاخرة للمنازل والشركات في قطر"
        : "Vistara | Luxury Residential & Commercial Cleaning Services in Qatar",
      template: isAr ? "%s | فيستارا قطر" : "%s | Vistara Qatar",
    },
    description: isAr
      ? "حلول تنظيف راقية للمنازل والشركات في الدوحة ولوسيل واللؤلؤة والخليج الغربي والوكرة والريان."
      : "Premium residential and commercial cleaning solutions across Doha, Lusail, The Pearl, West Bay, Al Wakrah, and Al Rayyan.",
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const [messages, activeServices] = await Promise.all([
    getMessages(),
    getActiveServices(),
  ]);

  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: isAr ? SITE_CONFIG.brandFullName.ar : SITE_CONFIG.brandFullName.en,
    url: `${SITE_CONFIG.siteUrl}/${locale}`,
    logo: `${SITE_CONFIG.siteUrl}/images/vistara-logo.png`,
    areaServed: SITE_CONFIG.serviceAreas.map((a) => ({
      "@type": "City",
      name: isAr ? a.ar : a.en,
    })),
    sameAs: Object.values(SITE_CONFIG.socialLinks),
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: isAr ? SITE_CONFIG.brandFullName.ar : SITE_CONFIG.brandFullName.en,
    url: `${SITE_CONFIG.siteUrl}/${locale}`,
    image: `${SITE_CONFIG.siteUrl}/images/hero-villa.jpg`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Doha",
      addressCountry: "QA",
    },
    areaServed: SITE_CONFIG.serviceAreas.map((a) => (isAr ? a.ar : a.en)),
    availableLanguage: ["English", "Arabic"],
  };

  const navServices = activeServices.map((s) => ({
    slug: s.slug,
    title_en: s.title_en,
    title_ar: s.title_ar,
    category: s.category,
  }));

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${plusJakarta.variable} ${cormorant.variable} ${cairo.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-white text-[#1B1F1C]">
        <JsonLd data={organizationSchema} />
        <JsonLd data={localBusinessSchema} />
        <NextIntlClientProvider messages={messages}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-[#014421] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          >
            {isAr ? "تجاوز إلى المحتوى الرئيسي" : "Skip to main content"}
          </a>
          <Navbar services={navServices} />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          <FloatingWhatsApp />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
