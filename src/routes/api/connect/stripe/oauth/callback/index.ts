import { createFileRoute } from "@tanstack/react-router";
import { getCookie, deleteCookie } from "@tanstack/react-start/server";
import { stripe } from "~/lib/stripe";
import { assertAuthenticated } from "~/utils/session";
import {
  getAffiliateByUserId,
  updateAffiliateStripeAccount,
} from "~/data-access/affiliates";
import { determineStripeAccountStatus, StripeAccountStatus } from "~/utils/stripe-status";

const AFTER_CONNECT_URL = "/affiliate-dashboard";

/**
 * Stripe OAuth callback route for connecting existing Stripe accounts.
 *
 * This route handles the return flow after a user authorizes their existing
 * Stripe account for connection.
 *
 * Flow:
 * 1. Validates the CSRF state token against the stored cookie
 * 2. Exchanges the authorization code for account info
 * 3. Stores the connected account ID
 * 4. Retrieves and updates the account status
 * 5. Redirects to the affiliate dashboard
 *
 * @route GET /api/connect/stripe/oauth/callback
 * @requires authentication
 * @redirects /affiliate-dashboard
 */
export const Route = createFileRoute("/api/connect/stripe/oauth/callback/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");
        const errorDescription = url.searchParams.get("error_description");

        const storedState = getCookie("stripe_oauth_state") ?? null;
        const storedAffiliateId = getCookie("stripe_oauth_affiliate_id") ?? null;

        // Clear cookies
        deleteCookie("stripe_oauth_state");
        deleteCookie("stripe_oauth_affiliate_id");
        deleteCookie("stripe_oauth_type");

        // Handle OAuth errors (user denied, etc.)
        if (error) {
          console.error("Stripe OAuth error:", error, errorDescription);
          return new Response(null, {
            status: 302,
            headers: { Location: `${AFTER_CONNECT_URL}?error=oauth_denied` },
          });
        }

        // Validate CSRF state token
        if (!state || !storedState || state !== storedState) {
          return new Response("Invalid state parameter", { status: 400 });
        }

        if (!code) {
          return new Response("Missing authorization code", { status: 400 });
        }

        try {
          // Require authentication
          const user = await assertAuthenticated();

          // Get affiliate record for this user
          const affiliate = await getAffiliateByUserId(user.id);

          if (!affiliate) {
            return new Response("Affiliate account not found", { status: 404 });
          }

          // Verify affiliate ID matches (extra security)
          if (storedAffiliateId && String(affiliate.id) !== storedAffiliateId) {
            return new Response("Affiliate mismatch", { status: 403 });
          }

          // Exchange authorization code for connected account ID
          const response = await stripe.oauth.token({
            grant_type: "authorization_code",
            code,
          });

          const connectedAccountId = response.stripe_user_id;

          if (!connectedAccountId) {
            console.error("No stripe_user_id in OAuth response");
            return new Response("Failed to connect Stripe account", { status: 500 });
          }

          // Retrieve account status from Stripe
          const account = await stripe.accounts.retrieve(connectedAccountId);

          // Determine account status based on Stripe account state
          const stripeAccountStatus = determineStripeAccountStatus(account);

          // Update database with connected account
          await updateAffiliateStripeAccount(affiliate.id, {
            stripeConnectAccountId: connectedAccountId,
            stripeAccountStatus,
            stripeChargesEnabled: account.charges_enabled ?? false,
            stripePayoutsEnabled: account.payouts_enabled ?? false,
            stripeDetailsSubmitted: account.details_submitted ?? false,
            lastStripeSync: new Date(),
          });

          // Redirect to affiliate dashboard with success message
          return new Response(null, {
            status: 302,
            headers: { Location: `${AFTER_CONNECT_URL}?connected=true` },
          });
        } catch (err) {
          console.error("Stripe OAuth callback error:", err);
          return new Response("Failed to complete Stripe account connection", {
            status: 500,
          });
        }
      },
    },
  },
});
