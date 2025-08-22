CREATE TABLE "app_launch_kit_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"launch_kit_id" serial NOT NULL,
	"user_id" serial NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"referrer" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_launch_kit_comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"launch_kit_id" serial NOT NULL,
	"parent_id" integer,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_launch_kit_tag_relation" (
	"id" serial PRIMARY KEY NOT NULL,
	"launch_kit_id" serial NOT NULL,
	"tag_id" serial NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_launch_kit_tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"color" varchar(7) DEFAULT '#3B82F6' NOT NULL,
	"category" varchar(50) DEFAULT 'framework' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_launch_kit_tag_name_unique" UNIQUE("name"),
	CONSTRAINT "app_launch_kit_tag_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "app_launch_kit" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"long_description" text,
	"repository_url" text NOT NULL,
	"demo_url" text,
	"image_url" text,
	"difficulty" varchar(50) DEFAULT 'beginner' NOT NULL,
	"clone_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_launch_kit_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "app_launch_kit_analytics" ADD CONSTRAINT "app_launch_kit_analytics_launch_kit_id_app_launch_kit_id_fk" FOREIGN KEY ("launch_kit_id") REFERENCES "public"."app_launch_kit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_launch_kit_analytics" ADD CONSTRAINT "app_launch_kit_analytics_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_launch_kit_comment" ADD CONSTRAINT "app_launch_kit_comment_userId_app_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_launch_kit_comment" ADD CONSTRAINT "app_launch_kit_comment_launch_kit_id_app_launch_kit_id_fk" FOREIGN KEY ("launch_kit_id") REFERENCES "public"."app_launch_kit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_launch_kit_comment" ADD CONSTRAINT "app_launch_kit_comment_parent_id_app_launch_kit_comment_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."app_launch_kit_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_launch_kit_tag_relation" ADD CONSTRAINT "app_launch_kit_tag_relation_launch_kit_id_app_launch_kit_id_fk" FOREIGN KEY ("launch_kit_id") REFERENCES "public"."app_launch_kit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_launch_kit_tag_relation" ADD CONSTRAINT "app_launch_kit_tag_relation_tag_id_app_launch_kit_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."app_launch_kit_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "launch_kit_analytics_kit_idx" ON "app_launch_kit_analytics" USING btree ("launch_kit_id");--> statement-breakpoint
CREATE INDEX "launch_kit_analytics_event_idx" ON "app_launch_kit_analytics" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "launch_kit_analytics_created_idx" ON "app_launch_kit_analytics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "launch_kit_analytics_user_idx" ON "app_launch_kit_analytics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "launch_kit_comments_kit_created_idx" ON "app_launch_kit_comment" USING btree ("launch_kit_id","created_at");--> statement-breakpoint
CREATE INDEX "launch_kit_comments_user_created_idx" ON "app_launch_kit_comment" USING btree ("userId","created_at");--> statement-breakpoint
CREATE INDEX "launch_kit_comments_parent_idx" ON "app_launch_kit_comment" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "launch_kit_tag_relations_kit_idx" ON "app_launch_kit_tag_relation" USING btree ("launch_kit_id");--> statement-breakpoint
CREATE INDEX "launch_kit_tag_relations_tag_idx" ON "app_launch_kit_tag_relation" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "launch_kit_tag_relations_unique" ON "app_launch_kit_tag_relation" USING btree ("launch_kit_id","tag_id");--> statement-breakpoint
CREATE INDEX "launch_kit_tags_category_idx" ON "app_launch_kit_tag" USING btree ("category");--> statement-breakpoint
CREATE INDEX "launch_kit_tags_slug_idx" ON "app_launch_kit_tag" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "launch_kits_difficulty_idx" ON "app_launch_kit" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "launch_kits_active_idx" ON "app_launch_kit" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "launch_kits_slug_idx" ON "app_launch_kit" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "launch_kits_created_idx" ON "app_launch_kit" USING btree ("created_at");