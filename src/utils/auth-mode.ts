/**
 * Server-only utility for getting auth mode preference.
 * This file should only be imported by server-side code (API routes).
 */
import { getCookie } from "@tanstack/react-start/server";

export type AuthMode = "dev" | "google";

const AUTH_PREF_COOKIE = "dev-auth-mode";

/**
 * Check if real Google OAuth credentials are configured (not test fallbacks)
 */
function isGoogleOAuthAvailable(): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // Check if credentials exist and are not test fallbacks
  return !!(
    clientId &&
    clientSecret &&
    !clientId.startsWith("test-") &&
    !clientSecret.startsWith("test-")
  );
}

/**
 * Get auth mode preference from cookie (server-side only)
 */
export function getAuthMode(): AuthMode {
  if (process.env.NODE_ENV !== "development") {
    return "google";
  }

  const pref = getCookie(AUTH_PREF_COOKIE) as AuthMode | undefined;
  const googleAvailable = isGoogleOAuthAvailable();

  if (pref === "google" && googleAvailable) {
    return "google";
  }
  return "dev";
}
