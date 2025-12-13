CREATE TABLE "app_video_processing_job" (
	"id" serial PRIMARY KEY NOT NULL,
	"segmentId" serial NOT NULL,
	"jobType" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "app_video_processing_job" ADD CONSTRAINT "app_video_processing_job_segmentId_app_segment_id_fk" FOREIGN KEY ("segmentId") REFERENCES "public"."app_segment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "video_processing_jobs_segment_idx" ON "app_video_processing_job" USING btree ("segmentId");--> statement-breakpoint
CREATE INDEX "video_processing_jobs_status_idx" ON "app_video_processing_job" USING btree ("status");--> statement-breakpoint
CREATE INDEX "video_processing_jobs_created_idx" ON "app_video_processing_job" USING btree ("created_at");