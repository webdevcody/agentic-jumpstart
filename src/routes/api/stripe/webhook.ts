import { createFileRoute } from "@tanstack/react-router";
import { stripe } from "~/lib/stripe";
import { updateUserToPremiumUseCase } from "~/use-cases/users";
import { processAffiliateReferralUseCase } from "~/use-cases/affiliates";
import { env } from "~/utils/env";
import { trackAnalyticsEvent } from "~/data-access/analytics";

const webhookSecret = env.STRIPE_WEBHOOK_SECRET!;

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const sig = request.headers.get("stripe-signature");
        const payload = await request.text();

        try {
          const event = stripe.webhooks.constructEvent(
            payload,
            sig!,
            webhookSecret
          );

          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object;
              const userId = session.metadata?.userId;
              const affiliateCode = session.metadata?.affiliateCode;
              const analyticsSessionId = session.metadata?.analyticsSessionId;

              if (userId) {
                await updateUserToPremiumUseCase(parseInt(userId));
                console.log(`Updated user ${userId} to premium status`);

                // Track purchase completion in analytics
                if (analyticsSessionId) {
                  try {
                    await trackAnalyticsEvent({
                      sessionId: analyticsSessionId,
                      userId: parseInt(userId),
                      eventType: "purchase_completed",
                      pagePath: "/success",
                      metadata: {
                        amount: session.amount_total,
                        stripeSessionId: session.id,
                        affiliateCode,
                      },
                    });
                    console.log(
                      `Tracked purchase completion for analytics session ${analyticsSessionId}`
                    );
                  } catch (error) {
                    console.error("Failed to track purchase completion:", error);
                    // Don't fail the webhook for analytics errors
                  }
                }

                // Process affiliate referral if code exists
                if (affiliateCode && session.amount_total) {
                  try {
                    const referral = await processAffiliateReferralUseCase({
                      affiliateCode,
                      purchaserId: parseInt(userId),
                      stripeSessionId: session.id,
                      amount: session.amount_total,
                    });

                    if (referral) {
                      console.log(
                        `Successfully processed affiliate referral for code ${affiliateCode}, session ${session.id}, commission: $${referral.commission / 100}`
                      );
                    } else {
                      console.warn(
                        `Affiliate referral not processed for code ${affiliateCode}, session ${session.id} - likely duplicate, self-referral, or invalid code`
                      );
                    }
                  } catch (error) {
                    console.error(
                      `Failed to process affiliate referral for code ${affiliateCode}, session ${session.id}:`,
                      {
                        error:
                          error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined,
                        affiliateCode,
                        purchaserId: userId,
                        sessionId: session.id,
                        amount: session.amount_total,
                      }
                    );
                    // Don't fail the webhook for affiliate errors - user upgrade should succeed
                  }
                }
              }

              console.log("Payment successful:", session.id);
              break;
            }
          }

          return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Webhook Error:", err);
          return new Response(
            JSON.stringify({ error: "Webhook handler failed" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
