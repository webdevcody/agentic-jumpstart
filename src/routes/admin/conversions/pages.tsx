import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  getPopularPagesFn 
} from "~/fn/analytics";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const Route = createFileRoute("/admin/conversions/pages")({
  component: PagesPage,
});

function PagesPage() {
  const currentDate = new Date();
  const [selectedDate, setSelectedDate] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
  });

  const startDate = new Date(selectedDate.year, selectedDate.month - 1, 1);
  const endDate = new Date(selectedDate.year, selectedDate.month, 0, 23, 59, 59);

  const { data: popularPages, isLoading: popularPagesLoading } = useQuery({
    queryKey: ["popularPages", selectedDate.year, selectedDate.month],
    queryFn: () => getPopularPagesFn({ 
      data: { 
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        limit: 10 
      } 
    }),
  });

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

  const totalViews = popularPages?.reduce((sum, page) => sum + page.views, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">Page Analytics</h3>
          <p className="text-muted-foreground text-sm">
            Page views for {formatMonthYear(selectedDate.year, selectedDate.month)}
          </p>
        </div>
        
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

      {/* Total Views Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Page Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {popularPagesLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
              ) : (
                totalViews.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              For {formatMonthYear(selectedDate.year, selectedDate.month)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {popularPagesLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
              ) : (
                popularPages?.length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pages with traffic
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Views per Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {popularPagesLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
              ) : (
                popularPages && popularPages.length > 0 
                  ? Math.round(totalViews / popularPages.length).toLocaleString()
                  : 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Views per page
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              Most Popular Pages
            </CardTitle>
            <p className="text-muted-foreground">
              Pages with the highest view counts and engagement
            </p>
          </CardHeader>
          <CardContent>
            {popularPagesLoading ? (
              <div className="space-y-3">
                {[...Array(8)].map((_, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
                      <div className="h-4 w-40 bg-muted animate-pulse rounded"></div>
                    </div>
                    <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                  </div>
                ))}
              </div>
            ) : popularPages && popularPages.length > 0 ? (
              <div className="space-y-3">
                {popularPages.map((page, index) => (
                  <div key={page.pagePath} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">{page.pagePath}</span>
                        {page.pagePath !== '/' && (
                          <div className="text-sm text-muted-foreground">
                            Path: {page.pagePath}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-blue-600 dark:text-blue-400">
                        {page.views}
                      </div>
                      <div className="text-sm text-muted-foreground">views</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Eye className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground mb-2">No page views tracked yet</h3>
                <p className="text-sm text-muted-foreground">
                  No page views found for {formatMonthYear(selectedDate.year, selectedDate.month)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}