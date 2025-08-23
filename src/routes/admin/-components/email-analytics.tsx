import { useMemo } from "react";
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
  Area,
  AreaChart,
} from "recharts";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Calendar,
  Loader2,
} from "lucide-react";
import { parseISO, format, getDate } from "date-fns";

interface EmailAnalyticsProps {
  analyticsData: Array<{ date: string; count: number }> | undefined;
  analyticsLoading: boolean;
  analyticsDate: { year: number; month: number };
  analyticsType: "waitlist" | "newsletter";
  setAnalyticsDate: (date: { year: number; month: number }) => void;
  setAnalyticsType: (type: "waitlist" | "newsletter") => void;
}

export function EmailAnalytics({
  analyticsData,
  analyticsLoading,
  analyticsDate,
  analyticsType,
  setAnalyticsDate,
  setAnalyticsType,
}: EmailAnalyticsProps) {
  // Month navigation functions
  const goToPreviousMonth = () => {
    setAnalyticsDate((prev) => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const goToNextMonth = () => {
    setAnalyticsDate((prev) => {
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

  // Transform analytics data for charts
  const chartData = useMemo(() => {
    if (!analyticsData) return [];
    return analyticsData.map((item) => ({
      ...item,
      day: getDate(parseISO(item.date)),
      formattedDate: format(parseISO(item.date), "MMM d"),
    }));
  }, [analyticsData]);

  return (
    <div className="p-6">
      {analyticsLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-theme-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {chartData
                  .reduce((sum, item) => sum + item.count, 0)
                  .toLocaleString()}
              </div>
              <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                Total Signups
              </p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {chartData.length > 0
                  ? (
                      chartData.reduce((sum, item) => sum + item.count, 0) / 30
                    ).toFixed(1)
                  : "0"}
              </div>
              <p className="text-sm text-green-600/80 dark:text-green-400/80">
                Daily Average
              </p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {chartData.length > 0
                  ? Math.max(
                      ...chartData.map((item) => item.count)
                    ).toLocaleString()
                  : "0"}
              </div>
              <p className="text-sm text-purple-600/80 dark:text-purple-400/80">
                Peak Day
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-8">
            {chartData.length > 0 ? (
              <>
                {/* Area Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Signup Trend Over Time
                  </h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="opacity-30"
                        />
                        <XAxis
                          dataKey="day"
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
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                  <p className="font-medium">
                                    {data.formattedDate}
                                  </p>
                                  <p className="text-theme-600 dark:text-theme-400">
                                    Signups: {payload[0].value}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#3b82f6"
                          fill="url(#colorGradient)"
                          strokeWidth={2}
                        />
                        <defs>
                          <linearGradient
                            id="colorGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#3b82f6"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#3b82f6"
                              stopOpacity={0.05}
                            />
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bar Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Daily Signup Volume
                  </h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="opacity-30"
                        />
                        <XAxis
                          dataKey="day"
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
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                  <p className="font-medium">
                                    {data.formattedDate}
                                  </p>
                                  <p className="text-theme-600 dark:text-theme-400">
                                    Signups: {payload[0].value}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <BarChart3 className="h-16 w-16 mx-auto mb-6 opacity-30" />
                <p className="text-lg">No signup data available</p>
                <p className="text-sm">
                  No {analyticsType} signups found for{" "}
                  {formatMonthYear(analyticsDate.year, analyticsDate.month)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface EmailAnalyticsHeaderProps {
  analyticsDate: { year: number; month: number };
  analyticsType: "waitlist" | "newsletter";
  setAnalyticsDate: (
    fn: (prev: { year: number; month: number }) => {
      year: number;
      month: number;
    }
  ) => void;
  setAnalyticsType: (type: "waitlist" | "newsletter") => void;
}

export function EmailAnalyticsHeader({
  analyticsDate,
  analyticsType,
  setAnalyticsDate,
  setAnalyticsType,
}: EmailAnalyticsHeaderProps) {
  const goToPreviousMonth = () => {
    setAnalyticsDate((prev) => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const goToNextMonth = () => {
    setAnalyticsDate((prev) => {
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

  return (
    <div className="p-6 border-b border-border/50">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-theme-500" />
            Email Signup Analytics
          </h2>
          <p className="text-muted-foreground">
            Track email signups over time with detailed charts
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-4">
          <Select
            value={analyticsType}
            onValueChange={(value: "waitlist" | "newsletter") =>
              setAnalyticsType(value)
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="waitlist">Waitlist</SelectItem>
              <SelectItem value="newsletter">Newsletter</SelectItem>
            </SelectContent>
          </Select>

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
              {formatMonthYear(analyticsDate.year, analyticsDate.month)}
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
      </div>
    </div>
  );
}
