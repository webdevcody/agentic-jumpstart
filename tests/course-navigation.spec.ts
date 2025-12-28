import { test, expect } from "@playwright/test";
import { clearSession, createAndLoginAsNewRegularUser } from "./helpers/auth";
import { setEarlyAccessMode } from "./helpers/early-access";
import { clickWithRetry } from "./helpers/click-retry";
import { TEST_CONFIG } from "./setup/config";

test.describe.configure({ mode: "serial" });

test.describe("Course Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await setEarlyAccessMode(false);
  });

  test("A regular should should be able to navigate through the videos", async ({
    page,
  }) => {
    await createAndLoginAsNewRegularUser(page);
    await page.goto(`/learn/${TEST_CONFIG.SEGMENTS.WELCOME_TO_COURSE.slug}`);

    // verify the title of the page says "Welcome to the Course"
    // Note: segment title is in h2 (video-header), h1 is the site logo
    await expect(page.locator("h2")).toHaveText(
      TEST_CONFIG.SEGMENTS.WELCOME_TO_COURSE.title
    );

    // verify the correct module active
    const module = page.getByLabel(
      TEST_CONFIG.LABELS.TOGGLE_MODULE_GETTING_STARTED
    );
    await expect(module).toBeVisible();

    // verify the segment is visible
    const segment = page.getByLabel(TEST_CONFIG.LABELS.SELECT_SEGMENT_WELCOME);
    await expect(segment).toBeVisible();
    const segmentItem = page
      .locator(TEST_CONFIG.CSS_CLASSES.SEGMENT_ITEM)
      .filter({ has: segment });
    await expect(segmentItem).toHaveClass(
      TEST_CONFIG.CSS_CLASSES.SEGMENT_ACTIVE
    );

    // verify the next segment is visible
    const nextSegment = page.getByLabel(
      TEST_CONFIG.LABELS.SELECT_SEGMENT_SETUP
    );
    await expect(nextSegment).toBeVisible();
    // verify the play icon exists in the current segment (not yet completed)
    await expect(segmentItem.locator(".lucide-circle-play")).toBeVisible();

    await nextSegment.click();
    // Wait for title to change (more reliable than URL for React SPA)
    await expect(page.locator("h2")).toHaveText(
      TEST_CONFIG.SEGMENTS.SETTING_UP_ENVIRONMENT.title,
      { timeout: TEST_CONFIG.TIMEOUTS.ELEMENT_VISIBLE }
    );
    await expect(
      page
        .locator(TEST_CONFIG.CSS_CLASSES.SEGMENT_ITEM)
        .filter({ has: nextSegment })
    ).toHaveClass(TEST_CONFIG.CSS_CLASSES.SEGMENT_ACTIVE);

    // previous segment should not be active
    await expect(segmentItem).not.toHaveClass(
      TEST_CONFIG.CSS_CLASSES.SEGMENT_ACTIVE
    );

    // verify the title of the course changes to "Setting Up Your Environment"
    await expect(page.locator("h2")).toHaveText(
      TEST_CONFIG.SEGMENTS.SETTING_UP_ENVIRONMENT.title
    );

    // verify a user can click the back button to go back to the previous segment
    const backButton = page.getByRole("button", {
      name: TEST_CONFIG.UI_TEXT.PREVIOUS_LESSON_BUTTON,
    });
    // Wait for button to be enabled (indicates modules are loaded and previousSegment exists)
    await expect(backButton).toBeEnabled({ timeout: TEST_CONFIG.TIMEOUTS.ELEMENT_VISIBLE });

    // Click with retry for headless mode reliability
    await clickWithRetry(backButton, {
      type: "text",
      locator: page.locator("h2"),
      text: TEST_CONFIG.SEGMENTS.WELCOME_TO_COURSE.title,
    });

    // Verify URL updated as well
    await expect(page).toHaveURL(`/learn/${TEST_CONFIG.SEGMENTS.WELCOME_TO_COURSE.slug}`);

    // verify a user can click the next button to go to the next segment
    // Progress format is now "X/Y" instead of "X of Y completed"
    await expect(
      module.locator("span", { hasText: "0/3" })
    ).toBeVisible();
    const nextButton = page.getByRole("button", {
      name: TEST_CONFIG.UI_TEXT.NEXT_VIDEO_BUTTON,
    });
    await nextButton.click();
    await expect(page.locator("h2")).toHaveText(
      TEST_CONFIG.SEGMENTS.SETTING_UP_ENVIRONMENT.title
    );

    // verify the check icon exists in the previous segment (should be completed)
    await expect(segmentItem.locator(".lucide-check")).toBeVisible();

    // Verify that the progress indicator shows completion
    await expect(
      module.locator("span", { hasText: "1/3" })
    ).toBeVisible();
  });

  test("A non-premium user should NOT have premium videos marked as watched when clicking Next", async ({
    page,
  }) => {
    await createAndLoginAsNewRegularUser(page);

    // Navigate to the last free segment (Your First Project - last in Getting Started module)
    await page.goto(`/learn/${TEST_CONFIG.SEGMENTS.FIRST_PROJECT.slug}`);

    // Verify we're on the correct page
    await expect(page.locator("h2")).toHaveText(
      TEST_CONFIG.SEGMENTS.FIRST_PROJECT.title
    );

    // Get the Advanced Topics module to check progress
    const advancedModule = page.getByLabel(
      TEST_CONFIG.LABELS.TOGGLE_MODULE_ADVANCED_TOPICS
    );

    // Expand the Advanced Topics module to see progress
    await advancedModule.click();

    // Verify the advanced patterns segment shows the lock icon (premium indicator)
    const advancedPatternsSegment = page.getByLabel(
      TEST_CONFIG.LABELS.SELECT_SEGMENT_ADVANCED_PATTERNS
    );
    await expect(advancedPatternsSegment).toBeVisible();

    // Verify initial progress is 0/2 for Advanced Topics module
    await expect(
      advancedModule.locator("span", { hasText: "0/2" })
    ).toBeVisible();

    // Click the "Next Video" button - this should navigate to the next segment
    // but NOT mark the premium segment as watched for a non-premium user
    const nextButton = page.getByRole("button", {
      name: TEST_CONFIG.UI_TEXT.NEXT_VIDEO_BUTTON,
    });
    // Wait for button to be enabled (indicates React queries are complete)
    await expect(nextButton).toBeEnabled({ timeout: TEST_CONFIG.TIMEOUTS.ELEMENT_VISIBLE });

    // Click with retry for headless mode reliability
    await clickWithRetry(nextButton, {
      type: "text",
      locator: page.locator("h2"),
      text: TEST_CONFIG.SEGMENTS.ADVANCED_PATTERNS.title,
    });
    // Verify URL updated as well
    await expect(page).toHaveURL(`/learn/${TEST_CONFIG.SEGMENTS.ADVANCED_PATTERNS.slug}`);

    // Verify the progress for Advanced Topics module is still 0/2
    // The premium video should NOT have been marked as watched
    await expect(
      advancedModule.locator("span", { hasText: "0/2" })
    ).toBeVisible();

    // The segment item should NOT have a check icon
    const advancedPatternsSegmentItem = page
      .locator(TEST_CONFIG.CSS_CLASSES.SEGMENT_ITEM)
      .filter({ has: advancedPatternsSegment });
    await expect(advancedPatternsSegmentItem.locator(".lucide-check")).not.toBeVisible();
  });

  test("A user can manually mark a video as complete using the Mark as Complete button", async ({
    page,
  }) => {
    await createAndLoginAsNewRegularUser(page);

    // Navigate to Setting Up Your Environment segment
    await page.goto(`/learn/${TEST_CONFIG.SEGMENTS.SETTING_UP_ENVIRONMENT.slug}`);

    // Verify we're on the correct page
    await expect(page.locator("h2")).toHaveText(
      TEST_CONFIG.SEGMENTS.SETTING_UP_ENVIRONMENT.title
    );

    // Get the module to check progress
    const module = page.getByLabel(
      TEST_CONFIG.LABELS.TOGGLE_MODULE_GETTING_STARTED
    );
    await expect(module).toBeVisible();

    // Verify initial progress is 0/3
    await expect(
      module.locator("span", { hasText: "0/3" })
    ).toBeVisible();

    // Find the segment item for this segment
    const setupSegment = page.getByLabel(TEST_CONFIG.LABELS.SELECT_SEGMENT_SETUP);
    await expect(setupSegment).toBeVisible();

    const setupSegmentItem = page
      .locator(TEST_CONFIG.CSS_CLASSES.SEGMENT_ITEM)
      .filter({ has: setupSegment });

    // Verify the segment is not completed (should have play icon, not check icon)
    await expect(setupSegmentItem.locator(".lucide-circle-play")).toBeVisible();
    await expect(setupSegmentItem.locator(".lucide-check")).not.toBeVisible();

    // Click the "Mark as Complete" button in the video header
    const markCompleteButton = page.getByRole("button", { name: /mark as complete/i });
    await expect(markCompleteButton).toBeVisible();
    await markCompleteButton.click();

    // Verify the success toast appears
    await expect(page.getByText("Video marked as complete")).toBeVisible();

    // Verify the segment now shows the check icon (completed)
    await expect(setupSegmentItem.locator(".lucide-check")).toBeVisible();

    // Verify progress updated to 1/3
    await expect(
      module.locator("span", { hasText: "1/3" })
    ).toBeVisible();
  });
});
