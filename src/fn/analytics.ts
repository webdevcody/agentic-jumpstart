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
import { validateRequest } from "~/utils/auth";
import {
  trackPurchaseIntent,
  generateSessionId,
  trackPageView,
} from "~/utils/analytics";
import {
  getConversionMetrics,
  getConversionFunnel,
  getTopReferrers,
  getDailyConversions,
  getAllAnalyticsEvents,
  getAllAnalyticsSessions,
  getEventTypeCounts,
  getPopularPages,
  getOverallAnalyticsStats,
} from "~/data-access/analytics";
import { getHeaders } from "@tanstack/react-start/server";

// Helper function to verify admin access
async function requireAdmin() {
  const { user } = await validateRequest();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!user.isAdmin) {
    throw new Error("Admin access required");
  }

  return user;
}

export const getAnalyticsDashboardDataFn = createServerFn({
  method: "GET",
}).handler(async () => {
  await requireAdmin();
  return getAnalyticsDashboardDataUseCase();
});

export const getUserStatsFn = createServerFn({
  method: "GET",
}).handler(async () => {
  await requireAdmin();
  return getUserStatsUseCase();
});

export const getModulesAnalyticsFn = createServerFn({
  method: "GET",
}).handler(async () => {
  await requireAdmin();
  return getModulesAnalyticsUseCase();
});

export const getSegmentsAnalyticsFn = createServerFn({
  method: "GET",
}).handler(async () => {
  await requireAdmin();
  return getSegmentsAnalyticsUseCase();
});

export const getOverallStatsFn = createServerFn({
  method: "GET",
}).handler(async () => {
  await requireAdmin();
  return getOverallStatsUseCase();
});

export const getEngagementInsightsFn = createServerFn({
  method: "GET",
}).handler(async () => {
  await requireAdmin();
  return getEngagementInsightsUseCase();
});

export const getCourseHealthMetricsFn = createServerFn({
  method: "GET",
}).handler(async () => {
  await requireAdmin();
  return getCourseHealthMetricsUseCase();
});

// New conversion tracking functions

const trackPurchaseIntentSchema = z.object({
  sessionId: z.string(),
  buttonType: z.string().optional(),
});

export const trackPurchaseIntentFn = createServerFn()
  .validator(trackPurchaseIntentSchema)
  .handler(async ({ data }) => {
    const headers = getHeaders();
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
  const headers = getHeaders();
  const userAgent = headers["User-Agent"] || undefined;
  const ipAddress =
    headers["X-Forwarded-For"] || headers["X-Real-IP"] || undefined;

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
});

export const trackPageViewFn = createServerFn()
  .validator(pageViewSchema)
  .handler(async ({ data }) => {
    console.log("Tracking page view:", data);
    const headers = getHeaders();
    try {
      await trackPageView({
        headers,
        url: data.fullUrl || `${process.env.APP_URL}${data.pagePath}`,
        sessionId: data.sessionId,
        pagePath: data.pagePath,
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
  .validator(dateRangeSchema)
  .handler(async ({ data }) => {
    await requireAdmin();

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
  .validator(limitSchema)
  .handler(async ({ data }) => {
    await requireAdmin();

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
  .validator(dateRangeSchema)
  .handler(async ({ data }) => {
    await requireAdmin();

    const dateRange =
      data.start && data.end
        ? {
            start: new Date(data.start),
            end: new Date(data.end),
          }
        : undefined;

    return getOverallAnalyticsStats(dateRange);
  });
