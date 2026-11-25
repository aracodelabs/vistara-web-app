import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import {
  buildServiceWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/config/site";
import { WhatsAppIcon } from "@/components/whatsapp/WhatsAppIcon";

export interface ServiceCardData {
  slug: string;
  category: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  image: string;
}

const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  residential: { en: "Residential", ar: "سكني" },
  commercial: { en: "Commercial", ar: "تجاري" },
  specialized: { en: "Specialized Care", ar: "عناية متخصصة" },
};

export function ServiceCard({
  service,
  locale,
  learnMoreLabel,
  whatsappLabel,
}: {
  service: ServiceCardData;
  locale: "en" | "ar";
  learnMoreLabel: string;
  whatsappLabel: string;
}) {
  const title = locale === "ar" ? service.title_ar : service.title_en;
  const description =
    locale === "ar" ? service.description_ar : service.description_en;
  const categoryLabel =
    CATEGORY_LABELS[service.category]?.[locale] ?? service.category;
  const whatsappUrl = buildWhatsAppUrl(
    buildServiceWhatsAppMessage(title, locale)
  );

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#013220]/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#013220]/10">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E8F0E8]">
        <Image
          src={service.image}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute start-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#013220] shadow-sm backdrop-blur-sm">
          {categoryLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-xl font-bold text-[#013220]">{title}</h3>
        <p className="mt-2.5 flex-1 text-sm leading-relaxed text-[#1B1F1C]/80">
          {description}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-[#013220]/10 pt-4">
          <Link
            href={`/services/${service.slug}`}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-[#013220]/20 bg-[#F7F8F4] px-4 text-xs font-semibold text-[#013220] transition-colors hover:bg-[#E8F0E8]"
          >
            <span>{learnMoreLabel}</span>
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#014421] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#013220]"
          >
            <WhatsAppIcon className="h-3.5 w-3.5 shrink-0" />
            <span>{whatsappLabel}</span>
          </a>
        </div>
      </div>
    </article>
  );
}
