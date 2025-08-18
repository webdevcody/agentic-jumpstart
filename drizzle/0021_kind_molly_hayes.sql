CREATE TABLE "app_newsletter_signup" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"source" text DEFAULT 'early_access' NOT NULL,
	"isVerified" boolean DEFAULT false NOT NULL,
	"subscriptionType" text DEFAULT 'newsletter' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_newsletter_signup_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "newsletter_signups_email_idx" ON "app_newsletter_signup" USING btree ("email");--> statement-breakpoint
CREATE INDEX "newsletter_signups_source_idx" ON "app_newsletter_signup" USING btree ("source");--> statement-breakpoint
CREATE INDEX "newsletter_signups_type_idx" ON "app_newsletter_signup" USING btree ("subscriptionType");--> statement-breakpoint
CREATE INDEX "newsletter_signups_created_idx" ON "app_newsletter_signup" USING btree ("created_at");