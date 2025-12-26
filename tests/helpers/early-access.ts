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
