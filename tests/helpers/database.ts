import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "~/db/schema";
import dotenv from "dotenv";
import path from "path";

// Load test environment variables (must use .env.test for correct DATABASE_URL_TEST)
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

// Create test database connection without strict env validation
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL_TEST,
});

export const testDatabase = drizzle(pool, { schema });

export async function closeTestDatabase() {
  await pool.end();
}
