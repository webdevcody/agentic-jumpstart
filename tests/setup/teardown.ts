import { closeTestDatabase } from "../helpers/database";

async function globalTeardown() {
  console.log("🧹 Cleaning up test database connections...");

  try {
    // Close the shared test database pool
    await closeTestDatabase();
    console.log("✅ Test database teardown complete!");
  } catch (error) {
    console.error("❌ Error during teardown:", error);
  }
}

export default globalTeardown;
