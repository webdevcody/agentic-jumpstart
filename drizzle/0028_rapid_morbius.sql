CREATE TABLE "app_agent" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"author_id" serial NOT NULL,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_agent_name_unique" UNIQUE("name"),
	CONSTRAINT "app_agent_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "app_agent" ADD CONSTRAINT "app_agent_author_id_app_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agents_author_idx" ON "app_agent" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "agents_type_idx" ON "app_agent" USING btree ("type");--> statement-breakpoint
CREATE INDEX "agents_public_idx" ON "app_agent" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "agents_slug_idx" ON "app_agent" USING btree ("slug");