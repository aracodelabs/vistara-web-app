import React from "react";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function LocaleNotFound() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <section className="flex min-h-[60vh] items-center justify-center bg-[#F7F8F4] px-4 py-20 text-center">
      <div className="max-w-md rounded-3xl border border-[#013220]/10 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold tracking-widest text-[#355E3B] uppercase">
          404
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[#013220]">
          {isAr ? "الصفحة غير موجودة" : "Page Not Found"}
        </h1>
        <p className="mt-2 text-sm text-[#1B1F1C]/80">
          {isAr
            ? "لم نتمكن من العثور على الصفحة التي تبحث عنها."
            : "We could not find the page you were looking for."}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-[#014421] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#013220]"
        >
          {isAr ? "العودة للرئيسية" : "Return Home"}
        </Link>
      </div>
    </section>
  );
}
