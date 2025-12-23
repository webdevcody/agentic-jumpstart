import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { isR2Available, setDevStoragePreference, type StorageType } from "~/utils/storage";

const STORAGE_PREF_COOKIE = "dev-storage-mode";
const AUTH_PREF_COOKIE = "dev-auth-mode";

type AuthMode = "dev" | "google";

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

// Get all dev settings at once
export const getDevSettingsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    if (process.env.NODE_ENV !== "development") {
      return {
        storage: { mode: "r2" as StorageType, available: false },
        auth: { mode: "google" as AuthMode, available: false },
      };
    }

    const storagePref = getCookie(STORAGE_PREF_COOKIE) as StorageType | undefined;
    const authPref = getCookie(AUTH_PREF_COOKIE) as AuthMode | undefined;

    const r2Available = isR2Available();
    const googleAvailable = isGoogleOAuthAvailable();

    // Sync module-level preference from cookie
    const resolvedStorageMode = storagePref === "r2" && r2Available ? "r2" : "mock";
    setDevStoragePreference(resolvedStorageMode);

    return {
      storage: {
        mode: resolvedStorageMode as StorageType,
        available: r2Available,
      },
      auth: {
        mode: (authPref === "google" && googleAvailable ? "google" : "dev") as AuthMode,
        available: googleAvailable,
      },
    };
  });

// Set storage mode
export const setStorageModeFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ mode: z.enum(["r2", "mock"]) }))
  .handler(async ({ data }) => {
    if (process.env.NODE_ENV !== "development") {
      return { success: false };
    }
    setCookie(STORAGE_PREF_COOKIE, data.mode, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    setDevStoragePreference(data.mode);
    return { success: true, mode: data.mode };
  });

// Set auth mode
export const setAuthModeFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ mode: z.enum(["dev", "google"]) }))
  .handler(async ({ data }) => {
    if (process.env.NODE_ENV !== "development") {
      return { success: false };
    }
    setCookie(AUTH_PREF_COOKIE, data.mode, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    return { success: true, mode: data.mode };
  });
