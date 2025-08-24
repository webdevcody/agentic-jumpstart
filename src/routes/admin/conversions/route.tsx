import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { PageHeader } from "../-components/page-header";
import { Page } from "../-components/page";
import { 
  getOverallAnalyticsStatsFn, 
  getEventTypeCountsFn, 
  getPopularPagesFn 
} from "~/fn/analytics";
import {
  TrendingUp,
  BarChart3,
  Eye,
} from "lucide-react";
import { assertIsAdminFn } from "~/fn/auth";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

export const Route = createFileRoute("/admin/conversions")({
  beforeLoad: () => assertIsAdminFn(),
  loader: ({ context }) => {
    // Prefetch all analytics data
    context.queryClient.ensureQueryData({
      queryKey: ["overallAnalyticsStats"],
      queryFn: () => getOverallAnalyticsStatsFn({ data: {} }),
    });
    context.queryClient.ensureQueryData({
      queryKey: ["eventTypeCounts"],
      queryFn: () => getEventTypeCountsFn({ data: {} }),
    });
    context.queryClient.ensureQueryData({
      queryKey: ["popularPages"],
      queryFn: () => getPopularPagesFn({ data: { limit: 10 } }),
    });
  },
  component: ConversionsLayout,
});

function ConversionsLayout() {
  const location = useLocation();

  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/events')) return 'events';
    if (path.includes('/pages')) return 'pages';
    return 'overview'; // default
  };

  return (
    <Page>
      <PageHeader
        title="Conversion Analytics"
        highlightedWord="Conversion"
        description="Comprehensive analytics including conversions, events, and popular pages"
      />

      <div className="w-full">
        <div className="flex flex-col gap-6">
          <Tabs value={getCurrentTab()} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <Link to="/admin/conversions/overview">
                <TabsTrigger value="overview" className="flex items-center gap-2 w-full">
                  <TrendingUp className="h-4 w-4" />
                  Overview
                </TabsTrigger>
              </Link>
              <Link to="/admin/conversions/events">
                <TabsTrigger value="events" className="flex items-center gap-2 w-full">
                  <BarChart3 className="h-4 w-4" />
                  Event Types
                </TabsTrigger>
              </Link>
              <Link to="/admin/conversions/pages">
                <TabsTrigger value="pages" className="flex items-center gap-2 w-full">
                  <Eye className="h-4 w-4" />
                  Popular Pages
                </TabsTrigger>
              </Link>
            </TabsList>
          </Tabs>

          <Outlet />
        </div>
      </div>
    </Page>
  );
}