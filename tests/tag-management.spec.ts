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

      // Open tag creation dialog
      await page.click('[data-testid="new-tag-button"]');

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
      await page.click('button:has-text("New Tag")');

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

    test("Admin can create a new category inline", async ({ page }) => {
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
      await page.click('button:has-text("New Tag")');

      // Click to open category dropdown
      await page.click('[role="combobox"]');

      // Click "Create new category" option
      await page.click('[role="option"]:has-text("Create new category")');

      // Enter new category name
      await page.fill(
        'input[placeholder="Enter category name"]',
        "Testing Tools"
      );
      await page.click('button:has-text("Add Category")');

      // Verify category is selected
      await expect(page.locator('[role="combobox"]')).toContainText(
        "Testing Tools"
      );

      // Complete tag creation
      await page.fill('input[id="tag-name"]', "Jest");
      await page.click('button:has-text("Create Tag")');

      // Verify tag was created with new category
      const tags = await testDatabase.select().from(launchKitTags);
      expect(tags).toHaveLength(1);
      expect(tags[0].category).toBe("testing-tools");
    });

    test("Admin can rename existing tag", async ({ page }) => {
      await createMockAdminSession(page);

      // Create initial tag
      const [existingTag] = await testDatabase
        .insert(launchKitTags)
        .values({
          name: "Vue",
          slug: "vue",
          color: "#4FC08D",
          category: "framework",
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

      // Find and click edit button for the tag
      await page.click(`button[aria-label="Edit tag Vue"]`);

      // Update tag name
      await page.fill('input[id="tag-name"]', "Vue.js");
      await page.click('button:has-text("Update Tag")');

      // Verify tag was renamed
      await expect(page.locator('text="Vue.js"')).toBeVisible();
      await expect(page.locator('text="Vue"')).not.toBeVisible();

      // Verify in database
      const updatedTag = await testDatabase
        .select()
        .from(launchKitTags)
        .where(eq(launchKitTags.id, existingTag.id));
      expect(updatedTag[0].name).toBe("Vue.js");
    });

    test("Admin can rename existing category", async ({ page }) => {
      await createMockAdminSession(page);
      await createMockAdminSession(page);

      // Create tags with category
      await testDatabase.insert(launchKitTags).values([
        { name: "React", slug: "react", category: "frontend" },
        { name: "Vue", slug: "vue", category: "frontend" },
      ]);

      await page.goto("/admin/launch-kits/tags");

      // Click category settings
      await page.click('button[aria-label="Category settings for frontend"]');

      // Click rename option
      await page.click('button:has-text("Rename Category")');

      // Enter new name
      await page.fill(
        'input[placeholder="Enter new category name"]',
        "Frontend Frameworks"
      );
      await page.click('button:has-text("Rename")');

      // Verify category was renamed
      await expect(page.locator('text="Frontend Frameworks"')).toBeVisible();

      // Verify all tags in category were updated
      const tags = await testDatabase
        .select()
        .from(launchKitTags)
        .where(eq(launchKitTags.category, "frontend-frameworks"));
      expect(tags).toHaveLength(2);
    });

    test("Admin can delete tag with confirmation", async ({ page }) => {
      await createMockAdminSession(page);

      const [tagToDelete] = await testDatabase
        .insert(launchKitTags)
        .values({
          name: "Obsolete",
          slug: "obsolete",
          color: "#FF0000",
          category: "other",
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

      // Click delete button for the tag
      await page.click(`button[aria-label="Delete tag Obsolete"]`);

      // Confirm deletion in dialog
      await expect(page.locator('text="Delete Tag"')).toBeVisible();
      await expect(
        page.locator('text="Are you sure you want to delete"')
      ).toBeVisible();
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

    test("Prevents deletion of tags in use", async ({ page }) => {
      await createMockAdminSession(page);

      const [tag] = await testDatabase
        .insert(launchKitTags)
        .values({
          name: "InUse",
          slug: "inuse",
          color: "#00FF00",
          category: "tool",
        })
        .returning();

      const [kit] = await testDatabase
        .insert(launchKits)
        .values({
          name: "Kit Using Tag",
          slug: "kit-using-tag",
          description: "Test kit",
          repositoryUrl: "https://github.com/test/test",
          isActive: true,
        })
        .returning();

      // Associate tag with kit
      await testDatabase.insert(launchKitTagRelations).values({
        launchKitId: kit.id,
        tagId: tag.id,
      });

      await page.goto(`/admin/launch-kits/edit/${kit.id}`);

      // Try to delete tag in use
      await page.click(`button[aria-label="Delete tag InUse"]`);

      // Should show warning
      await expect(page.locator('text="Tag is in use"')).toBeVisible();
      await expect(
        page.locator(
          'text="This tag is currently associated with 1 launch kit"'
        )
      ).toBeVisible();
    });
  });

  test.describe("Starter Kit Integration", () => {
    test("Admin can attach multiple tags to launch kit", async ({ page }) => {
      await createMockAdminSession(page);

      // Create test tags
      const tags = await testDatabase
        .insert(launchKitTags)
        .values([
          { name: "React", slug: "react", category: "framework" },
          { name: "TypeScript", slug: "typescript", category: "language" },
          { name: "PostgreSQL", slug: "postgresql", category: "database" },
        ])
        .returning();

      // Navigate to create launch kit page
      await page.goto("/admin/launch-kits/create");

      // Fill basic info
      await page.fill('input[name="name"]', "Full Stack App");
      await page.fill(
        'textarea[name="description"]',
        "A complete full stack application"
      );
      await page.fill(
        'input[name="repositoryUrl"]',
        "https://github.com/test/fullstack"
      );

      // Select tags
      await page.check(`input[id="tag-${tags[0].id}"]`);
      await page.check(`input[id="tag-${tags[1].id}"]`);
      await page.check(`input[id="tag-${tags[2].id}"]`);

      // Save launch kit
      await page.click('button:has-text("Create Launch Kit")');

      // Verify tags are associated
      const relations = await testDatabase.select().from(launchKitTagRelations);
      expect(relations).toHaveLength(3);
    });

    test("Admin can detach tags from launch kit", async ({ page }) => {
      await createMockAdminSession(page);

      const [tag1, tag2] = await testDatabase
        .insert(launchKitTags)
        .values([
          { name: "Docker", slug: "docker", category: "deployment" },
          { name: "Kubernetes", slug: "kubernetes", category: "deployment" },
        ])
        .returning();

      const [kit] = await testDatabase
        .insert(launchKits)
        .values({
          name: "Containerized App",
          slug: "containerized-app",
          description: "Docker-based application",
          repositoryUrl: "https://github.com/test/container",
          isActive: true,
        })
        .returning();

      // Associate both tags
      await testDatabase.insert(launchKitTagRelations).values([
        { launchKitId: kit.id, tagId: tag1.id },
        { launchKitId: kit.id, tagId: tag2.id },
      ]);

      await page.goto(`/admin/launch-kits/edit/${kit.id}`);

      // Uncheck one tag
      await page.uncheck(`input[id="tag-${tag1.id}"]`);

      // Save changes
      await page.click('button:has-text("Update Launch Kit")');

      // Verify only one tag remains associated
      const relations = await testDatabase
        .select()
        .from(launchKitTagRelations)
        .where(eq(launchKitTagRelations.launchKitId, kit.id));
      expect(relations).toHaveLength(1);
      expect(relations[0].tagId).toBe(tag2.id);
    });
  });

  test.describe("User-Facing Features", () => {
    test("Users can see tags on launch kit cards", async ({ page }) => {
      // Create tags and kit
      const [reactTag, tsTag] = await testDatabase
        .insert(launchKitTags)
        .values([
          {
            name: "React",
            slug: "react",
            color: "#61DAFB",
            category: "framework",
          },
          {
            name: "TypeScript",
            slug: "typescript",
            color: "#3178C6",
            category: "language",
          },
        ])
        .returning();

      const [kit] = await testDatabase
        .insert(launchKits)
        .values({
          name: "React TypeScript Starter",
          slug: "react-ts-starter",
          description: "Modern React app with TypeScript",
          repositoryUrl: "https://github.com/test/react-ts",
          isActive: true,
        })
        .returning();

      await testDatabase.insert(launchKitTagRelations).values([
        { launchKitId: kit.id, tagId: reactTag.id },
        { launchKitId: kit.id, tagId: tsTag.id },
      ]);

      // Visit launch kits page as regular user
      await createAndLoginAsNewRegularUser(page);
      await page.goto("/launch-kits");

      // Verify tags are displayed on card
      const kitCard = page.locator(`[data-kit-id="${kit.id}"]`);
      await expect(kitCard.locator('text="React"')).toBeVisible();
      await expect(kitCard.locator('text="TypeScript"')).toBeVisible();

      // Verify tag colors are applied
      const reactBadge = kitCard.locator('[data-tag="react"]');
      await expect(reactBadge).toHaveCSS("border-color", "rgb(97, 218, 251)");
    });

    test("Users can search launch kits by tags", async ({ page }) => {
      // Create multiple kits with different tags
      const [reactTag, vueTag, nodeTag] = await testDatabase
        .insert(launchKitTags)
        .values([
          { name: "React", slug: "react", category: "framework" },
          { name: "Vue", slug: "vue", category: "framework" },
          { name: "Node.js", slug: "nodejs", category: "runtime" },
        ])
        .returning();

      const [reactKit, vueKit, fullStackKit] = await testDatabase
        .insert(launchKits)
        .values([
          {
            name: "React App",
            slug: "react-app",
            description: "React starter",
            repositoryUrl: "https://github.com/test/react",
            isActive: true,
          },
          {
            name: "Vue App",
            slug: "vue-app",
            description: "Vue starter",
            repositoryUrl: "https://github.com/test/vue",
            isActive: true,
          },
          {
            name: "Full Stack",
            slug: "full-stack",
            description: "Full stack app",
            repositoryUrl: "https://github.com/test/full",
            isActive: true,
          },
        ])
        .returning();

      await testDatabase.insert(launchKitTagRelations).values([
        { launchKitId: reactKit.id, tagId: reactTag.id },
        { launchKitId: vueKit.id, tagId: vueTag.id },
        { launchKitId: fullStackKit.id, tagId: reactTag.id },
        { launchKitId: fullStackKit.id, tagId: nodeTag.id },
      ]);

      await page.goto("/launch-kits");

      // Search by tag name
      await page.fill('input[placeholder="Search launch kits..."]', "React");
      await page.waitForTimeout(500); // Wait for debounce

      // Should show React App and Full Stack, but not Vue App
      await expect(
        page.locator('[data-kit-id="' + reactKit.id + '"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-kit-id="' + fullStackKit.id + '"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-kit-id="' + vueKit.id + '"]')
      ).not.toBeVisible();
    });

    test("Users can filter by multiple tags", async ({ page }) => {
      const [reactTag, tsTag, dockerTag] = await testDatabase
        .insert(launchKitTags)
        .values([
          { name: "React", slug: "react", category: "framework" },
          { name: "TypeScript", slug: "typescript", category: "language" },
          { name: "Docker", slug: "docker", category: "deployment" },
        ])
        .returning();

      const [kit1, kit2, kit3] = await testDatabase
        .insert(launchKits)
        .values([
          {
            name: "React TS",
            slug: "react-ts",
            description: "React with TypeScript",
            repositoryUrl: "https://github.com/test/1",
            isActive: true,
          },
          {
            name: "React Docker",
            slug: "react-docker",
            description: "React with Docker",
            repositoryUrl: "https://github.com/test/2",
            isActive: true,
          },
          {
            name: "Full Stack",
            slug: "full-stack",
            description: "All technologies",
            repositoryUrl: "https://github.com/test/3",
            isActive: true,
          },
        ])
        .returning();

      await testDatabase.insert(launchKitTagRelations).values([
        { launchKitId: kit1.id, tagId: reactTag.id },
        { launchKitId: kit1.id, tagId: tsTag.id },
        { launchKitId: kit2.id, tagId: reactTag.id },
        { launchKitId: kit2.id, tagId: dockerTag.id },
        { launchKitId: kit3.id, tagId: reactTag.id },
        { launchKitId: kit3.id, tagId: tsTag.id },
        { launchKitId: kit3.id, tagId: dockerTag.id },
      ]);

      await page.goto("/launch-kits");

      // Filter by React and TypeScript
      await page.check('input[data-tag-filter="react"]');
      await page.check('input[data-tag-filter="typescript"]');

      // Should show only kits with both tags
      await expect(
        page.locator('[data-kit-id="' + kit1.id + '"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-kit-id="' + kit3.id + '"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-kit-id="' + kit2.id + '"]')
      ).not.toBeVisible();
    });
  });

  test.describe("Data Validation", () => {
    test("Tag names must be unique", async ({ page }) => {
      await createMockAdminSession(page);

      // Create existing tag
      await testDatabase.insert(launchKitTags).values({
        name: "React",
        slug: "react",
        category: "framework",
      });

      const [kit] = await testDatabase
        .insert(launchKits)
        .values({
          name: "Test Kit",
          slug: "test-kit",
          description: "Test",
          repositoryUrl: "https://github.com/test/test",
          isActive: true,
        })
        .returning();

      await page.goto(`/admin/launch-kits/edit/${kit.id}`);
      await page.click('button:has-text("New Tag")');

      // Try to create duplicate tag
      await page.fill('input[id="tag-name"]', "React");
      await page.click('button:has-text("Create Tag")');

      // Should show error
      await expect(
        page.locator('text="A tag with this name already exists"')
      ).toBeVisible();
    });

    test("Tag names have min/max length constraints", async ({ page }) => {
      await createMockAdminSession(page);

      const [kit] = await testDatabase
        .insert(launchKits)
        .values({
          name: "Test Kit",
          slug: "test-kit",
          description: "Test",
          repositoryUrl: "https://github.com/test/test",
          isActive: true,
        })
        .returning();

      await page.goto(`/admin/launch-kits/edit/${kit.id}`);
      await page.click('button:has-text("New Tag")');

      // Try too short name
      await page.fill('input[id="tag-name"]', "A");
      await page.click('button:has-text("Create Tag")');
      await expect(
        page.locator('text="Tag name must be at least 2 characters"')
      ).toBeVisible();

      // Try too long name
      await page.fill('input[id="tag-name"]', "A".repeat(31));
      await page.click('button:has-text("Create Tag")');
      await expect(
        page.locator('text="Tag name must be at most 30 characters"')
      ).toBeVisible();
    });

    test("Colors must be valid hex codes", async ({ page }) => {
      await createMockAdminSession(page);

      const [kit] = await testDatabase
        .insert(launchKits)
        .values({
          name: "Test Kit",
          slug: "test-kit",
          description: "Test",
          repositoryUrl: "https://github.com/test/test",
          isActive: true,
        })
        .returning();

      await page.goto(`/admin/launch-kits/edit/${kit.id}`);
      await page.click('button:has-text("New Tag")');

      await page.fill('input[id="tag-name"]', "Test Tag");

      // Try invalid hex code
      await page.fill('input[type="text"][placeholder="#3B82F6"]', "invalid");
      await page.click('button:has-text("Create Tag")');

      await expect(
        page.locator('text="Please enter a valid hex color code"')
      ).toBeVisible();
    });
  });
});
