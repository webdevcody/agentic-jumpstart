import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { env } from "~/utils/env";
import { NewsletterForm } from "./newsletter-form";

declare global {
  interface Window {
    grecaptcha: any;
  }
}

export const subscribeFn = createServerFn()
  .validator(z.object({ email: z.email(), recaptchaToken: z.string() }))
  .handler(async ({ data }) => {
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
      throw new Error("invalid recaptcha token");
    }

    if (json.score < 0.5) {
      throw new Error("recaptcha score too low");
    }

    // Store in our database instead of external service
    const { subscribeToNewsletterFn } = await import("~/fn/newsletter");
    await subscribeToNewsletterFn({
      data: {
        email: data.email,
        recaptchaToken: data.recaptchaToken,
        subscriptionType: "newsletter",
        source: "newsletter_section",
      },
    });
  });

export function NewsletterSection() {
  return (
    <section className="relative py-16 md:py-20 overflow-hidden">
      {/* AI-themed background similar to hero */}
      <div className="absolute inset-0 hero-background-ai"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-theme-500/5 dark:via-theme-950/20 to-transparent"></div>

      {/* Circuit pattern overlay */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="circuit-pattern absolute inset-0"></div>
      </div>

      {/* Floating elements for visual appeal */}
      <div className="floating-elements">
        <div className="floating-element-small top-10 right-10"></div>
        <div className="floating-element-small bottom-10 left-10"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header with improved typography */}
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-theme-500 to-theme-600 dark:from-theme-400 dark:to-theme-500 bg-clip-text text-transparent">
              /subscribe
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl mb-4 max-w-2xl mx-auto">
              Stay ahead of the agentic coding revolution
            </p>
            <p className="text-muted-foreground text-base max-w-3xl mx-auto">
              Get weekly insights on new AI coding tools, advanced Claude Code
              techniques, Cursor IDE tips, and exclusive updates on agentic
              programming patterns. Join thousands of developers transforming
              their workflow with AI-first development.
            </p>
          </div>

          {/* Use the refactored NewsletterForm component */}
          <NewsletterForm showStats={false} />

          {/* Trust indicators - moved outside the form component */}
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-theme-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>No spam ever</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-theme-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Unsubscribe anytime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade with theme accent - matching hero */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      <div className="section-divider-glow-bottom"></div>
    </section>
  );
}
