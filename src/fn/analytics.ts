import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getAnalyticsDashboardDataUseCase,
  getUserStatsUseCase,
  getModulesAnalyticsUseCase,
  getSegmentsAnalyticsUseCase,
  getOverallStatsUseCase,
  getEngagementInsightsUseCase,
  getCourseHealthMetricsUseCase,
} from "~/use-cases/analytics";
import {
  trackPurchaseIntent,
  generateSessionId,
  trackPageView,
} from "~/utils/analytics";
import {
  getEventTypeCounts,
  getPopularPages,
  getOverallAnalyticsStats,
  getDailyConversions,
  getUniqueUtmCampaigns,
  getDailyUtmPageViews,
  getUtmStats,
} from "~/data-access/analytics";
import { getRequest } from "@tanstack/react-start/server";
import { adminMiddleware } from "~/lib/auth";

export const getAnalyticsDashboardDataFn = createServerFn({
  method: "GET",
})
  .middleware([adminMiddleware])
  .handler(async () => {
    return getAnalyticsDashboardDataUseCase();
  });

export const getUserStatsFn = createServerFn({
  method: "GET",
})
  .middleware([adminMiddleware])
  .handler(async () => {
    return getUserStatsUseCase();
  });

export const getModulesAnalyticsFn = createServerFn({
  method: "GET",
})
  .middleware([adminMiddleware])
  .handler(async () => {
    return getModulesAnalyticsUseCase();
  });

export const getSegmentsAnalyticsFn = createServerFn({
  method: "GET",
})
  .middleware([adminMiddleware])
  .handler(async () => {
    return getSegmentsAnalyticsUseCase();
  });

export const getOverallStatsFn = createServerFn({
  method: "GET",
})
  .middleware([adminMiddleware])
  .handler(async () => {
    return getOverallStatsUseCase();
  });

export const getEngagementInsightsFn = createServerFn({
  method: "GET",
})
  .middleware([adminMiddleware])
  .handler(async () => {
    return getEngagementInsightsUseCase();
  });

export const getCourseHealthMetricsFn = createServerFn({
  method: "GET",
})
  .middleware([adminMiddleware])
  .handler(async () => {
    return getCourseHealthMetricsUseCase();
  });

// New conversion tracking functions

const trackPurchaseIntentSchema = z.object({
  sessionId: z.string(),
  buttonType: z.string().optional(),
});

export const trackPurchaseIntentFn = createServerFn()
  .inputValidator(trackPurchaseIntentSchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const headers = {
      "User-Agent": request.headers.get("User-Agent") ?? undefined,
      "X-Forwarded-For": request.headers.get("X-Forwarded-For") ?? undefined,
      "X-Real-IP": request.headers.get("X-Real-IP") ?? undefined,
    };
    try {
      await trackPurchaseIntent({
        headers,
        sessionId: data.sessionId,
        buttonType: data.buttonType,
      });
      return { success: true };
    } catch (error) {
      console.error("Purchase intent tracking error:", error);
      return { success: false, error: "Failed to track purchase intent" };
    }
  });

// Generate session ID for client use
export const generateSessionIdFn = createServerFn().handler(async () => {
  const request = getRequest();
  const userAgent = request.headers.get("User-Agent") ?? undefined;
  const ipAddress =
    request.headers.get("X-Forwarded-For") ??
    request.headers.get("X-Real-IP") ??
    undefined;

  const sessionId = generateSessionId(userAgent, ipAddress);
  return { sessionId };
});

// Conversion dashboard functions
const dateRangeSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
});

// Page view tracking
const pageViewSchema = z.object({
  sessionId: z.string(),
  pagePath: z.string(),
  fullUrl: z.string().optional(),
  gclid: z.string().optional(), // Google Click ID
});

export const trackPageViewFn = createServerFn()
  .inputValidator(pageViewSchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const headers = {
      "User-Agent": request.headers.get("User-Agent") ?? undefined,
      Referer: request.headers.get("Referer") ?? undefined,
      "X-Forwarded-For": request.headers.get("X-Forwarded-For") ?? undefined,
      "X-Real-IP": request.headers.get("X-Real-IP") ?? undefined,
    };
    try {
      await trackPageView({
        headers,
        sessionId: data.sessionId,
        pagePath: data.pagePath, // pagePath now includes UTM params in query string
        gclid: data.gclid,
      });

      return { success: true };
    } catch (error) {
      console.error("Page view tracking error:", error);
      return { success: false, error: "Failed to track page view" };
    }
  });

// Comprehensive analytics functions

const limitSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  limit: z.number().optional(),
});

export const getEventTypeCountsFn = createServerFn()
  .inputValidator(dateRangeSchema)
  .middleware([adminMiddleware])
  .handler(async ({ data }) => {
    const dateRange =
      data.start && data.end
        ? {
            start: new Date(data.start),
            end: new Date(data.end),
          }
        : undefined;

    return getEventTypeCounts(dateRange);
  });

export const getPopularPagesFn = createServerFn()
  .inputValidator(limitSchema)
  .middleware([adminMiddleware])
  .handler(async ({ data }) => {
    const dateRange =
      data.start && data.end
        ? {
            start: new Date(data.start),
            end: new Date(data.end),
          }
        : undefined;

    return getPopularPages(dateRange, data.limit);
  });

export const getOverallAnalyticsStatsFn = createServerFn()
  .inputValidator(dateRangeSchema)
  .middleware([adminMiddleware])
  .handler(async ({ data }) => {
    const dateRange =
      data.start && data.end
        ? {
            start: new Date(data.start),
            end: new Date(data.end),
          }
        : undefined;

    return getOverallAnalyticsStats(dateRange);
  });

export const getDailyConversionsFn = createServerFn()
  .inputValidator(dateRangeSchema)
  .middleware([adminMiddleware])
  .handler(async ({ data }) => {
    const dateRange =
      data.start && data.end
        ? {
            start: new Date(data.start),
            end: new Date(data.end),
          }
        : undefined;

    return getDailyConversions(dateRange);
  });

// UTM Analytics functions

export const getUniqueUtmCampaignsFn = createServerFn()
  .inputValidator(dateRangeSchema)
  .middleware([adminMiddleware])
  .handler(async ({ data }) => {
    const dateRange =
      data.start && data.end
        ? {
            start: new Date(data.start),
            end: new Date(data.end),
          }
        : undefined;

    return getUniqueUtmCampaigns(dateRange);
  });

export const getDailyUtmPageViewsFn = createServerFn()
  .inputValidator(dateRangeSchema)
  .middleware([adminMiddleware])
  .handler(async ({ data }) => {
    const dateRange =
      data.start && data.end
        ? {
            start: new Date(data.start),
            end: new Date(data.end),
          }
        : undefined;

    return getDailyUtmPageViews(dateRange);
  });

export const getUtmStatsFn = createServerFn()
  .inputValidator(dateRangeSchema)
  .middleware([adminMiddleware])
  .handler(async ({ data }) => {
    const dateRange =
      data.start && data.end
        ? {
            start: new Date(data.start),
            end: new Date(data.end),
          }
        : undefined;

    return getUtmStats(dateRange);
  });
