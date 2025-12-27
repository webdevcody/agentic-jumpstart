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
import { getAffiliateByUserId, updateAffiliateDiscountRate, getAffiliatePayouts, getAffiliateReferrals } from "~/data-access/affiliates";

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

export const registerAffiliateFn = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware, affiliatesFeatureMiddleware])
  .inputValidator(registerAffiliateSchema)
  .handler(async ({ data, context }) => {
    const affiliate = await registerAffiliateUseCase({
      userId: context.userId,
      paymentMethod: data.paymentMethod,
      paymentLink: data.paymentLink,
    });
    return { success: true, data: affiliate };
  });

export const getAffiliateDashboardFn = createServerFn({ method: "GET" })
  .middleware([authenticatedMiddleware, affiliatesFeatureMiddleware])
  .inputValidator(z.void())
  .handler(async ({ context }) => {
    const analytics = await getAffiliateAnalyticsUseCase(context.userId);
    return { success: true, data: analytics };
  });

export const checkIfUserIsAffiliateFn = createServerFn({ method: "GET" })
  .middleware([unauthenticatedMiddleware, affiliatesFeatureMiddleware])
  .inputValidator(z.void())
  .handler(async ({ context }) => {
    if (!context.userId) {
      return {
        success: true,
        data: {
          isAffiliate: false,
          isOnboardingComplete: false,
          paymentMethod: null,
          stripeAccountStatus: null,
          hasStripeAccount: false,
        },
      };
    }
    const affiliate = await getAffiliateByUserId(context.userId);
    if (!affiliate) {
      return {
        success: true,
        data: {
          isAffiliate: false,
          isOnboardingComplete: false,
          paymentMethod: null,
          stripeAccountStatus: null,
          hasStripeAccount: false,
        },
      };
    }

    // Check if onboarding is complete:
    // - For 'link' payment method: always complete (no extra setup needed)
    // - For 'stripe' payment method: complete only if Stripe account is fully active
    const isOnboardingComplete =
      affiliate.paymentMethod === "link" ||
      (affiliate.paymentMethod === "stripe" && affiliate.stripeAccountStatus === "active");

    return {
      success: true,
      data: {
        isAffiliate: true,
        isOnboardingComplete,
        paymentMethod: affiliate.paymentMethod,
        stripeAccountStatus: affiliate.stripeAccountStatus,
        hasStripeAccount: !!affiliate.stripeConnectAccountId,
      },
    };
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

export const updateAffiliatePaymentLinkFn = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware, affiliatesFeatureMiddleware])
  .inputValidator(updatePaymentMethodSchema)
  .handler(async ({ data, context }) => {
    const updated = await updateAffiliatePaymentLinkUseCase({
      userId: context.userId,
      paymentMethod: data.paymentMethod,
      paymentLink: data.paymentLink,
    });
    return { success: true, data: updated };
  });

const updateDiscountRateSchema = z.object({
  discountRate: z.number().min(0).max(100),
});

/**
 * Update affiliate's discount rate (how much of their commission goes to customer discount).
 * Affiliates can call this to adjust their commission split.
 */
export const updateAffiliateDiscountRateFn = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware, affiliatesFeatureMiddleware])
  .inputValidator(updateDiscountRateSchema)
  .handler(async ({ data, context }) => {
    const affiliate = await getAffiliateByUserId(context.userId);
    if (!affiliate) {
      throw new Error("Affiliate account not found");
    }
    // Ensure discount rate doesn't exceed commission rate
    if (data.discountRate > affiliate.commissionRate) {
      throw new Error(`Discount rate cannot exceed your commission rate of ${affiliate.commissionRate}%`);
    }
    const updated = await updateAffiliateDiscountRate(affiliate.id, data.discountRate);
    return { success: true, data: updated };
  });

export const adminGetAllAffiliatesFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(z.void())
  .handler(async () => {
    const affiliates = await adminGetAllAffiliatesUseCase();
    return { success: true, data: affiliates };
  });

const toggleAffiliateStatusSchema = z.object({
  affiliateId: z.number(),
  isActive: z.boolean(),
});

export const adminToggleAffiliateStatusFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(toggleAffiliateStatusSchema)
  .handler(async ({ data }) => {
    const updated = await adminToggleAffiliateStatusUseCase({
      affiliateId: data.affiliateId,
      isActive: data.isActive,
    });
    return { success: true, data: updated };
  });

const updateAffiliateCommissionRateSchema = z.object({
  affiliateId: z.number(),
  commissionRate: z.number().min(0).max(100),
});

export const adminUpdateAffiliateCommissionRateFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(updateAffiliateCommissionRateSchema)
  .handler(async ({ data }) => {
    const updated = await adminUpdateAffiliateCommissionRateUseCase({
      affiliateId: data.affiliateId,
      commissionRate: data.commissionRate,
    });
    return { success: true, data: updated };
  });

const recordPayoutSchema = z.object({
  affiliateId: z.number(),
  amount: z.number().min(5000, "Minimum payout is $50"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

export const adminRecordPayoutFn = createServerFn({ method: "POST" })
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
    return { success: true, data: payout };
  });

const validateAffiliateCodeSchema = z.object({
  code: z.string().min(1).max(20).regex(/^[A-Z0-9]+$/i, "Code must contain only letters and numbers"),
});

export const validateAffiliateCodeFn = createServerFn({ method: "GET" })
  .middleware([unauthenticatedMiddleware])
  .inputValidator(validateAffiliateCodeSchema)
  .handler(async ({ data }) => {
    const affiliate = await validateAffiliateCodeUseCase(data.code);
    return { success: true, data: { valid: !!affiliate } };
  });

// Admin function to trigger automatic payouts for all eligible affiliates
export const adminProcessAutomaticPayoutsFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(z.void())
  .handler(async ({ context }) => {
    const result = await processAllAutomaticPayoutsUseCase({
      systemUserId: context.userId,
    });

    return {
      success: true,
      data: {
        message: `Processed ${result.processed} affiliates: ${result.successful} successful, ${result.failed} failed`,
        processed: result.processed,
        successful: result.successful,
        failed: result.failed,
        results: result.results,
      },
    };
  });

// User function to manually refresh their Stripe Connect account status
export const refreshStripeAccountStatusFn = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware, affiliatesFeatureMiddleware])
  .inputValidator(z.void())
  .handler(async ({ context }) => {
    const result = await refreshStripeAccountStatusForUserUseCase(context.userId);

    if (!result.success) {
      throw new Error(result.error || "Failed to refresh Stripe account status");
    }

    return {
      success: true,
      data: {
        message: "Stripe account status refreshed successfully",
      },
    };
  });

// User function to disconnect their Stripe Connect account
export const disconnectStripeAccountFn = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware, affiliatesFeatureMiddleware])
  .inputValidator(z.void())
  .handler(async ({ context }) => {
    const affiliate = await disconnectStripeAccountUseCase(context.userId);

    return {
      success: true,
      data: {
        message: "Stripe Connect account disconnected successfully",
        affiliate,
      },
    };
  });

// Admin function to get affiliate payout history
const getAffiliatePayoutsSchema = z.object({
  affiliateId: z.number(),
  limit: z.number().optional().default(10),
  offset: z.number().optional().default(0),
});

export const adminGetAffiliatePayoutsFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(getAffiliatePayoutsSchema)
  .handler(async ({ data }) => {
    const result = await getAffiliatePayouts(data.affiliateId, {
      limit: data.limit,
      offset: data.offset,
    });
    return { success: true, data: result };
  });

// Admin function to get affiliate referral/conversion history
const getAffiliateReferralsSchema = z.object({
  affiliateId: z.number(),
  limit: z.number().optional().default(10),
  offset: z.number().optional().default(0),
});

export const adminGetAffiliateReferralsFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(getAffiliateReferralsSchema)
  .handler(async ({ data }) => {
    const result = await getAffiliateReferrals(data.affiliateId, {
      limit: data.limit,
      offset: data.offset,
    });
    return { success: true, data: result };
  });
