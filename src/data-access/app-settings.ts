import { eq } from "drizzle-orm";
import { database } from "~/db";
import { appSettings } from "~/db/schema";
import { FLAGS, FALLBACK_CONFIG } from "~/config";

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
