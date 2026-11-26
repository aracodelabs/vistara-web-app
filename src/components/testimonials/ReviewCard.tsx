"use client";

import React from "react";
import { MapPin, ShieldCheck } from "lucide-react";
import type { ApprovedTestimonial } from "@/lib/testimonials-types";
import { StarRatingDisplay } from "./StarRating";

export function ReviewCard({
  review,
  locale,
  labels,
}: {
  review: ApprovedTestimonial;
  locale: "en" | "ar";
  labels: {
    verifiedBadge: string;
    generalService: string;
    ratingAria: (rating: number) => string;
  };
}) {
  const serviceName =
    locale === "ar"
      ? review.serviceTitleAr || labels.generalService
      : review.serviceTitleEn || labels.generalService;

  const formattedDate = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-QA" : "en-QA",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(new Date(review.createdAt));

  const initial = review.customerName.trim().charAt(0).toUpperCase() || "V";

  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#013220]/10 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#013220]/10">
      <div className="flex items-start justify-between gap-3">
        <StarRatingDisplay
          rating={review.rating}
          ariaLabel={labels.ratingAria(review.rating)}
          size="sm"
        />

        {review.isVerified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F0E8] px-2.5 py-1 text-xs font-semibold text-[#014421]">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span>{labels.verifiedBadge}</span>
          </span>
        )}
      </div>

      <div className="mt-3">
        <span className="inline-block rounded-full border border-[#013220]/15 bg-[#F7F8F4] px-3 py-1 text-xs font-semibold text-[#355E3B]">
          {serviceName}
        </span>
      </div>

      <p
        dir={review.language === "ar" ? "rtl" : "ltr"}
        className="mt-4 flex-1 text-sm leading-relaxed text-[#1B1F1C]/90 sm:text-base"
      >
        “{review.review}”
      </p>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#013220]/10 pt-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#013220] text-sm font-bold text-[#F7F8F4]"
          >
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#013220]">
              {review.customerName}
            </p>
            {review.location && (
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-[#355E3B]">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{review.location}</span>
              </p>
            )}
          </div>
        </div>

        <time
          dateTime={review.createdAt}
          className="shrink-0 text-xs font-medium text-[#355E3B]/85"
        >
          {formattedDate}
        </time>
      </div>
    </article>
  );
}
