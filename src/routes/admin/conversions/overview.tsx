import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { 
  getDailyConversionsFn,
} from "~/fn/analytics";
import {
  BarChart3,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
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

  // Calculate date range for the selected month
  const dateRange = useMemo(() => {
    const start = startOfMonth(new Date(selectedDate.year, selectedDate.month - 1));
    const end = endOfMonth(new Date(selectedDate.year, selectedDate.month - 1));
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, [selectedDate]);

  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ["dailyConversions", selectedDate.year, selectedDate.month],
    queryFn: () => getDailyConversionsFn({ 
      data: { 
        start: dateRange.start, 
        end: dateRange.end 
      } 
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
    return dailyData
      .map((item) => ({
        ...item,
        formattedDate: format(parseISO(item.date), "MMM d"),
        day: format(parseISO(item.date), "d"),
      }))
      .reverse(); // Reverse to show chronological order
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
            Track conversions, purchase intent, and sessions over time
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
                Sessions, Purchase Intent & Conversions Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                                  <p className="font-medium">{label}</p>
                                  {payload.map((entry, index) => (
                                    <p key={index} style={{ color: entry.color }}>
                                      {entry.dataKey === 'sessions' && 'Total Sessions: '}
                                      {entry.dataKey === 'purchaseIntent' && 'Purchase Intent: '}
                                      {entry.dataKey === 'conversions' && 'Conversions: '}
                                      {entry.value}
                                    </p>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="sessions"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ fill: "#3b82f6", r: 4 }}
                          name="Total Sessions"
                        />
                        <Line
                          type="monotone"
                          dataKey="purchaseIntent"
                          stroke="#f59e0b"
                          strokeWidth={3}
                          dot={{ fill: "#f59e0b", r: 4 }}
                          name="Purchase Intent"
                        />
                        <Line
                          type="monotone"
                          dataKey="conversions"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ fill: "#10b981", r: 4 }}
                          name="Conversions"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
                
                <TabsContent value="bar">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
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
                                  <p className="font-medium">{label}</p>
                                  {payload.map((entry, index) => (
                                    <p key={index} style={{ color: entry.color }}>
                                      {entry.dataKey === 'sessions' && 'Total Sessions: '}
                                      {entry.dataKey === 'purchaseIntent' && 'Purchase Intent: '}
                                      {entry.dataKey === 'conversions' && 'Conversions: '}
                                      {entry.value}
                                    </p>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="sessions"
                          fill="#3b82f6"
                          name="Total Sessions"
                        />
                        <Bar
                          dataKey="purchaseIntent"
                          fill="#f59e0b"
                          name="Purchase Intent"
                        />
                        <Bar
                          dataKey="conversions"
                          fill="#10b981"
                          name="Conversions"
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
                {formatMonthYear(selectedDate.year, selectedDate.month)}. 
                Charts will appear here once you have conversion tracking data.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}