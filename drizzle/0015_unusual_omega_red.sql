CREATE TABLE "app_guest_book_entry" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_guest_book_entry" ADD CONSTRAINT "app_guest_book_entry_userId_app_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;