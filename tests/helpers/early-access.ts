import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import pg from "pg";
import * as schema from "~/db/schema";

// Use DATABASE_URL_TEST directly to ensure we connect to the test database
// This bypasses the app's env.ts which may not have IS_TEST set in the test process
const connectionString =
  process.env.DATABASE_URL_TEST ||
  "postgresql://postgres:example@localhost:5433/postgres";

const pool = new pg.Pool({ connectionString });
const db = drizzle(pool, { schema });

const EARLY_ACCESS_MODE_KEY = "EARLY_ACCESS_MODE";

export async function setEarlyAccessMode(enabled: boolean) {
  await db
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
  const result = await db
    .select()
    .from(schema.appSettings)
    .where(eq(schema.appSettings.key, EARLY_ACCESS_MODE_KEY))
    .limit(1);

  return result[0]?.value === "true";
}
