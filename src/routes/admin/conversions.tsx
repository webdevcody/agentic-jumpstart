import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { PageHeader } from "~/routes/admin/-components/page-header";
import { getOverallAnalyticsStatsFn } from "~/fn/analytics";
import {
  Users,
  ShoppingCart,
  Target,
  TrendingUp,
  Activity,
  Zap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Page } from "./-components/page";

export const Route = createFileRoute("/admin/conversions")({
  component: ConversionsPage,
  loader: ({ context }) => {
    context.queryClient.ensureQueryData({
      queryKey: ["overallAnalyticsStats"],
      queryFn: () => getOverallAnalyticsStatsFn({ data: {} }),
    });
  },
});

// Skeleton components
function CountSkeleton() {
  return <div className="h-8 w-16 bg-muted/50 rounded animate-pulse"></div>;
}

function ConversionsPage() {
  const { data: overallStats, isLoading } = useQuery({
    queryKey: ["overallAnalyticsStats"],
    queryFn: () => getOverallAnalyticsStatsFn({ data: {} }),
  });

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const calculatePurchaseIntentRate = () => {
    if (!overallStats || overallStats.totalSessions === 0) return 0;
    return (
      (overallStats.sessionsWithPurchaseIntent / overallStats.totalSessions) *
      100
    );
  };

  const calculateOverallConversionRate = () => {
    if (!overallStats || overallStats.totalSessions === 0) return 0;
    return (overallStats.conversions / overallStats.totalSessions) * 100;
  };

  const calculateIntentToConversionRate = () => {
    if (!overallStats || overallStats.sessionsWithPurchaseIntent === 0)
      return 0;
    return (
      (overallStats.conversions / overallStats.sessionsWithPurchaseIntent) * 100
    );
  };

  return (
    <Page>
      <PageHeader
        title="Conversion Analytics"
        highlightedWord="Conversion"
        description="Track basic session metrics and conversions."
      />

      <div
        className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "0.1s", animationFillMode: "both" }}
      >
        {/* Raw Numbers */}
        <div
          className="animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "0.2s", animationFillMode: "both" }}
        >
          <h3 className="text-lg font-semibold mb-4">Session Metrics</h3>
          <div
            className="grid gap-4 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: "0.3s", animationFillMode: "both" }}
          >
            <Card
              className="animate-in fade-in slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: "0.4s", animationFillMode: "both" }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Sessions
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <CountSkeleton />
                  ) : (
                    overallStats?.totalSessions || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  All user sessions
                </p>
              </CardContent>
            </Card>

            <Card
              className="animate-in fade-in slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: "0.5s", animationFillMode: "both" }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Sessions with Payment Intent
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <CountSkeleton />
                  ) : (
                    overallStats?.sessionsWithPurchaseIntent || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sessions that showed purchase intent
                </p>
              </CardContent>
            </Card>

            <Card
              className="animate-in fade-in slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: "0.6s", animationFillMode: "both" }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Sessions with Stripe Purchase
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <CountSkeleton />
                  ) : (
                    overallStats?.conversions || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sessions that completed a purchase
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Conversion Rates */}
        <div
          className="animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "0.7s", animationFillMode: "both" }}
        >
          <h3 className="text-lg font-semibold mb-4">Conversion Rates</h3>
          <div
            className="grid gap-4 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: "0.8s", animationFillMode: "both" }}
          >
            <Card
              className="animate-in fade-in slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: "0.9s", animationFillMode: "both" }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Purchase Intent Rate
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <CountSkeleton />
                  ) : (
                    formatPercentage(calculatePurchaseIntentRate())
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sessions showing interest in purchasing
                </p>
              </CardContent>
            </Card>

            <Card
              className="animate-in fade-in slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: "1.0s", animationFillMode: "both" }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Overall Conversion Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <CountSkeleton />
                  ) : (
                    formatPercentage(calculateOverallConversionRate())
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sessions that convert to purchases
                </p>
              </CardContent>
            </Card>

            <Card
              className="animate-in fade-in slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: "1.1s", animationFillMode: "both" }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Intent to Purchase Rate
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <CountSkeleton />
                  ) : (
                    formatPercentage(calculateIntentToConversionRate())
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Intent sessions that convert to purchases
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Page>
  );
}
