"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, MessageSquareText } from "lucide-react";
import {
  TESTIMONIAL_FILTER_SLUGS,
  type PaginatedTestimonialsResult,
} from "@/lib/testimonials-types";
import { cn } from "@/lib/utils";
import { ReviewCard } from "./ReviewCard";

export function TestimonialsList({
  initialData,
  locale,
}: {
  initialData: PaginatedTestimonialsResult;
  locale: "en" | "ar";
}) {
  const filterT = useTranslations("testimonials.filters");
  const cardT = useTranslations("testimonials.card");
  const emptyT = useTranslations("testimonials.empty");
  const pageT = useTranslations("testimonials.pagination");

  const [selectedSlug, setSelectedSlug] = useState<string>("all");
  const [data, setData] = useState<PaginatedTestimonialsResult>(initialData);
  const [loading, setLoading] = useState(false);

  const filterItems = [
    { slug: "all", label: filterT("all") },
    ...TESTIMONIAL_FILTER_SLUGS.map((slug) => ({
      slug,
      label: filterT(slug),
    })),
  ];

  async function fetchPage(slug: string, page: number) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        service: slug,
        page: String(page),
        pageSize: String(initialData.pageSize),
      });
      const res = await fetch(`/api/testimonials?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.ok) {
          setData({
            items: json.items,
            totalCount: json.totalCount,
            page: json.page,
            pageSize: json.pageSize,
            totalPages: json.totalPages,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSelectFilter(slug: string) {
    setSelectedSlug(slug);
    void fetchPage(slug, 1);
  }

  function handlePageChange(nextPage: number) {
    void fetchPage(selectedSlug, nextPage);
  }

  return (
    <div>
      {/* Filter Tabs */}
      <div
        role="tablist"
        aria-label={filterT("label")}
        className="mb-8 flex flex-wrap gap-2"
      >
        {filterItems.map((item) => {
          const active = selectedSlug === item.slug;
          return (
            <button
              key={item.slug}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleSelectFilter(item.slug)}
              className={cn(
                "h-10 rounded-full px-4 text-sm font-semibold transition-colors cursor-pointer sm:px-5",
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

      {/* Cards Grid or Empty State */}
      {data.items.length === 0 ? (
        <div className="rounded-3xl border border-[#013220]/12 bg-white px-6 py-12 text-center shadow-xs sm:px-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F0E8] text-[#014421]">
            <MessageSquareText className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-xl font-bold text-[#013220]">
            {selectedSlug === "all"
              ? emptyT("allTitle")
              : emptyT("filteredTitle")}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#1B1F1C]/80 sm:text-base">
            {selectedSlug === "all"
              ? emptyT("allDescription")
              : emptyT("filteredDescription")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {selectedSlug !== "all" && (
              <button
                type="button"
                onClick={() => handleSelectFilter("all")}
                className="inline-flex h-11 items-center rounded-full border border-[#013220]/20 bg-[#F7F8F4] px-6 text-sm font-semibold text-[#013220] transition-colors hover:bg-[#E8F0E8] cursor-pointer"
              >
                {emptyT("resetFilter")}
              </button>
            )}
            <a
              href="#submit-review"
              className="inline-flex h-11 items-center rounded-full bg-[#014421] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#013220]"
            >
              {emptyT("ctaButton")}
            </a>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 transition-opacity duration-200",
            loading && "opacity-60"
          )}
        >
          {data.items.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              locale={locale}
              labels={{
                verifiedBadge: cardT("verifiedBadge"),
                generalService: cardT("generalService"),
                ratingAria: (rating) => cardT("ratingAria", { rating }),
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={data.page <= 1 || loading}
            onClick={() => handlePageChange(data.page - 1)}
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-[#013220]/20 bg-white px-5 text-sm font-semibold text-[#013220] transition-colors hover:bg-[#E8F0E8] disabled:pointer-events-none disabled:opacity-45 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            <span>{pageT("previous")}</span>
          </button>

          <span className="px-2 text-sm font-semibold text-[#355E3B]">
            {pageT("pageOf", { page: data.page, total: data.totalPages })}
          </span>

          <button
            type="button"
            disabled={data.page >= data.totalPages || loading}
            onClick={() => handlePageChange(data.page + 1)}
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-[#013220]/20 bg-white px-5 text-sm font-semibold text-[#013220] transition-colors hover:bg-[#E8F0E8] disabled:pointer-events-none disabled:opacity-45 cursor-pointer"
          >
            <span>{pageT("next")}</span>
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
}
