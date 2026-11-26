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
