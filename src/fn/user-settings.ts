import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authenticatedMiddleware } from "~/lib/auth";
import {
  getUserEmailPreferences,
  createOrUpdateEmailPreferences,
} from "~/data-access/emails";
import { validateAndConsumeUnsubscribeToken } from "~/data-access/unsubscribe-tokens";

// Email preferences validation schema
const emailPreferencesSchema = z.object({
  allowCourseUpdates: z.boolean(),
  allowPromotional: z.boolean(),
});

// Get user email preferences
export const getUserEmailPreferencesFn = createServerFn({
  method: "GET",
})
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    try {
      return await getUserEmailPreferences(context.userId!);
    } catch (error) {
      console.error("Failed to get email preferences:", error);
      throw new Error("Failed to get email preferences");
    }
  });

// Update user email preferences
export const updateEmailPreferencesFn = createServerFn({
  method: "POST",
})
  .middleware([authenticatedMiddleware])
  .validator(emailPreferencesSchema)
  .handler(async ({ data, context }) => {
    try {
      await createOrUpdateEmailPreferences(context.userId!, data);
      return { success: true };
    } catch (error) {
      console.error("Failed to update email preferences:", error);
      throw new Error("Failed to update email preferences");
    }
  });

// Process unsubscribe token (no authentication required)
export const processUnsubscribeFn = createServerFn({
  method: "POST",
})
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    try {
      const tokenData = await validateAndConsumeUnsubscribeToken(data.token);

      if (!tokenData) {
        return {
          status: "error",
          message: "Invalid or expired unsubscribe token",
        };
      }

      // Disable marketing emails for this user
      await createOrUpdateEmailPreferences(tokenData.userId, {
        allowCourseUpdates: true, // Keep course updates enabled
        allowPromotional: false, // Disable marketing emails
      });

      return {
        status: "success",
        emailAddress: tokenData.emailAddress,
      };
    } catch (error) {
      console.error("Unsubscribe error:", error);
      return {
        status: "error",
        message: "An error occurred while processing your unsubscribe request",
      };
    }
  });
