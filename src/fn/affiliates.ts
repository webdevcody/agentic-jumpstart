import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  authenticatedMiddleware,
  adminMiddleware,
  unauthenticatedMiddleware,
} from "~/lib/auth";
import { createFeatureFlagMiddleware } from "~/lib/feature-flags";
import {
  registerAffiliateUseCase,
  getAffiliateAnalyticsUseCase,
  updateAffiliatePaymentLinkUseCase,
  adminGetAllAffiliatesUseCase,
  adminToggleAffiliateStatusUseCase,
  adminUpdateAffiliateCommissionRateUseCase,
  recordAffiliatePayoutUseCase,
  validateAffiliateCodeUseCase,
  processAllAutomaticPayoutsUseCase,
  refreshStripeAccountStatusForUserUseCase,
  disconnectStripeAccountUseCase,
} from "~/use-cases/affiliates";
import { getAffiliateByUserId } from "~/data-access/affiliates";

const affiliatesFeatureMiddleware = createFeatureFlagMiddleware("AFFILIATES_FEATURE");

const registerAffiliateSchema = z.object({
  paymentMethod: z.enum(["link", "stripe"]),
  paymentLink: z.string().optional(),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms of service",
  }),
}).refine((data) => {
  if (data.paymentMethod === "link") {
    if (!data.paymentLink || data.paymentLink.length === 0) {
      return false;
    }
    try {
      new URL(data.paymentLink);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}, {
  message: "Please provide a valid payment URL",
  path: ["paymentLink"],
});

export const registerAffiliateFn = createServerFn()
  .middleware([authenticatedMiddleware, affiliatesFeatureMiddleware])
  .inputValidator(registerAffiliateSchema)
  .handler(async ({ data, context }) => {
    const affiliate = await registerAffiliateUseCase({
      userId: context.userId,
      paymentMethod: data.paymentMethod,
      paymentLink: data.paymentLink,
    });
    return affiliate;
  });

export const getAffiliateDashboardFn = createServerFn()
  .middleware([authenticatedMiddleware, affiliatesFeatureMiddleware])
  .handler(async ({ context }) => {
    const analytics = await getAffiliateAnalyticsUseCase(context.userId);
    return analytics;
  });

export const checkIfUserIsAffiliateFn = createServerFn()
  .middleware([unauthenticatedMiddleware, affiliatesFeatureMiddleware])
  .handler(async ({ context }) => {
    if (!context.userId) {
      return { isAffiliate: false };
    }
    const affiliate = await getAffiliateByUserId(context.userId);
    return { isAffiliate: !!affiliate };
  });

const updatePaymentMethodSchema = z.object({
  paymentMethod: z.enum(["link", "stripe"]),
  paymentLink: z.string().optional(),
}).refine((data) => {
  if (data.paymentMethod === "link") {
    if (!data.paymentLink || data.paymentLink.length === 0) {
      return false;
    }
    try {
      new URL(data.paymentLink);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}, {
  message: "Please provide a valid payment URL",
  path: ["paymentLink"],
});

export const updateAffiliatePaymentLinkFn = createServerFn()
  .middleware([authenticatedMiddleware, affiliatesFeatureMiddleware])
  .inputValidator(updatePaymentMethodSchema)
  .handler(async ({ data, context }) => {
    const updated = await updateAffiliatePaymentLinkUseCase({
      userId: context.userId,
      paymentMethod: data.paymentMethod,
      paymentLink: data.paymentLink,
    });
    return updated;
  });

export const adminGetAllAffiliatesFn = createServerFn()
  .middleware([adminMiddleware])
  .handler(async () => {
    const affiliates = await adminGetAllAffiliatesUseCase();
    return affiliates;
  });

const toggleAffiliateStatusSchema = z.object({
  affiliateId: z.number(),
  isActive: z.boolean(),
});

export const adminToggleAffiliateStatusFn = createServerFn()
  .middleware([adminMiddleware])
  .inputValidator(toggleAffiliateStatusSchema)
  .handler(async ({ data }) => {
    const updated = await adminToggleAffiliateStatusUseCase({
      affiliateId: data.affiliateId,
      isActive: data.isActive,
    });
    return updated;
  });

const updateAffiliateCommissionRateSchema = z.object({
  affiliateId: z.number(),
  commissionRate: z.number().min(0).max(100),
});

export const adminUpdateAffiliateCommissionRateFn = createServerFn()
  .middleware([adminMiddleware])
  .inputValidator(updateAffiliateCommissionRateSchema)
  .handler(async ({ data }) => {
    const updated = await adminUpdateAffiliateCommissionRateUseCase({
      affiliateId: data.affiliateId,
      commissionRate: data.commissionRate,
    });
    return updated;
  });

const recordPayoutSchema = z.object({
  affiliateId: z.number(),
  amount: z.number().min(5000, "Minimum payout is $50"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

export const adminRecordPayoutFn = createServerFn()
  .middleware([adminMiddleware])
  .inputValidator(recordPayoutSchema)
  .handler(async ({ data, context }) => {
    const payout = await recordAffiliatePayoutUseCase({
      affiliateId: data.affiliateId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      transactionId: data.transactionId,
      notes: data.notes,
      paidBy: context.userId,
    });
    return payout;
  });

const validateAffiliateCodeSchema = z.object({
  code: z.string().min(1).max(20).regex(/^[A-Z0-9]+$/i, "Code must contain only letters and numbers"),
});

export const validateAffiliateCodeFn = createServerFn()
  .middleware([unauthenticatedMiddleware])
  .inputValidator(validateAffiliateCodeSchema)
  .handler(async ({ data }) => {
    const affiliate = await validateAffiliateCodeUseCase(data.code);
    return { valid: !!affiliate };
  });

// Admin function to trigger automatic payouts for all eligible affiliates
export const adminProcessAutomaticPayoutsFn = createServerFn()
  .middleware([adminMiddleware])
  .handler(async ({ context }) => {
    const result = await processAllAutomaticPayoutsUseCase({
      systemUserId: context.userId,
    });

    return {
      success: true,
      message: `Processed ${result.processed} affiliates: ${result.successful} successful, ${result.failed} failed`,
      processed: result.processed,
      successful: result.successful,
      failed: result.failed,
      results: result.results,
    };
  });

// User function to manually refresh their Stripe Connect account status
export const refreshStripeAccountStatusFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    const result = await refreshStripeAccountStatusForUserUseCase(context.userId);

    if (!result.success) {
      throw new Error(result.error || "Failed to refresh Stripe account status");
    }

    return {
      success: true,
      message: "Stripe account status refreshed successfully",
    };
  });

// User function to disconnect their Stripe Connect account
export const disconnectStripeAccountFn = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    const affiliate = await disconnectStripeAccountUseCase(context.userId);

    return {
      success: true,
      message: "Stripe Connect account disconnected successfully",
      affiliate,
    };
  });
