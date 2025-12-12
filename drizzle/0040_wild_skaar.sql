DROP INDEX "analytics_events_campaign_idx";--> statement-breakpoint
DROP INDEX "analytics_sessions_campaign_idx";--> statement-breakpoint
ALTER TABLE "app_analytics_event" DROP COLUMN "utmSource";--> statement-breakpoint
ALTER TABLE "app_analytics_event" DROP COLUMN "utmMedium";--> statement-breakpoint
ALTER TABLE "app_analytics_event" DROP COLUMN "utmCampaign";--> statement-breakpoint
ALTER TABLE "app_analytics_event" DROP COLUMN "utmContent";--> statement-breakpoint
ALTER TABLE "app_analytics_event" DROP COLUMN "utmTerm";--> statement-breakpoint
ALTER TABLE "app_analytics_session" DROP COLUMN "utmCampaign";--> statement-breakpoint
ALTER TABLE "app_analytics_session" DROP COLUMN "utmSource";--> statement-breakpoint
ALTER TABLE "app_analytics_session" DROP COLUMN "utmMedium";--> statement-breakpoint
ALTER TABLE "app_analytics_session" DROP COLUMN "utmContent";--> statement-breakpoint
ALTER TABLE "app_analytics_session" DROP COLUMN "utmTerm";