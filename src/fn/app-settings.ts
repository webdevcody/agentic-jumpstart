import { createServerFn } from "@tanstack/react-start";
import { adminMiddleware, unauthenticatedMiddleware } from "~/lib/auth";
import { z } from "zod";
import { FLAG_KEYS, type FlagKey } from "~/config";
import {
  getAppSettingsUseCase,
  toggleEarlyAccessModeUseCase,
  getEarlyAccessModeUseCase,
  getAgentsFeatureEnabledUseCase,
  toggleAgentsFeatureUseCase,
  getLaunchKitsFeatureEnabledUseCase,
  toggleLaunchKitsFeatureUseCase,
  getAffiliatesFeatureEnabledUseCase,
  toggleAffiliatesFeatureUseCase,
  getBlogFeatureEnabledUseCase,
  toggleBlogFeatureUseCase,
  getNewsFeatureEnabledUseCase,
  toggleNewsFeatureUseCase,
  getVideoSegmentContentTabsEnabledUseCase,
  toggleVideoSegmentContentTabsUseCase,
  getFeatureFlagEnabledUseCase,
  toggleFeatureFlagUseCase,
  getAffiliateCommissionRateUseCase,
  setAffiliateCommissionRateUseCase,
  getAffiliateMinimumPayoutUseCase,
  setAffiliateMinimumPayoutUseCase,
  getPricingSettingsUseCase,
  updatePricingSettingsUseCase,
} from "~/use-cases/app-settings";
import { isFeatureEnabledForUser } from "~/data-access/app-settings";

// Zod enum schema for validating flag keys
const flagKeySchema = z.enum(FLAG_KEYS);

export const getAppSettingsFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(z.void())
  .handler(async () => {
    return getAppSettingsUseCase();
  });

export const toggleEarlyAccessModeFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ enabled: z.boolean() }))
  .handler(async ({ data }) => {
    await toggleEarlyAccessModeUseCase(data.enabled);
    return { success: true };
  });

export const getEarlyAccessModeFn = createServerFn({ method: "GET" })
  .middleware([unauthenticatedMiddleware])
  .inputValidator(z.void())
  .handler(async () => {
    return getEarlyAccessModeUseCase();
  });

export const getAgentsFeatureEnabledFn = createServerFn({ method: "GET" })
  .middleware([unauthenticatedMiddleware])
  .inputValidator(z.void())
  .handler(async () => {
    return getAgentsFeatureEnabledUseCase();
  });

export const toggleAgentsFeatureFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ enabled: z.boolean() }))
  .handler(async ({ data }) => {
    await toggleAgentsFeatureUseCase(data.enabled);
    return { success: true };
  });

export const getLaunchKitsFeatureEnabledFn = createServerFn({ method: "GET" })
  .middleware([unauthenticatedMiddleware])
  .inputValidator(z.void())
  .handler(async () => {
    return getLaunchKitsFeatureEnabledUseCase();
  });

export const toggleLaunchKitsFeatureFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ enabled: z.boolean() }))
  .handler(async ({ data }) => {
    await toggleLaunchKitsFeatureUseCase(data.enabled);
    return { success: true };
  });

export const getAffiliatesFeatureEnabledFn = createServerFn({ method: "GET" })
  .middleware([unauthenticatedMiddleware])
  .inputValidator(z.void())
  .handler(async () => {
    return getAffiliatesFeatureEnabledUseCase();
  });

export const toggleAffiliatesFeatureFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ enabled: z.boolean() }))
  .handler(async ({ data }) => {
    await toggleAffiliatesFeatureUseCase(data.enabled);
    return { success: true };
  });

export const getBlogFeatureEnabledFn = createServerFn({ method: "GET" })
  .middleware([unauthenticatedMiddleware])
  .inputValidator(z.void())
  .handler(async () => {
    return getBlogFeatureEnabledUseCase();
  });

export const getNewsFeatureEnabledFn = createServerFn({ method: "GET" })
  .middleware([unauthenticatedMiddleware])
  .inputValidator(z.void())
  .handler(async () => {
    return getNewsFeatureEnabledUseCase();
  });

export const toggleBlogFeatureFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ enabled: z.boolean() }))
  .handler(async ({ data }) => {
    await toggleBlogFeatureUseCase(data.enabled);
    return { success: true };
  });

export const toggleNewsFeatureFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ enabled: z.boolean() }))
  .handler(async ({ data }) => {
    await toggleNewsFeatureUseCase(data.enabled);
    return { success: true };
  });

export const getVideoSegmentContentTabsEnabledFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .inputValidator(z.void())
  .handler(async () => {
    return getVideoSegmentContentTabsEnabledUseCase();
  });

export const toggleVideoSegmentContentTabsFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .inputValidator(z.object({ enabled: z.boolean() }))
  .handler(async ({ data }) => {
    await toggleVideoSegmentContentTabsUseCase(data.enabled);
    return { success: true };
  });

export const isFeatureEnabledForUserFn = createServerFn({ method: "GET" })
  .middleware([unauthenticatedMiddleware])
  .inputValidator(z.object({ flagKey: flagKeySchema }))
  .handler(async ({ data, context }) => {
    return isFeatureEnabledForUser(data.flagKey, context.user?.id ?? null);
  });

/**
 * Generic server function to get the enabled state of any feature flag.
 * Use this for new flags instead of creating individual server functions.
 */
export const getFeatureFlagEnabledFn = createServerFn({ method: "GET" })
  .middleware([unauthenticatedMiddleware])
  .inputValidator(z.object({ flagKey: flagKeySchema }))
  .handler(async ({ data }) => {
    return getFeatureFlagEnabledUseCase(data.flagKey);
  });

/**
 * Generic server function to toggle any feature flag.
 * Use this for new flags instead of creating individual server functions.
 */
export const toggleFeatureFlagFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ flagKey: flagKeySchema, enabled: z.boolean() }))
  .handler(async ({ data }) => {
    await toggleFeatureFlagUseCase(data.flagKey, data.enabled);
    return { success: true };
  });

/**
 * Get the affiliate commission rate from app settings (admin only).
 */
export const getAffiliateCommissionRateFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(z.void())
  .handler(async () => {
    return getAffiliateCommissionRateUseCase();
  });

/**
 * Get the affiliate commission rate (public - for onboarding page).
 */
export const getPublicAffiliateCommissionRateFn = createServerFn({ method: "GET" })
  .middleware([unauthenticatedMiddleware])
  .handler(async () => {
    return getAffiliateCommissionRateUseCase();
  });

/**
 * Set the affiliate commission rate in app settings.
 */
export const setAffiliateCommissionRateFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ rate: z.number().int().min(0).max(100) }))
  .handler(async ({ data }) => {
    await setAffiliateCommissionRateUseCase(data.rate);
    return { success: true };
  });

/**
 * Get the affiliate minimum payout from app settings (admin only).
 */
export const getAffiliateMinimumPayoutFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(z.void())
  .handler(async () => {
    return getAffiliateMinimumPayoutUseCase();
  });

/**
 * Get the affiliate minimum payout (public - for onboarding page).
 */
export const getPublicAffiliateMinimumPayoutFn = createServerFn({ method: "GET" })
  .middleware([unauthenticatedMiddleware])
  .handler(async () => {
    return getAffiliateMinimumPayoutUseCase();
  });

/**
 * Set the affiliate minimum payout in app settings.
 */
export const setAffiliateMinimumPayoutFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ amount: z.number().int().min(0) }))
  .handler(async ({ data }) => {
    await setAffiliateMinimumPayoutUseCase(data.amount);
    return { success: true };
  });

// ============================================
// Pricing Server Functions
// ============================================

/**
 * Get pricing settings (for purchase page).
 */
export const getPricingSettingsFn = createServerFn({ method: "GET" })
  .middleware([unauthenticatedMiddleware])
  .inputValidator(z.void())
  .handler(async () => {
    return getPricingSettingsUseCase();
  });

/**
 * Update pricing settings (admin only).
 */
export const updatePricingSettingsFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(
    z.object({
      currentPrice: z.number().int().min(0).optional(),
      originalPrice: z.number().int().min(0).optional(),
      promoLabel: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    await updatePricingSettingsUseCase(data);
    return { success: true };
  });
