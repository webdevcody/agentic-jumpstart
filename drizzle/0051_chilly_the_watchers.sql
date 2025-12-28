DROP INDEX "affiliates_code_idx";--> statement-breakpoint
CREATE INDEX "referrals_affiliate_unpaid_idx" ON "app_affiliate_referral" USING btree ("affiliateId","isPaid");