import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { PageHeader } from "../-components/page-header";
import { Page } from "../-components/page";
import { HeaderStats, HeaderStatCard } from "../-components/header-stats";
import { Users, CheckCircle, Mail, Clock, Send, BarChart3 } from "lucide-react";
import { getUsersForEmailingFn } from "~/fn/emails";
import { useQuery } from "@tanstack/react-query";
import { assertIsAdminFn } from "~/fn/auth";

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
          <div className="border-b">
            <nav className="flex gap-4">
              <Link
                to="/admin/emails/compose"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:text-primary border-b-2 data-[status=active]:border-primary data-[status=active]:text-primary data-[status=inactive]:border-transparent"
                activeProps={{ "data-status": "active" }}
                inactiveProps={{ "data-status": "inactive" }}
              >
                <Send className="h-4 w-4" />
                Compose
              </Link>
              <Link
                to="/admin/emails/waitlist"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:text-primary border-b-2 data-[status=active]:border-primary data-[status=active]:text-primary data-[status=inactive]:border-transparent"
                activeProps={{ "data-status": "active" }}
                inactiveProps={{ "data-status": "inactive" }}
              >
                <Mail className="h-4 w-4" />
                Waitlist
              </Link>
              <Link
                to="/admin/emails/history"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:text-primary border-b-2 data-[status=active]:border-primary data-[status=active]:text-primary data-[status=inactive]:border-transparent"
                activeProps={{ "data-status": "active" }}
                inactiveProps={{ "data-status": "inactive" }}
              >
                <Clock className="h-4 w-4" />
                History
              </Link>
              <Link
                to="/admin/emails/analytics"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:text-primary border-b-2 data-[status=active]:border-primary data-[status=active]:text-primary data-[status=inactive]:border-transparent"
                activeProps={{ "data-status": "active" }}
                inactiveProps={{ "data-status": "inactive" }}
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Link>
            </nav>
          </div>

          <Outlet />
        </div>
      </div>
    </Page>
  );
}
