import { z } from "zod";

export interface ValidationMessages {
  nameMin: string;
  phoneInvalid: string;
  emailInvalid: string;
  serviceRequired: string;
  propertyRequired: string;
  areaRequired: string;
}

export const DEFAULT_VALIDATION_MESSAGES: ValidationMessages = {
  nameMin: "Please enter your full name (at least 2 characters).",
  phoneInvalid: "Please enter a valid Qatar or international phone number.",
  emailInvalid: "Please enter a valid email address.",
  serviceRequired: "Please select a cleaning service.",
  propertyRequired: "Please select your property type.",
  areaRequired: "Please select your area in Qatar.",
};

export function createInquirySchema(
  messages: ValidationMessages = DEFAULT_VALIDATION_MESSAGES
) {
  return z.object({
    customerName: z.string().trim().min(2, messages.nameMin).max(160),
    phoneNumber: z
      .string()
      .trim()
      .refine(
        (val) => {
          const digits = val.replace(/\D/g, "");
          return digits.length >= 8 && digits.length <= 15;
        },
        { message: messages.phoneInvalid }
      ),
    email: z
      .string()
      .trim()
      .email(messages.emailInvalid)
      .max(180)
      .optional()
      .or(z.literal("")),
    serviceSlug: z.string().trim().min(1, messages.serviceRequired).max(120),
    propertyType: z.string().trim().min(1, messages.propertyRequired).max(100),
    area: z.string().trim().min(1, messages.areaRequired).max(120),
    preferredDate: z.string().trim().max(40).optional().or(z.literal("")),
    preferredTime: z.string().trim().max(60).optional().or(z.literal("")),
    message: z.string().trim().max(2000).optional().or(z.literal("")),
    language: z.enum(["en", "ar"]),
    website: z.string().max(100).optional().or(z.literal("")),
  });
}

export type InquiryFormValues = z.infer<ReturnType<typeof createInquirySchema>>;

export interface TestimonialValidationMessages {
  nameMin: string;
  serviceRequired: string;
  ratingRequired: string;
  reviewMin: string;
  reviewMax: string;
}

export const DEFAULT_TESTIMONIAL_VALIDATION_MESSAGES: TestimonialValidationMessages =
{
  nameMin: "Please enter your name (at least 2 characters).",
  serviceRequired: "Please select the cleaning service you received.",
  ratingRequired: "Please select a star rating between 1 and 5.",
  reviewMin: "Please share at least 15 characters about your experience.",
  reviewMax: "Review description cannot exceed 1,500 characters.",
};

export function createTestimonialSchema(
  messages: TestimonialValidationMessages = DEFAULT_TESTIMONIAL_VALIDATION_MESSAGES
) {
  return z.object({
    customerName: z.string().trim().min(2, messages.nameMin).max(160),
    location: z.string().trim().max(120).optional().or(z.literal("")),
    serviceSlug: z.string().trim().min(1, messages.serviceRequired).max(120),
    rating: z
      .number({ message: messages.ratingRequired })
      .int(messages.ratingRequired)
      .min(1, messages.ratingRequired)
      .max(5, messages.ratingRequired),
    review: z
      .string()
      .trim()
      .min(15, messages.reviewMin)
      .max(1500, messages.reviewMax),
    language: z.enum(["en", "ar"]),
    website: z.string().max(100).optional().or(z.literal("")),
  });
}

export type TestimonialFormValues = z.infer<
  ReturnType<typeof createTestimonialSchema>
>;

export const adminLoginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address.").max(180),
  password: z.string().min(1, "Please enter your password.").max(128),
});

export const adminSetupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(180),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters.")
    .max(128, "Password cannot exceed 128 characters."),
});

export const adminForgotPasswordSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address.").max(180),
});

export const adminResetPasswordSchema = z
  .object({
    token: z.string().trim().min(16, "Invalid reset token.").max(256),
    password: z
      .string()
      .min(10, "Password must be at least 10 characters.")
      .max(128, "Password cannot exceed 128 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password.").max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const INQUIRY_STATUSES = [
  "New",
  "Contacted",
  "Quotation Sent",
  "Confirmed",
  "Completed",
  "Cancelled",
] as const;

export const adminInquiryUpdateSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(INQUIRY_STATUSES),
});

export const adminInquiryNoteSchema = z.object({
  note: z
    .string()
    .trim()
    .min(2, "Note must be at least 2 characters.")
    .max(2000),
});

export const adminTestimonialUpdateSchema = z.object({
  id: z.number().int().positive(),
  isApproved: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  customerName: z.string().trim().min(2).max(160).optional(),
  location: z.string().trim().max(120).nullable().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  review: z.string().trim().min(10).max(1500).optional(),
});

export const adminServiceCreateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens."
    ),
  category: z.string().trim().min(1).max(60),
  category_id: z.number().int().positive().nullable().optional(),
  title_en: z.string().trim().min(2).max(160),
  title_ar: z.string().trim().min(2).max(160),
  description_en: z.string().trim().min(10).max(2000),
  description_ar: z.string().trim().min(10).max(2000),
  image: z.string().trim().max(500).optional().or(z.literal("")),
  image_source: z.enum(["manual", "ai", "fallback"]).optional(),
  seo_title_en: z.string().trim().max(180).nullable().optional(),
  seo_title_ar: z.string().trim().max(180).nullable().optional(),
  seo_description_en: z.string().trim().max(500).nullable().optional(),
  seo_description_ar: z.string().trim().max(500).nullable().optional(),
  sort_order: z.number().int().min(0).max(999).optional(),
  is_active: z.boolean().optional(),
});

export const adminServiceUpdateSchema = z.object({
  id: z.number().int().positive(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  category: z.string().trim().min(1).max(60).optional(),
  category_id: z.number().int().positive().nullable().optional(),
  title_en: z.string().trim().min(2).max(160).optional(),
  title_ar: z.string().trim().min(2).max(160).optional(),
  description_en: z.string().trim().min(10).max(2000).optional(),
  description_ar: z.string().trim().min(10).max(2000).optional(),
  image: z.string().trim().max(500).optional(),
  image_source: z.enum(["manual", "ai", "fallback"]).optional(),
  image_generation_status: z
    .enum(["manual", "not_generated", "generating", "generated", "failed"])
    .optional(),
  seo_title_en: z.string().trim().max(180).nullable().optional(),
  seo_title_ar: z.string().trim().max(180).nullable().optional(),
  seo_description_en: z.string().trim().max(500).nullable().optional(),
  seo_description_ar: z.string().trim().max(500).nullable().optional(),
  sort_order: z.number().int().min(0).max(999).optional(),
  is_active: z.boolean().optional(),
});

export const adminCategoryCreateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  name_en: z.string().trim().min(2).max(120),
  name_ar: z.string().trim().min(2).max(120),
  description_en: z.string().trim().min(5).max(1000),
  description_ar: z.string().trim().min(5).max(1000),
  image: z.string().trim().max(500).nullable().optional(),
  sort_order: z.number().int().min(0).max(999).optional(),
  is_active: z.boolean().optional(),
});

export const adminCategoryUpdateSchema = z.object({
  id: z.number().int().positive(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  name_en: z.string().trim().min(2).max(120).optional(),
  name_ar: z.string().trim().min(2).max(120).optional(),
  description_en: z.string().trim().min(5).max(1000).optional(),
  description_ar: z.string().trim().min(5).max(1000).optional(),
  image: z.string().trim().max(500).nullable().optional(),
  image_source: z.enum(["manual", "ai", "fallback"]).optional(),
  sort_order: z.number().int().min(0).max(999).optional(),
  is_active: z.boolean().optional(),
});

export const adminContentUpdateSchema = z.object({
  section_key: z.string().trim().min(1).max(80),
  content_en: z.record(z.string(), z.unknown()),
  content_ar: z.record(z.string(), z.unknown()),
});

export const adminFaqSchema = z.object({
  id: z.number().int().positive().optional(),
  question_en: z.string().trim().min(5).max(400),
  question_ar: z.string().trim().min(5).max(400),
  answer_en: z.string().trim().min(10).max(2000),
  answer_ar: z.string().trim().min(10).max(2000),
  sort_order: z.number().int().min(0).max(999).optional(),
  is_active: z.boolean().optional(),
});

export const adminSeoUpdateSchema = z.object({
  page_key: z.string().trim().min(1).max(80),
  title_en: z.string().trim().min(2).max(180),
  title_ar: z.string().trim().min(2).max(180),
  description_en: z.string().trim().min(10).max(500),
  description_ar: z.string().trim().min(10).max(500),
  og_image: z.string().trim().max(500).nullable().optional(),
  canonical_url: z.string().trim().max(500).nullable().optional(),
});

export const adminSettingsUpdateSchema = z.object({
  company_name_en: z.string().trim().min(2).max(160),
  company_name_ar: z.string().trim().min(2).max(160),
  company_email: z.string().trim().email().max(180),
  whatsapp_number: z
    .string()
    .trim()
    .regex(
      /^\d{8,15}$/,
      "WhatsApp number must contain 8–15 digits only (e.g. 974XXXXXXXX)."
    ),
  contact_phone: z.string().trim().min(4).max(40),
  address_en: z.string().trim().min(3).max(400),
  address_ar: z.string().trim().min(3).max(400),
  business_hours_en: z.string().trim().min(3).max(400),
  business_hours_ar: z.string().trim().min(3).max(400),
  service_areas: z.array(
    z.object({
      slug: z.string().trim().min(1).max(80),
      en: z.string().trim().min(1).max(120),
      ar: z.string().trim().min(1).max(120),
    })
  ),
  social_links: z.object({
    instagram: z.string().trim().max(300).optional().or(z.literal("")),
    facebook: z.string().trim().max(300).optional().or(z.literal("")),
    linkedin: z.string().trim().max(300).optional().or(z.literal("")),
  }),
  google_review_url: z.string().trim().max(500).nullable().optional(),
  default_language: z.enum(["en", "ar"]),
  navigation_visibility: z
    .object({
      about: z.boolean(),
      services: z.boolean(),
      residential: z.boolean(),
      commercial: z.boolean(),
      reviews: z.boolean(),
      faq: z.boolean(),
      contact: z.boolean(),
      quote: z.boolean(),
    })
    .optional(),
});

export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR"] as const;

export const adminUserCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  password: z.string().min(10).max(128),
  role: z.enum(ADMIN_ROLES),
});

export const adminUserUpdateSchema = z.object({
  id: z.number().int().positive(),
  role: z.enum(ADMIN_ROLES).optional(),
  is_active: z.boolean().optional(),
  action: z.enum(["revoke_sessions"]).optional(),
});
