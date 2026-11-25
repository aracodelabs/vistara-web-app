"use client";

import { useLocale, useTranslations } from "next-intl";
import { buildGeneralWhatsAppMessage, buildWhatsAppUrl } from "@/config/site";
import { WhatsAppIcon } from "./WhatsAppIcon";

export function FloatingWhatsApp() {
  const locale = useLocale() as "en" | "ar";
  const t = useTranslations("floatingWhatsapp");
  const href = buildWhatsAppUrl(buildGeneralWhatsAppMessage(locale));

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("ariaLabel")}
      className="group fixed bottom-5 end-5 z-40 inline-flex h-14 items-center gap-2.5 rounded-full bg-[#014421] px-4 text-white shadow-lg shadow-[#013220]/25 ring-2 ring-white/80 transition-all duration-200 hover:bg-[#013220] hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#014421]"
    >
      <WhatsAppIcon className="h-6 w-6 shrink-0" />
      <span className="hidden text-sm font-semibold sm:inline">
        {t("tooltip")}
      </span>
    </a>
  );
}
