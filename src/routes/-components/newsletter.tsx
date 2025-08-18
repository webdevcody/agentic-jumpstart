import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { env } from "~/utils/env";
import { Button } from "~/components/ui/button";
import { useNewsletterSubscription } from "~/hooks/use-newsletter-subscription";

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
  const { email, setEmail, isSubmitted, isLoading, handleSubmit } =
    useNewsletterSubscription();

  return (
    <section className="bg-theme-50 dark:bg-black py-12 border-t border-b border-theme-200 dark:border-theme-200">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-theme-500 to-theme-600 dark:from-theme-400 dark:to-theme-500 bg-clip-text text-transparent">
            /subscribe
          </h2>
          <p className="text-muted-foreground text-xl mb-8 max-w-2xl mx-auto">
            Join our community to receive early access to new content and
            special discounts reserved for subscribers.
          </p>

          {isSubmitted ? (
            <div className="max-w-xl mx-auto">
              <div className="bg-theme-100 dark:bg-theme-500/10 border border-theme-200 dark:border-theme-500/20 rounded-lg p-6">
                <h3 className="text-2xl font-semibold text-theme-600 dark:text-theme-400 mb-2">
                  Thank you for subscribing!
                </h3>
                <p className="text-muted-foreground">
                  We'll be in touch soon with updates and exclusive content.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 px-4 py-2 rounded-lg bg-background text-foreground border border-border focus:outline-none focus:border-theme-500"
                  required
                />
                <Button type="submit" className="h-12" disabled={isLoading}>
                  {isLoading ? "Subscribing..." : "Request access"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
