import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { generateSessionIdFn, trackPageViewFn } from "~/fn/analytics";

// Store session ID in memory for the browser session
let browserSessionId: string | null = null;

export function useAnalytics() {
  const location = useLocation();
  const prevPathnameRef = useRef<string>("");

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

        // Track page view when pathname changes
        const currentPathname = location.pathname;
        if (prevPathnameRef.current !== currentPathname) {
          prevPathnameRef.current = currentPathname;
          
          // Don't track API routes or development routes
          if (
            !currentPathname.startsWith('/api/') && 
            !currentPathname.startsWith('/__') &&
            currentPathname !== '/_dev'
          ) {
            // Track page view via server function
            try {
              await trackPageViewFn({
                data: {
                  sessionId: browserSessionId,
                  pagePath: currentPathname,
                  fullUrl: window.location.href, // Include full URL with query params
                },
              });
              console.log('[Analytics] Page view tracked:', currentPathname, 'Session:', browserSessionId);
            } catch (error) {
              console.error('[Analytics] Failed to track page view:', error);
            }
          }
        }
      } catch (error) {
        console.error('[Analytics] Failed to track page view:', error);
      }
    };

    trackPageView();
  }, [location.pathname]);

  return {
    sessionId: browserSessionId,
    trackEvent: async (eventType: string, metadata?: Record<string, any>) => {
      if (!browserSessionId) return;
      
      try {
        console.log('[Analytics] Event:', eventType, metadata, 'Session:', browserSessionId);
        // Custom event tracking can be implemented here as needed
      } catch (error) {
        console.error('[Analytics] Failed to track event:', error);
      }
    }
  };
}