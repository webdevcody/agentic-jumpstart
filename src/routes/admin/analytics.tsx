import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAnalyticsDashboardDataFn } from "~/fn/analytics";
import {
  TrendingUp,
  Users,
  Award,
  BarChart3,
  Play,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  Clock,
  Target,
  Activity,
  DollarSign,
  UserCheck,
  BookOpen,
} from "lucide-react";
import { adminMiddleware } from "~/lib/auth";
import { queryOptions } from "@tanstack/react-query";
import { Progress } from "~/components/ui/progress";
import { Badge } from "~/components/ui/badge";
import { assertIsAdminFn } from "~/fn/auth";
import { Page } from "./-components/page";
import { PageHeader } from "./-components/page-header";

const analyticsQuery = queryOptions({
  queryKey: ["admin", "analytics"],
  queryFn: () => getAnalyticsDashboardDataFn(),
});

export const Route = createFileRoute("/admin/analytics")({
  beforeLoad: () => assertIsAdminFn(),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(analyticsQuery);
  },
  component: AdminAnalytics,
});

function AdminAnalytics() {
  const { data: analytics } = useSuspenseQuery(analyticsQuery);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);

  const filteredSegments = selectedModule
    ? analytics.segmentAnalytics.filter((s) => s.moduleId === selectedModule)
    : analytics.segmentAnalytics;

  return (
    <Page>
      <PageHeader
        title="Course Analytics"
        highlightedWord="Analytics"
        description="Comprehensive insights into user engagement, course performance, and revenue metrics"
      />

      {/* Key Metrics Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
            {/* Total Users */}
            <div className="group relative">
              <div className="module-card p-6 h-full">
                <div className="flex flex-row items-center justify-between space-y-0 mb-4">
                  <div className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 dark:bg-blue-400/20 flex items-center justify-center group-hover:bg-blue-500/20 dark:group-hover:bg-blue-400/30 transition-colors duration-300">
                    <Users className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  {analytics.userStats.totalUsers.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  All registered users
                </p>
              </div>
            </div>

            {/* Premium Members */}
            <div className="group relative">
              <div className="module-card p-6 h-full">
                <div className="flex flex-row items-center justify-between space-y-0 mb-4">
                  <div className="text-sm font-medium text-muted-foreground">
                    Premium Members
                  </div>
                  <div className="w-10 h-10 rounded-full bg-theme-500/10 dark:bg-theme-400/20 flex items-center justify-center group-hover:bg-theme-500/20 dark:group-hover:bg-theme-400/30 transition-colors duration-300">
                    <Award className="h-5 w-5 text-theme-500 dark:text-theme-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground mb-2 group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors duration-300">
                  {analytics.userStats.premiumUsers.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  {analytics.userStats.conversionRate}% conversion rate
                </p>
              </div>
            </div>

            {/* Revenue */}
            <div className="group relative">
              <div className="module-card p-6 h-full">
                <div className="flex flex-row items-center justify-between space-y-0 mb-4">
                  <div className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-500/10 dark:bg-green-400/20 flex items-center justify-center group-hover:bg-green-500/20 dark:group-hover:bg-green-400/30 transition-colors duration-300">
                    <DollarSign className="h-5 w-5 text-green-500 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                  $
                  {(analytics.overallStats.totalRevenue / 100).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  From affiliate referrals
                </p>
              </div>
            </div>

            {/* Average Progress */}
            <div className="group relative">
              <div className="module-card p-6 h-full">
                <div className="flex flex-row items-center justify-between space-y-0 mb-4">
                  <div className="text-sm font-medium text-muted-foreground">
                    Avg Progress
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 dark:bg-purple-400/20 flex items-center justify-center group-hover:bg-purple-500/20 dark:group-hover:bg-purple-400/30 transition-colors duration-300">
                    <Activity className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                  {analytics.overallStats.averageProgressPerUser}
                </div>
                <p className="text-sm text-muted-foreground">
                  Segments per user
                </p>
              </div>
            </div>
          </div>

      {/* Top Performing Content */}
      <div className="grid gap-6 lg:grid-cols-2 mb-12">
            {/* Most Completed Segments */}
            <div className="module-card">
              <div className="p-6 border-b border-border/50">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-theme-500" />
                  Top Performing Segments
                </h2>
                <p className="text-muted-foreground text-sm">
                  Segments with highest completion rates
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {analytics.topPerformingSegments.map((segment, index) => (
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
              </div>
            </div>

            {/* Most Commented Segments */}
            <div className="module-card">
              <div className="p-6 border-b border-border/50">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-orange-500" />
                  Most Discussed Segments
                </h2>
                <p className="text-muted-foreground text-sm">
                  Segments generating the most engagement
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {analytics.mostCommentedSegments.map((segment, index) => (
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
              </div>
            </div>
          </div>

          {/* Module Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
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
              {analytics.moduleAnalytics.map((module) => (
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
            </div>
          </div>

      {/* Detailed Analytics Table */}
      <div className="module-card">
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
                    <th className="text-center p-4 font-semibold">
                      Completion
                    </th>
                    <th className="text-center p-4 font-semibold">Comments</th>
                    <th className="text-center p-4 font-semibold">Length</th>
                    <th className="text-center p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSegments.map((segment, index) => (
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
