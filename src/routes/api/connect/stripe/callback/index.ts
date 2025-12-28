import { createFileRoute } from "@tanstack/react-router";
import { getCookie, deleteCookie } from "@tanstack/react-start/server";
import { stripe } from "~/lib/stripe";
import { assertAuthenticated } from "~/utils/session";
import {
  getAffiliateByUserId,
  updateAffiliateStripeAccount,
} from "~/data-access/affiliates";
import { determineStripeAccountStatus } from "~/utils/stripe-status";
import { timingSafeStringEqual } from "~/utils/crypto";

const AFTER_CONNECT_URL = "/affiliate-dashboard";
const ONBOARDING_COMPLETE_URL = "/affiliate-onboarding?step=complete";

/**
 * Stripe Connect OAuth callback route.
 *
 * This route handles the return flow after a user completes (or exits) the
 * Stripe Connect onboarding process.
 *
 * Flow:
 * 1. Validates the CSRF state token against the stored cookie
 * 2. Clears the state and affiliate ID cookies
 * 3. Authenticates the user and retrieves their affiliate record
 * 4. Retrieves the Stripe account status from Stripe API
 * 5. Determines the account status (active/pending/restricted/onboarding)
 * 6. Updates the affiliate record in the database
 * 7. Redirects to the affiliate dashboard
 *
 * Security:
 * - CSRF validation via state parameter comparison
 * - Double verification of affiliate ID
 * - Re-authentication required
 *
 * @route GET /api/connect/stripe/callback
 * @requires authentication
 * @redirects /affiliate-dashboard
 */
export const Route = createFileRoute("/api/connect/stripe/callback/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
    const url = new URL(request.url);
    const state = url.searchParams.get("state");
    const storedState = getCookie("stripe_connect_state") ?? null;
    const storedAffiliateId = getCookie("stripe_connect_affiliate_id") ?? null;
    const onboardingInProgress = getCookie("affiliate_onboarding") ?? null;

    // Validate CSRF state token using timing-safe comparison
    // Clear cookies on validation failure to prevent reuse
    if (!timingSafeStringEqual(state, storedState)) {
      deleteCookie("stripe_connect_state");
      deleteCookie("stripe_connect_affiliate_id");
      if (onboardingInProgress) {
        deleteCookie("affiliate_onboarding");
      }
      return new Response("Invalid state parameter", { status: 400 });
    }

    // Helper to clear all OAuth cookies
    const clearOAuthCookies = () => {
      deleteCookie("stripe_connect_state");
      deleteCookie("stripe_connect_affiliate_id");
      if (onboardingInProgress) {
        deleteCookie("affiliate_onboarding");
      }
    };

    try {
      // Require authentication
      const user = await assertAuthenticated();

      // Get affiliate record for this user
      const affiliate = await getAffiliateByUserId(user.id);

      if (!affiliate) {
        // Don't clear cookies - allow retry
        return new Response("Affiliate account not found", { status: 404 });
      }

      // Verify affiliate ID matches (extra security)
      if (storedAffiliateId && String(affiliate.id) !== storedAffiliateId) {
        // Security violation - clear cookies to prevent reuse
        clearOAuthCookies();
        return new Response("Affiliate mismatch", { status: 403 });
      }

      if (!affiliate.stripeConnectAccountId) {
        // Don't clear cookies - allow retry
        return new Response("Stripe Connect account not found", { status: 404 });
      }

      // Retrieve account status from Stripe
      const account = await stripe.accounts.retrieve(
        affiliate.stripeConnectAccountId
      );

      // Determine account status based on Stripe account state
      const stripeAccountStatus = determineStripeAccountStatus(account);

      // Update database with account status
      await updateAffiliateStripeAccount(affiliate.id, {
        stripeAccountStatus,
        stripeChargesEnabled: account.charges_enabled ?? false,
        stripePayoutsEnabled: account.payouts_enabled ?? false,
        stripeDetailsSubmitted: account.details_submitted ?? false,
        stripeAccountType: account.type ?? null,
        lastStripeSync: new Date(),
      });

      // Clear cookies only after successful completion
      clearOAuthCookies();

      // Redirect to onboarding complete step if coming from onboarding flow
      // Otherwise go directly to dashboard
      const redirectUrl = onboardingInProgress
        ? ONBOARDING_COMPLETE_URL
        : AFTER_CONNECT_URL;
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl },
      });
    } catch (error) {
      console.error("Stripe Connect callback error:", error);
      // Don't clear cookies on transient errors - allow retry
      return new Response("Failed to complete Stripe Connect onboarding", {
        status: 500,
      });
    }
      },
    },
  },
});
