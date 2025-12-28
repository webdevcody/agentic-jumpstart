import {
  getAllAppSettings,
  setAppSetting,
  isEarlyAccessMode as checkEarlyAccessMode,
  isAgentsFeatureEnabled as checkAgentsFeatureEnabled,
  isLaunchKitsFeatureEnabled as checkLaunchKitsFeatureEnabled,
  isAffiliatesFeatureEnabled as checkAffiliatesFeatureEnabled,
  isBlogFeatureEnabled as checkBlogFeatureEnabled,
  isNewsFeatureEnabled as checkNewsFeatureEnabled,
  isVideoSegmentContentTabsEnabled as checkVideoSegmentContentTabsEnabled,
  isFeatureFlagEnabled,
  getAffiliateCommissionRate as getCommissionRateFromDb,
  setAffiliateCommissionRate as setCommissionRateInDb,
  getAffiliateMinimumPayout as getMinimumPayoutFromDb,
  setAffiliateMinimumPayout as setMinimumPayoutInDb,
  getPricingSettings as getPricingSettingsFromDb,
  setPricingCurrentPrice as setCurrentPriceInDb,
  setPricingOriginalPrice as setOriginalPriceInDb,
  setPricingPromoLabel as setPromoLabelInDb,
} from "~/data-access/app-settings";
import { type FlagKey } from "~/config";

export async function getAppSettingsUseCase() {
  const settings = await getAllAppSettings();

  // Transform into a more usable format
  return settings.reduce(
    (acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    },
    {} as Record<string, string>
  );
}

export async function getEarlyAccessModeUseCase() {
  return checkEarlyAccessMode();
}

export async function toggleEarlyAccessModeUseCase(enabled: boolean) {
  await setAppSetting("EARLY_ACCESS_MODE", enabled.toString());
}

export async function getAgentsFeatureEnabledUseCase() {
  return checkAgentsFeatureEnabled();
}

export async function toggleAgentsFeatureUseCase(enabled: boolean) {
  await setAppSetting("AGENTS_FEATURE", enabled.toString());
}

export async function getLaunchKitsFeatureEnabledUseCase() {
  return checkLaunchKitsFeatureEnabled();
}

export async function toggleLaunchKitsFeatureUseCase(enabled: boolean) {
  await setAppSetting("LAUNCH_KITS_FEATURE", enabled.toString());
}

export async function getAffiliatesFeatureEnabledUseCase() {
  return checkAffiliatesFeatureEnabled();
}

export async function toggleAffiliatesFeatureUseCase(enabled: boolean) {
  await setAppSetting("AFFILIATES_FEATURE", enabled.toString());
}

export async function getBlogFeatureEnabledUseCase() {
  return checkBlogFeatureEnabled();
}

export async function toggleBlogFeatureUseCase(enabled: boolean) {
  await setAppSetting("BLOG_FEATURE", enabled.toString());
}

export async function getNewsFeatureEnabledUseCase() {
  return checkNewsFeatureEnabled();
}

export async function toggleNewsFeatureUseCase(enabled: boolean) {
  await setAppSetting("NEWS_FEATURE", enabled.toString());
}

export async function getVideoSegmentContentTabsEnabledUseCase() {
  return checkVideoSegmentContentTabsEnabled();
}

export async function toggleVideoSegmentContentTabsUseCase(enabled: boolean) {
  await setAppSetting("VIDEO_SEGMENT_CONTENT_TABS", enabled.toString());
}

/**
 * Generic function to get the enabled state of any feature flag.
 * Use this for new flags instead of creating individual use-case functions.
 */
export async function getFeatureFlagEnabledUseCase(flagKey: FlagKey) {
  return isFeatureFlagEnabled(flagKey);
}

/**
 * Generic function to toggle any feature flag.
 * Use this for new flags instead of creating individual use-case functions.
 */
export async function toggleFeatureFlagUseCase(flagKey: FlagKey, enabled: boolean) {
  await setAppSetting(flagKey, enabled.toString());
}

/**
 * Get the affiliate commission rate from app settings.
 * Returns the rate as an integer percentage (e.g., 30 for 30%).
 */
export async function getAffiliateCommissionRateUseCase(): Promise<number> {
  return getCommissionRateFromDb();
}

/**
 * Set the affiliate commission rate in app settings.
 * @param rate - Integer percentage (0-100)
 */
export async function setAffiliateCommissionRateUseCase(rate: number): Promise<void> {
  return setCommissionRateInDb(rate);
}

/**
 * Get the affiliate minimum payout from app settings.
 * Returns the amount in cents.
 */
export async function getAffiliateMinimumPayoutUseCase(): Promise<number> {
  return getMinimumPayoutFromDb();
}

/**
 * Set the affiliate minimum payout in app settings.
 * @param amount - Amount in cents (must be >= 0)
 */
export async function setAffiliateMinimumPayoutUseCase(amount: number): Promise<void> {
  return setMinimumPayoutInDb(amount);
}

// ============================================
// Pricing Use Cases
// ============================================

/**
 * Get all pricing settings at once.
 */
export async function getPricingSettingsUseCase(): Promise<{
  currentPrice: number;
  originalPrice: number;
  promoLabel: string;
}> {
  return getPricingSettingsFromDb();
}

/**
 * Update pricing settings.
 */
export async function updatePricingSettingsUseCase(settings: {
  currentPrice?: number;
  originalPrice?: number;
  promoLabel?: string;
}): Promise<void> {
  const updates: Promise<void>[] = [];

  if (settings.currentPrice !== undefined) {
    updates.push(setCurrentPriceInDb(settings.currentPrice));
  }
  if (settings.originalPrice !== undefined) {
    updates.push(setOriginalPriceInDb(settings.originalPrice));
  }
  if (settings.promoLabel !== undefined) {
    updates.push(setPromoLabelInDb(settings.promoLabel));
  }

  await Promise.all(updates);
}
