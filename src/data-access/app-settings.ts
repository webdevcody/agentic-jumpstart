import { eq } from "drizzle-orm";
import { database } from "~/db";
import { appSettings } from "~/db/schema";
import { FLAGS, FALLBACK_CONFIG, TARGET_MODES, type FlagKey, APP_SETTING_KEYS, AFFILIATE_CONFIG, PRICING_CONFIG } from "~/config";
import { getFeatureFlagTarget, getFeatureFlagUser } from "./feature-flags";
import { getUser } from "./users";

export async function getAppSetting(key: string) {
  try {
    const result = await database
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error(`Error getting app setting ${key}:`, error);
    return null;
  }
}

export async function setAppSetting(key: string, value: string) {
  try {
    await database
      .insert(appSettings)
      .values({
        key,
        value,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: {
          value,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error(`Error setting app setting ${key}:`, error);
    throw error;
  }
}

export async function getAllAppSettings() {
  try {
    return database.select().from(appSettings);
  } catch (error) {
    console.error("Error getting all app settings:", error);
    return [];
  }
}

export async function isEarlyAccessMode() {
  try {
    const setting = await getAppSetting(FLAGS.EARLY_ACCESS_MODE);
    return setting?.value === "true";
  } catch (error) {
    console.error("Error checking early access mode:", error);
    return FALLBACK_CONFIG.EARLY_ACCESS_MODE;
  }
}

export async function isAgentsFeatureEnabled() {
  try {
    const setting = await getAppSetting(FLAGS.AGENTS_FEATURE);
    return setting?.value === "true";
  } catch (error) {
    console.error("Error checking agents feature:", error);
    return FALLBACK_CONFIG.AGENTS_FEATURE;
  }
}

export async function isLaunchKitsFeatureEnabled() {
  try {
    const setting = await getAppSetting(FLAGS.LAUNCH_KITS_FEATURE);
    return setting?.value === "true";
  } catch (error) {
    console.error("Error checking launch kits feature:", error);
    return FALLBACK_CONFIG.LAUNCH_KITS_FEATURE;
  }
}

export async function isAffiliatesFeatureEnabled() {
  try {
    const setting = await getAppSetting(FLAGS.AFFILIATES_FEATURE);
    return setting?.value === "true";
  } catch (error) {
    console.error("Error checking affiliates feature:", error);
    return FALLBACK_CONFIG.AFFILIATES_FEATURE;
  }
}

export async function isBlogFeatureEnabled() {
  try {
    const setting = await getAppSetting(FLAGS.BLOG_FEATURE);
    return setting?.value === "true";
  } catch (error) {
    console.error("Error checking blog feature:", error);
    return FALLBACK_CONFIG.BLOG_FEATURE;
  }
}

export async function isNewsFeatureEnabled() {
  try {
    const setting = await getAppSetting(FLAGS.NEWS_FEATURE);
    return setting?.value === "true";
  } catch (error) {
    console.error("Error checking news feature:", error);
    return FALLBACK_CONFIG.NEWS_FEATURE;
  }
}

export async function isVideoSegmentContentTabsEnabled() {
  try {
    const setting = await getAppSetting(FLAGS.VIDEO_SEGMENT_CONTENT_TABS);
    return setting?.value === "true";
  } catch (error) {
    console.error("Error checking video segment content tabs feature:", error);
    return FALLBACK_CONFIG.VIDEO_SEGMENT_CONTENT_TABS;
  }
}

/**
 * Generic function to check if any feature flag is enabled.
 * Use this for new flags instead of creating individual functions.
 */
export async function isFeatureFlagEnabled(flagKey: FlagKey): Promise<boolean> {
  try {
    const setting = await getAppSetting(flagKey);
    return setting?.value === "true";
  } catch (error) {
    console.error(`Error checking feature flag ${flagKey}:`, error);
    return FALLBACK_CONFIG[flagKey] ?? false;
  }
}

export async function isFeatureEnabledForUser(
  flagKey: FlagKey,
  userId: number | null
): Promise<boolean> {
  try {
    const setting = await getAppSetting(flagKey);
    const baseEnabled = setting?.value === "true";

    if (!userId) return baseEnabled;

    const user = await getUser(userId);
    if (user?.isAdmin) return true;

    const targeting = await getFeatureFlagTarget(flagKey);
    if (!targeting || targeting.targetMode === TARGET_MODES.ALL) {
      return baseEnabled;
    }

    // baseEnabled acts as a global kill switch - if disabled, targeting cannot override
    if (!baseEnabled) {
      return false;
    }

    // When baseEnabled is true, targeting narrows access to specific user groups
    if (targeting.targetMode === TARGET_MODES.PREMIUM) {
      return user?.isPremium ?? false;
    }

    if (targeting.targetMode === TARGET_MODES.NON_PREMIUM) {
      return !(user?.isPremium ?? false);
    }

    if (targeting.targetMode === TARGET_MODES.CUSTOM) {
      const userTarget = await getFeatureFlagUser(flagKey, userId);
      return userTarget?.enabled ?? false;
    }

    return baseEnabled;
  } catch (error) {
    console.error(`Error checking feature ${flagKey} for user ${userId}:`, error);
    return false;
  }
}

/**
 * Get the affiliate commission rate from app settings.
 * Returns the rate as an integer percentage (e.g., 30 for 30%).
 */
export async function getAffiliateCommissionRate(): Promise<number> {
  try {
    const setting = await getAppSetting(APP_SETTING_KEYS.AFFILIATE_COMMISSION_RATE);
    if (setting?.value) {
      const rate = parseInt(setting.value, 10);
      if (!isNaN(rate) && rate >= 0 && rate <= 100) {
        return rate;
      }
    }
    return AFFILIATE_CONFIG.DEFAULT_COMMISSION_RATE;
  } catch (error) {
    console.error("Error getting affiliate commission rate:", error);
    return AFFILIATE_CONFIG.DEFAULT_COMMISSION_RATE;
  }
}

/**
 * Set the affiliate commission rate in app settings.
 * @param rate - Integer percentage (0-100)
 */
export async function setAffiliateCommissionRate(rate: number): Promise<void> {
  if (rate < 0 || rate > 100) {
    throw new Error("Commission rate must be between 0 and 100");
  }
  await setAppSetting(APP_SETTING_KEYS.AFFILIATE_COMMISSION_RATE, rate.toString());
}

/**
 * Get the affiliate minimum payout from app settings.
 * Returns the amount in cents.
 */
export async function getAffiliateMinimumPayout(): Promise<number> {
  try {
    const setting = await getAppSetting(APP_SETTING_KEYS.AFFILIATE_MINIMUM_PAYOUT);
    if (setting?.value) {
      const amount = parseInt(setting.value, 10);
      if (!isNaN(amount) && amount >= 0) {
        return amount;
      }
    }
    return AFFILIATE_CONFIG.DEFAULT_MINIMUM_PAYOUT;
  } catch (error) {
    console.error("Error getting affiliate minimum payout:", error);
    return AFFILIATE_CONFIG.DEFAULT_MINIMUM_PAYOUT;
  }
}

/**
 * Set the affiliate minimum payout in app settings.
 * @param amount - Amount in cents (must be >= 0)
 */
export async function setAffiliateMinimumPayout(amount: number): Promise<void> {
  if (amount < 0) {
    throw new Error("Minimum payout must be >= 0");
  }
  await setAppSetting(APP_SETTING_KEYS.AFFILIATE_MINIMUM_PAYOUT, amount.toString());
}

// ============================================
// Pricing Settings
// ============================================

/**
 * Get current price from app settings (in dollars).
 * Falls back to PRICING_CONFIG.CURRENT_PRICE if not set.
 */
export async function getPricingCurrentPrice(): Promise<number> {
  try {
    const setting = await getAppSetting(APP_SETTING_KEYS.PRICING_CURRENT_PRICE);
    if (setting?.value) {
      const price = parseInt(setting.value, 10);
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
    return PRICING_CONFIG.CURRENT_PRICE;
  } catch (error) {
    console.error("Error getting current price:", error);
    return PRICING_CONFIG.CURRENT_PRICE;
  }
}

/**
 * Set current price in app settings (in dollars).
 */
export async function setPricingCurrentPrice(price: number): Promise<void> {
  if (price < 0) {
    throw new Error("Price must be >= 0");
  }
  await setAppSetting(APP_SETTING_KEYS.PRICING_CURRENT_PRICE, price.toString());
}

/**
 * Get original/regular price from app settings (in dollars).
 * Falls back to PRICING_CONFIG.ORIGINAL_PRICE if not set.
 */
export async function getPricingOriginalPrice(): Promise<number> {
  try {
    const setting = await getAppSetting(APP_SETTING_KEYS.PRICING_ORIGINAL_PRICE);
    if (setting?.value) {
      const price = parseInt(setting.value, 10);
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
    return PRICING_CONFIG.ORIGINAL_PRICE;
  } catch (error) {
    console.error("Error getting original price:", error);
    return PRICING_CONFIG.ORIGINAL_PRICE;
  }
}

/**
 * Set original/regular price in app settings (in dollars).
 */
export async function setPricingOriginalPrice(price: number): Promise<void> {
  if (price < 0) {
    throw new Error("Price must be >= 0");
  }
  await setAppSetting(APP_SETTING_KEYS.PRICING_ORIGINAL_PRICE, price.toString());
}

/**
 * Get promo label from app settings.
 * Falls back to "Limited Time Offer" if not set.
 */
export async function getPricingPromoLabel(): Promise<string> {
  try {
    const setting = await getAppSetting(APP_SETTING_KEYS.PRICING_PROMO_LABEL);
    if (setting?.value) {
      return setting.value;
    }
    return "Limited Time Offer";
  } catch (error) {
    console.error("Error getting promo label:", error);
    return "Limited Time Offer";
  }
}

/**
 * Set promo label in app settings.
 * Pass empty string to hide the promo label.
 */
export async function setPricingPromoLabel(label: string): Promise<void> {
  await setAppSetting(APP_SETTING_KEYS.PRICING_PROMO_LABEL, label);
}

/**
 * Get all pricing settings at once.
 */
export async function getPricingSettings(): Promise<{
  currentPrice: number;
  originalPrice: number;
  promoLabel: string;
}> {
  const [currentPrice, originalPrice, promoLabel] = await Promise.all([
    getPricingCurrentPrice(),
    getPricingOriginalPrice(),
    getPricingPromoLabel(),
  ]);
  return { currentPrice, originalPrice, promoLabel };
}
