"use client";

import React, { useState } from "react";
import { ServiceCard, type ServiceCardData } from "./ServiceCard";
import { cn } from "@/lib/utils";

export function ServicesExplorer({
  services,
  locale,
  labels,
}: {
  services: ServiceCardData[];
  locale: "en" | "ar";
  labels: {
    all: string;
    residential: string;
    commercial: string;
    specialized: string;
    learnMore: string;
    inquireWhatsapp: string;
  };
}) {
  const [filter, setFilter] = useState<string>("all");

  const filters = [
    { key: "all", label: labels.all },
    { key: "residential", label: labels.residential },
    { key: "commercial", label: labels.commercial },
    { key: "specialized", label: labels.specialized },
  ];

  const filtered =
    filter === "all"
      ? services
      : services.filter((svc) => svc.category === filter);

  return (
    <div>
      <div
        role="tablist"
        aria-label={locale === "ar" ? "تصنيف الخدمات" : "Service categories"}
        className="mb-8 flex flex-wrap gap-2"
      >
        {filters.map((item) => {
          const active = filter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(item.key)}
              className={cn(
                "h-10 rounded-full px-5 text-sm font-semibold transition-colors cursor-pointer",
                active
                  ? "bg-[#014421] text-white shadow-sm"
                  : "border border-[#013220]/15 bg-white text-[#013220] hover:bg-[#E8F0E8]"
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((service) => (
          <ServiceCard
            key={service.slug}
            service={service}
            locale={locale}
            learnMoreLabel={labels.learnMore}
            whatsappLabel={labels.inquireWhatsapp}
          />
        ))}
      </div>
    </div>
  );
}
