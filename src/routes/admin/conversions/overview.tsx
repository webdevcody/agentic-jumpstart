import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { getDailyConversionsFn } from "~/fn/analytics";
import {
  BarChart3,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShoppingCart,
  CreditCard,
  Megaphone,
  MousePointerClick,
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
  BarChart,
  Bar,
} from "recharts";
import { useMemo, useState } from "react";
import { parseISO, format, startOfMonth, endOfMonth } from "date-fns";

// Data series configuration
const DATA_SERIES = {
  pageViews: {
    key: "pageViews",
    label: "Page Views",
    color: "#3b82f6",
    icon: Eye,
  },
  googleAdsPageViews: {
    key: "googleAdsPageViews",
    label: "Google Ads Clicks",
    color: "#8b5cf6",
    icon: MousePointerClick,
  },
  purchaseIntent: {
    key: "purchaseIntent",
    label: "Purchase Intent",
    color: "#f59e0b",
    icon: ShoppingCart,
  },
  purchaseCompleted: {
    key: "purchaseCompleted",
    label: "Purchases",
    color: "#10b981",
    icon: CreditCard,
  },
  googleAdsPurchases: {
    key: "googleAdsPurchases",
    label: "Google Ads Purchases",
    color: "#ec4899",
    icon: Megaphone,
  },
} as const;

type SeriesKey = keyof typeof DATA_SERIES;

export const Route = createFileRoute("/admin/conversions/overview")({
  component: OverviewPage,
});

function OverviewPage() {
  // State for month navigation
  const currentDate = new Date();
  const [selectedDate, setSelectedDate] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
  });

  // State for selected metric tab
  const [selectedMetric, setSelectedMetric] =
    useState<SeriesKey>("purchaseCompleted");

  // Calculate date range for the selected month
  const dateRange = useMemo(() => {
    const start = startOfMonth(
      new Date(selectedDate.year, selectedDate.month - 1)
    );
    const end = endOfMonth(new Date(selectedDate.year, selectedDate.month - 1));
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, [selectedDate]);

  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ["dailyConversions", selectedDate.year, selectedDate.month],
    queryFn: () =>
      getDailyConversionsFn({
        data: {
          start: dateRange.start,
          end: dateRange.end,
        },
      }),
  });

  // Month navigation functions
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

  // Transform daily data for charts
  const chartData = useMemo(() => {
    if (!dailyData) return [];
    return dailyData.map((item) => ({
      ...item,
      formattedDate: format(parseISO(item.date), "MMM d"),
      day: format(parseISO(item.date), "d"),
    }));
  }, [dailyData]);

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-theme-500" />
            Conversion Overview
          </h2>
          <p className="text-muted-foreground">
            Track page views, purchase intent, and purchase completions over
            time
          </p>
        </div>

        {/* Month Navigation */}
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

      {/* Charts Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Conversion Trends</h3>
        {dailyLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-theme-500"></div>
          </div>
        ) : chartData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Conversion Analytics Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Metric Selection Tabs */}
              <Tabs
                value={selectedMetric}
                onValueChange={(value) => setSelectedMetric(value as SeriesKey)}
                className="w-full mb-6"
              >
                <TabsList className="grid grid-cols-5 w-full bg-transparent border-0 p-0 gap-2">
                  {(Object.keys(DATA_SERIES) as SeriesKey[]).map((key) => {
                    const series = DATA_SERIES[key];
                    const Icon = series.icon;
                    const isSelected = selectedMetric === key;
                    return (
                      <TabsTrigger
                        key={key}
                        value={key}
                        className="flex items-center gap-2 rounded-lg border-2 data-[state=active]:shadow-none"
                        style={{
                          backgroundColor: series.color,
                          borderColor: isSelected ? "#60a5fa" : series.color,
                          color: "white",
                          borderWidth: isSelected ? "2px" : "2px",
                        }}
                      >
                        <Icon className="h-4 w-4" />
                        {series.label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>

              <Tabs defaultValue="line" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="line" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Line Chart
                  </TabsTrigger>
                  <TabsTrigger value="bar" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Bar Chart
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="line">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="opacity-30"
                        />
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
                                  {payload.map((entry, index) => {
                                    const seriesKey =
                                      entry.dataKey as SeriesKey;
                                    const series = DATA_SERIES[seriesKey];
                                    return (
                                      <p
                                        key={index}
                                        style={{ color: entry.color }}
                                        className="text-sm"
                                      >
                                        {series?.label || entry.dataKey}:{" "}
                                        {entry.value}
                                      </p>
                                    );
                                  })}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey={selectedMetric}
                          stroke={DATA_SERIES[selectedMetric].color}
                          strokeWidth={3}
                          dot={{
                            fill: DATA_SERIES[selectedMetric].color,
                            r: 4,
                          }}
                          name={DATA_SERIES[selectedMetric].label}
                          strokeDasharray={
                            selectedMetric === "googleAdsPurchases"
                              ? "5 5"
                              : undefined
                          }
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="bar">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="opacity-30"
                        />
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
                                  {payload.map((entry, index) => {
                                    const seriesKey =
                                      entry.dataKey as SeriesKey;
                                    const series = DATA_SERIES[seriesKey];
                                    return (
                                      <p
                                        key={index}
                                        style={{ color: entry.color }}
                                        className="text-sm"
                                      >
                                        {series?.label || entry.dataKey}:{" "}
                                        {entry.value}
                                      </p>
                                    );
                                  })}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey={selectedMetric}
                          fill={DATA_SERIES[selectedMetric].color}
                          name={DATA_SERIES[selectedMetric].label}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center text-muted-foreground py-12">
              <BarChart3 className="h-16 w-16 mx-auto mb-6 opacity-30" />
              <p className="text-lg">No conversion data available</p>
              <p className="text-sm">
                No conversion data found for{" "}
                {formatMonthYear(selectedDate.year, selectedDate.month)}. Charts
                will appear here once you have conversion tracking data.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
