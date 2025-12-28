CREATE TYPE "public"."affiliate_payment_method_enum" AS ENUM('link', 'stripe');--> statement-breakpoint
CREATE TYPE "public"."stripe_account_status_enum" AS ENUM('not_started', 'onboarding', 'active', 'restricted');--> statement-breakpoint
ALTER TABLE "app_affiliate" ALTER COLUMN "paymentMethod" SET DEFAULT 'link'::"public"."affiliate_payment_method_enum";--> statement-breakpoint
ALTER TABLE "app_affiliate" ALTER COLUMN "paymentMethod" SET DATA TYPE "public"."affiliate_payment_method_enum" USING "paymentMethod"::"public"."affiliate_payment_method_enum";--> statement-breakpoint
ALTER TABLE "app_affiliate" ALTER COLUMN "stripeAccountStatus" SET DEFAULT 'not_started'::"public"."stripe_account_status_enum";--> statement-breakpoint
ALTER TABLE "app_affiliate" ALTER COLUMN "stripeAccountStatus" SET DATA TYPE "public"."stripe_account_status_enum" USING "stripeAccountStatus"::"public"."stripe_account_status_enum";--> statement-breakpoint
ALTER TABLE "app_affiliate" ADD CONSTRAINT "discount_rate_check" CHECK ("app_affiliate"."discountRate" <= "app_affiliate"."commissionRate" AND "app_affiliate"."discountRate" >= 0);