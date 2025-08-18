CREATE TABLE "app_analytics_event" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"sessionId" text NOT NULL,
	"eventType" text NOT NULL,
	"pagePath" text NOT NULL,
	"referrer" text,
	"userAgent" text,
	"ipAddressHash" text,
	"utmSource" text,
	"utmMedium" text,
	"utmCampaign" text,
	"utmContent" text,
	"utmTerm" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_analytics_session" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"first_seen" timestamp DEFAULT now() NOT NULL,
	"last_seen" timestamp DEFAULT now() NOT NULL,
	"referrerSource" text,
	"utmCampaign" text,
	"utmSource" text,
	"utmMedium" text,
	"utmContent" text,
	"utmTerm" text,
	"pageViews" integer DEFAULT 0 NOT NULL,
	"hasPurchaseIntent" boolean DEFAULT false NOT NULL,
	"hasConversion" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_analytics_event" ADD CONSTRAINT "app_analytics_event_userId_app_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_analytics_session" ADD CONSTRAINT "app_analytics_session_userId_app_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_events_session_idx" ON "app_analytics_event" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "analytics_events_user_idx" ON "app_analytics_event" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "analytics_events_type_idx" ON "app_analytics_event" USING btree ("eventType");--> statement-breakpoint
CREATE INDEX "analytics_events_campaign_idx" ON "app_analytics_event" USING btree ("utmCampaign");--> statement-breakpoint
CREATE INDEX "analytics_events_created_idx" ON "app_analytics_event" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "analytics_sessions_user_idx" ON "app_analytics_session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "analytics_sessions_campaign_idx" ON "app_analytics_session" USING btree ("utmCampaign");--> statement-breakpoint
CREATE INDEX "analytics_sessions_first_seen_idx" ON "app_analytics_session" USING btree ("first_seen");