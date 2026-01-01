-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "app_transcript_chunk" (
	"id" serial PRIMARY KEY NOT NULL,
	"segmentId" serial NOT NULL,
	"chunkIndex" integer NOT NULL,
	"chunkText" text NOT NULL,
	"embedding" vector(1536),
	"tokenCount" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_transcript_chunk" ADD CONSTRAINT "app_transcript_chunk_segmentId_app_segment_id_fk" FOREIGN KEY ("segmentId") REFERENCES "public"."app_segment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transcript_chunks_segment_idx" ON "app_transcript_chunk" USING btree ("segmentId");--> statement-breakpoint
CREATE INDEX "transcript_chunks_segment_order_idx" ON "app_transcript_chunk" USING btree ("segmentId","chunkIndex");