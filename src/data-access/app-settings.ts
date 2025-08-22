import { eq } from "drizzle-orm";
import { database } from "~/db";
import { appSettings } from "~/db/schema";
import { FLAGS } from "~/config";

export async function getAppSetting(key: string) {
  const result = await database
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .limit(1);

  return result[0] || null;
}

export async function setAppSetting(key: string, value: string) {
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
}

export async function getAllAppSettings() {
  return database.select().from(appSettings);
}

export async function isEarlyAccessMode() {
  const setting = await getAppSetting(FLAGS.EARLY_ACCESS_MODE);
  return setting?.value === "true";
}

export async function isAgentsFeatureEnabled() {
  const setting = await getAppSetting(FLAGS.AGENTS_FEATURE);
  return setting?.value === "true";
}

export async function isLaunchKitsFeatureEnabled() {
  const setting = await getAppSetting(FLAGS.LAUNCH_KITS_FEATURE);
  return setting?.value === "true";
}

export async function isAffiliatesFeatureEnabled() {
  const setting = await getAppSetting(FLAGS.AFFILIATES_FEATURE);
  return setting?.value === "true";
}
