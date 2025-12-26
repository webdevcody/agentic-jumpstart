import { createFileRoute } from "@tanstack/react-router";
import { setCookie, getCookie, deleteCookie } from "@tanstack/react-start/server";
import { stripe } from "~/lib/stripe";
import { assertAuthenticated } from "~/utils/session";
import { getAffiliateByUserId } from "~/data-access/affiliates";
import { env } from "~/utils/env";
import { generateCsrfState } from "~/utils/crypto";

const MAX_COOKIE_AGE_SECONDS = 60 * 10; // 10 minutes

/**
 * Stripe Connect OAuth refresh route.
 *
 * This route handles the case where a user exits the Stripe onboarding flow
 * before completing it. It regenerates a new onboarding link to allow them
 * to continue where they left off.
 *
 * Flow:
 * 1. Validates the CSRF state token (from the original initiation)
 * 2. Generates a new CSRF state token
 * 3. Stores new state and affiliate ID in cookies
 * 4. Generates a fresh Stripe account onboarding link
 * 5. Redirects back to Stripe onboarding
 *
 * @route GET /api/connect/stripe/refresh
 * @requires authentication
 * @redirects Stripe hosted onboarding page (retry)
 */
export const Route = createFileRoute("/api/connect/stripe/refresh/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
    const url = new URL(request.url);
    const incomingState = url.searchParams.get("state");
    const storedState = getCookie("stripe_connect_state") ?? null;

    // Validate CSRF state token (from the original request)
    if (!incomingState || !storedState || incomingState !== storedState) {
      // If state validation fails, redirect to start fresh
      return new Response(null, {
        status: 302,
        headers: { Location: "/api/connect/stripe" },
      });
    }

    // Clear old cookies
    deleteCookie("stripe_connect_state");
    deleteCookie("stripe_connect_affiliate_id");

    try {
      // Require authentication
      const user = await assertAuthenticated();

      // Get affiliate record for this user
      const affiliate = await getAffiliateByUserId(user.id);

      if (!affiliate) {
        return new Response("Affiliate account not found", { status: 404 });
      }

      if (!affiliate.stripeConnectAccountId) {
        // No Stripe account exists, redirect to initiation
        return new Response(null, {
          status: 302,
          headers: { Location: "/api/connect/stripe" },
        });
      }

      // Generate new CSRF state token for the retry
      const newState = generateCsrfState();

      // Store new state in HTTP-only cookie
      // Note: sameSite "lax" is required for OAuth flows - "strict" would block
      // cookies on the redirect back from Stripe (cross-site navigation)
      setCookie("stripe_connect_state", newState, {
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

      // Re-generate account onboarding link for the existing account
      const accountLink = await stripe.accountLinks.create({
        account: affiliate.stripeConnectAccountId,
        refresh_url: `${env.HOST_NAME}/api/connect/stripe/refresh?state=${newState}`,
        return_url: `${env.HOST_NAME}/api/connect/stripe/callback?state=${newState}`,
        type: "account_onboarding",
      });

      return Response.redirect(accountLink.url);
    } catch (error) {
      console.error("Stripe Connect refresh error:", error);
      return new Response("Failed to refresh Stripe Connect onboarding", {
        status: 500,
      });
    }
      },
    },
  },
});
