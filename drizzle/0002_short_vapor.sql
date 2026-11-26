CREATE TYPE "public"."admin_role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'EDITOR');--> statement-breakpoint
CREATE TABLE "admin_activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_user_id" integer,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(60) NOT NULL,
	"entity_id" varchar(60),
	"details" jsonb,
	"ip_address" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_user_id" integer NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(180) NOT NULL,
	"name" varchar(120) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "admin_role" DEFAULT 'ADMIN' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_en" text NOT NULL,
	"question_ar" text NOT NULL,
	"answer_en" text NOT NULL,
	"answer_ar" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_generation_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar(40) NOT NULL,
	"entity_id" integer NOT NULL,
	"prompt" text NOT NULL,
	"provider" varchar(40) NOT NULL,
	"status" varchar(30) DEFAULT 'generating' NOT NULL,
	"result_url" varchar(600),
	"error_message" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internal_inquiry_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"inquiry_id" integer NOT NULL,
	"admin_user_id" integer,
	"author_name" varchar(120) NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" varchar(600) NOT NULL,
	"pathname" varchar(400) NOT NULL,
	"filename" varchar(255) NOT NULL,
	"mime_type" varchar(80) NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"source" varchar(30) DEFAULT 'manual' NOT NULL,
	"storage_provider" varchar(40) DEFAULT 'vercel-blob' NOT NULL,
	"prompt" text,
	"uploaded_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_user_id" integer NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "seo_metadata" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_key" varchar(80) NOT NULL,
	"title_en" varchar(180) NOT NULL,
	"title_ar" varchar(180) NOT NULL,
	"description_en" text NOT NULL,
	"description_ar" text NOT NULL,
	"og_image" varchar(500),
	"canonical_url" varchar(500),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "seo_metadata_page_key_unique" UNIQUE("page_key")
);
--> statement-breakpoint
CREATE TABLE "website_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_key" varchar(80) NOT NULL,
	"content_en" jsonb NOT NULL,
	"content_ar" jsonb NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "website_content_section_key_unique" UNIQUE("section_key")
);
--> statement-breakpoint
CREATE TABLE "website_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(40) DEFAULT 'primary' NOT NULL,
	"company_name_en" varchar(160) NOT NULL,
	"company_name_ar" varchar(160) NOT NULL,
	"company_email" varchar(180) NOT NULL,
	"whatsapp_number" varchar(30) NOT NULL,
	"contact_phone" varchar(40) NOT NULL,
	"address_en" text NOT NULL,
	"address_ar" text NOT NULL,
	"business_hours_en" text NOT NULL,
	"business_hours_ar" text NOT NULL,
	"service_areas" jsonb NOT NULL,
	"social_links" jsonb NOT NULL,
	"google_review_url" varchar(500),
	"default_language" varchar(10) DEFAULT 'en' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "website_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "image" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "service_categories" ADD COLUMN "image" varchar(500);--> statement-breakpoint
ALTER TABLE "service_categories" ADD COLUMN "image_source" varchar(30) DEFAULT 'fallback' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_categories" ADD COLUMN "image_generation_status" varchar(30) DEFAULT 'not_generated' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_categories" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "image_source" varchar(30) DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "image_generation_status" varchar(30) DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "image_generation_error" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "seo_title_en" varchar(180);--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "seo_title_ar" varchar(180);--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "seo_description_en" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "seo_description_ar" text;--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_generation_jobs" ADD CONSTRAINT "image_generation_jobs_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_inquiry_notes" ADD CONSTRAINT "internal_inquiry_notes_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_inquiry_notes" ADD CONSTRAINT "internal_inquiry_notes_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_admin_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_content" ADD CONSTRAINT "website_content_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_activity_created_idx" ON "admin_activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "admin_sessions_user_idx" ON "admin_sessions" USING btree ("admin_user_id");--> statement-breakpoint
CREATE INDEX "admin_sessions_expires_idx" ON "admin_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "image_gen_jobs_entity_idx" ON "image_generation_jobs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "internal_inquiry_notes_inquiry_idx" ON "internal_inquiry_notes" USING btree ("inquiry_id");--> statement-breakpoint
CREATE INDEX "media_assets_source_idx" ON "media_assets" USING btree ("source");--> statement-breakpoint
CREATE INDEX "password_reset_user_idx" ON "password_reset_tokens" USING btree ("admin_user_id");--> statement-breakpoint
CREATE INDEX "password_reset_expires_idx" ON "password_reset_tokens" USING btree ("expires_at");