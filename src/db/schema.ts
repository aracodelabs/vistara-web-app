import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
  index,
  check,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import {
  DEFAULT_NAVIGATION_VISIBILITY,
  type NavigationVisibility,
} from "@/lib/navigation-visibility";

export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "New",
  "Contacted",
  "Quotation Sent",
  "Confirmed",
  "Completed",
  "Cancelled",
]);

export const adminRoleEnum = pgEnum("admin_role", [
  "SUPER_ADMIN",
  "ADMIN",
  "EDITOR",
]);

export const serviceCategories = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  name_en: varchar("name_en", { length: 120 }).notNull(),
  name_ar: varchar("name_ar", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description_en: text("description_en").notNull(),
  description_ar: text("description_ar").notNull(),
  image: varchar("image", { length: 500 }),
  image_source: varchar("image_source", { length: 30 })
    .notNull()
    .default("fallback"),
  image_generation_status: varchar("image_generation_status", { length: 30 })
    .notNull()
    .default("not_generated"),
  sort_order: integer("sort_order").notNull().default(0),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  category: varchar("category", { length: 60 }).notNull(),
  category_id: integer("category_id").references(() => serviceCategories.id, {
    onDelete: "set null",
  }),
  title_en: varchar("title_en", { length: 160 }).notNull(),
  title_ar: varchar("title_ar", { length: 160 }).notNull(),
  description_en: text("description_en").notNull(),
  description_ar: text("description_ar").notNull(),
  image: varchar("image", { length: 500 }).notNull(),
  image_source: varchar("image_source", { length: 30 })
    .notNull()
    .default("manual"),
  image_generation_status: varchar("image_generation_status", { length: 30 })
    .notNull()
    .default("manual"),
  image_generation_error: text("image_generation_error"),
  seo_title_en: varchar("seo_title_en", { length: 180 }),
  seo_title_ar: varchar("seo_title_ar", { length: 180 }),
  seo_description_en: text("seo_description_en"),
  seo_description_ar: text("seo_description_ar"),
  is_active: boolean("is_active").notNull().default(true),
  sort_order: integer("sort_order").notNull().default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  customer_name: varchar("customer_name", { length: 160 }).notNull(),
  phone_number: varchar("phone_number", { length: 40 }).notNull(),
  email: varchar("email", { length: 180 }),
  service_id: integer("service_id").references(() => services.id, {
    onDelete: "set null",
  }),
  property_type: varchar("property_type", { length: 100 }).notNull(),
  area: varchar("area", { length: 120 }).notNull(),
  preferred_date: varchar("preferred_date", { length: 40 }),
  preferred_time: varchar("preferred_time", { length: 40 }),
  message: text("message"),
  language: varchar("language", { length: 10 }).notNull().default("en"),
  status: inquiryStatusEnum("status").notNull().default("New"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const testimonials = pgTable(
  "testimonials",
  {
    id: serial("id").primaryKey(),
    customer_name: varchar("customer_name", { length: 160 }).notNull(),
    location: varchar("location", { length: 120 }),
    service_id: integer("service_id").references(() => services.id, {
      onDelete: "set null",
    }),
    rating: integer("rating").notNull(),
    review: text("review").notNull(),
    language: varchar("language", { length: 10 }).notNull().default("en"),
    is_verified: boolean("is_verified").notNull().default(false),
    is_approved: boolean("is_approved").notNull().default(false),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check(
      "testimonials_rating_range",
      sql`${table.rating} >= 1 AND ${table.rating} <= 5`
    ),
    index("testimonials_approved_created_idx").on(
      table.is_approved,
      table.created_at
    ),
    index("testimonials_service_idx").on(table.service_id),
  ]
);

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 180 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  password_hash: text("password_hash").notNull(),
  role: adminRoleEnum("role").notNull().default("ADMIN"),
  is_active: boolean("is_active").notNull().default(true),
  last_login_at: timestamp("last_login_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: serial("id").primaryKey(),
    admin_user_id: integer("admin_user_id")
      .references(() => adminUsers.id, { onDelete: "cascade" })
      .notNull(),
    token_hash: varchar("token_hash", { length: 64 }).notNull().unique(),
    expires_at: timestamp("expires_at").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("admin_sessions_user_idx").on(table.admin_user_id),
    index("admin_sessions_expires_idx").on(table.expires_at),
  ]
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: serial("id").primaryKey(),
    admin_user_id: integer("admin_user_id")
      .references(() => adminUsers.id, { onDelete: "cascade" })
      .notNull(),
    token_hash: varchar("token_hash", { length: 64 }).notNull().unique(),
    expires_at: timestamp("expires_at").notNull(),
    used_at: timestamp("used_at"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("password_reset_user_idx").on(table.admin_user_id),
    index("password_reset_expires_idx").on(table.expires_at),
  ]
);

export const adminActivityLogs = pgTable(
  "admin_activity_logs",
  {
    id: serial("id").primaryKey(),
    admin_user_id: integer("admin_user_id").references(() => adminUsers.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 100 }).notNull(),
    entity_type: varchar("entity_type", { length: 60 }).notNull(),
    entity_id: varchar("entity_id", { length: 60 }),
    details: jsonb("details").$type<Record<string, unknown> | null>(),
    ip_address: varchar("ip_address", { length: 64 }),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("admin_activity_created_idx").on(table.created_at)]
);

export const internalInquiryNotes = pgTable(
  "internal_inquiry_notes",
  {
    id: serial("id").primaryKey(),
    inquiry_id: integer("inquiry_id")
      .references(() => inquiries.id, { onDelete: "cascade" })
      .notNull(),
    admin_user_id: integer("admin_user_id").references(() => adminUsers.id, {
      onDelete: "set null",
    }),
    author_name: varchar("author_name", { length: 120 }).notNull(),
    note: text("note").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("internal_inquiry_notes_inquiry_idx").on(table.inquiry_id)]
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: serial("id").primaryKey(),
    url: varchar("url", { length: 600 }).notNull().unique(),
    pathname: varchar("pathname", { length: 400 }).notNull(),
    filename: varchar("filename", { length: 255 }).notNull(),
    mime_type: varchar("mime_type", { length: 80 }).notNull(),
    size_bytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    source: varchar("source", { length: 30 }).notNull().default("manual"),
    storage_provider: varchar("storage_provider", { length: 40 })
      .notNull()
      .default("vercel-blob"),
    prompt: text("prompt"),
    uploaded_by: integer("uploaded_by").references(() => adminUsers.id, {
      onDelete: "set null",
    }),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("media_assets_source_idx").on(table.source)]
);

export const imageGenerationJobs = pgTable(
  "image_generation_jobs",
  {
    id: serial("id").primaryKey(),
    entity_type: varchar("entity_type", { length: 40 }).notNull(),
    entity_id: integer("entity_id").notNull(),
    prompt: text("prompt").notNull(),
    provider: varchar("provider", { length: 40 }).notNull(),
    status: varchar("status", { length: 30 }).notNull().default("generating"),
    result_url: varchar("result_url", { length: 600 }),
    error_message: text("error_message"),
    created_by: integer("created_by").references(() => adminUsers.id, {
      onDelete: "set null",
    }),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("image_gen_jobs_entity_idx").on(table.entity_type, table.entity_id),
  ]
);

export const websiteContent = pgTable("website_content", {
  id: serial("id").primaryKey(),
  section_key: varchar("section_key", { length: 80 }).notNull().unique(),
  content_en: jsonb("content_en").$type<Record<string, unknown>>().notNull(),
  content_ar: jsonb("content_ar").$type<Record<string, unknown>>().notNull(),
  updated_by: integer("updated_by").references(() => adminUsers.id, {
    onDelete: "set null",
  }),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question_en: text("question_en").notNull(),
  question_ar: text("question_ar").notNull(),
  answer_en: text("answer_en").notNull(),
  answer_ar: text("answer_ar").notNull(),
  sort_order: integer("sort_order").notNull().default(0),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const seoMetadata = pgTable("seo_metadata", {
  id: serial("id").primaryKey(),
  page_key: varchar("page_key", { length: 80 }).notNull().unique(),
  title_en: varchar("title_en", { length: 180 }).notNull(),
  title_ar: varchar("title_ar", { length: 180 }).notNull(),
  description_en: text("description_en").notNull(),
  description_ar: text("description_ar").notNull(),
  og_image: varchar("og_image", { length: 500 }),
  canonical_url: varchar("canonical_url", { length: 500 }),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const websiteSettings = pgTable("website_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 40 }).notNull().unique().default("primary"),
  company_name_en: varchar("company_name_en", { length: 160 }).notNull(),
  company_name_ar: varchar("company_name_ar", { length: 160 }).notNull(),
  company_email: varchar("company_email", { length: 180 }).notNull(),
  whatsapp_number: varchar("whatsapp_number", { length: 30 }).notNull(),
  contact_phone: varchar("contact_phone", { length: 40 }).notNull(),
  address_en: text("address_en").notNull(),
  address_ar: text("address_ar").notNull(),
  business_hours_en: text("business_hours_en").notNull(),
  business_hours_ar: text("business_hours_ar").notNull(),
  service_areas: jsonb("service_areas")
    .$type<Array<{ slug: string; en: string; ar: string }>>()
    .notNull(),
  social_links: jsonb("social_links")
    .$type<{ instagram?: string; facebook?: string; linkedin?: string }>()
    .notNull(),
  google_review_url: varchar("google_review_url", { length: 500 }),
  default_language: varchar("default_language", { length: 10 })
    .notNull()
    .default("en"),
  navigation_visibility: jsonb("navigation_visibility")
    .$type<NavigationVisibility>()
    .notNull()
    .default(DEFAULT_NAVIGATION_VISIBILITY),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const serviceCategoriesRelations = relations(
  serviceCategories,
  ({ many }) => ({
    services: many(services),
  })
);

export const servicesRelations = relations(services, ({ one, many }) => ({
  categoryRef: one(serviceCategories, {
    fields: [services.category_id],
    references: [serviceCategories.id],
  }),
  inquiries: many(inquiries),
  testimonials: many(testimonials),
}));

export const inquiriesRelations = relations(inquiries, ({ one, many }) => ({
  service: one(services, {
    fields: [inquiries.service_id],
    references: [services.id],
  }),
  notes: many(internalInquiryNotes),
}));

export const internalInquiryNotesRelations = relations(
  internalInquiryNotes,
  ({ one }) => ({
    inquiry: one(inquiries, {
      fields: [internalInquiryNotes.inquiry_id],
      references: [inquiries.id],
    }),
    author: one(adminUsers, {
      fields: [internalInquiryNotes.admin_user_id],
      references: [adminUsers.id],
    }),
  })
);

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  service: one(services, {
    fields: [testimonials.service_id],
    references: [services.id],
  }),
}));

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  sessions: many(adminSessions),
  resetTokens: many(passwordResetTokens),
  activityLogs: many(adminActivityLogs),
}));

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  user: one(adminUsers, {
    fields: [adminSessions.admin_user_id],
    references: [adminUsers.id],
  }),
}));

export const passwordResetTokensRelations = relations(
  passwordResetTokens,
  ({ one }) => ({
    user: one(adminUsers, {
      fields: [passwordResetTokens.admin_user_id],
      references: [adminUsers.id],
    }),
  })
);

export const adminActivityLogsRelations = relations(
  adminActivityLogs,
  ({ one }) => ({
    user: one(adminUsers, {
      fields: [adminActivityLogs.admin_user_id],
      references: [adminUsers.id],
    }),
  })
);

export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type ServiceRecord = typeof services.$inferSelect;
export type InquiryRecord = typeof inquiries.$inferSelect;
export type TestimonialRecord = typeof testimonials.$inferSelect;
export type NewTestimonialRecord = typeof testimonials.$inferInsert;
export type AdminUserRecord = typeof adminUsers.$inferSelect;
export type AdminSessionRecord = typeof adminSessions.$inferSelect;
export type PasswordResetTokenRecord = typeof passwordResetTokens.$inferSelect;
export type AdminActivityLogRecord = typeof adminActivityLogs.$inferSelect;
export type InternalInquiryNoteRecord =
  typeof internalInquiryNotes.$inferSelect;
export type MediaAssetRecord = typeof mediaAssets.$inferSelect;
export type ImageGenerationJobRecord = typeof imageGenerationJobs.$inferSelect;
export type WebsiteContentRecord = typeof websiteContent.$inferSelect;
export type FaqRecord = typeof faqs.$inferSelect;
export type SeoMetadataRecord = typeof seoMetadata.$inferSelect;
export type WebsiteSettingsRecord = typeof websiteSettings.$inferSelect;
