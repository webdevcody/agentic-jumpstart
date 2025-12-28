import { test, expect } from "@playwright/test";
import {
  createMockAdminSession,
  clearSession,
  createAndLoginAsNewRegularUser,
} from "./helpers/auth";
import { testDatabase } from "./helpers/database";
import { clickWithRetry } from "./helpers/click-retry";
import { TEST_CONFIG } from "./setup/config";
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

      // Wait for form to be fully loaded (check for the form title)
      const newTagButton = page.locator('[data-testid="new-tag-button"]');
      await expect(newTagButton).toBeVisible({ timeout: TEST_CONFIG.TIMEOUTS.ELEMENT_VISIBLE });
      // Ensure button is enabled and ready for interaction
      await expect(newTagButton).toBeEnabled({ timeout: TEST_CONFIG.TIMEOUTS.ELEMENT_VISIBLE });

      // Open tag creation dialog with retry for headless mode reliability
      const dialog = page.getByRole("dialog");
      await clickWithRetry(newTagButton, { type: "visible", locator: dialog });

      // Wait for dialog form field to be ready
      const tagNameInput = page.locator('[data-testid="tag-name-input"]');
      await expect(tagNameInput).toBeVisible({ timeout: TEST_CONFIG.TIMEOUTS.ELEMENT_VISIBLE });

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

      // Wait for form to be fully loaded
      const newTagButton = page.locator('[data-testid="new-tag-button"]');
      await expect(newTagButton).toBeVisible({ timeout: TEST_CONFIG.TIMEOUTS.ELEMENT_VISIBLE });
      await expect(newTagButton).toBeEnabled({ timeout: TEST_CONFIG.TIMEOUTS.ELEMENT_VISIBLE });

      // Open tag creation dialog with retry for headless mode reliability
      const dialog = page.getByRole("dialog");
      await clickWithRetry(newTagButton, { type: "visible", locator: dialog });

      const colorInput = page.locator('input[type="color"]');
      await expect(colorInput).toBeVisible({ timeout: TEST_CONFIG.TIMEOUTS.ELEMENT_VISIBLE });

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

      // Wait for the delete button to be visible and enabled
      const deleteButton = page.locator(`button[aria-label="Delete tag Obsolete"]`);
      await expect(deleteButton).toBeVisible({ timeout: TEST_CONFIG.TIMEOUTS.ELEMENT_VISIBLE });
      await expect(deleteButton).toBeEnabled({ timeout: TEST_CONFIG.TIMEOUTS.ELEMENT_VISIBLE });

      // Click delete button with retry for headless mode reliability
      const deleteTagText = page.locator('text="Delete Tag"');
      await clickWithRetry(deleteButton, { type: "visible", locator: deleteTagText });
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
