CREATE TABLE "app_blog_post" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"isPublished" boolean DEFAULT false NOT NULL,
	"authorId" serial NOT NULL,
	"featuredImage" text,
	"tags" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	CONSTRAINT "app_blog_post_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "app_blog_post_view" (
	"id" serial PRIMARY KEY NOT NULL,
	"blogPostId" serial NOT NULL,
	"sessionId" text NOT NULL,
	"ipAddressHash" text,
	"userAgent" text,
	"referrer" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_post_views_session_post_unique" UNIQUE("sessionId","blogPostId")
);
--> statement-breakpoint
ALTER TABLE "app_blog_post" ADD CONSTRAINT "app_blog_post_authorId_app_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_blog_post_view" ADD CONSTRAINT "app_blog_post_view_blogPostId_app_blog_post_id_fk" FOREIGN KEY ("blogPostId") REFERENCES "public"."app_blog_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_posts_slug_idx" ON "app_blog_post" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_posts_author_idx" ON "app_blog_post" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "blog_posts_published_idx" ON "app_blog_post" USING btree ("isPublished","published_at");--> statement-breakpoint
CREATE INDEX "blog_posts_created_idx" ON "app_blog_post" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "blog_post_views_post_idx" ON "app_blog_post_view" USING btree ("blogPostId");--> statement-breakpoint
CREATE INDEX "blog_post_views_session_idx" ON "app_blog_post_view" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "blog_post_views_created_idx" ON "app_blog_post_view" USING btree ("created_at");