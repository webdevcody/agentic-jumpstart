import { database } from "~/db";
import {
  users,
  modules,
  segments,
  progress,
  comments,
  affiliateReferrals,
  analyticsEvents,
  analyticsSessions,
  type AnalyticsEventCreate,
  type AnalyticsSessionCreate,
} from "~/db/schema";
import { sql, count, eq, and, desc, gte, lte } from "drizzle-orm";

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
        ? Math.round(
            (module.completedSegments / (module.totalSegments * totalUsers)) *
              100 *
              100
          ) / 100
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

  const totalProgress = progressStats.reduce(
    (sum, user) => sum + user.segmentCount,
    0
  );
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

// New conversion tracking analytics functions

export async function createOrUpdateAnalyticsSession({
  sessionId,
  utmParams,
  referrerSource,
}: {
  sessionId: string;
  utmParams: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
  };
  referrerSource?: string;
}) {
  // Try to find existing session
  const existingSession = await database
    .select()
    .from(analyticsSessions)
    .where(eq(analyticsSessions.id, sessionId))
    .limit(1);

  if (existingSession.length > 0) {
    // Update last seen and increment page views
    await database
      .update(analyticsSessions)
      .set({
        lastSeen: new Date(),
        pageViews: sql`${analyticsSessions.pageViews} + 1`,
      })
      .where(eq(analyticsSessions.id, sessionId));

    return existingSession[0];
  } else {
    // Create new session
    const newSession: AnalyticsSessionCreate = {
      id: sessionId,
      firstSeen: new Date(),
      lastSeen: new Date(),
      referrerSource,
      utmCampaign: utmParams.utmCampaign,
      utmSource: utmParams.utmSource,
      utmMedium: utmParams.utmMedium,
      utmContent: utmParams.utmContent,
      utmTerm: utmParams.utmTerm,
      pageViews: 1,
      hasPurchaseIntent: false,
      hasConversion: false,
    };

    const [session] = await database
      .insert(analyticsSessions)
      .values(newSession)
      .returning();

    return session;
  }
}

export async function trackAnalyticsEvent({
  sessionId,
  eventType,
  pagePath,
  referrer,
  userAgent,
  ipAddressHash,
  utmParams,
  metadata,
}: {
  sessionId: string;
  eventType:
    | "page_view"
    | "purchase_intent"
    | "purchase_completed"
    | "course_access";
  pagePath: string;
  referrer?: string;
  userAgent?: string;
  ipAddressHash?: string;
  utmParams?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
  };
  metadata?: Record<string, any>;
}) {
  const event: AnalyticsEventCreate = {
    sessionId,
    eventType,
    pagePath,
    referrer,
    userAgent,
    ipAddressHash,
    utmSource: utmParams?.utmSource,
    utmMedium: utmParams?.utmMedium,
    utmCampaign: utmParams?.utmCampaign,
    utmContent: utmParams?.utmContent,
    utmTerm: utmParams?.utmTerm,
    metadata: metadata ? JSON.stringify(metadata) : null,
    createdAt: new Date(),
  };

  const [createdEvent] = await database
    .insert(analyticsEvents)
    .values(event)
    .returning();

  // Update session flags based on event type
  if (eventType === "purchase_intent") {
    await database
      .update(analyticsSessions)
      .set({ hasPurchaseIntent: true })
      .where(eq(analyticsSessions.id, sessionId));
  } else if (eventType === "purchase_completed") {
    await database
      .update(analyticsSessions)
      .set({ hasConversion: true })
      .where(eq(analyticsSessions.id, sessionId));
  }

  return createdEvent;
}

export async function getConversionMetrics(dateRange?: {
  start: Date;
  end: Date;
}) {
  const whereCondition = dateRange
    ? and(
        gte(analyticsSessions.firstSeen, dateRange.start),
        lte(analyticsSessions.firstSeen, dateRange.end)
      )
    : undefined;

  const campaignMetrics = await database
    .select({
      utmCampaign: analyticsSessions.utmCampaign,
      utmSource: analyticsSessions.utmSource,
      utmMedium: analyticsSessions.utmMedium,
      totalSessions: count(analyticsSessions.id),
      totalPageViews: sql<number>`sum(${analyticsSessions.pageViews})`,
      purchaseIntentSessions: sql<number>`sum(case when ${analyticsSessions.hasPurchaseIntent} then 1 else 0 end)`,
      conversions: sql<number>`sum(case when ${analyticsSessions.hasConversion} then 1 else 0 end)`,
    })
    .from(analyticsSessions)
    .where(whereCondition)
    .groupBy(
      analyticsSessions.utmCampaign,
      analyticsSessions.utmSource,
      analyticsSessions.utmMedium
    )
    .orderBy(
      desc(
        sql`sum(case when ${analyticsSessions.hasConversion} then 1 else 0 end)`
      )
    );

  return campaignMetrics;
}

export async function getConversionFunnel(dateRange?: {
  start: Date;
  end: Date;
}) {
  // Debug: Check total sessions without date filter first
  const [totalCheck] = await database
    .select({
      total: count(analyticsSessions.id),
    })
    .from(analyticsSessions);
  
  console.log('Total sessions in database:', totalCheck.total);
  
  const whereCondition = dateRange
    ? and(
        gte(analyticsSessions.firstSeen, dateRange.start),
        lte(analyticsSessions.firstSeen, dateRange.end)
      )
    : undefined;

  console.log('Date range filter:', dateRange);

  const [funnelData] = await database
    .select({
      totalSessions: count(analyticsSessions.id),
      purchasePageViews: sql<number>`sum(case when exists(
        select 1 from ${analyticsEvents} 
        where ${analyticsEvents.sessionId} = ${analyticsSessions.id}::text 
        and ${analyticsEvents.eventType} = 'page_view'
        and ${analyticsEvents.pagePath} = '/purchase'
      ) then 1 else 0 end)`,
      purchaseIntentEvents: sql<number>`sum(case when ${analyticsSessions.hasPurchaseIntent} then 1 else 0 end)`,
      conversions: sql<number>`sum(case when ${analyticsSessions.hasConversion} then 1 else 0 end)`,
    })
    .from(analyticsSessions)
    .where(whereCondition);

  console.log('Filtered sessions:', funnelData.totalSessions);

  return funnelData;
}

export async function getTopReferrers(
  dateRange?: { start: Date; end: Date },
  limit = 10
) {
  const whereCondition = dateRange
    ? and(
        gte(analyticsSessions.firstSeen, dateRange.start),
        lte(analyticsSessions.firstSeen, dateRange.end)
      )
    : undefined;

  const topReferrers = await database
    .select({
      referrerSource: analyticsSessions.referrerSource,
      sessions: count(analyticsSessions.id),
      conversions: sql<number>`sum(case when ${analyticsSessions.hasConversion} then 1 else 0 end)`,
      conversionRate: sql<number>`
        case when count(${analyticsSessions.id}) > 0 
        then round(sum(case when ${analyticsSessions.hasConversion} then 1 else 0 end) * 100.0 / count(${analyticsSessions.id}), 2)
        else 0 
        end
      `,
    })
    .from(analyticsSessions)
    .where(whereCondition)
    .groupBy(analyticsSessions.referrerSource)
    .orderBy(desc(count(analyticsSessions.id)))
    .limit(limit);

  return topReferrers;
}

export async function getDailyConversions(dateRange?: {
  start: Date;
  end: Date;
}) {
  const whereCondition = dateRange
    ? and(
        gte(analyticsSessions.firstSeen, dateRange.start),
        lte(analyticsSessions.firstSeen, dateRange.end)
      )
    : undefined;

  const dailyData = await database
    .select({
      date: sql<string>`date(${analyticsSessions.firstSeen})`,
      sessions: count(analyticsSessions.id),
      purchaseIntent: sql<number>`sum(case when ${analyticsSessions.hasPurchaseIntent} then 1 else 0 end)`,
      conversions: sql<number>`sum(case when ${analyticsSessions.hasConversion} then 1 else 0 end)`,
      conversionRate: sql<number>`
        case when count(${analyticsSessions.id}) > 0 
        then round(sum(case when ${analyticsSessions.hasConversion} then 1 else 0 end) * 100.0 / count(${analyticsSessions.id}), 2)
        else 0 
        end
      `,
    })
    .from(analyticsSessions)
    .where(whereCondition)
    .groupBy(sql`date(${analyticsSessions.firstSeen})`)
    .orderBy(sql`date(${analyticsSessions.firstSeen})`)
    .limit(30);

  return dailyData;
}

// Additional analytics functions for comprehensive views

export async function getAllAnalyticsEvents(
  dateRange?: { start: Date; end: Date },
  limit = 100
) {
  const whereCondition = dateRange
    ? and(
        gte(analyticsEvents.createdAt, dateRange.start),
        lte(analyticsEvents.createdAt, dateRange.end)
      )
    : undefined;

  const events = await database
    .select({
      id: analyticsEvents.id,
      sessionId: analyticsEvents.sessionId,
      eventType: analyticsEvents.eventType,
      pagePath: analyticsEvents.pagePath,
      referrer: analyticsEvents.referrer,
      userAgent: analyticsEvents.userAgent,
      utmSource: analyticsEvents.utmSource,
      utmMedium: analyticsEvents.utmMedium,
      utmCampaign: analyticsEvents.utmCampaign,
      metadata: analyticsEvents.metadata,
      createdAt: analyticsEvents.createdAt,
    })
    .from(analyticsEvents)
    .where(whereCondition)
    .orderBy(desc(analyticsEvents.createdAt))
    .limit(limit);

  return events;
}

export async function getAllAnalyticsSessions(
  dateRange?: { start: Date; end: Date },
  limit = 100
) {
  // Debug: Check total sessions first
  const [totalCheck] = await database
    .select({
      total: count(analyticsSessions.id),
    })
    .from(analyticsSessions);
  
  // Get sample sessions to check date format
  const sampleSessions = await database
    .select({
      id: analyticsSessions.id,
      firstSeen: analyticsSessions.firstSeen,
    })
    .from(analyticsSessions)
    .limit(3);
  
  console.log('getAllAnalyticsSessions - Total sessions in database:', totalCheck.total);
  console.log('getAllAnalyticsSessions - Sample sessions:', sampleSessions);
  console.log('getAllAnalyticsSessions - Date range:', dateRange);
  
  const whereCondition = dateRange
    ? and(
        gte(analyticsSessions.firstSeen, dateRange.start),
        lte(analyticsSessions.firstSeen, dateRange.end)
      )
    : undefined;

  // Temporarily test without date filter to confirm data exists
  const sessionsWithoutFilter = await database
    .select({
      id: analyticsSessions.id,
      firstSeen: analyticsSessions.firstSeen,
    })
    .from(analyticsSessions)
    .limit(3);
  
  console.log('getAllAnalyticsSessions - Sessions without filter:', sessionsWithoutFilter.length);

  const sessions = await database
    .select({
      id: analyticsSessions.id,
      firstSeen: analyticsSessions.firstSeen,
      lastSeen: analyticsSessions.lastSeen,
      referrerSource: analyticsSessions.referrerSource,
      utmCampaign: analyticsSessions.utmCampaign,
      utmSource: analyticsSessions.utmSource,
      utmMedium: analyticsSessions.utmMedium,
      pageViews: analyticsSessions.pageViews,
      hasPurchaseIntent: analyticsSessions.hasPurchaseIntent,
      hasConversion: analyticsSessions.hasConversion,
    })
    .from(analyticsSessions)
    .where(whereCondition)
    .orderBy(desc(analyticsSessions.firstSeen))
    .limit(limit);

  console.log('getAllAnalyticsSessions - Found sessions:', sessions.length);

  return sessions;
}

export async function getEventTypeCounts(dateRange?: {
  start: Date;
  end: Date;
}) {
  const whereCondition = dateRange
    ? and(
        gte(analyticsEvents.createdAt, dateRange.start),
        lte(analyticsEvents.createdAt, dateRange.end)
      )
    : undefined;

  const eventCounts = await database
    .select({
      eventType: analyticsEvents.eventType,
      count: count(analyticsEvents.id),
    })
    .from(analyticsEvents)
    .where(whereCondition)
    .groupBy(analyticsEvents.eventType)
    .orderBy(desc(count(analyticsEvents.id)));

  return eventCounts;
}

export async function getPopularPages(
  dateRange?: { start: Date; end: Date },
  limit = 20
) {
  const whereCondition = dateRange
    ? and(
        gte(analyticsEvents.createdAt, dateRange.start),
        lte(analyticsEvents.createdAt, dateRange.end),
        eq(analyticsEvents.eventType, "page_view")
      )
    : eq(analyticsEvents.eventType, "page_view");

  const popularPages = await database
    .select({
      pagePath: analyticsEvents.pagePath,
      views: count(analyticsEvents.id),
      uniqueSessions: sql<number>`count(distinct ${analyticsEvents.sessionId})`,
    })
    .from(analyticsEvents)
    .where(whereCondition)
    .groupBy(analyticsEvents.pagePath)
    .orderBy(desc(count(analyticsEvents.id)))
    .limit(limit);

  return popularPages;
}

export async function getOverallAnalyticsStats(dateRange?: {
  start: Date;
  end: Date;
}) {
  const whereCondition = dateRange
    ? and(
        gte(analyticsSessions.firstSeen, dateRange.start),
        lte(analyticsSessions.firstSeen, dateRange.end)
      )
    : undefined;

  const [stats] = await database
    .select({
      totalSessions: count(analyticsSessions.id),
      totalPageViews: sql<number>`sum(${analyticsSessions.pageViews})`,
      averagePageViewsPerSession: sql<number>`round(avg(${analyticsSessions.pageViews}), 2)`,
      sessionsWithPurchaseIntent: sql<number>`sum(case when ${analyticsSessions.hasPurchaseIntent} then 1 else 0 end)`,
      conversions: sql<number>`sum(case when ${analyticsSessions.hasConversion} then 1 else 0 end)`,
      conversionRate: sql<number>`
        case when count(${analyticsSessions.id}) > 0 
        then round(sum(case when ${analyticsSessions.hasConversion} then 1 else 0 end) * 100.0 / count(${analyticsSessions.id}), 2)
        else 0 
        end
      `,
      intentToConversionRate: sql<number>`
        case when sum(case when ${analyticsSessions.hasPurchaseIntent} then 1 else 0 end) > 0 
        then round(sum(case when ${analyticsSessions.hasConversion} then 1 else 0 end) * 100.0 / sum(case when ${analyticsSessions.hasPurchaseIntent} then 1 else 0 end), 2)
        else 0 
        end
      `,
    })
    .from(analyticsSessions)
    .where(whereCondition);

  return stats;
}
