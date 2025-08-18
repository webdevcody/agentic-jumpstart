import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { env } from "~/utils/env";
import {
  createNewsletterSignup,
  getNewsletterSignupByEmail,
  updateNewsletterSignup,
  getNewsletterSignupsCount,
} from "~/data-access/newsletter";

const newsletterSubscribeSchema = z.object({
  email: z.email("Please enter a valid email address"),
  recaptchaToken: z.string(),
  subscriptionType: z.enum(["newsletter", "waitlist"]).default("newsletter"),
  source: z.string().default("early_access"),
});

export const subscribeToNewsletterFn = createServerFn()
  .validator(newsletterSubscribeSchema)
  .handler(async ({ data }) => {
    // Verify reCAPTCHA
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${env.RECAPTCHA_SECRET_KEY}&response=${data.recaptchaToken}`,
      }
    );
    const json = (await response.json()) as {
      success: boolean;
      score: number;
    };

    if (!json.success) {
      throw new Error("Invalid reCAPTCHA token");
    }

    if (json.score < 0.5) {
      throw new Error("reCAPTCHA score too low");
    }

    // Check if email already exists
    const existingSignup = await getNewsletterSignupByEmail(data.email);
    
    if (existingSignup) {
      // Update existing signup if needed
      await updateNewsletterSignup(data.email, {
        subscriptionType: data.subscriptionType,
        source: data.source,
      });
    } else {
      // Create new signup
      await createNewsletterSignup({
        email: data.email,
        subscriptionType: data.subscriptionType,
        source: data.source,
        isVerified: true, // Auto-verify since they passed reCAPTCHA
      });
    }

    return { success: true };
  });

export const getNewsletterStatsFn = createServerFn().handler(async () => {
  try {
    const stats = await getNewsletterSignupsCount();
    return stats;
  } catch (error) {
    console.error("Failed to get newsletter stats:", error);
    throw new Error("Failed to get newsletter stats");
  }
});