import { createServerFileRoute } from "@tanstack/react-start/server";
import { stripe } from "~/lib/stripe";
import { updateUserToPremiumUseCase } from "~/use-cases/users";
import { processAffiliateReferralUseCase } from "~/use-cases/affiliates";
import { env } from "~/utils/env";

const webhookSecret = env.STRIPE_WEBHOOK_SECRET!;

export const ServerRoute = createServerFileRoute("/api/stripe/webhook").methods(
  {
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

            if (userId) {
              await updateUserToPremiumUseCase(parseInt(userId));
              console.log(`Updated user ${userId} to premium status`);
              
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
                    console.log(`Processed affiliate referral for code ${affiliateCode}`);
                  }
                } catch (error) {
                  console.error("Failed to process affiliate referral:", error);
                  // Don't fail the webhook for affiliate errors
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
  }
);
