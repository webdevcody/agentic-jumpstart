CREATE TABLE "app_affiliate_payout" (
	"id" serial PRIMARY KEY NOT NULL,
	"affiliateId" serial NOT NULL,
	"amount" integer NOT NULL,
	"paymentMethod" text NOT NULL,
	"transactionId" text,
	"notes" text,
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"paidBy" serial NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_affiliate_referral" (
	"id" serial PRIMARY KEY NOT NULL,
	"affiliateId" serial NOT NULL,
	"purchaserId" serial NOT NULL,
	"stripeSessionId" text NOT NULL,
	"amount" integer NOT NULL,
	"commission" integer NOT NULL,
	"isPaid" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_affiliate" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"affiliateCode" text NOT NULL,
	"paymentLink" text NOT NULL,
	"commissionRate" integer DEFAULT 30 NOT NULL,
	"totalEarnings" integer DEFAULT 0 NOT NULL,
	"paidAmount" integer DEFAULT 0 NOT NULL,
	"unpaidBalance" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_affiliate_userId_unique" UNIQUE("userId"),
	CONSTRAINT "app_affiliate_affiliateCode_unique" UNIQUE("affiliateCode")
);
--> statement-breakpoint
ALTER TABLE "app_affiliate_payout" ADD CONSTRAINT "app_affiliate_payout_affiliateId_app_affiliate_id_fk" FOREIGN KEY ("affiliateId") REFERENCES "public"."app_affiliate"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_affiliate_payout" ADD CONSTRAINT "app_affiliate_payout_paidBy_app_user_id_fk" FOREIGN KEY ("paidBy") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_affiliate_referral" ADD CONSTRAINT "app_affiliate_referral_affiliateId_app_affiliate_id_fk" FOREIGN KEY ("affiliateId") REFERENCES "public"."app_affiliate"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_affiliate_referral" ADD CONSTRAINT "app_affiliate_referral_purchaserId_app_user_id_fk" FOREIGN KEY ("purchaserId") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_affiliate" ADD CONSTRAINT "app_affiliate_userId_app_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payouts_affiliate_paid_idx" ON "app_affiliate_payout" USING btree ("affiliateId","paid_at");--> statement-breakpoint
CREATE INDEX "referrals_affiliate_created_idx" ON "app_affiliate_referral" USING btree ("affiliateId","created_at");--> statement-breakpoint
CREATE INDEX "referrals_purchaser_idx" ON "app_affiliate_referral" USING btree ("purchaserId");--> statement-breakpoint
CREATE UNIQUE INDEX "referrals_stripe_session_unique" ON "app_affiliate_referral" USING btree ("stripeSessionId");--> statement-breakpoint
CREATE INDEX "affiliates_user_id_idx" ON "app_affiliate" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "affiliates_code_idx" ON "app_affiliate" USING btree ("affiliateCode");