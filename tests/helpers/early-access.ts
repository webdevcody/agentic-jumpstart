import { eq } from "drizzle-orm";
import * as schema from "~/db/schema";
import { testDatabase } from "./database";

const EARLY_ACCESS_MODE_KEY = "EARLY_ACCESS_MODE";

export async function setEarlyAccessMode(enabled: boolean) {
  await testDatabase
    .insert(schema.appSettings)
    .values({
      key: EARLY_ACCESS_MODE_KEY,
      value: enabled.toString(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.appSettings.key,
      set: {
        value: enabled.toString(),
        updatedAt: new Date(),
      },
    });
}

export async function getEarlyAccessMode(): Promise<boolean> {
  const result = await testDatabase
    .select()
    .from(schema.appSettings)
    .where(eq(schema.appSettings.key, EARLY_ACCESS_MODE_KEY))
    .limit(1);

  return result[0]?.value === "true";
}
