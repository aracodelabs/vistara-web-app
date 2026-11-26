CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" varchar(160) NOT NULL,
	"location" varchar(120),
	"service_id" integer,
	"rating" integer NOT NULL,
	"review" text NOT NULL,
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "testimonials_rating_range" CHECK ("testimonials"."rating" >= 1 AND "testimonials"."rating" <= 5)
);
--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "testimonials_approved_created_idx" ON "testimonials" USING btree ("is_approved","created_at");--> statement-breakpoint
CREATE INDEX "testimonials_service_idx" ON "testimonials" USING btree ("service_id");