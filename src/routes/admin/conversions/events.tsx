import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  getEventTypeCountsFn, 
} from "~/fn/analytics";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const Route = createFileRoute("/admin/conversions/events")({
  component: EventsPage,
});

function EventsPage() {
  const currentDate = new Date();
  const [selectedDate, setSelectedDate] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
  });

  const startDate = new Date(selectedDate.year, selectedDate.month - 1, 1);
  const endDate = new Date(selectedDate.year, selectedDate.month, 0, 23, 59, 59);

  const { data: eventTypeCounts, isLoading: eventTypesLoading } = useQuery({
    queryKey: ["eventTypeCounts", selectedDate.year, selectedDate.month],
    queryFn: () => getEventTypeCountsFn({ 
      data: { 
        start: startDate.toISOString(),
        end: endDate.toISOString(),
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">Event Type Analytics</h3>
          <p className="text-muted-foreground text-sm">
            Analytics events for {formatMonthYear(selectedDate.year, selectedDate.month)}
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
      
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-theme-500" />
              Event Type Counts
            </CardTitle>
            <p className="text-muted-foreground">
              Breakdown of different analytics events tracked across sessions
            </p>
          </CardHeader>
          <CardContent>
            {eventTypesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                  </div>
                ))}
              </div>
            ) : eventTypeCounts && eventTypeCounts.length > 0 ? (
              <div className="space-y-3">
                {eventTypeCounts.map((event, index) => (
                  <div key={event.eventType} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-theme-500/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-theme-600 dark:text-theme-400">
                          #{index + 1}
                        </span>
                      </div>
                      <span className="font-medium capitalize">{event.eventType.replace('_', ' ')}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-theme-600 dark:text-theme-400">
                        {event.count}
                      </div>
                      <div className="text-sm text-muted-foreground">events</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground mb-2">No events tracked yet</h3>
                <p className="text-sm text-muted-foreground">
                  No analytics events found for {formatMonthYear(selectedDate.year, selectedDate.month)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}