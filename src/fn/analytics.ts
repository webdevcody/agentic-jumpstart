import { createServerFn } from "@tanstack/react-start";
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