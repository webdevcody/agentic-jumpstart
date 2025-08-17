import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authenticatedMiddleware, adminMiddleware } from "~/lib/auth";
import {
  registerAffiliateUseCase,
  getAffiliateAnalyticsUseCase,
  updateAffiliatePaymentLinkUseCase,
  adminGetAllAffiliatesUseCase,
  adminToggleAffiliateStatusUseCase,
  recordAffiliatePayoutUseCase,
  validateAffiliateCodeUseCase,
} from "~/use-cases/affiliates";
import { getAffiliateByUserId } from "~/data-access/affiliates";

const registerAffiliateSchema = z.object({
  paymentLink: z.url("Please provide a valid URL"),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms of service",
  }),
});

export const registerAffiliateFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .validator(registerAffiliateSchema)
  .handler(async ({ data, context }) => {
    const affiliate = await registerAffiliateUseCase({
      userId: context.userId,
      paymentLink: data.paymentLink,
    });
    return affiliate;
  });

export const getAffiliateDashboardFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    const analytics = await getAffiliateAnalyticsUseCase(context.userId);
    return analytics;
  });

export const checkIfUserIsAffiliateFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    const affiliate = await getAffiliateByUserId(context.userId);
    return { isAffiliate: !!affiliate };
  });

const updatePaymentLinkSchema = z.object({
  paymentLink: z.url("Please provide a valid URL"),
});

export const updateAffiliatePaymentLinkFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .validator(updatePaymentLinkSchema)
  .handler(async ({ data, context }) => {
    const updated = await updateAffiliatePaymentLinkUseCase({
      userId: context.userId,
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
  .validator(toggleAffiliateStatusSchema)
  .handler(async ({ data }) => {
    const updated = await adminToggleAffiliateStatusUseCase({
      affiliateId: data.affiliateId,
      isActive: data.isActive,
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
  .validator(recordPayoutSchema)
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
  code: z.string(),
});

export const validateAffiliateCodeFn = createServerFn()
  .validator(validateAffiliateCodeSchema)
  .handler(async ({ data }) => {
    const affiliate = await validateAffiliateCodeUseCase(data.code);
    return { valid: !!affiliate };
  });
