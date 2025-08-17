import { database } from "~/db";
import { 
  users, 
  modules, 
  segments, 
  progress, 
  comments,
  affiliateReferrals 
} from "~/db/schema";
import { sql, count, eq, and, desc } from "drizzle-orm";

export interface UserStats {
  totalUsers: number;
  premiumUsers: number;
  conversionRate: number;
}

export interface ModuleAnalytics {
  id: number;
  title: string;
  order: number;
  totalSegments: number;
  completedSegments: number;
  averageCompletionRate: number;
}

export interface SegmentAnalytics {
  id: number;
  slug: string;
  title: string;
  moduleId: number;
  moduleTitle: string;
  order: number;
  moduleOrder: number;
  isPremium: boolean;
  length: string | null;
  totalUsers: number;
  completedCount: number;
  completionRate: number;
  commentCount: number;
}

export interface OverallStats {
  totalRevenue: number;
  recentSignups: number;
  averageProgressPerUser: number;
}

export async function getUserStats(): Promise<UserStats> {
  const [totalUsersResult] = await database
    .select({ count: count() })
    .from(users);

  const [premiumUsersResult] = await database
    .select({ count: count() })
    .from(users)
    .where(eq(users.isPremium, true));

  const totalUsers = totalUsersResult.count;
  const premiumUsers = premiumUsersResult.count;
  const conversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;

  return {
    totalUsers,
    premiumUsers,
    conversionRate: Math.round(conversionRate * 100) / 100,
  };
}

export async function getModulesAnalytics(): Promise<ModuleAnalytics[]> {
  const modulesWithSegments = await database
    .select({
      moduleId: modules.id,
      moduleTitle: modules.title,
      moduleOrder: modules.order,
      segmentId: segments.id,
      segmentTitle: segments.title,
      segmentOrder: segments.order,
    })
    .from(modules)
    .leftJoin(segments, eq(modules.id, segments.moduleId))
    .orderBy(modules.order, segments.order);

  // Get progress data for all segments
  const progressData = await database
    .select({
      segmentId: progress.segmentId,
      completedCount: count(),
    })
    .from(progress)
    .groupBy(progress.segmentId);

  const progressMap = new Map(
    progressData.map((p) => [p.segmentId, p.completedCount])
  );

  // Get total user count for completion rate calculation
  const [{ totalUsers }] = await database
    .select({ totalUsers: count() })
    .from(users);

  // Group by module and calculate analytics
  const moduleMap = new Map<number, ModuleAnalytics>();

  for (const row of modulesWithSegments) {
    if (!row.segmentId) continue; // Skip modules without segments

    const moduleId = row.moduleId;
    const completedCount = progressMap.get(row.segmentId) || 0;

    if (!moduleMap.has(moduleId)) {
      moduleMap.set(moduleId, {
        id: moduleId,
        title: row.moduleTitle,
        order: row.moduleOrder,
        totalSegments: 0,
        completedSegments: 0,
        averageCompletionRate: 0,
      });
    }

    const moduleAnalytics = moduleMap.get(moduleId)!;
    moduleAnalytics.totalSegments++;
    moduleAnalytics.completedSegments += completedCount;
  }

  // Calculate average completion rates
  return Array.from(moduleMap.values()).map((module) => ({
    ...module,
    averageCompletionRate: 
      module.totalSegments > 0 && totalUsers > 0
        ? Math.round((module.completedSegments / (module.totalSegments * totalUsers)) * 100 * 100) / 100
        : 0,
  }));
}

export async function getSegmentsAnalytics(): Promise<SegmentAnalytics[]> {
  // Get all segments with their module information
  const segmentsWithModules = await database
    .select({
      segmentId: segments.id,
      segmentSlug: segments.slug,
      segmentTitle: segments.title,
      segmentOrder: segments.order,
      segmentIsPremium: segments.isPremium,
      segmentLength: segments.length,
      moduleId: modules.id,
      moduleTitle: modules.title,
      moduleOrder: modules.order,
    })
    .from(segments)
    .innerJoin(modules, eq(segments.moduleId, modules.id))
    .orderBy(modules.order, segments.order);

  // Get progress counts for each segment
  const progressCounts = await database
    .select({
      segmentId: progress.segmentId,
      completedCount: count(),
    })
    .from(progress)
    .groupBy(progress.segmentId);

  // Get comment counts for each segment
  const commentCounts = await database
    .select({
      segmentId: comments.segmentId,
      commentCount: count(),
    })
    .from(comments)
    .groupBy(comments.segmentId);

  // Get total user count
  const [{ totalUsers }] = await database
    .select({ totalUsers: count() })
    .from(users);

  const progressMap = new Map(
    progressCounts.map((p) => [p.segmentId, p.completedCount])
  );

  const commentMap = new Map(
    commentCounts.map((c) => [c.segmentId, c.commentCount])
  );

  return segmentsWithModules.map((segment) => {
    const completedCount = progressMap.get(segment.segmentId) || 0;
    const commentCount = commentMap.get(segment.segmentId) || 0;
    const completionRate = 
      totalUsers > 0 
        ? Math.round((completedCount / totalUsers) * 100 * 100) / 100
        : 0;

    return {
      id: segment.segmentId,
      slug: segment.segmentSlug,
      title: segment.segmentTitle,
      moduleId: segment.moduleId,
      moduleTitle: segment.moduleTitle,
      order: segment.segmentOrder,
      moduleOrder: segment.moduleOrder,
      isPremium: segment.segmentIsPremium,
      length: segment.segmentLength,
      totalUsers,
      completedCount,
      completionRate,
      commentCount,
    };
  });
}

export async function getOverallStats(): Promise<OverallStats> {
  // Calculate total revenue from affiliate referrals (rough estimate)
  const [revenueResult] = await database
    .select({
      totalRevenue: sql<number>`COALESCE(SUM(${affiliateReferrals.amount}), 0)`,
    })
    .from(affiliateReferrals);

  // Get recent signups (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [recentSignupsResult] = await database
    .select({ count: count() })
    .from(users)
    .where(sql`${users.emailVerified} >= ${thirtyDaysAgo}`);

  // Calculate average progress per user
  const progressStats = await database
    .select({
      userId: progress.userId,
      segmentCount: count(),
    })
    .from(progress)
    .groupBy(progress.userId);

  const totalProgress = progressStats.reduce((sum, user) => sum + user.segmentCount, 0);
  const averageProgressPerUser = 
    progressStats.length > 0 
      ? Math.round((totalProgress / progressStats.length) * 100) / 100
      : 0;

  return {
    totalRevenue: revenueResult.totalRevenue || 0,
    recentSignups: recentSignupsResult.count,
    averageProgressPerUser,
  };
}

export async function getTopPerformingSegments(limit: number = 10) {
  return database
    .select({
      segmentId: progress.segmentId,
      segmentTitle: segments.title,
      segmentSlug: segments.slug,
      moduleTitle: modules.title,
      completedCount: count(),
    })
    .from(progress)
    .innerJoin(segments, eq(progress.segmentId, segments.id))
    .innerJoin(modules, eq(segments.moduleId, modules.id))
    .groupBy(progress.segmentId, segments.title, segments.slug, modules.title)
    .orderBy(desc(count()))
    .limit(limit);
}

export async function getMostCommentedSegments(limit: number = 10) {
  return database
    .select({
      segmentId: comments.segmentId,
      segmentTitle: segments.title,
      segmentSlug: segments.slug,
      moduleTitle: modules.title,
      commentCount: count(),
    })
    .from(comments)
    .innerJoin(segments, eq(comments.segmentId, segments.id))
    .innerJoin(modules, eq(segments.moduleId, modules.id))
    .groupBy(comments.segmentId, segments.title, segments.slug, modules.title)
    .orderBy(desc(count()))
    .limit(limit);
}