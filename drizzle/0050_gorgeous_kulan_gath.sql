CREATE TYPE "public"."affiliate_payout_status_enum" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
ALTER TABLE "app_affiliate" ALTER COLUMN "paymentLink" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "app_segment" ALTER COLUMN "moduleId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app_affiliate_payout" ADD COLUMN "stripeTransferId" text;--> statement-breakpoint
ALTER TABLE "app_affiliate_payout" ADD COLUMN "status" "affiliate_payout_status_enum" DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "app_affiliate_payout" ADD COLUMN "errorMessage" text;--> statement-breakpoint
ALTER TABLE "app_affiliate_referral" ADD COLUMN "commissionRate" integer;--> statement-breakpoint
ALTER TABLE "app_affiliate_referral" ADD COLUMN "discountRate" integer;--> statement-breakpoint
ALTER TABLE "app_affiliate_referral" ADD COLUMN "originalCommissionRate" integer;--> statement-breakpoint
ALTER TABLE "app_affiliate" ADD COLUMN "paymentMethod" text DEFAULT 'link' NOT NULL;--> statement-breakpoint
ALTER TABLE "app_affiliate" ADD COLUMN "discountRate" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_affiliate" ADD COLUMN "stripeConnectAccountId" text;--> statement-breakpoint
ALTER TABLE "app_affiliate" ADD COLUMN "stripeAccountStatus" text DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE "app_affiliate" ADD COLUMN "stripeChargesEnabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_affiliate" ADD COLUMN "stripePayoutsEnabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_affiliate" ADD COLUMN "stripeDetailsSubmitted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_affiliate" ADD COLUMN "stripeAccountType" text;--> statement-breakpoint
ALTER TABLE "app_affiliate" ADD COLUMN "lastStripeSync" timestamp;--> statement-breakpoint
ALTER TABLE "app_affiliate" ADD COLUMN "lastPayoutError" text;--> statement-breakpoint
ALTER TABLE "app_affiliate" ADD COLUMN "lastPayoutErrorAt" timestamp;--> statement-breakpoint
ALTER TABLE "app_affiliate" ADD COLUMN "lastPayoutAttemptAt" timestamp;--> statement-breakpoint
ALTER TABLE "app_affiliate" ADD COLUMN "lastConnectAttemptAt" timestamp;--> statement-breakpoint
ALTER TABLE "app_affiliate" ADD COLUMN "connectAttemptCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_affiliate" ADD COLUMN "payoutRetryCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_affiliate" ADD COLUMN "nextPayoutRetryAt" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX "payouts_stripe_transfer_idx" ON "app_affiliate_payout" USING btree ("stripeTransferId");--> statement-breakpoint
CREATE INDEX "payouts_status_idx" ON "app_affiliate_payout" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "affiliates_stripe_account_idx" ON "app_affiliate" USING btree ("stripeConnectAccountId");