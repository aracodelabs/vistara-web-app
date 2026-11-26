"use client";

import React, { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, RotateCcw, Send } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import {
  createTestimonialSchema,
  type TestimonialFormValues,
} from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { StarRatingInput } from "@/components/testimonials/StarRating";
import { cn } from "@/lib/utils";

export interface ReviewServiceOption {
  slug: string;
  title_en: string;
  title_ar: string;
}

export function TestimonialForm({
  services,
}: {
  services: ReviewServiceOption[];
}) {
  const locale = useLocale() as "en" | "ar";
  const t = useTranslations("testimonials.form");
  const summaryT = useTranslations("testimonials.summary");

  const schema = useMemo(
    () =>
      createTestimonialSchema({
        nameMin: t("validation.nameMin"),
        serviceRequired: t("validation.serviceRequired"),
        ratingRequired: t("validation.ratingRequired"),
        reviewMin: t("validation.reviewMin"),
        reviewMax: t("validation.reviewMax"),
      }),
    [t]
  );

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TestimonialFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: "",
      location: "",
      serviceSlug: "",
      rating: 5,
      review: "",
      language: locale,
      website: "",
    },
  });

  const reviewText = useWatch({ control, name: "review" }) || "";

  async function onSubmit(values: TestimonialFormValues) {
    setSubmitError(null);
    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        if (data.code === "LINKS_NOT_ALLOWED") {
          setSubmitError(t("errorLinksNotAllowed"));
        } else {
          setSubmitError(data.error || t("errorGeneric"));
        }
        return;
      }

      setSubmitted(true);
    } catch {
      setSubmitError(t("errorGeneric"));
    }
  }

  if (submitted) {
    return (
      <div className="rounded-3xl border border-[#014421]/20 bg-white p-6 shadow-md sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#E8F0E8] px-3.5 py-1.5 text-xs font-semibold text-[#014421]">
          <CheckCircle2 className="h-4 w-4" />
          <span>{t("success.badge")}</span>
        </div>

        <h3 className="mt-4 text-2xl font-bold text-[#013220]">
          {t("success.title")}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#1B1F1C]/85 sm:text-base">
          {t("success.description")}
        </p>

        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => {
              setSubmitted(false);
              reset({
                customerName: "",
                location: "",
                serviceSlug: "",
                rating: 5,
                review: "",
                language: locale,
                website: "",
              });
            }}
          >
            <RotateCcw className="h-4 w-4" />
            <span>{t("success.submitAnother")}</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-3xl border border-[#013220]/12 bg-white p-6 shadow-md sm:p-8"
    >
      {/* Honeypot field hidden from human visitors */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="review-website-field">Website</label>
        <input
          id="review-website-field"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Customer Name */}
        <div>
          <label
            htmlFor="testimonial-customerName"
            className="mb-1.5 block text-sm font-semibold text-[#013220]"
          >
            {t("fields.customerName")} *
          </label>
          <input
            id="testimonial-customerName"
            type="text"
            placeholder={t("fields.customerNamePlaceholder")}
            aria-invalid={!!errors.customerName}
            className="h-11 w-full rounded-xl border border-[#013220]/20 bg-[#F7F8F4] px-4 text-sm text-[#1B1F1C] placeholder:text-[#1B1F1C]/45 focus:border-[#014421] focus:bg-white focus:outline-none"
            {...register("customerName")}
          />
          {errors.customerName && (
            <p className="mt-1 text-xs font-medium text-red-700">
              {errors.customerName.message}
            </p>
          )}
        </div>

        {/* Location (Optional) */}
        <div>
          <label
            htmlFor="testimonial-location"
            className="mb-1.5 block text-sm font-semibold text-[#013220]"
          >
            {t("fields.location")}
          </label>
          <input
            id="testimonial-location"
            type="text"
            list="qatar-review-areas"
            placeholder={t("fields.locationPlaceholder")}
            className="h-11 w-full rounded-xl border border-[#013220]/20 bg-[#F7F8F4] px-4 text-sm text-[#1B1F1C] placeholder:text-[#1B1F1C]/45 focus:border-[#014421] focus:bg-white focus:outline-none"
            {...register("location")}
          />
          <datalist id="qatar-review-areas">
            {SITE_CONFIG.serviceAreas.map((area) => (
              <option
                key={area.slug}
                value={locale === "ar" ? area.ar : area.en}
              />
            ))}
          </datalist>
        </div>

        {/* Service Received */}
        <div>
          <label
            htmlFor="testimonial-serviceSlug"
            className="mb-1.5 block text-sm font-semibold text-[#013220]"
          >
            {t("fields.service")} *
          </label>
          <select
            id="testimonial-serviceSlug"
            aria-invalid={!!errors.serviceSlug}
            className="h-11 w-full rounded-xl border border-[#013220]/20 bg-[#F7F8F4] px-3.5 text-sm text-[#1B1F1C] focus:border-[#014421] focus:bg-white focus:outline-none"
            {...register("serviceSlug")}
          >
            <option value="">{t("fields.servicePlaceholder")}</option>
            {services.map((svc) => (
              <option key={svc.slug} value={svc.slug}>
                {locale === "ar" ? svc.title_ar : svc.title_en}
              </option>
            ))}
          </select>
          {errors.serviceSlug && (
            <p className="mt-1 text-xs font-medium text-red-700">
              {errors.serviceSlug.message}
            </p>
          )}
        </div>

        {/* Preferred Language */}
        <div>
          <span className="mb-1.5 block text-sm font-semibold text-[#013220]">
            {t("fields.language")}
          </span>
          <Controller
            name="language"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: "en", label: t("fields.languageEn") },
                    { value: "ar", label: t("fields.languageAr") },
                  ] as const
                ).map((option) => {
                  const active = field.value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        "h-11 rounded-xl border px-3 text-sm font-semibold transition-colors cursor-pointer",
                        active
                          ? "border-[#014421] bg-[#E8F0E8] text-[#013220]"
                          : "border-[#013220]/20 bg-[#F7F8F4] text-[#1B1F1C]/80 hover:bg-[#E8F0E8]/50"
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </div>
      </div>

      {/* Star Rating */}
      <div className="mt-5">
        <span className="mb-1.5 block text-sm font-semibold text-[#013220]">
          {t("fields.rating")} *
        </span>
        <Controller
          name="rating"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap items-center gap-3">
              <StarRatingInput
                value={field.value}
                onChange={field.onChange}
                groupLabel={t("fields.rating")}
                starLabelTemplate={(stars) => summaryT("starLabel", { stars })}
              />
              <span className="text-xs font-medium text-[#355E3B]">
                {t("fields.ratingHelp")}
              </span>
            </div>
          )}
        />
        {errors.rating && (
          <p className="mt-1 text-xs font-medium text-red-700">
            {errors.rating.message}
          </p>
        )}
      </div>

      {/* Review Text */}
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label
            htmlFor="testimonial-review"
            className="text-sm font-semibold text-[#013220]"
          >
            {t("fields.review")} *
          </label>
          <span className="text-xs text-[#355E3B]">
            {reviewText.length}/1500
          </span>
        </div>
        <textarea
          id="testimonial-review"
          rows={4}
          placeholder={t("fields.reviewPlaceholder")}
          aria-invalid={!!errors.review}
          className="w-full rounded-2xl border border-[#013220]/20 bg-[#F7F8F4] p-4 text-sm text-[#1B1F1C] placeholder:text-[#1B1F1C]/45 focus:border-[#014421] focus:bg-white focus:outline-none"
          {...register("review")}
        />
        <p className="mt-1 text-xs text-[#355E3B]">{t("fields.reviewHint")}</p>
        {errors.review && (
          <p className="mt-1 text-xs font-medium text-red-700">
            {errors.review.message}
          </p>
        )}
      </div>

      {submitError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {submitError}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          <Send className="h-4 w-4 rtl:rotate-180" />
          <span>{isSubmitting ? t("submitting") : t("submitButton")}</span>
        </Button>
        <p className="text-xs leading-relaxed text-[#355E3B]">
          {t("moderationNote")}
        </p>
      </div>
    </form>
  );
}
