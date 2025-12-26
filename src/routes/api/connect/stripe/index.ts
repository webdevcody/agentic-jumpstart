import { createFileRoute } from "@tanstack/react-router";
import { setCookie } from "@tanstack/react-start/server";
import { stripe } from "~/lib/stripe";
import { assertAuthenticated } from "~/utils/session";
import {
  getAffiliateByUserId,
  updateAffiliateStripeAccount,
  isConnectAttemptRateLimited,
  recordConnectAttempt,
} from "~/data-access/affiliates";
import { env } from "~/utils/env";
import { StripeAccountStatus } from "~/utils/stripe-status";
import { generateCsrfState } from "~/utils/crypto";

const MAX_COOKIE_AGE_SECONDS = 60 * 10; // 10 minutes

/**
 * Stripe Connect OAuth initiation route.
 *
 * This route initiates the Stripe Connect onboarding flow for affiliates who want
 * to receive automatic payouts via Stripe.
 *
 * Flow:
 * 1. Authenticates the user and verifies they are an affiliate
 * 2. Generates a CSRF state token and stores it in HTTP-only cookies
 * 3. Creates a Stripe Express account if one doesn't exist
 * 4. Generates a Stripe account onboarding link
 * 5. Redirects the user to Stripe's hosted onboarding flow
 *
 * Security:
 * - CSRF protection via state parameter stored in HTTP-only cookie (10 min expiration)
 * - Affiliate ID stored in cookie for validation on callback
 *
 * @route GET /api/connect/stripe
 * @requires authentication
 * @redirects Stripe hosted onboarding page
 */
export const Route = createFileRoute("/api/connect/stripe/")({
  server: {
    handlers: {
      GET: async () => {
    // Require authentication
    const user = await assertAuthenticated();

    // Get affiliate record for this user
    const affiliate = await getAffiliateByUserId(user.id);

    if (!affiliate) {
      return new Response("Affiliate account not found", { status: 404 });
    }

    // Check rate limiting (3 attempts per hour)
    // const isRateLimited = await isConnectAttemptRateLimited(affiliate.id);
    // if (isRateLimited) {
    //   return new Response(
    //     "Too many Stripe Connect attempts. Please try again later.",
    //     { status: 429 }
    //   );
    // }

    // Record this attempt for rate limiting
    await recordConnectAttempt(affiliate.id);

    // Generate CSRF state token
    const state = generateCsrfState();

    // Store state in HTTP-only cookie for CSRF protection
    // Note: sameSite "lax" is required for OAuth flows - "strict" would block
    // cookies on the redirect back from Stripe (cross-site navigation)
    setCookie("stripe_connect_state", state, {
      path: "/",
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_COOKIE_AGE_SECONDS,
    });

    // Store affiliate ID in cookie for callback
    setCookie("stripe_connect_affiliate_id", String(affiliate.id), {
      path: "/",
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_COOKIE_AGE_SECONDS,
    });

    try {
      let accountId = affiliate.stripeConnectAccountId;

      // Create Stripe Express account if not exists
      if (!accountId) {
        const account = await stripe.accounts.create({
          type: "express",
          email: user.email ?? undefined,
          metadata: {
            affiliateId: String(affiliate.id),
            userId: String(user.id),
          },
        });
        accountId = account.id;

        // Update affiliate with the new account ID
        await updateAffiliateStripeAccount(affiliate.id, {
          stripeConnectAccountId: accountId,
          stripeAccountStatus: StripeAccountStatus.ONBOARDING,
        });
      }

      // Generate account onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${env.HOST_NAME}/api/connect/stripe/refresh?state=${state}`,
        return_url: `${env.HOST_NAME}/api/connect/stripe/callback?state=${state}`,
        type: "account_onboarding",
      });

      return Response.redirect(accountLink.url);
    } catch (error) {
      console.error("Stripe Connect account creation error:", error);
      return new Response("Failed to initiate Stripe Connect onboarding", {
        status: 500,
      });
    }
      },
    },
  },
});
