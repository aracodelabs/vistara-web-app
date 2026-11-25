"use client";

import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { SITE_CONFIG, buildWhatsAppUrl } from "@/config/site";
import {
  createInquirySchema,
  type InquiryFormValues,
} from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/whatsapp/WhatsAppIcon";

export interface QuoteServiceOption {
  slug: string;
  title_en: string;
  title_ar: string;
}

export function QuoteForm({
  services,
  defaultServiceSlug = "",
}: {
  services: QuoteServiceOption[];
  defaultServiceSlug?: string;
}) {
  const locale = useLocale() as "en" | "ar";
  const t = useTranslations("quoteForm");

  const schema = useMemo(
    () =>
      createInquirySchema({
        nameMin: t("validation.nameMin"),
        phoneInvalid: t("validation.phoneInvalid"),
        emailInvalid: t("validation.emailInvalid"),
        serviceRequired: t("validation.serviceRequired"),
        propertyRequired: t("validation.propertyRequired"),
        areaRequired: t("validation.areaRequired"),
      }),
    [t]
  );

  const propertyTypes = t.raw("propertyTypes") as string[];
  const timeSlots = t.raw("timeSlots") as string[];

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    id: number;
    draftMessage: string;
  } | null>(null);
  const [editableMessage, setEditableMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: "",
      phoneNumber: "",
      email: "",
      serviceSlug: defaultServiceSlug,
      propertyType: "",
      area: "",
      preferredDate: "",
      preferredTime: "",
      message: "",
      language: locale,
      website: "",
    },
  });

  function buildPrefilledMessage(
    values: InquiryFormValues,
    serviceTitle: string
  ): string {
    if (locale === "ar") {
      return [
        "مرحباً فيستارا لخدمات التنظيف، أود طلب عرض سعر:",
        `- الاسم: ${values.customerName}`,
        `- الهاتف: ${values.phoneNumber}`,
        `- الخدمة المطلوبة: ${serviceTitle}`,
        `- نوع العقار: ${values.propertyType}`,
        `- المنطقة في قطر: ${values.area}`,
        values.preferredDate ? `- التاريخ المفضل: ${values.preferredDate}` : "",
        values.preferredTime ? `- الوقت المفضل: ${values.preferredTime}` : "",
        values.message ? `- ملاحظات إضافية: ${values.message}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    }

    return [
      "Hello Vistara Cleaning Services, I would like to request a quotation:",
      `- Name: ${values.customerName}`,
      `- Phone: ${values.phoneNumber}`,
      `- Service: ${serviceTitle}`,
      `- Property Type: ${values.propertyType}`,
      `- Area in Qatar: ${values.area}`,
      values.preferredDate ? `- Preferred Date: ${values.preferredDate}` : "",
      values.preferredTime ? `- Preferred Time: ${values.preferredTime}` : "",
      values.message ? `- Additional Requirements: ${values.message}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function onSubmit(values: InquiryFormValues) {
    setSubmitError(null);
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, language: locale }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setSubmitError(data.error || t("errorGeneric"));
        return;
      }

      const matchedSvc = services.find((s) => s.slug === values.serviceSlug);
      const serviceTitle = matchedSvc
        ? locale === "ar"
          ? matchedSvc.title_ar
          : matchedSvc.title_en
        : values.serviceSlug;

      const draft = buildPrefilledMessage(values, serviceTitle);
      setEditableMessage(draft);
      setSubmittedResult({ id: data.id, draftMessage: draft });
    } catch {
      setSubmitError(t("errorGeneric"));
    }
  }

  if (submittedResult) {
    const whatsappHref = buildWhatsAppUrl(editableMessage);
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
          {t("success.description", { id: submittedResult.id })}
        </p>

        <div className="mt-6">
          <label
            htmlFor="whatsapp-editable-message"
            className="mb-2 block text-sm font-semibold text-[#013220]"
          >
            {t("success.editableLabel")}
          </label>
          <textarea
            id="whatsapp-editable-message"
            rows={7}
            value={editableMessage}
            onChange={(e) => setEditableMessage(e.target.value)}
            className="w-full rounded-2xl border border-[#013220]/20 bg-[#F7F8F4] p-4 text-sm leading-relaxed text-[#1B1F1C] focus:border-[#014421] focus:bg-white focus:outline-none"
          />
          <p className="mt-2 text-xs text-[#355E3B]">
            {t("success.autoNotice")}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#014421] px-7 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#013220]"
          >
            <WhatsAppIcon className="h-5 w-5" />
            <span>{t("success.continueButton")}</span>
          </a>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => {
              setSubmittedResult(null);
              reset({
                customerName: "",
                phoneNumber: "",
                email: "",
                serviceSlug: defaultServiceSlug,
                propertyType: "",
                area: "",
                preferredDate: "",
                preferredTime: "",
                message: "",
                language: locale,
                website: "",
              });
            }}
          >
            <RotateCcw className="h-4 w-4" />
            <span>{t("success.newInquiryButton")}</span>
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
        <label htmlFor="website-field">Website</label>
        <input
          id="website-field"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Full Name */}
        <div>
          <label
            htmlFor="customerName"
            className="mb-1.5 block text-sm font-semibold text-[#013220]"
          >
            {t("fields.fullName")} *
          </label>
          <input
            id="customerName"
            type="text"
            placeholder={t("fields.fullNamePlaceholder")}
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

        {/* Phone Number */}
        <div>
          <label
            htmlFor="phoneNumber"
            className="mb-1.5 block text-sm font-semibold text-[#013220]"
          >
            {t("fields.phone")} *
          </label>
          <input
            id="phoneNumber"
            type="tel"
            dir="ltr"
            placeholder={t("fields.phonePlaceholder")}
            aria-invalid={!!errors.phoneNumber}
            className="h-11 w-full rounded-xl border border-[#013220]/20 bg-[#F7F8F4] px-4 text-start text-sm text-[#1B1F1C] placeholder:text-[#1B1F1C]/45 focus:border-[#014421] focus:bg-white focus:outline-none"
            {...register("phoneNumber")}
          />
          {errors.phoneNumber && (
            <p className="mt-1 text-xs font-medium text-red-700">
              {errors.phoneNumber.message}
            </p>
          )}
        </div>

        {/* Email (Optional) */}
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-semibold text-[#013220]"
          >
            {t("fields.email")}
          </label>
          <input
            id="email"
            type="email"
            dir="ltr"
            placeholder={t("fields.emailPlaceholder")}
            aria-invalid={!!errors.email}
            className="h-11 w-full rounded-xl border border-[#013220]/20 bg-[#F7F8F4] px-4 text-start text-sm text-[#1B1F1C] placeholder:text-[#1B1F1C]/45 focus:border-[#014421] focus:bg-white focus:outline-none"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs font-medium text-red-700">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Service Type */}
        <div>
          <label
            htmlFor="serviceSlug"
            className="mb-1.5 block text-sm font-semibold text-[#013220]"
          >
            {t("fields.serviceType")} *
          </label>
          <select
            id="serviceSlug"
            aria-invalid={!!errors.serviceSlug}
            className="h-11 w-full rounded-xl border border-[#013220]/20 bg-[#F7F8F4] px-3.5 text-sm text-[#1B1F1C] focus:border-[#014421] focus:bg-white focus:outline-none"
            {...register("serviceSlug")}
          >
            <option value="">{t("fields.serviceTypePlaceholder")}</option>
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

        {/* Property Type */}
        <div>
          <label
            htmlFor="propertyType"
            className="mb-1.5 block text-sm font-semibold text-[#013220]"
          >
            {t("fields.propertyType")} *
          </label>
          <select
            id="propertyType"
            aria-invalid={!!errors.propertyType}
            className="h-11 w-full rounded-xl border border-[#013220]/20 bg-[#F7F8F4] px-3.5 text-sm text-[#1B1F1C] focus:border-[#014421] focus:bg-white focus:outline-none"
            {...register("propertyType")}
          >
            <option value="">{t("fields.propertyTypePlaceholder")}</option>
            {propertyTypes.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>
          {errors.propertyType && (
            <p className="mt-1 text-xs font-medium text-red-700">
              {errors.propertyType.message}
            </p>
          )}
        </div>

        {/* Area in Qatar */}
        <div>
          <label
            htmlFor="area"
            className="mb-1.5 block text-sm font-semibold text-[#013220]"
          >
            {t("fields.area")} *
          </label>
          <select
            id="area"
            aria-invalid={!!errors.area}
            className="h-11 w-full rounded-xl border border-[#013220]/20 bg-[#F7F8F4] px-3.5 text-sm text-[#1B1F1C] focus:border-[#014421] focus:bg-white focus:outline-none"
            {...register("area")}
          >
            <option value="">{t("fields.areaPlaceholder")}</option>
            {SITE_CONFIG.serviceAreas.map((area) => {
              const label = locale === "ar" ? area.ar : area.en;
              return (
                <option key={area.slug} value={label}>
                  {label}
                </option>
              );
            })}
          </select>
          {errors.area && (
            <p className="mt-1 text-xs font-medium text-red-700">
              {errors.area.message}
            </p>
          )}
        </div>

        {/* Preferred Date */}
        <div>
          <label
            htmlFor="preferredDate"
            className="mb-1.5 block text-sm font-semibold text-[#013220]"
          >
            {t("fields.preferredDate")}
          </label>
          <input
            id="preferredDate"
            type="date"
            className="h-11 w-full rounded-xl border border-[#013220]/20 bg-[#F7F8F4] px-4 text-sm text-[#1B1F1C] focus:border-[#014421] focus:bg-white focus:outline-none"
            {...register("preferredDate")}
          />
        </div>

        {/* Preferred Time */}
        <div>
          <label
            htmlFor="preferredTime"
            className="mb-1.5 block text-sm font-semibold text-[#013220]"
          >
            {t("fields.preferredTime")}
          </label>
          <select
            id="preferredTime"
            className="h-11 w-full rounded-xl border border-[#013220]/20 bg-[#F7F8F4] px-3.5 text-sm text-[#1B1F1C] focus:border-[#014421] focus:bg-white focus:outline-none"
            {...register("preferredTime")}
          >
            <option value="">{t("fields.preferredTimePlaceholder")}</option>
            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Additional Requirements */}
      <div className="mt-5">
        <label
          htmlFor="message"
          className="mb-1.5 block text-sm font-semibold text-[#013220]"
        >
          {t("fields.message")}
        </label>
        <textarea
          id="message"
          rows={4}
          placeholder={t("fields.messagePlaceholder")}
          className="w-full rounded-2xl border border-[#013220]/20 bg-[#F7F8F4] p-4 text-sm text-[#1B1F1C] placeholder:text-[#1B1F1C]/45 focus:border-[#014421] focus:bg-white focus:outline-none"
          {...register("message")}
        />
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
          <WhatsAppIcon className="h-5 w-5" />
          <span>{isSubmitting ? t("submitting") : t("submitButton")}</span>
        </Button>
        <p className="text-xs leading-relaxed text-[#355E3B]">
          {t("disclaimer")}
        </p>
      </div>
    </form>
  );
}
