import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";
import { stripe } from "~/lib/stripe";
import { updateUserToPremiumUseCase } from "~/use-cases/users";
import {
  processAffiliateReferralUseCase,
  syncStripeAccountStatusUseCase,
} from "~/use-cases/affiliates";
import {
  getAffiliateByCode,
  getAffiliateByStripeSession,
  getPayoutByStripeTransferId,
  getAffiliateByStripeAccountIdWithUserEmail,
  updateAffiliatePayoutError,
} from "~/data-access/affiliates";
import { trackAnalyticsEvent } from "~/data-access/analytics";
import { sendAffiliatePayoutFailedEmail } from "~/utils/email";
import { logger } from "~/utils/logger";
import { env } from "~/utils/env";

// Map Stripe error codes/messages to user-friendly messages
function getUserFriendlyPayoutError(stripeError: string | undefined): string {
  if (!stripeError) {
    return "A payout error occurred. Please check your Stripe dashboard or contact support.";
  }

  const lowerError = stripeError.toLowerCase();

  if (lowerError.includes("insufficient_funds") || lowerError.includes("insufficient funds")) {
    return "Your connected account has insufficient funds";
  }
  if (lowerError.includes("account_restricted") || lowerError.includes("account restricted")) {
    return "Your Stripe account has restrictions that need to be resolved";
  }
  if (lowerError.includes("invalid_account") || lowerError.includes("invalid account")) {
    return "There's an issue with your connected account";
  }

  return "A payout error occurred. Please check your Stripe dashboard or contact support.";
}

const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
      const sig = request.headers.get("stripe-signature");

      if (!sig) {
        logger.error("Webhook Error: Missing stripe-signature header", { fn: "stripe-webhook" });
        return new Response(
          JSON.stringify({ error: "Missing stripe-signature header" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Validate webhook secret is configured
      if (!webhookSecret) {
        logger.error("Webhook Error: STRIPE_WEBHOOK_SECRET not configured", { fn: "stripe-webhook" });
        return new Response(
          JSON.stringify({ error: "Webhook secret not configured" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const payload = await request.text();

      // Verify webhook signature - return 400 on failure so Stripe doesn't retry with invalid signatures
      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(
          payload,
          sig,
          webhookSecret
        );
      } catch (signatureError) {
        logger.error("Webhook signature verification failed", {
          fn: "stripe-webhook",
          error: signatureError instanceof Error ? signatureError.message : String(signatureError),
        });
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Process the event - return 200 on errors to prevent Stripe from retrying
      // (we've already verified the webhook, so retrying won't help with processing errors)
      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object;

            // Idempotency check: skip if this session was already processed
            const existingReferral = await getAffiliateByStripeSession(session.id);
            if (existingReferral) {
              logger.info("Skipping already processed checkout session", {
                fn: "stripe-webhook",
                sessionId: session.id,
                existingReferralId: existingReferral.referral.id,
              });
              break;
            }

            const userId = session.metadata?.userId;
            const affiliateCode = session.metadata?.affiliateCode;
            const analyticsSessionId = session.metadata?.analyticsSessionId;

            if (userId) {
              await updateUserToPremiumUseCase(parseInt(userId));
              logger.info("Updated user to premium status", { fn: "stripe-webhook", userId });
              
              // Track purchase completion in analytics
              if (analyticsSessionId) {
                try {
                  await trackAnalyticsEvent({
                    sessionId: analyticsSessionId,
                    userId: parseInt(userId),
                    eventType: 'purchase_completed',
                    pagePath: '/success',
                    metadata: {
                      amount: session.amount_total,
                      stripeSessionId: session.id,
                      affiliateCode,
                    },
                  });
                  logger.info("Tracked purchase completion", { fn: "stripe-webhook", analyticsSessionId });
                } catch (error) {
                  logger.error("Failed to track purchase completion", {
                    fn: "stripe-webhook",
                    error: error instanceof Error ? error.message : String(error),
                  });
                  // Don't fail the webhook for analytics errors
                }
              }
              
              // Process affiliate referral if code exists
              if (affiliateCode && session.amount_total) {
                try {
                  // Get frozen rates from checkout metadata for audit trail
                  // commissionRate = effective rate (originalRate - discountRate)
                  const frozenCommissionRate = session.metadata?.commissionRate
                    ? parseInt(session.metadata.commissionRate, 10)
                    : undefined;
                  const frozenDiscountRate = session.metadata?.discountRate
                    ? parseInt(session.metadata.discountRate, 10)
                    : undefined;
                  const frozenOriginalCommissionRate = session.metadata?.originalCommissionRate
                    ? parseInt(session.metadata.originalCommissionRate, 10)
                    : undefined;

                  // Check if affiliate has Stripe Connect enabled (transfer_data was used)
                  const affiliate = await getAffiliateByCode(affiliateCode);
                  const isAutoTransfer = !!(affiliate?.stripeConnectAccountId && affiliate?.stripePayoutsEnabled);

                  const referral = await processAffiliateReferralUseCase({
                    affiliateCode,
                    purchaserId: parseInt(userId),
                    stripeSessionId: session.id,
                    amount: session.amount_total,
                    frozenCommissionRate,
                    frozenDiscountRate,
                    frozenOriginalCommissionRate,
                    isAutoTransfer, // If true, Stripe handles transfer via transfer_data
                  });

                  if (referral) {
                    logger.info("Successfully processed affiliate referral", {
                      fn: "stripe-webhook",
                      affiliateCode,
                      sessionId: session.id,
                      commission: referral.commission / 100,
                      isAutoTransfer,
                    });
                  } else {
                    logger.warn("Affiliate referral not processed", {
                      fn: "stripe-webhook",
                      affiliateCode,
                      sessionId: session.id,
                      reason: "likely duplicate, self-referral, or invalid code",
                    });
                  }
                } catch (error) {
                  logger.error("Failed to process affiliate referral", {
                    fn: "stripe-webhook",
                    affiliateCode,
                    purchaserId: userId,
                    sessionId: session.id,
                    amount: session.amount_total,
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                  });
                  // Don't fail the webhook for affiliate errors - user upgrade should succeed
                }
              }
            }

            logger.info("Payment successful", { fn: "stripe-webhook", sessionId: session.id });
            break;
          }

          // Handle Stripe Connect account updates
          case "account.updated": {
            const account = event.data.object;
            logger.info("Stripe Connect account updated", { fn: "stripe-webhook", accountId: account.id });

            try {
              const result = await syncStripeAccountStatusUseCase(account.id);
              if (result.success) {
                logger.info("Successfully synced Stripe account", {
                  fn: "stripe-webhook",
                  accountId: account.id,
                  payoutsEnabled: account.payouts_enabled,
                  chargesEnabled: account.charges_enabled,
                });
              } else {
                logger.warn("Could not sync Stripe account", {
                  fn: "stripe-webhook",
                  accountId: account.id,
                  error: result.error,
                });
              }
            } catch (error) {
              logger.error("Error syncing Stripe account", {
                fn: "stripe-webhook",
                accountId: account.id,
                error: error instanceof Error ? error.message : String(error),
              });
              // Don't fail webhook for sync errors
            }
            break;
          }

          // Handle transfer creation (transfer initiated but funds not yet arrived)
          case "transfer.created": {
            const transfer = event.data.object;
            logger.info("Stripe transfer initiated (pending)", {
              fn: "stripe-webhook",
              transferId: transfer.id,
              amount: transfer.amount / 100,
              destination: transfer.destination,
            });

            // Log transfer details for auditing
            const metadata = transfer.metadata || {};
            if (metadata.affiliateId) {
              logger.info("Transfer initiated for affiliate", {
                fn: "stripe-webhook",
                transferId: transfer.id,
                affiliateId: metadata.affiliateId,
                affiliateCode: metadata.affiliateCode,
              });
            }
            break;
          }

          default: {
            // Handle transfer.paid, transfer.failed and other events that may not be in the type definitions
            // Cast to string to allow comparison with event types not in Stripe's type definitions
            const eventType: string = event.type;

            // Handle transfer.paid - confirms funds have arrived at destination
            if (eventType === "transfer.paid") {
              const transfer = event.data.object as Stripe.Transfer;

              logger.info("Stripe transfer paid", {
                fn: "stripe-webhook",
                transferId: transfer.id,
                amount: transfer.amount / 100,
                destination: transfer.destination,
              });

              // Log confirmation for affiliate transfers
              const metadata = transfer.metadata || {};
              if (metadata.affiliateId) {
                logger.info("Transfer funds arrived for affiliate", {
                  fn: "stripe-webhook",
                  transferId: transfer.id,
                  affiliateId: metadata.affiliateId,
                  affiliateCode: metadata.affiliateCode,
                });
              }
            }

            // Handle transfer.failed
            if (eventType === "transfer.failed") {
              const transfer = event.data.object as Stripe.Transfer;
              // Note: failure_message is available on Transfer objects in failed state
              const transferWithFailure = transfer as Stripe.Transfer & { failure_message?: string };
              logger.error("Stripe transfer failed", {
                fn: "stripe-webhook",
                transferId: transfer.id,
                amount: transfer.amount / 100,
                destination: transfer.destination,
              });

              // Extract raw error message from transfer for logging
              const rawErrorMessage = transferWithFailure.failure_message || "Transfer failed - unknown reason";
              // Convert to user-friendly message for storage and emails
              const userFriendlyError = getUserFriendlyPayoutError(transferWithFailure.failure_message);

              // Log error details for admin notification (with raw error for debugging)
              const metadata = transfer.metadata || {};
              if (metadata.affiliateId) {
                logger.error("Failed transfer was for affiliate", {
                  fn: "stripe-webhook",
                  transferId: transfer.id,
                  affiliateId: metadata.affiliateId,
                  affiliateCode: metadata.affiliateCode,
                  rawError: rawErrorMessage,
                  note: "Manual intervention may be required",
                });
              }

              // Try to get affiliate by destination (Stripe Connect account ID) and save the error
              try {
                const destination = transfer.destination;
                if (typeof destination === "string") {
                  const affiliate = await getAffiliateByStripeAccountIdWithUserEmail(destination);
                  if (affiliate) {
                    // Save user-friendly error to affiliate record
                    await updateAffiliatePayoutError(
                      affiliate.id,
                      userFriendlyError,
                      new Date()
                    );
                    logger.info("Saved payout error for affiliate", {
                      fn: "stripe-webhook",
                      affiliateId: affiliate.id,
                      userFriendlyError,
                      rawError: rawErrorMessage,
                    });

                    // Send failure notification email with user-friendly message
                    if (affiliate.userEmail) {
                      const failureDate = new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });
                      await sendAffiliatePayoutFailedEmail(affiliate.userEmail, {
                        affiliateName: affiliate.userName || "Affiliate Partner",
                        errorMessage: userFriendlyError,
                        failureDate,
                      });
                      logger.info("Sent payout failure email", {
                        fn: "stripe-webhook",
                        affiliateId: affiliate.id,
                      });
                    }
                  }
                }
              } catch (error) {
                logger.error("Error saving payout error to affiliate", {
                  fn: "stripe-webhook",
                  error: error instanceof Error ? error.message : String(error),
                });
              }

              // Check if we have a payout record for this transfer
              try {
                const existingPayout = await getPayoutByStripeTransferId(transfer.id);
                if (existingPayout) {
                  logger.error("Payout record exists for failed transfer", {
                    fn: "stripe-webhook",
                    payoutId: existingPayout.id,
                    transferId: transfer.id,
                    note: "Admin should review and potentially reverse",
                  });
                }
              } catch (error) {
                logger.error("Error checking payout record for failed transfer", {
                  fn: "stripe-webhook",
                  error: error instanceof Error ? error.message : String(error),
                });
              }
            }
            break;
          }
        }

        return new Response(JSON.stringify({ received: true }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (processingError) {
        // Log the error but return 200 to acknowledge receipt
        // Returning non-2xx would cause Stripe to retry, but since we've verified
        // the signature, the issue is likely with our processing logic
        logger.error("Webhook processing error", {
          fn: "stripe-webhook",
          eventType: event.type,
          error: processingError instanceof Error ? processingError.message : String(processingError),
          stack: processingError instanceof Error ? processingError.stack : undefined,
        });
        return new Response(
          JSON.stringify({ received: true, processingError: true }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      },
    },
  },
});
