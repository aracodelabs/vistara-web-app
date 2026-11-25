CREATE TYPE "public"."inquiry_status" AS ENUM('New', 'Contacted', 'Quotation Sent', 'Confirmed', 'Completed', 'Cancelled');--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" varchar(160) NOT NULL,
	"phone_number" varchar(40) NOT NULL,
	"email" varchar(180),
	"service_id" integer,
	"property_type" varchar(100) NOT NULL,
	"area" varchar(120) NOT NULL,
	"preferred_date" varchar(40),
	"preferred_time" varchar(40),
	"message" text,
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"status" "inquiry_status" DEFAULT 'New' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_en" varchar(120) NOT NULL,
	"name_ar" varchar(120) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description_en" text NOT NULL,
	"description_ar" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"category" varchar(60) NOT NULL,
	"category_id" integer,
	"title_en" varchar(160) NOT NULL,
	"title_ar" varchar(160) NOT NULL,
	"description_en" text NOT NULL,
	"description_ar" text NOT NULL,
	"image" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE set null ON UPDATE no action;