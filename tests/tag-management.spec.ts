import { test, expect } from "@playwright/test";
import {
  createMockAdminSession,
  clearSession,
  createAndLoginAsNewRegularUser,
} from "./helpers/auth";
import { testDatabase } from "./helpers/database";
import {
  launchKits,
  launchKitTags,
  launchKitTagRelations,
  launchKitCategories,
} from "~/db/schema";
import { eq } from "drizzle-orm";

test.describe.configure({ mode: "serial" });

test.describe("Tag Management", () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    // Clear existing tags and launch kits for clean tests
    await testDatabase.delete(launchKitTagRelations);
    await testDatabase.delete(launchKitTags);
    await testDatabase.delete(launchKits);
    await testDatabase.delete(launchKitCategories);
  });

  test.describe("Admin Tag CRUD Operations", () => {
    test("Admin can create a new tag with name and color", async ({ page }) => {
      await createMockAdminSession(page);

      // Create a test launch kit first
      const [testKit] = await testDatabase
        .insert(launchKits)
        .values({
          name: "Test Kit",
          slug: "test-kit",
          description: "Test launch kit for tag testing",
          repositoryUrl: "https://github.com/test/test-kit",
          isActive: true,
        })
        .returning();

      await page.goto(`/admin/launch-kits/edit/${testKit.id}`);

      // Wait for the page to fully hydrate by waiting for the form
      await page.waitForLoadState('networkidle');

      // Wait for the page to load (form should be visible)
      await page.waitForSelector('[data-testid="new-tag-button"]', { state: "visible", timeout: 10000 });

      // Open tag creation dialog
      await page.click('[data-testid="new-tag-button"]');

      // Wait for dialog to appear (Radix portals to body)
      await page.waitForSelector('[role="dialog"]', { state: "visible", timeout: 10000 });

      // Wait for dialog form field to be ready
      await page.waitForSelector('[data-testid="tag-name-input"]', { state: "visible", timeout: 10000 });

      // Fill tag form
      await page.fill('[data-testid="tag-name-input"]', "React");
      await page.fill('[data-testid="tag-color-input"]', "#FF0000");

      // create a category
      await page.click('[data-testid="new-category-button"]');
      await page.fill('[data-testid="new-category-input"]', "Library");
      await page.click('[data-testid="add-category-button"]');

      // Submit form
      await page.click('[data-testid="create-tag-button"]');

      // Wait for the dialog to close and success toast
      await expect(
        page.getByRole("dialog", { name: /create new tag/i })
      ).toBeHidden();

      // Wait for the toast to appear
      await expect(page.getByText("Tag created successfully")).toBeVisible();

      // Verify the tag is created
      await expect(page.getByText("React")).toBeVisible();

      // Verify the tag is associated with the launch kit
      await page.click('[data-testid="tag-react"]');

      // Save the launch kit
      await page.click('[data-testid="save-launch-kit-button"]');

      // Wait for the toast to appear
      await expect(
        page.getByText("Launch kit updated successfully")
      ).toBeVisible();

      // Verify we're redirected back to the launch kits list
      await expect(page).toHaveURL("/admin/launch-kits");
    });

    test("Admin can randomize tag color", async ({ page }) => {
      await createMockAdminSession(page);

      const [testKit] = await testDatabase
        .insert(launchKits)
        .values({
          name: "Test Kit",
          slug: "test-kit",
          description: "Test launch kit",
          repositoryUrl: "https://github.com/test/test",
          isActive: true,
        })
        .returning();

      await page.goto(`/admin/launch-kits/edit/${testKit.id}`);

      // Wait for the page to fully hydrate
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('[data-testid="new-tag-button"]', { state: "visible", timeout: 10000 });

      await page.click('[data-testid="new-tag-button"]');

      // Wait for dialog to open (Radix portals to body)
      await page.waitForSelector('[role="dialog"]', { state: "visible", timeout: 10000 });
      await page.waitForSelector('input[type="color"]', { state: "visible", timeout: 10000 });

      // Get initial color value
      const initialColor = await page
        .locator('input[type="color"]')
        .inputValue();

      // Click randomize button
      await page.click('button[aria-label="Randomize color"]');

      // Verify color changed
      const newColor = await page.locator('input[type="color"]').inputValue();
      expect(newColor).not.toBe(initialColor);

      // Click again to verify it cycles through colors
      await page.click('button[aria-label="Randomize color"]');
      const thirdColor = await page.locator('input[type="color"]').inputValue();
      expect(thirdColor).not.toBe(newColor);
    });

    test("Admin can delete tag with confirmation", async ({ page }) => {
      await createMockAdminSession(page);

      const [category] = await testDatabase
        .insert(launchKitCategories)
        .values({
          name: "Other",
          slug: "other",
        })
        .returning();

      const [tagToDelete] = await testDatabase
        .insert(launchKitTags)
        .values({
          name: "Obsolete",
          slug: "obsolete",
          color: "#FF0000",
          categoryId: category.id,
        })
        .returning();

      const [testKit] = await testDatabase
        .insert(launchKits)
        .values({
          name: "Test Kit",
          slug: "test-kit",
          description: "Test launch kit",
          repositoryUrl: "https://github.com/test/test",
          isActive: true,
        })
        .returning();

      await page.goto(`/admin/launch-kits/edit/${testKit.id}`);

      // Wait for the page to fully hydrate
      await page.waitForLoadState('networkidle');

      // Click delete button for the tag
      await page.click(`button[aria-label="Delete tag Obsolete"]`);

      // Confirm deletion in dialog
      await expect(page.locator('text="Delete Tag"')).toBeVisible();
      await page.click('button:has-text("Delete")');

      // Verify tag was deleted from UI
      await expect(page.locator('text="Obsolete"')).not.toBeVisible();

      // Verify in database
      const remainingTags = await testDatabase
        .select()
        .from(launchKitTags)
        .where(eq(launchKitTags.id, tagToDelete.id));
      expect(remainingTags).toHaveLength(0);
    });
  });
});
