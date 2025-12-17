ALTER TABLE "app_unsubscribe_token" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_unsubscribe_token" ALTER COLUMN "userId" DROP NOT NULL;