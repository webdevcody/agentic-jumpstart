import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { generateSessionIdFn, trackPageViewFn } from "~/fn/analytics";

// Store session ID in memory for the browser session
let browserSessionId: string | null = null;

// Track if UTM params have been processed this session
let utmProcessed = false;

// List of UTM parameter names
const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

// Check if URL has any UTM parameters
function hasUtmParams(url: URL): boolean {
  return UTM_PARAMS.some((param) => url.searchParams.has(param));
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
        // Generate session ID if not exists
        if (!browserSessionId) {
          const result = await generateSessionIdFn();
          browserSessionId = result.sessionId;
        }

        const currentUrl = new URL(window.location.href);
        const currentPathname = location.pathname;

        // Check for UTM params on initial load only (once per session)
        if (initialLoadRef.current && !utmProcessed && hasUtmParams(currentUrl)) {
          utmProcessed = true;

          // Track page view with full path including UTM query string
          const fullPath = currentUrl.pathname + currentUrl.search;

          try {
            await trackPageViewFn({
              data: {
                sessionId: browserSessionId,
                pagePath: fullPath, // e.g., /purchase?utm_source=google&utm_medium=cpc
                fullUrl: window.location.href,
              },
            });
          } catch (error) {
            console.error("[Analytics] Failed to track UTM page view:", error);
          }

          // Strip UTM params from URL after tracking
          stripUtmFromUrl();

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
