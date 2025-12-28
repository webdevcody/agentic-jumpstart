import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import * as schema from "~/db/schema";
import { sql } from "drizzle-orm";
import path from "path";
import dotenv from "dotenv";
import { TEST_CONFIG } from "./config";

// Load test environment variables (must use .env.test for correct DATABASE_URL_TEST)
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

async function globalSetup() {
  console.log("🔧 Setting up test database...");

  // Create a connection to the test database (uses DATABASE_URL_TEST or fallback 5433)
  const connectionString =
    process.env.DATABASE_URL_TEST ||
    "postgresql://postgres:example@localhost:5433/postgres";
  console.log("📍 Using connection:", connectionString);

  const pool = new pg.Pool({
    connectionString,
  });

  const db = drizzle(pool, { schema });

  try {
    // 1. Clear all tables (in correct order to respect foreign keys)
    console.log("📦 Clearing test database...");

    // Try to truncate tables, but don't fail if they don't exist
    // Truncate all tables in the current schema (public) except for migration tables
    try {
      // Get all table names except for drizzle migrations
      const tablesResult = await db.execute(
        sql`
          SELECT tablename
          FROM pg_tables
          WHERE schemaname = 'public'
            AND tablename NOT IN ('_drizzle_migrations')
        `
      );
      const tableNames = tablesResult.rows.map((row: any) => row.tablename);
      if (tableNames.length > 0) {
        // Build a TRUNCATE statement for all tables
        const truncateSql = sql.raw(
          `TRUNCATE TABLE ${tableNames.map((t) => `"${t}"`).join(", ")} CASCADE`
        );
        await db.execute(truncateSql);
        console.log("   All tables truncated successfully");
      } else {
        console.log("   No tables found to truncate");
      }
    } catch (err) {
      console.log("   Error truncating tables, continuing...", err);
    }

    // 2. Run migrations
    console.log("🚀 Running migrations...");
    const migrationsFolder = path.join(process.cwd(), "drizzle");
    await migrate(db, { migrationsFolder });

    // 3. Seed initial data
    console.log("🌱 Seeding test data...");

    // Create admin user
    const [adminUser] = await db
      .insert(schema.users)
      .values({
        email: TEST_CONFIG.USERS.ADMIN.email,
        isAdmin: true,
        isPremium: true,
        emailVerified: new Date(),
      })
      .returning();

    // Create regular user
    const [regularUser] = await db
      .insert(schema.users)
      .values({
        email: TEST_CONFIG.USERS.REGULAR.email,
        isAdmin: false,
        isPremium: false,
        emailVerified: new Date(),
      })
      .returning();

    // Create profiles for users
    await db.insert(schema.profiles).values([
      {
        userId: adminUser.id,
        displayName: "Test Admin",
        bio: "Test admin user",
      },
      {
        userId: regularUser.id,
        displayName: "Test User",
        bio: "Test regular user",
      },
    ]);

    // Create test modules
    const [module1] = await db
      .insert(schema.modules)
      .values({
        title: TEST_CONFIG.MODULES.GETTING_STARTED,
        order: 1,
      })
      .returning();

    const [module2] = await db
      .insert(schema.modules)
      .values({
        title: TEST_CONFIG.MODULES.ADVANCED_TOPICS,
        order: 2,
      })
      .returning();

    // Create test segments for the first module
    await db.insert(schema.segments).values([
      {
        slug: TEST_CONFIG.SEGMENTS.WELCOME_TO_COURSE.slug,
        title: TEST_CONFIG.SEGMENTS.WELCOME_TO_COURSE.title,
        content: "This is the welcome segment content",
        transcripts: "Welcome to our course! This is the first video.",
        order: 1,
        length: "5:00",
        isPremium: false,
        isComingSoon: false,
        moduleId: module1.id,
        videoKey: "welcome-video",
      },
      {
        slug: TEST_CONFIG.SEGMENTS.SETTING_UP_ENVIRONMENT.slug,
        title: TEST_CONFIG.SEGMENTS.SETTING_UP_ENVIRONMENT.title,
        content: "Learn how to set up your development environment",
        transcripts: "Let's set up your development environment step by step.",
        order: 2,
        length: "10:00",
        isPremium: false,
        isComingSoon: false,
        moduleId: module1.id,
        videoKey: "setup-video",
      },
      {
        slug: TEST_CONFIG.SEGMENTS.FIRST_PROJECT.slug,
        title: TEST_CONFIG.SEGMENTS.FIRST_PROJECT.title,
        content: "Create your first project with our framework",
        transcripts: "Time to create your first project!",
        order: 3,
        length: "15:00",
        isPremium: false,
        isComingSoon: false,
        moduleId: module1.id,
        videoKey: "first-project-video",
      },
    ]);

    // Create test segments for the second module
    await db.insert(schema.segments).values([
      {
        slug: TEST_CONFIG.SEGMENTS.ADVANCED_PATTERNS.slug,
        title: TEST_CONFIG.SEGMENTS.ADVANCED_PATTERNS.title,
        content: "Learn advanced design patterns",
        transcripts: "Let's explore advanced patterns.",
        order: 1,
        length: "20:00",
        isPremium: true,
        isComingSoon: false,
        moduleId: module2.id,
        videoKey: "advanced-patterns-video",
      },
      {
        slug: TEST_CONFIG.SEGMENTS.PERFORMANCE_OPTIMIZATION.slug,
        title: TEST_CONFIG.SEGMENTS.PERFORMANCE_OPTIMIZATION.title,
        content: "Optimize your application performance",
        transcripts: "Performance optimization techniques.",
        order: 2,
        length: "25:00",
        isPremium: true,
        isComingSoon: false,
        moduleId: module2.id,
        videoKey: "performance-video",
      },
    ]);

    console.log("✅ Test database setup complete!");
    console.log(
      `   - Created 2 users (admin: ${adminUser.id}, regular: ${regularUser.id})`
    );
    console.log(`   - Created 2 modules`);
    console.log(`   - Created 5 segments`);
  } catch (error) {
    console.error("❌ Error setting up test database:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

export default globalSetup;
