import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { queryOptions } from "@tanstack/react-query";
import { getEmailAnalyticsFn } from "~/fn/emails";
import {
  EmailAnalytics,
  EmailAnalyticsHeader,
} from "./-components/email-analytics";

const emailAnalyticsQueryOptions = (
  year: number,
  month: number,
  type: "waitlist" | "newsletter"
) =>
  queryOptions({
    queryKey: ["admin", "emailAnalytics", year, month, type],
    queryFn: () => getEmailAnalyticsFn({ data: { year, month, type } }),
  });

export const Route = createFileRoute("/admin/emails/analytics")({
  component: EmailAnalyticsPage,
});

function EmailAnalyticsPage() {
  const currentDate = new Date();
  const [analyticsDate, setAnalyticsDate] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
  });
  const [analyticsType, setAnalyticsType] = useState<"waitlist" | "newsletter">(
    "waitlist"
  );

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery(
    emailAnalyticsQueryOptions(
      analyticsDate.year,
      analyticsDate.month,
      analyticsType
    )
  );

  return (
    <div
      className="module-card"
    >
      <EmailAnalyticsHeader
        analyticsDate={analyticsDate}
        analyticsType={analyticsType}
        setAnalyticsDate={setAnalyticsDate}
        setAnalyticsType={setAnalyticsType}
      />
      <EmailAnalytics
        analyticsData={analyticsData}
        analyticsLoading={analyticsLoading}
        analyticsDate={analyticsDate}
        analyticsType={analyticsType}
        setAnalyticsDate={setAnalyticsDate}
        setAnalyticsType={setAnalyticsType}
      />
    </div>
  );
}
