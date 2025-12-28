import { expect, type Locator } from "@playwright/test";
import { TEST_CONFIG } from "../setup/config";

/**
 * Click an element and wait for an expected result, retrying if needed.
 * In headless mode, clicks on React buttons may not trigger handlers reliably.
 * This helper retries the click if the expected condition doesn't occur.
 */
export async function clickWithRetry(
  clickTarget: Locator,
  expectation: {
    type: "text";
    locator: Locator;
    text: string;
  } | {
    type: "visible";
    locator: Locator;
  }
): Promise<void> {
  const { TIMEOUTS } = TEST_CONFIG;
  let conditionMet = false;

  for (let attempt = 0; attempt < TIMEOUTS.MAX_RETRY_ATTEMPTS && !conditionMet; attempt++) {
    await clickTarget.click();
    try {
      if (expectation.type === "text") {
        await expect(expectation.locator).toHaveText(expectation.text, {
          timeout: TIMEOUTS.CLICK_RETRY,
        });
      } else {
        await expect(expectation.locator).toBeVisible({
          timeout: TIMEOUTS.CLICK_RETRY,
        });
      }
      conditionMet = true;
    } catch {
      // Condition not met, retry click
    }
  }

  // Final assertion with longer timeout for good error message
  if (expectation.type === "text") {
    await expect(expectation.locator).toHaveText(expectation.text, {
      timeout: TIMEOUTS.FINAL_ASSERTION,
    });
  } else {
    await expect(expectation.locator).toBeVisible({
      timeout: TIMEOUTS.FINAL_ASSERTION,
    });
  }
}
