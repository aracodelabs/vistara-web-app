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
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "New",
  "Contacted",
  "Quotation Sent",
  "Confirmed",
  "Completed",
  "Cancelled",
]);

export const serviceCategories = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  name_en: varchar("name_en", { length: 120 }).notNull(),
  name_ar: varchar("name_ar", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description_en: text("description_en").notNull(),
  description_ar: text("description_ar").notNull(),
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
  image: varchar("image", { length: 255 }).notNull(),
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

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  service: one(services, {
    fields: [inquiries.service_id],
    references: [services.id],
  }),
}));

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  service: one(services, {
    fields: [testimonials.service_id],
    references: [services.id],
  }),
}));

export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type ServiceRecord = typeof services.$inferSelect;
export type InquiryRecord = typeof inquiries.$inferSelect;
export type TestimonialRecord = typeof testimonials.$inferSelect;
export type NewTestimonialRecord = typeof testimonials.$inferInsert;
