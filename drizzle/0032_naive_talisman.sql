CREATE TABLE "app_project" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"imageUrl" text,
	"projectUrl" text,
	"repositoryUrl" text,
	"technologies" text,
	"order" integer DEFAULT 0 NOT NULL,
	"isVisible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_profile" ADD COLUMN "twitterHandle" text;--> statement-breakpoint
ALTER TABLE "app_profile" ADD COLUMN "githubHandle" text;--> statement-breakpoint
ALTER TABLE "app_profile" ADD COLUMN "websiteUrl" text;--> statement-breakpoint
ALTER TABLE "app_profile" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "app_project" ADD CONSTRAINT "app_project_userId_app_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_user_order_idx" ON "app_project" USING btree ("userId","order");--> statement-breakpoint
CREATE INDEX "projects_user_visible_idx" ON "app_project" USING btree ("userId","isVisible");