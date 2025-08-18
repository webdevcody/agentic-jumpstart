ALTER TABLE "app_analytics_event" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_analytics_event" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "app_analytics_session" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_analytics_session" ALTER COLUMN "userId" DROP NOT NULL;