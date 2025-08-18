import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { PageHeader } from "~/routes/admin/-components/page-header";
import { Page } from "~/routes/admin/-components/page";
import { getOverallAnalyticsStatsFn } from "~/fn/analytics";
import {
  Users,
  ShoppingCart,
  Target,
  TrendingUp,
  Activity,
  Zap,
} from "lucide-react";
import { assertIsAdminFn } from "~/fn/auth";

export const Route = createFileRoute("/admin/conversions")({
  beforeLoad: () => assertIsAdminFn(),
  component: ConversionsPage,
});

function ConversionsPage() {
  const [overallStats, setOverallStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const stats = await getOverallAnalyticsStatsFn({ data: {} });
      setOverallStats(stats);
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const calculatePurchaseIntentRate = () => {
    if (!overallStats || overallStats.totalSessions === 0) return 0;
    return (overallStats.sessionsWithPurchaseIntent / overallStats.totalSessions) * 100;
  };

  const calculateOverallConversionRate = () => {
    if (!overallStats || overallStats.totalSessions === 0) return 0;
    return (overallStats.conversions / overallStats.totalSessions) * 100;
  };

  const calculateIntentToConversionRate = () => {
    if (!overallStats || overallStats.sessionsWithPurchaseIntent === 0) return 0;
    return (overallStats.conversions / overallStats.sessionsWithPurchaseIntent) * 100;
  };

  if (loading) {
    return (
      <Page>
        <PageHeader
          title="Conversion Analytics"
          highlightedWord="Conversion"
          description="Track basic session metrics and conversions."
        />
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Conversion Analytics"
        highlightedWord="Conversion"
        description="Track basic session metrics and conversions."
      />

      {overallStats && (
        <div className="space-y-6">
          {/* Raw Numbers */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Session Metrics</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Sessions
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {overallStats.totalSessions || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All user sessions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Sessions with Payment Intent
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {overallStats.sessionsWithPurchaseIntent || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sessions that showed purchase intent
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Sessions with Stripe Purchase
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {overallStats.conversions || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sessions that completed a purchase
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Conversion Rates */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Conversion Rates</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Purchase Intent Rate
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPercentage(calculatePurchaseIntentRate())}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sessions showing interest in purchasing
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Overall Conversion Rate
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPercentage(calculateOverallConversionRate())}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sessions that convert to purchases
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Intent to Purchase Rate
                  </CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPercentage(calculateIntentToConversionRate())}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Intent sessions that convert to purchases
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
