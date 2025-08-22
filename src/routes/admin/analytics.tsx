import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAnalyticsDashboardDataFn } from "~/fn/analytics";
import { getBlogAnalyticsFn } from "~/fn/blog";
import {
  TrendingUp,
  Users,
  Award,
  MessageSquare,
  ExternalLink,
  Clock,
  Activity,
  DollarSign,
  FileText,
  Eye,
} from "lucide-react";
import { queryOptions } from "@tanstack/react-query";
import { Progress } from "~/components/ui/progress";
import { Badge } from "~/components/ui/badge";
import { PageHeader } from "./-components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { StatsCard } from "~/components/stats-card";
import { AppCard } from "~/components/app-card";
import { Page } from "./-components/page";

export const Route = createFileRoute("/admin/analytics")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(analyticsQuery);
    context.queryClient.ensureQueryData(blogAnalyticsQuery);
  },
  component: AdminAnalytics,
});

const analyticsQuery = queryOptions({
  queryKey: ["admin", "analytics"],
  queryFn: () => getAnalyticsDashboardDataFn(),
});

const blogAnalyticsQuery = queryOptions({
  queryKey: ["admin", "blog-analytics"],
  queryFn: () => getBlogAnalyticsFn(),
});

// Atomic skeleton components
function CountSkeleton() {
  return <div className="h-8 w-16 bg-muted/50 rounded animate-pulse"></div>;
}

function PercentageSkeleton() {
  return <div className="h-4 w-16 bg-muted/50 rounded animate-pulse"></div>;
}

function TextSkeleton({ width = "w-20" }: { width?: string }) {
  return (
    <div className={`h-4 ${width} bg-muted/50 rounded animate-pulse`}></div>
  );
}

function SmallCountSkeleton() {
  return <div className="h-4 w-8 bg-muted/50 rounded animate-pulse"></div>;
}

// List skeleton components
function SegmentSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
        <div className="space-y-1">
          <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
          <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
        </div>
      </div>
      <div className="text-right space-y-1">
        <div className="h-4 w-8 bg-muted animate-pulse rounded ml-auto"></div>
        <div className="h-3 w-16 bg-muted animate-pulse rounded ml-auto"></div>
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-border/30">
      <td className="p-4">
        <div className="space-y-1">
          <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
          <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
        </div>
      </td>
      <td className="p-4">
        <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
      </td>
      <td className="p-4 text-center">
        <div className="h-6 w-16 bg-muted animate-pulse rounded mx-auto"></div>
      </td>
      <td className="p-4 text-center">
        <div className="space-y-2">
          <div className="h-4 w-16 bg-muted animate-pulse rounded mx-auto"></div>
          <div className="h-2 w-20 bg-muted animate-pulse rounded mx-auto"></div>
        </div>
      </td>
      <td className="p-4 text-center">
        <div className="h-4 w-8 bg-muted animate-pulse rounded mx-auto"></div>
      </td>
      <td className="p-4 text-center">
        <div className="h-4 w-12 bg-muted animate-pulse rounded mx-auto"></div>
      </td>
      <td className="p-4 text-center">
        <div className="h-4 w-12 bg-muted animate-pulse rounded mx-auto"></div>
      </td>
    </tr>
  );
}

function AdminAnalytics() {
  const { data: analytics, isLoading } = useQuery(analyticsQuery);
  const { data: blogAnalytics, isLoading: blogLoading } = useQuery(blogAnalyticsQuery);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);

  const filteredSegments = selectedModule
    ? analytics?.segmentAnalytics.filter((s) => s.moduleId === selectedModule)
    : analytics?.segmentAnalytics;

  return (
    <Page>
      <PageHeader
        title="Course Analytics"
        highlightedWord="Analytics"
        description="Comprehensive insights into user engagement, course performance, and revenue metrics"
      />

      {/* Key Metrics Overview */}
      <div
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12 animate-in fade-in slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "0.1s", animationFillMode: "both" }}
      >
        <StatsCard
          icon={Users}
          iconColor="text-blue-500 dark:text-blue-400"
          iconBgColor="bg-blue-500/10 dark:bg-blue-400/20"
          title="Total Users"
          value={isLoading ? null : analytics?.userStats.totalUsers}
          description="All registered users"
          hoverColor="group-hover:text-blue-600 dark:group-hover:text-blue-400"
          animationDelay="0.2s"
        />

        <StatsCard
          icon={Award}
          iconColor="text-theme-500 dark:text-theme-400"
          iconBgColor="bg-theme-500/10 dark:bg-theme-400/20"
          title="Premium Members"
          value={isLoading ? null : analytics?.userStats.premiumUsers}
          description={
            isLoading
              ? null
              : `${analytics?.userStats.conversionRate}% conversion rate`
          }
          hoverColor="group-hover:text-theme-600 dark:group-hover:text-theme-400"
          animationDelay="0.3s"
        />

        <StatsCard
          icon={DollarSign}
          iconColor="text-green-500 dark:text-green-400"
          iconBgColor="bg-green-500/10 dark:bg-green-400/20"
          title="Total Revenue"
          value={
            isLoading
              ? null
              : `$${((analytics?.overallStats.totalRevenue || 0) / 100).toLocaleString()}`
          }
          description="From affiliate referrals"
          hoverColor="group-hover:text-green-600 dark:group-hover:text-green-400"
          animationDelay="0.4s"
        />

        <StatsCard
          icon={Activity}
          iconColor="text-purple-500 dark:text-purple-400"
          iconBgColor="bg-purple-500/10 dark:bg-purple-400/20"
          title="Avg Progress"
          value={
            isLoading ? null : analytics?.overallStats.averageProgressPerUser
          }
          description="Segments per user"
          hoverColor="group-hover:text-purple-600 dark:group-hover:text-purple-400"
          animationDelay="0.5s"
        />
      </div>

      {/* Top Performing Content */}
      <div
        className="grid gap-6 lg:grid-cols-2 mb-12 animate-in fade-in slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "0.6s", animationFillMode: "both" }}
      >
        {/* Most Completed Segments */}
        <AppCard
          icon={TrendingUp}
          iconColor="theme"
          title="Top Performing Segments"
          description="Segments with highest completion rates"
          className="animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "0.7s", animationFillMode: "both" }}
        >
          <div className="space-y-4">
            {isLoading
              ? [...Array(5)].map((_, idx) => <SegmentSkeleton key={idx} />)
              : analytics?.topPerformingSegments.map((segment, index) => (
                  <div
                    key={segment.segmentId}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-theme-500/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-theme-600 dark:text-theme-400">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <Link
                          to="/learn/$slug"
                          params={{ slug: segment.segmentSlug }}
                          className="font-medium text-foreground hover:text-theme-600 dark:hover:text-theme-400 transition-colors"
                        >
                          {segment.segmentTitle}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {segment.moduleTitle}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-theme-600 dark:text-theme-400">
                        {segment.completedCount}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        completions
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </AppCard>

        {/* Most Commented Segments */}
        <AppCard
          icon={MessageSquare}
          iconColor="orange"
          title="Most Discussed Segments"
          description="Segments generating the most engagement"
          className="animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "0.8s", animationFillMode: "both" }}
        >
          <div className="space-y-4">
            {isLoading
              ? [...Array(5)].map((_, idx) => <SegmentSkeleton key={idx} />)
              : analytics?.mostCommentedSegments.map((segment, index) => (
                  <div
                    key={segment.segmentId}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <Link
                          to="/learn/$slug"
                          params={{ slug: segment.segmentSlug }}
                          className="font-medium text-foreground hover:text-theme-600 dark:hover:text-theme-400 transition-colors"
                        >
                          {segment.segmentTitle}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {segment.moduleTitle}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-orange-600 dark:text-orange-400">
                        {segment.commentCount}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        comments
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </AppCard>
      </div>

      {/* Blog Analytics */}
      <div
        className="mb-12 animate-in fade-in slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "0.8s", animationFillMode: "both" }}
      >
        <div className="module-card">
          <div className="p-6 border-b border-border/50">
            <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-6 w-6 text-theme-500" />
              Blog Analytics
            </h2>
            <p className="text-muted-foreground">
              Performance metrics for your blog posts
            </p>
          </div>
          <div className="p-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {/* Total Posts */}
              <div className="text-center">
                <div className="text-3xl font-bold text-theme-600 dark:text-theme-400 mb-2">
                  {blogLoading ? (
                    <CountSkeleton />
                  ) : (
                    blogAnalytics?.totalPosts || 0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Total Posts</div>
              </div>
              
              {/* Published Posts */}
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {blogLoading ? (
                    <CountSkeleton />
                  ) : (
                    blogAnalytics?.publishedPosts || 0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Published</div>
              </div>
              
              {/* Total Views */}
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {blogLoading ? (
                    <CountSkeleton />
                  ) : (
                    blogAnalytics?.totalViews || 0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </div>
              
              {/* Avg Views per Post */}
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {blogLoading ? (
                    <CountSkeleton />
                  ) : (
                    Math.round((blogAnalytics?.totalViews || 0) / (blogAnalytics?.publishedPosts || 1))
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Avg Views/Post</div>
              </div>
            </div>
            
            {/* Most Viewed Posts */}
            {blogAnalytics?.mostViewedPosts && blogAnalytics.mostViewedPosts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-500" />
                  Most Viewed Posts
                </h3>
                <div className="space-y-3">
                  {blogAnalytics.mostViewedPosts.slice(0, 5).map((post, index) => (
                    <div key={post.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            #{index + 1}
                          </span>
                        </div>
                        <div>
                          <Link
                            to="/blog/$slug"
                            params={{ slug: post.slug }}
                            className="font-medium text-foreground hover:text-theme-600 dark:hover:text-theme-400 transition-colors"
                          >
                            {post.title}
                          </Link>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                          {post.viewCount}
                        </div>
                        <div className="text-sm text-muted-foreground">views</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Module Filter */}
      <div
        className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "0.9s", animationFillMode: "both" }}
      >
        <div className="flex flex-wrap gap-2">
          {isLoading ? (
            <>
              <div className="h-9 w-24 bg-muted animate-pulse rounded-lg"></div>
              {[...Array(3)].map((_, idx) => (
                <div
                  key={idx}
                  className="h-9 w-20 bg-muted animate-pulse rounded-lg"
                ></div>
              ))}
            </>
          ) : (
            <>
              <button
                onClick={() => setSelectedModule(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedModule === null
                    ? "bg-theme-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                All Modules
              </button>
              {analytics?.moduleAnalytics.map((module) => (
                <button
                  key={module.id}
                  onClick={() => setSelectedModule(module.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedModule === module.id
                      ? "bg-theme-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {module.title}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Detailed Analytics Table */}
      <div
        className="module-card animate-in fade-in slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "1.0s", animationFillMode: "both" }}
      >
        <div className="p-6 border-b border-border/50">
          <h2 className="text-2xl font-semibold mb-2">
            {selectedModule ? "Module" : "All"} Segment Analytics
          </h2>
          <p className="text-muted-foreground">
            Detailed performance metrics for each segment
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left p-4 font-semibold">Segment</th>
                <th className="text-left p-4 font-semibold">Module</th>
                <th className="text-center p-4 font-semibold">Type</th>
                <th className="text-center p-4 font-semibold">Completion</th>
                <th className="text-center p-4 font-semibold">Comments</th>
                <th className="text-center p-4 font-semibold">Length</th>
                <th className="text-center p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(5)].map((_, idx) => <TableRowSkeleton key={idx} />)
                : filteredSegments?.map((segment, index) => (
                    <tr
                      key={segment.id}
                      className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${
                        index % 2 === 0 ? "" : "bg-muted/10"
                      }`}
                    >
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-foreground">
                            {segment.title}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Order: {segment.order}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {segment.moduleTitle}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <Badge
                          variant={segment.isPremium ? "default" : "secondary"}
                          className={segment.isPremium ? "bg-theme-500" : ""}
                        >
                          {segment.isPremium ? "Premium" : "Free"}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            <div className="text-sm font-semibold">
                              {segment.completionRate}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ({segment.completedCount}/{segment.totalUsers})
                            </div>
                          </div>
                          <Progress
                            value={segment.completionRate}
                            className="w-20 h-2"
                          />
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {segment.commentCount}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {segment.length || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <Link
                          to="/learn/$slug"
                          params={{ slug: segment.slug }}
                          className="inline-flex items-center gap-1 text-sm text-theme-600 dark:text-theme-400 hover:text-theme-700 dark:hover:text-theme-300 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </Page>
  );
}
