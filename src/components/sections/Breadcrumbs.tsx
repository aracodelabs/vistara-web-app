import React from "react";
import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { JsonLd } from "@/components/seo/JsonLd";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({
  items,
  locale,
}: {
  items: BreadcrumbItem[];
  locale: "en" | "ar";
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.label,
      ...(item.href
        ? { item: `${SITE_CONFIG.siteUrl}/${locale}${item.href === "/" ? "" : item.href}` }
        : {}),
    })),
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[#355E3B]">
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
                {idx > 0 && (
                  <ChevronRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 text-[#355E3B]/60 rtl:rotate-180"
                  />
                )}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="font-medium transition-colors hover:text-[#013220] hover:underline"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className="font-semibold text-[#013220]"
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
