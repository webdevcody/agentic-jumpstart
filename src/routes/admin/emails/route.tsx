import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { PageHeader } from "../-components/page-header";
import { Page } from "../-components/page";
import { HeaderStats, HeaderStatCard } from "../-components/header-stats";
import { Users, CheckCircle, Mail, Clock, Send, BarChart3 } from "lucide-react";
import { getUsersForEmailingFn } from "~/fn/emails";
import { useQuery } from "@tanstack/react-query";
import { assertIsAdminFn } from "~/fn/auth";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

const usersForEmailingQueryOptions = queryOptions({
  queryKey: ["admin", "usersForEmailing"],
  queryFn: () => getUsersForEmailingFn(),
});

export const Route = createFileRoute("/admin/emails")({
  beforeLoad: () => assertIsAdminFn(),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(usersForEmailingQueryOptions);
  },
  component: EmailsLayout,
});

function EmailsLayout() {
  const { data: usersForEmailing, isLoading: usersLoading } = useQuery(
    usersForEmailingQueryOptions
  );
  const location = useLocation();

  const getRecipientCount = (type: string) => {
    if (!usersForEmailing || usersLoading) return 0;

    switch (type) {
      case "all":
        return usersForEmailing.totalUsers;
      case "premium":
        return usersForEmailing.premiumUsers;
      case "free":
        return usersForEmailing.freeUsers;
      case "newsletter":
        return usersForEmailing.newsletterUsers || 0;
      case "waitlist":
        return usersForEmailing.waitlistUsers || 0;
      default:
        return 0;
    }
  };

  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes("/compose")) return "compose";
    if (path.includes("/waitlist")) return "waitlist";
    if (path.includes("/history")) return "history";
    if (path.includes("/analytics")) return "analytics";
    return "compose"; // default
  };

  return (
    <Page>
      <PageHeader
        title="Email Composer"
        highlightedWord="Composer"
        description="Send bulk emails to your course participants and manage email campaigns"
        actions={
          <HeaderStats columns={5}>
            <HeaderStatCard
              icon={Users}
              iconColor="blue"
              value={getRecipientCount("all")}
              label="Total"
              loading={usersLoading}
            />
            <HeaderStatCard
              icon={CheckCircle}
              iconColor="theme"
              value={getRecipientCount("premium")}
              label="Premium"
              loading={usersLoading}
            />
            <HeaderStatCard
              icon={Mail}
              iconColor="green"
              value={getRecipientCount("free")}
              label="Free"
              loading={usersLoading}
            />
            <HeaderStatCard
              icon={Mail}
              iconColor="purple"
              value={getRecipientCount("newsletter")}
              label="Newsletter"
              loading={usersLoading}
            />
            <HeaderStatCard
              icon={Clock}
              iconColor="orange"
              value={getRecipientCount("waitlist")}
              label="Waitlist"
              loading={usersLoading}
            />
          </HeaderStats>
        }
      />

      <div className="w-full">
        <div className="flex flex-col gap-6">
          <Tabs value={getCurrentTab()} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <Link to="/admin/emails/analytics">
                <TabsTrigger
                  value="analytics"
                  className="flex items-center gap-2 w-full"
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </Link>
              <Link to="/admin/emails/compose">
                <TabsTrigger
                  value="compose"
                  className="flex items-center gap-2 w-full"
                >
                  <Send className="h-4 w-4" />
                  Compose
                </TabsTrigger>
              </Link>
              <Link to="/admin/emails/waitlist">
                <TabsTrigger
                  value="waitlist"
                  className="flex items-center gap-2 w-full"
                >
                  <Mail className="h-4 w-4" />
                  Waitlist
                </TabsTrigger>
              </Link>
              <Link to="/admin/emails/history">
                <TabsTrigger
                  value="history"
                  className="flex items-center gap-2 w-full"
                >
                  <Clock className="h-4 w-4" />
                  History
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
