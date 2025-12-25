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

        // Log webhook receipt for debugging
        const userAgent = request.headers.get("user-agent") || "";
        const isStripeCLI = userAgent.includes("Stripe/1.");
        console.log("Webhook received:", {
          hasSignature: !!sig,
          payloadLength: payload.length,
          webhookSecretSet: !!webhookSecret,
          webhookSecretPrefix: webhookSecret?.substring(0, 10) + "...",
          source: isStripeCLI ? "Stripe CLI" : "Stripe Dashboard/API",
          userAgent: userAgent.substring(0, 50),
          url: request.url,
        });

        if (!sig) {
          console.error("Missing stripe-signature header");
          return new Response(
            JSON.stringify({ error: "Missing stripe-signature header" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        if (!webhookSecret) {
          console.error(
            "STRIPE_WEBHOOK_SECRET environment variable is not set"
          );
          return new Response(
            JSON.stringify({ error: "Webhook secret not configured" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        try {
          const event = stripe.webhooks.constructEvent(
            payload,
            sig,
            webhookSecret
          );

          console.log("Webhook event constructed successfully:", event.type);

          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object;
              const userId = session.metadata?.userId;
              const affiliateCode = session.metadata?.affiliateCode;
              const analyticsSessionId = session.metadata?.analyticsSessionId;
              const gclid = session.metadata?.gclid;

              if (userId) {
                await updateUserToPremiumUseCase(parseInt(userId));
                console.log(`Updated user ${userId} to premium status`);

                // Track purchase completion in analytics
                if (analyticsSessionId) {
                  try {
                    await trackAnalyticsEvent({
                      sessionId: analyticsSessionId,
                      eventType: "purchase_completed",
                      pagePath: "/success",
                      metadata: {
                        userId: parseInt(userId),
                        amount: session.amount_total,
                        stripeSessionId: session.id,
                        affiliateCode,
                        gclid,
                      },
                    });
                    console.log(
                      `Tracked purchase completion for analytics session ${analyticsSessionId}${gclid ? ` (Google Ads: ${gclid})` : ""}`
                    );
                  } catch (error) {
                    console.error(
                      "Failed to track purchase completion:",
                      error
                    );
                    // Don't fail the webhook for analytics errors
                  }
                } else {
                  console.warn(
                    `No analyticsSessionId found in Stripe metadata for user ${userId}. Purchase not tracked in analytics.`
                  );
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
                          error instanceof Error
                            ? error.message
                            : String(error),
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
          console.error("Webhook Error:", {
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
            errorType: err instanceof Error ? err.constructor.name : typeof err,
          });
          return new Response(
            JSON.stringify({
              error: "Webhook handler failed",
              message: err instanceof Error ? err.message : String(err),
            }),
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
