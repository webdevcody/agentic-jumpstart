import {
  getUserStats,
  getModulesAnalytics,
  getSegmentsAnalytics,
  getOverallStats,
  getTopPerformingSegments,
  getMostCommentedSegments,
  type UserStats,
  type ModuleAnalytics,
  type SegmentAnalytics,
  type OverallStats,
} from "~/data-access/analytics";

export interface AnalyticsDashboardData {
  userStats: UserStats;
  moduleAnalytics: ModuleAnalytics[];
  segmentAnalytics: SegmentAnalytics[];
  overallStats: OverallStats;
  topPerformingSegments: Array<{
    segmentId: number;
    segmentTitle: string;
    segmentSlug: string;
    moduleTitle: string;
    completedCount: number;
  }>;
  mostCommentedSegments: Array<{
    segmentId: number;
    segmentTitle: string;
    segmentSlug: string;
    moduleTitle: string;
    commentCount: number;
  }>;
}

export async function getAnalyticsDashboardDataUseCase(): Promise<AnalyticsDashboardData> {
  // Fetch all analytics data in parallel for better performance
  const [
    userStats,
    moduleAnalytics,
    segmentAnalytics,
    overallStats,
    topPerformingSegments,
    mostCommentedSegments,
  ] = await Promise.all([
    getUserStats(),
    getModulesAnalytics(),
    getSegmentsAnalytics(),
    getOverallStats(),
    getTopPerformingSegments(5),
    getMostCommentedSegments(5),
  ]);

  return {
    userStats,
    moduleAnalytics,
    segmentAnalytics,
    overallStats,
    topPerformingSegments,
    mostCommentedSegments,
  };
}

export async function getUserStatsUseCase(): Promise<UserStats> {
  return getUserStats();
}

export async function getModulesAnalyticsUseCase(): Promise<ModuleAnalytics[]> {
  return getModulesAnalytics();
}

export async function getSegmentsAnalyticsUseCase(): Promise<SegmentAnalytics[]> {
  return getSegmentsAnalytics();
}

export async function getOverallStatsUseCase(): Promise<OverallStats> {
  return getOverallStats();
}

export async function getEngagementInsightsUseCase() {
  const [topPerforming, mostCommented] = await Promise.all([
    getTopPerformingSegments(10),
    getMostCommentedSegments(10),
  ]);

  return {
    topPerforming,
    mostCommented,
  };
}

// Calculate course health metrics
export async function getCourseHealthMetricsUseCase() {
  const segmentAnalytics = await getSegmentsAnalytics();
  const userStats = await getUserStats();

  // Identify problem areas
  const lowCompletionSegments = segmentAnalytics.filter(
    (segment) => segment.completionRate < 30 && segment.totalUsers > 10
  );

  const highEngagementSegments = segmentAnalytics.filter(
    (segment) => segment.commentCount > 5
  );

  // Calculate overall course completion rate
  const totalSegments = segmentAnalytics.length;
  const averageCompletionRate = 
    segmentAnalytics.reduce((sum, segment) => sum + segment.completionRate, 0) / totalSegments;

  // Identify premium vs free content performance
  const premiumSegments = segmentAnalytics.filter((s) => s.isPremium);
  const freeSegments = segmentAnalytics.filter((s) => !s.isPremium);

  const premiumCompletionRate = 
    premiumSegments.length > 0
      ? premiumSegments.reduce((sum, s) => sum + s.completionRate, 0) / premiumSegments.length
      : 0;

  const freeCompletionRate = 
    freeSegments.length > 0
      ? freeSegments.reduce((sum, s) => sum + s.completionRate, 0) / freeSegments.length
      : 0;

  return {
    averageCompletionRate: Math.round(averageCompletionRate * 100) / 100,
    lowCompletionSegments,
    highEngagementSegments,
    premiumCompletionRate: Math.round(premiumCompletionRate * 100) / 100,
    freeCompletionRate: Math.round(freeCompletionRate * 100) / 100,
    conversionOpportunity: freeCompletionRate > premiumCompletionRate ? 
      "Free content performs better - consider premium content improvements" :
      "Premium content performs better - good conversion funnel",
  };
}