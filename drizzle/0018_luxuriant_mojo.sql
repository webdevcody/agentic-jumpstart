CREATE TABLE "app_email_batch" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"htmlContent" text NOT NULL,
	"recipientCount" integer DEFAULT 0 NOT NULL,
	"sentCount" integer DEFAULT 0 NOT NULL,
	"failedCount" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"adminId" serial NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_user_email_preference" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"allowCourseUpdates" boolean DEFAULT true NOT NULL,
	"allowPromotional" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_email_preference_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "app_email_batch" ADD CONSTRAINT "app_email_batch_adminId_app_user_id_fk" FOREIGN KEY ("adminId") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_user_email_preference" ADD CONSTRAINT "app_user_email_preference_userId_app_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_batches_admin_created_idx" ON "app_email_batch" USING btree ("adminId","created_at");--> statement-breakpoint
CREATE INDEX "email_batches_status_idx" ON "app_email_batch" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_preferences_user_idx" ON "app_user_email_preference" USING btree ("userId");