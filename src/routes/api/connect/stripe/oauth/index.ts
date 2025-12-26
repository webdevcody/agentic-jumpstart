import { createFileRoute } from "@tanstack/react-router";
import { assertAuthenticated } from "~/utils/session";
import {
  getAffiliateByUserId,
  recordConnectAttempt,
} from "~/data-access/affiliates";
import { env } from "~/utils/env";
import { generateCsrfState } from "~/utils/crypto";

const MAX_COOKIE_AGE_SECONDS = 60 * 10; // 10 minutes

function buildCookie(name: string, value: string, maxAge: number): string {
  const secure = env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${value}; Path=/; HttpOnly; SameSite=lax; Max-Age=${maxAge}${secure}`;
}

/**
 * Stripe Connect OAuth initiation route for connecting EXISTING Stripe accounts.
 *
 * This route initiates the Stripe OAuth flow for affiliates who already have
 * a Stripe account and want to connect it for payouts.
 *
 * Flow:
 * 1. Authenticates the user and verifies they are an affiliate
 * 2. Generates a CSRF state token and stores it in HTTP-only cookies
 * 3. Redirects to Stripe's OAuth authorization page
 * 4. User authorizes access on Stripe
 * 5. Stripe redirects to callback with authorization code
 *
 * Security:
 * - CSRF protection via state parameter stored in HTTP-only cookie
 * - Affiliate ID stored in cookie for validation on callback
 *
 * @route GET /api/connect/stripe/oauth
 * @requires authentication
 * @redirects Stripe OAuth authorization page
 */
export const Route = createFileRoute("/api/connect/stripe/oauth/")({
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

        // Don't allow if already connected
        if (affiliate.stripeConnectAccountId && affiliate.stripePayoutsEnabled) {
          return new Response("Stripe account already connected", { status: 400 });
        }

        // Record this attempt for rate limiting
        await recordConnectAttempt(affiliate.id);

        // Generate CSRF state token
        const state = generateCsrfState();

        // Build Stripe OAuth authorization URL
        // Uses Standard account type for connecting existing accounts
        const stripeClientId = env.STRIPE_CLIENT_ID;
        if (!stripeClientId) {
          console.error("STRIPE_CLIENT_ID not configured");
          return new Response("Stripe OAuth not configured", { status: 500 });
        }

        const redirectUri = `${env.HOST_NAME}/api/connect/stripe/oauth/callback`;
        const oauthUrl = new URL("https://connect.stripe.com/oauth/authorize");
        oauthUrl.searchParams.set("response_type", "code");
        oauthUrl.searchParams.set("client_id", stripeClientId);
        oauthUrl.searchParams.set("scope", "read_write");
        oauthUrl.searchParams.set("redirect_uri", redirectUri);
        oauthUrl.searchParams.set("state", state);

        // Return redirect with cookies in headers
        const headers = new Headers();
        headers.set("Location", oauthUrl.toString());
        headers.append("Set-Cookie", buildCookie("stripe_oauth_state", state, MAX_COOKIE_AGE_SECONDS));
        headers.append("Set-Cookie", buildCookie("stripe_oauth_affiliate_id", String(affiliate.id), MAX_COOKIE_AGE_SECONDS));
        headers.append("Set-Cookie", buildCookie("stripe_oauth_type", "standard", MAX_COOKIE_AGE_SECONDS));

        return new Response(null, { status: 302, headers });
      },
    },
  },
});
