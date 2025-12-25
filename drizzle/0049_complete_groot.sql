ALTER TABLE "app_analytics_session" ADD COLUMN "gclid" text;--> statement-breakpoint
CREATE INDEX "analytics_sessions_gclid_idx" ON "app_analytics_session" USING btree ("gclid");