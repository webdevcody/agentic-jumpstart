ALTER TABLE "app_accounts" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_affiliate_payout" ALTER COLUMN "affiliateId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_affiliate_payout" ALTER COLUMN "paidBy" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_affiliate_referral" ALTER COLUMN "affiliateId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_affiliate_referral" ALTER COLUMN "purchaserId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_affiliate" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_agent" ALTER COLUMN "author_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_attachment" ALTER COLUMN "segmentId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_blog_post_view" ALTER COLUMN "blogPostId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_blog_post" ALTER COLUMN "authorId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_comment" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_comment" ALTER COLUMN "segmentId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_email_batch" ALTER COLUMN "adminId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_email_template" ALTER COLUMN "updatedBy" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_launch_kit_comment" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_launch_kit_comment" ALTER COLUMN "launch_kit_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_launch_kit_tag_relation" ALTER COLUMN "launch_kit_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_launch_kit_tag_relation" ALTER COLUMN "tag_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_launch_kit_tag" ALTER COLUMN "category_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_launch_kit_tag" ALTER COLUMN "category_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "app_news_entry" ALTER COLUMN "author_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_news_entry_tag" ALTER COLUMN "news_entry_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_news_entry_tag" ALTER COLUMN "news_tag_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_profile" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_progress" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_progress" ALTER COLUMN "segmentId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_progress" ALTER COLUMN "segmentId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "app_project" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_segment" ALTER COLUMN "moduleId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_session" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_testimonial" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_transcript_chunk" ALTER COLUMN "segmentId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_user_email_preference" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_video_processing_job" ALTER COLUMN "segmentId" SET DATA TYPE integer;