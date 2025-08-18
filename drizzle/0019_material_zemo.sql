CREATE TABLE "app_unsubscribe_token" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"userId" serial NOT NULL,
	"emailAddress" text NOT NULL,
	"isUsed" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_unsubscribe_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "app_unsubscribe_token" ADD CONSTRAINT "app_unsubscribe_token_userId_app_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "unsubscribe_tokens_token_idx" ON "app_unsubscribe_token" USING btree ("token");--> statement-breakpoint
CREATE INDEX "unsubscribe_tokens_user_idx" ON "app_unsubscribe_token" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "unsubscribe_tokens_expires_idx" ON "app_unsubscribe_token" USING btree ("expires_at");