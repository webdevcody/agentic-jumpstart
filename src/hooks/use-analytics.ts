import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { generateSessionIdFn, trackPageViewFn } from "~/fn/analytics";

const SESSION_STORAGE_KEY = "analytics_session_id";
const GCLID_PROCESSED_KEY = "analytics_gclid_processed";

// Get session ID from sessionStorage (persists across page reloads)
function getStoredSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_STORAGE_KEY);
}

// Store session ID in sessionStorage
function storeSessionId(sessionId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
}

// Check if gclid was already processed this session
function wasGclidProcessed(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(GCLID_PROCESSED_KEY) === "true";
}

// Mark gclid as processed
function markGclidProcessed(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(GCLID_PROCESSED_KEY, "true");
}

// Initialize from sessionStorage immediately (synchronous)
// This ensures sessionId is available on first render after OAuth redirect
let browserSessionId: string | null =
  typeof window !== "undefined"
    ? sessionStorage.getItem(SESSION_STORAGE_KEY)
    : null;

// List of UTM parameter names
const UTM_PARAMS = [
  "utm",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

// Check if URL has any UTM parameters
function hasUtmParams(url: URL): boolean {
  return UTM_PARAMS.some((param) => url.searchParams.has(param));
}

// Check if URL has gclid (Google Click ID)
function hasGclid(url: URL): boolean {
  return url.searchParams.has("gclid");
}

// Extract gclid from URL
function getGclid(url: URL): string | null {
  return url.searchParams.get("gclid");
}

// Remove UTM parameters from URL and update browser history
function stripUtmFromUrl() {
  const url = new URL(window.location.href);
  let hasParams = false;

  UTM_PARAMS.forEach((param) => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      hasParams = true;
    }
  });

  if (hasParams) {
    // Use replaceState to update URL without adding to history
    const newUrl = url.pathname + (url.search || "") + url.hash;
    window.history.replaceState(window.history.state, "", newUrl);
  }
}

export function useAnalytics() {
  const location = useLocation();
  const prevPathnameRef = useRef<string>("");
  const initialLoadRef = useRef(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const trackPageView = async () => {
      try {
        // Capture URL immediately before any async operations
        const capturedUrl = window.location.href;

        // Get session ID from sessionStorage first (persists across OAuth redirects)
        // Only generate new one if not found
        if (!browserSessionId) {
          const storedSessionId = getStoredSessionId();
          if (storedSessionId) {
            browserSessionId = storedSessionId;
          } else {
            const result = await generateSessionIdFn();
            browserSessionId = result.sessionId;
            storeSessionId(browserSessionId);
          }
        }

        const currentUrl = new URL(capturedUrl);
        const currentPathname = location.pathname;
        const hasUtm = hasUtmParams(currentUrl);
        const hasGclidParam = hasGclid(currentUrl);
        const gclid = getGclid(currentUrl);

        // Check for UTM params or gclid on initial load only (once per browser session)
        // Uses sessionStorage to persist across OAuth redirects
        const gclidAlreadyProcessed = wasGclidProcessed();
        if (
          initialLoadRef.current &&
          !gclidAlreadyProcessed &&
          (hasUtm || hasGclidParam)
        ) {
          markGclidProcessed();

          // Track page view with full path including UTM query string and gclid
          const fullPath = currentUrl.pathname + currentUrl.search;

          try {
            await trackPageViewFn({
              data: {
                sessionId: browserSessionId,
                pagePath: fullPath, // e.g., /purchase?utm_source=google&utm_medium=cpc&gclid=...
                fullUrl: capturedUrl,
                gclid: gclid || undefined,
              },
            });
          } catch (error) {
            console.error(
              "[Analytics] Failed to track UTM/gclid page view:",
              error
            );
          }

          // Strip UTM params and gclid from URL after tracking
          stripUtmFromUrl();
          if (gclid) {
            const url = new URL(window.location.href);
            url.searchParams.delete("gclid");
            const newUrl = url.pathname + (url.search || "") + url.hash;
            window.history.replaceState(window.history.state, "", newUrl);
          }

          initialLoadRef.current = false;
          prevPathnameRef.current = currentPathname;
          return; // Already tracked, don't double-track below
        }

        initialLoadRef.current = false;

        // Track page view when pathname changes (non-UTM visits)
        if (prevPathnameRef.current !== currentPathname) {
          prevPathnameRef.current = currentPathname;

          // Don't track API routes or development routes
          if (
            !currentPathname.startsWith("/api/") &&
            !currentPathname.startsWith("/__") &&
            currentPathname !== "/_dev"
          ) {
            // Track page view via server function
            try {
              await trackPageViewFn({
                data: {
                  sessionId: browserSessionId,
                  pagePath: currentPathname,
                  fullUrl: window.location.href,
                },
              });
            } catch (error) {
              console.error("[Analytics] Failed to track page view:", error);
            }
          }
        }
      } catch (error) {
        console.error("[Analytics] Failed to track page view:", error);
      }
    };

    trackPageView();
  }, [location.pathname]);

  return {
    sessionId: browserSessionId,
    trackEvent: async (eventType: string, metadata?: Record<string, any>) => {
      if (!browserSessionId) return;

      try {
        console.log(
          "[Analytics] Event:",
          eventType,
          metadata,
          "Session:",
          browserSessionId
        );
        // Custom event tracking can be implemented here as needed
      } catch (error) {
        console.error("[Analytics] Failed to track event:", error);
      }
    },
  };
}
