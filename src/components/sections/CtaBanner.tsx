import React from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { buildGeneralWhatsAppMessage, buildWhatsAppUrl } from "@/config/site";
import { WhatsAppIcon } from "@/components/whatsapp/WhatsAppIcon";

export async function CtaBanner() {
  const locale = (await getLocale()) as "en" | "ar";
  const t = await getTranslations("ctaBanner");
  const whatsappHref = buildWhatsAppUrl(buildGeneralWhatsAppMessage(locale));

  return (
    <section className="bg-[#F7F8F4] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#013220] px-6 py-12 text-white shadow-xl sm:px-12 sm:py-16 lg:px-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -end-20 -top-20 h-72 w-72 rounded-full bg-[#355E3B]/35 blur-3xl"
          />
          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <span className="inline-block rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-[#E8F0E8] uppercase">
                {t("eyebrow")}
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {t("title")}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-[#E8F0E8]/90 sm:text-lg">
                {t("description")}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-[#013220] shadow-sm transition-colors hover:bg-[#E8F0E8]"
              >
                <WhatsAppIcon className="h-5 w-5 text-[#014421]" />
                <span>{t("primaryCta")}</span>
              </a>
              <Link
                href="/quote"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/30 bg-[#014421] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#355E3B]"
              >
                <span>{t("secondaryCta")}</span>
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
