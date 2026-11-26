export const SITE_CONFIG = {
  brandName: {
    en: "Vistara",
    ar: "فيستارا",
  },
  brandFullName: {
    en: "Vistara Cleaning Services",
    ar: "فيستارا لخدمات التنظيف",
  },
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://vistaracleaning.qa",
  /**
   * Centralized WhatsApp number in international format without +, spaces, or dashes (e.g., 974XXXXXXXX).
   * Replace NEXT_PUBLIC_WHATSAPP_NUMBER in .env.local / Vercel env vars with the live business number.
   */
  whatsappNumber: (
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "97400000000"
  ).replace(/\D/g, ""),
  contactPlaceholders: {
    displayPhone: "+974 XXXX XXXX",
    email: "info@vistara-placeholder.qa",
    address: {
      en: "Doha, State of Qatar (Office Address Placeholder)",
      ar: "الدوحة، دولة قطر (عنوان المكتب — قابل للتعديل)",
    },
    businessHours: {
      en: "Saturday – Thursday: 8:00 AM – 8:00 PM (Hours Placeholder)",
      ar: "السبت – الخميس: 8:00 صباحاً – 8:00 مساءً (ساعات العمل — قابلة للتعديل)",
    },
    crNumber: {
      en: "CR No. [Company Registration Placeholder]",
      ar: "رقم السجل التجاري: [عنصر نائب للتسجيل التجاري]",
    },
    isPlaceholderNotice: {
      en: "Contact details shown are editable placeholders pending final business details.",
      ar: "بيانات الاتصال المعروضة هي عناصر نائبة قابلة للتعديل لحين اعتماد البيانات النهائية للشركة.",
    },
  },
  socialLinks: {
    instagram: "https://instagram.com/vistara-placeholder",
    facebook: "https://facebook.com/vistara-placeholder",
    linkedin: "https://linkedin.com/company/vistara-placeholder",
  },
  googleReviewUrl: (process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || "").trim(),
  serviceAreas: [
    { slug: "doha", en: "Doha", ar: "الدوحة" },
    { slug: "lusail", en: "Lusail", ar: "لوسيل" },
    { slug: "the-pearl", en: "The Pearl-Qatar", ar: "اللؤلؤة قطر" },
    { slug: "west-bay", en: "West Bay", ar: "الخليج الغربي" },
    { slug: "al-wakrah", en: "Al Wakrah", ar: "الوكرة" },
    { slug: "al-rayyan", en: "Al Rayyan", ar: "الريان" },
  ],
} as const;

export function buildWhatsAppUrl(message: string): string {
  const number = SITE_CONFIG.whatsappNumber || "97400000000";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function buildServiceWhatsAppMessage(
  serviceTitle: string,
  locale: "en" | "ar"
): string {
  if (locale === "ar") {
    return `مرحباً، أنا مهتم بخدمة ${serviceTitle} في قطر. هل يمكنكم تزويدي بعرض سعر والتنسيق للموعد؟`;
  }
  return `Hello, I am interested in your ${serviceTitle} service in Qatar. Could you please provide a quotation?`;
}

export function buildGeneralWhatsAppMessage(locale: "en" | "ar"): string {
  if (locale === "ar") {
    return "مرحباً، أود الاستفسار عن خدمات التنظيف في قطر والحصول على عرض سعر.";
  }
  return "Hello, I would like to inquire about your cleaning services in Qatar and request a quotation.";
}
