import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAllUsersWithProfilesFn } from "~/fn/users";
import { assertIsAdminFn } from "~/fn/auth";
import { Users, Crown, User, UserCheck } from "lucide-react";
import { queryOptions } from "@tanstack/react-query";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { PageHeader } from "~/routes/admin/-components/page-header";
import { AppCard } from "~/components/app-card";
import { Page } from "~/routes/admin/-components/page";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { HeaderStats, HeaderStatCard } from "~/routes/admin/-components/header-stats";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: () => assertIsAdminFn(),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(usersQuery);
  },
  component: AdminUsers,
});

const usersQuery = queryOptions({
  queryKey: ["admin", "users"],
  queryFn: () => getAllUsersWithProfilesFn(),
});

function AdminUsers() {
  const [activeTab, setActiveTab] = useState<"all" | "premium" | "free">("all");
  const { data: users = [], isLoading } = useQuery(usersQuery);

  const filteredUsers = users.filter((user) => {
    if (activeTab === "premium") return user.isPremium;
    if (activeTab === "free") return !user.isPremium;
    return true;
  });

  const premiumCount = users.filter((user) => user.isPremium).length;
  const freeCount = users.filter((user) => !user.isPremium).length;
  const conversionRate = users.length > 0 ? Math.round((premiumCount / users.length) * 100) : 0;
  const freeRate = users.length > 0 ? Math.round((freeCount / users.length) * 100) : 0;

  const getUserInitials = (
    displayName?: string | null,
    email?: string | null
  ) => {
    if (displayName) {
      return displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getUserAvatar = (profile: any, email?: string | null) => {
    if (profile?.image) {
      return profile.image;
    }
    const initials = getUserInitials(profile?.displayName, email);
    return `https://api.dicebear.com/9.x/initials/svg?seed=${initials}&backgroundColor=6366f1&textColor=ffffff`;
  };

  return (
    <Page>
      <PageHeader
        title="User Management"
        highlightedWord="Management"
        description={
          <span>
            View and manage all users in the system. Monitor user activity and
            premium status.
          </span>
        }
        actions={
          <HeaderStats columns={3}>
            <HeaderStatCard
              icon={Users}
              iconColor="blue"
              value={users.length}
              label="Total"
              loading={isLoading}
            />
            <HeaderStatCard
              icon={Crown}
              iconColor="yellow"
              value={premiumCount}
              label="Premium"
              subValue={`${conversionRate}%`}
              loading={isLoading}
            />
            <HeaderStatCard
              icon={User}
              iconColor="green"
              value={freeCount}
              label="Free"
              subValue={`${freeRate}%`}
              loading={isLoading}
            />
          </HeaderStats>
        }
      />

      <div className="space-y-6">
        {/* Users Table */}
        <AppCard
          icon={Users}
          title="Users"
          description="All users in the system"
        >
          <div className="p-6">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as any)}
            >
              <div className="flex items-center justify-between mb-6">
                <TabsList>
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    All Users
                    <Badge variant="secondary">{users.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="premium"
                    className="flex items-center gap-2"
                  >
                    <Crown className="h-4 w-4" />
                    Premium
                    <Badge variant="secondary">{premiumCount}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="free" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Free
                    <Badge variant="secondary">{freeCount}</Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="mt-0">
                {isLoading ? (
                  <UserTableSkeleton />
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Admin</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <User className="h-8 w-8" />
                                <span>No users found for this filter</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user) => (
                            <TableRow
                              key={user.id}
                              className="hover:bg-muted/50"
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage
                                      src={getUserAvatar(
                                        user.profile,
                                        user.email
                                      )}
                                      alt={
                                        user.profile?.displayName ||
                                        user.email ||
                                        "User"
                                      }
                                    />
                                    <AvatarFallback>
                                      {getUserInitials(
                                        user.profile?.displayName,
                                        user.email
                                      )}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">
                                      {user.profile?.displayName || "No name"}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      ID: {user.id}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">{user.email}</div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    user.isPremium ? "default" : "secondary"
                                  }
                                  className={
                                    user.isPremium
                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                      : ""
                                  }
                                >
                                  {user.isPremium ? (
                                    <>
                                      <Crown className="h-3 w-3 mr-1" />
                                      Premium
                                    </>
                                  ) : (
                                    <>
                                      <User className="h-3 w-3 mr-1" />
                                      Free
                                    </>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {user.isAdmin ? (
                                  <Badge variant="destructive">
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Admin
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    —
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm" asChild>
                                  <Link
                                    to="/profile/$userId"
                                    params={{ userId: user.id.toString() }}
                                  >
                                    View Profile
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </AppCard>
      </div>
    </Page>
  );
}

function UserTableSkeleton() {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="h-4 w-48 bg-muted animate-pulse rounded" />
              </TableCell>
              <TableCell>
                <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
              </TableCell>
              <TableCell>
                <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
              </TableCell>
              <TableCell>
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
