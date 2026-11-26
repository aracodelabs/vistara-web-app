export const TESTIMONIAL_FILTER_SLUGS = [
  "villa-cleaning",
  "apartment-cleaning",
  "deep-cleaning",
  "office-cleaning",
  "sofa-cleaning",
  "carpet-cleaning",
] as const;

export type TestimonialFilterSlug =
  | "all"
  | (typeof TESTIMONIAL_FILTER_SLUGS)[number];

export interface ApprovedTestimonial {
  id: number;
  customerName: string;
  location: string | null;
  serviceId: number | null;
  serviceSlug: string | null;
  serviceTitleEn: string | null;
  serviceTitleAr: string | null;
  rating: number;
  review: string;
  language: "en" | "ar";
  isVerified: boolean;
  createdAt: string;
}

export interface ReviewSummaryStats {
  totalApproved: number;
  averageRating: number | null;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface PaginatedTestimonialsResult {
  items: ApprovedTestimonial[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
