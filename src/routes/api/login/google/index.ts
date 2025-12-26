import { createFileRoute, redirect } from "@tanstack/react-router";
import { setCookie } from "@tanstack/react-start/server";
import { generateCodeVerifier, generateState } from "arctic";
import { googleAuth } from "~/utils/auth";
import { getAuthMode } from "~/utils/auth-mode";

const MAX_COOKIE_AGE_SECONDS = 60 * 10;

export const Route = createFileRoute("/api/login/google/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const redirectUri = url.searchParams.get("redirect_uri") || "/";

        // Dev mode: check auth preference (dev login vs real OAuth)
        if (process.env.NODE_ENV === "development" && getAuthMode() === "dev") {
          const devLoginUrl = new URL("/dev-login", url.origin);
          devLoginUrl.searchParams.set("redirect_uri", redirectUri);
          return Response.redirect(devLoginUrl.href);
        }

        const state = generateState();
        const codeVerifier = generateCodeVerifier();
        const authorizationInfo = googleAuth.createAuthorizationURL(
          state,
          codeVerifier,
          ["profile", "email"]
        );

        // Force Google to show account selection on every login
        authorizationInfo.searchParams.set("prompt", "select_account");
        authorizationInfo.searchParams.set("access_type", "online");

        setCookie("google_oauth_state", state, {
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: MAX_COOKIE_AGE_SECONDS,
        });

        setCookie("google_code_verifier", codeVerifier, {
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: MAX_COOKIE_AGE_SECONDS,
        });

        setCookie("google_redirect_uri", redirectUri, {
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: MAX_COOKIE_AGE_SECONDS,
        });

        // Use throw redirect() to avoid immutable headers error when combining setCookie with Response
        throw redirect({ href: authorizationInfo.href });
      },
    },
  },
});
