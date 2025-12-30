import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  getUniqueUtmCampaignsFn,
  getDailyUtmPageViewsFn,
  getUtmStatsFn,
} from "~/fn/analytics";
import { assertIsAdminFn } from "~/fn/auth";
import {
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Target,
  Link2,
  Megaphone,
  BarChart3,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useMemo, useState } from "react";
import { parseISO, format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Page } from "./-components/page";
import { PageHeader } from "./-components/page-header";
import { StatsCard } from "~/components/stats-card";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/admin/utm-analytics")({
  beforeLoad: () => assertIsAdminFn(),
  component: UtmAnalyticsPage,
});

// Color palette for different campaigns
const CAMPAIGN_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
];

function UtmAnalyticsPage() {
  const currentDate = new Date();
  const [selectedDate, setSelectedDate] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
  });

  // Track which campaigns are enabled for the chart
  const [enabledCampaigns, setEnabledCampaigns] = useState<Set<string>>(new Set());

  const dateRange = useMemo(() => {
    const start = startOfMonth(new Date(selectedDate.year, selectedDate.month - 1));
    const end = endOfMonth(new Date(selectedDate.year, selectedDate.month - 1));
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, [selectedDate]);

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["utmCampaigns", selectedDate.year, selectedDate.month],
    queryFn: () =>
      getUniqueUtmCampaignsFn({
        data: {
          start: dateRange.start,
          end: dateRange.end,
        },
      }),
  });

  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ["dailyUtmPageViews", selectedDate.year, selectedDate.month],
    queryFn: () =>
      getDailyUtmPageViewsFn({
        data: {
          start: dateRange.start,
          end: dateRange.end,
        },
      }),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["utmStats", selectedDate.year, selectedDate.month],
    queryFn: () =>
      getUtmStatsFn({
        data: {
          start: dateRange.start,
          end: dateRange.end,
        },
      }),
  });

  // Get unique campaign keys for toggle buttons
  const uniqueCampaignKeys = useMemo(() => {
    if (!campaigns) return [];
    const keys = new Map<string, { campaign: string; source: string | null; medium: string | null; count: number }>();
    campaigns.forEach((c) => {
      const key = `${c.utmCampaign || "unknown"}`;
      if (!keys.has(key)) {
        keys.set(key, {
          campaign: c.utmCampaign || "unknown",
          source: c.utmSource,
          medium: c.utmMedium,
          count: c.totalEvents,
        });
      } else {
        const existing = keys.get(key)!;
        existing.count += c.totalEvents;
      }
    });
    return Array.from(keys.values()).sort((a, b) => b.count - a.count);
  }, [campaigns]);

  // Initialize enabled campaigns when data loads
  useMemo(() => {
    if (uniqueCampaignKeys.length > 0 && enabledCampaigns.size === 0) {
      // Enable top 3 campaigns by default
      const topCampaigns = uniqueCampaignKeys.slice(0, 3).map(c => c.campaign);
      setEnabledCampaigns(new Set(topCampaigns));
    }
  }, [uniqueCampaignKeys]);

  // Transform daily data for the chart with dynamic campaign columns
  const chartData = useMemo(() => {
    if (!dailyData) return [];

    // Get all dates in the range
    const start = startOfMonth(new Date(selectedDate.year, selectedDate.month - 1));
    const end = endOfMonth(new Date(selectedDate.year, selectedDate.month - 1));
    const allDates = eachDayOfInterval({ start, end });

    // Create a map of date -> campaign -> pageViews
    const dateMap = new Map<string, Record<string, number>>();

    allDates.forEach(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      dateMap.set(dateStr, {});
    });

    dailyData.forEach((item) => {
      const dateStr = item.date;
      const campaignKey = item.utmCampaign || "unknown";

      if (dateMap.has(dateStr)) {
        const existing = dateMap.get(dateStr)!;
        existing[campaignKey] = (existing[campaignKey] || 0) + item.pageViews;
      }
    });

    // Convert to array format for recharts
    return Array.from(dateMap.entries()).map(([date, campaigns]) => ({
      date,
      formattedDate: format(parseISO(date), "MMM d"),
      ...campaigns,
    }));
  }, [dailyData, selectedDate]);

  // Get campaign color
  const getCampaignColor = (campaignName: string) => {
    const index = uniqueCampaignKeys.findIndex(c => c.campaign === campaignName);
    return CAMPAIGN_COLORS[index % CAMPAIGN_COLORS.length];
  };

  // Toggle campaign visibility
  const toggleCampaign = (campaign: string) => {
    setEnabledCampaigns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(campaign)) {
        newSet.delete(campaign);
      } else {
        newSet.add(campaign);
      }
      return newSet;
    });
  };

  // Enable/disable all campaigns
  const toggleAllCampaigns = () => {
    if (enabledCampaigns.size === uniqueCampaignKeys.length) {
      setEnabledCampaigns(new Set());
    } else {
      setEnabledCampaigns(new Set(uniqueCampaignKeys.map(c => c.campaign)));
    }
  };

  const goToPreviousMonth = () => {
    setSelectedDate((prev) => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const goToNextMonth = () => {
    setSelectedDate((prev) => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const formatMonthYear = (year: number, month: number) => {
    return new Date(year, month - 1).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const isLoading = campaignsLoading || dailyLoading || statsLoading;

  return (
    <Page>
      <PageHeader
        title="UTM Analytics"
        highlightedWord="UTM"
        description="Track page views and traffic from UTM campaigns, sources, and mediums"
      />

      {/* Month Navigation */}
      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold min-w-32 text-center">
            {formatMonthYear(selectedDate.year, selectedDate.month)}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          icon={TrendingUp}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          title="Total UTM Events"
          value={statsLoading ? null : stats?.totalUtmEvents}
          description="Total tracked UTM visits"
          hoverColor="group-hover:text-blue-600"
        />
        <StatsCard
          icon={Megaphone}
          iconColor="text-emerald-500"
          iconBgColor="bg-emerald-500/10"
          title="Unique Campaigns"
          value={statsLoading ? null : stats?.uniqueCampaigns}
          description="Different campaign tags"
          hoverColor="group-hover:text-emerald-600"
        />
        <StatsCard
          icon={Link2}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-500/10"
          title="Unique Sources"
          value={statsLoading ? null : stats?.uniqueSources}
          description="Traffic sources tracked"
          hoverColor="group-hover:text-amber-600"
        />
        <StatsCard
          icon={Target}
          iconColor="text-violet-500"
          iconBgColor="bg-violet-500/10"
          title="Unique Mediums"
          value={statsLoading ? null : stats?.uniqueMediums}
          description="Marketing mediums used"
          hoverColor="group-hover:text-violet-600"
        />
      </div>

      {/* Campaign Toggle Buttons */}
      {uniqueCampaignKeys.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Select Campaigns to Compare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllCampaigns}
                className="mr-2"
              >
                {enabledCampaigns.size === uniqueCampaignKeys.length ? "Deselect All" : "Select All"}
              </Button>
              {uniqueCampaignKeys.map((item) => {
                const isEnabled = enabledCampaigns.has(item.campaign);
                const color = getCampaignColor(item.campaign);
                return (
                  <Button
                    key={item.campaign}
                    variant={isEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleCampaign(item.campaign)}
                    className={cn(
                      isEnabled && "text-white"
                    )}
                    style={isEnabled ? { backgroundColor: color, borderColor: color } : {}}
                  >
                    <span
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: isEnabled ? "white" : color }}
                    />
                    {item.campaign}
                    <span className="ml-2 text-xs opacity-75">({item.count})</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            UTM Page Views Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-80">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-theme-500"></div>
            </div>
          ) : chartData.length > 0 && enabledCampaigns.size > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="formattedDate"
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: "#6b7280" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: "#6b7280" }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                            <p className="font-medium mb-2">{label}</p>
                            {payload.map((entry, index) => (
                              <p key={index} style={{ color: entry.color }} className="text-sm">
                                {entry.dataKey}: {entry.value} views
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  {uniqueCampaignKeys
                    .filter((item) => enabledCampaigns.has(item.campaign))
                    .map((item) => (
                      <Line
                        key={item.campaign}
                        type="monotone"
                        dataKey={item.campaign}
                        stroke={getCampaignColor(item.campaign)}
                        strokeWidth={2}
                        dot={{ fill: getCampaignColor(item.campaign), r: 3 }}
                        name={item.campaign}
                        connectNulls
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 text-muted-foreground">
              <BarChart3 className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg">
                {enabledCampaigns.size === 0
                  ? "Select at least one campaign to view the chart"
                  : "No UTM data available"}
              </p>
              <p className="text-sm">
                {enabledCampaigns.size === 0
                  ? "Use the toggle buttons above to select campaigns"
                  : `No UTM tracking data found for ${formatMonthYear(selectedDate.year, selectedDate.month)}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Breakdown Table */}
      {campaigns && campaigns.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Campaign Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Campaign</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Source</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Medium</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Events</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign, index) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getCampaignColor(campaign.utmCampaign || "unknown") }}
                          />
                          {campaign.utmCampaign || "-"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{campaign.utmSource || "-"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{campaign.utmMedium || "-"}</td>
                      <td className="py-3 px-4 text-right font-medium">{campaign.totalEvents.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </Page>
  );
}
