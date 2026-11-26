import React from "react";
import { getTranslations } from "next-intl/server";
import { ExternalLink, MessageSquarePlus, Star } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import type { ReviewSummaryStats } from "@/lib/testimonials";
import { StarRatingDisplay } from "./StarRating";

export async function ReviewSummary({
  summary,
}: {
  summary: ReviewSummaryStats;
}) {
  const [t, cardT, heroT] = await Promise.all([
    getTranslations("testimonials.summary"),
    getTranslations("testimonials.card"),
    getTranslations("testimonials.hero"),
  ]);

  const hasRatings = summary.totalApproved > 0 && summary.averageRating !== null;
  const starLevels = [5, 4, 3, 2, 1] as const;

  return (
    <div className="rounded-3xl border border-[#013220]/12 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
        {/* Left: Average Score or Empty Honest State */}
        <div className="flex flex-col items-start lg:col-span-5">
          <h2 className="text-xl font-bold text-[#013220] sm:text-2xl">
            {t("title")}
          </h2>

          {hasRatings ? (
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-bold tracking-tight text-[#013220]">
                  {summary.averageRating!.toFixed(1)}
                </span>
                <span className="text-sm font-medium text-[#355E3B]">
                  {t("outOfFive")}
                </span>
              </div>
              <div className="space-y-1">
                <StarRatingDisplay
                  rating={summary.averageRating!}
                  ariaLabel={cardT("ratingAria", {
                    rating: summary.averageRating!,
                  })}
                  size="md"
                />
                <p className="text-sm font-medium text-[#1B1F1C]/80">
                  {t("basedOn", { count: summary.totalApproved })}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-[#013220]/10 bg-[#F7F8F4] p-4 sm:p-5">
              <p className="text-base font-semibold text-[#013220]">
                {t("noRatingsYet")}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[#1B1F1C]/80">
                {t("noRatingsDescription")}
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="#submit-review"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#014421] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#013220]"
            >
              <MessageSquarePlus className="h-4 w-4" />
              <span>{heroT("submitCta")}</span>
            </a>

            {SITE_CONFIG.googleReviewUrl && (
              <a
                href={SITE_CONFIG.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-[#013220]/20 bg-[#F7F8F4] px-5 text-sm font-semibold text-[#013220] transition-colors hover:bg-[#E8F0E8]"
              >
                <span>{t("googleButton")}</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* Right: 5-star to 1-star Distribution */}
        <div className="space-y-3 lg:col-span-7">
          {starLevels.map((stars) => {
            const count = summary.distribution[stars];
            const percentage =
              summary.totalApproved > 0
                ? Math.round((count / summary.totalApproved) * 100)
                : 0;

            return (
              <div key={stars} className="flex items-center gap-3 text-sm">
                <div className="flex w-20 shrink-0 items-center gap-1.5 font-semibold text-[#013220]">
                  <span>{stars}</span>
                  <Star
                    aria-hidden="true"
                    className="h-4 w-4 fill-[#6BAE00] text-[#6BAE00]"
                  />
                </div>
                <div
                  role="progressbar"
                  aria-label={t("starLabel", { stars })}
                  aria-valuenow={percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-3 flex-1 overflow-hidden rounded-full bg-[#E8F0E8]"
                >
                  <div
                    className="h-full rounded-full bg-[#014421] transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-12 shrink-0 text-end text-xs font-semibold text-[#355E3B]">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
