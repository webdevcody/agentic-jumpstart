import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAllUsersWithProfilesFn } from "~/fn/users";
import { assertIsAdminFn } from "~/fn/auth";
import { Users, Crown, User, UserCheck, Mail, Search } from "lucide-react";
import { queryOptions } from "@tanstack/react-query";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { PageHeader } from "~/routes/admin/-components/page-header";
import { Page } from "~/routes/admin/-components/page";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card, CardContent } from "~/components/ui/card";
import {
  HeaderStats,
  HeaderStatCard,
} from "~/routes/admin/-components/header-stats";

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
  const [searchQuery, setSearchQuery] = useState("");
  const { data: users = [], isLoading } = useQuery(usersQuery);

  const filteredUsers = users.filter((user) => {
    // Filter by tab
    if (activeTab === "premium" && !user.isPremium) return false;
    if (activeTab === "free" && user.isPremium) return false;

    // Filter by email search
    if (searchQuery.trim()) {
      const email = user.email?.toLowerCase() || "";
      const query = searchQuery.toLowerCase().trim();
      if (!email.includes(query)) return false;
    }

    return true;
  });

  const premiumCount = users.filter((user) => user.isPremium).length;
  const freeCount = users.filter((user) => !user.isPremium).length;
  const conversionRate =
    users.length > 0 ? Math.round((premiumCount / users.length) * 100) : 0;
  const freeRate =
    users.length > 0 ? Math.round((freeCount / users.length) * 100) : 0;

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
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

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
              <TabsTrigger value="premium" className="flex items-center gap-2">
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

          {/* Users Grid */}
          <TabsContent value={activeTab} className="mt-0 animate-none">
            {isLoading ? (
              <UserGridSkeleton />
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No users found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery.trim()
                    ? `No users found matching "${searchQuery}"`
                    : "No users match the selected filter criteria."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredUsers.map((user, index) => (
                  <Link
                    key={user.id}
                    to="/profile/$userId"
                    params={{ userId: user.id.toString() }}
                    className="block"
                  >
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border border-border/50 shadow-sm hover:shadow-md cursor-pointer text-card-foreground flex flex-col gap-6 py-4">
                      <div className="px-6">
                        {/* Header with Avatar and Status */}
                        <div className="flex items-start mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
                              <AvatarImage
                                src={getUserAvatar(user.profile, user.email)}
                                alt={
                                  user.profile?.displayName ||
                                  user.email ||
                                  "User"
                                }
                              />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                {getUserInitials(
                                  user.profile?.displayName,
                                  user.email
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-base truncate">
                                {user.profile?.displayName || "No name"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Email */}
                        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center justify-start gap-2 flex-wrap">
                          <Badge
                            variant={user.isPremium ? "default" : "secondary"}
                            className={
                              user.isPremium
                                ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 border-0 shadow-sm"
                                : "bg-muted text-muted-foreground"
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
                          {user.isAdmin && (
                            <Badge variant="destructive" className="text-xs">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Page>
  );
}

function UserGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="h-5 w-12 bg-muted animate-pulse rounded-full" />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>

            <div className="flex items-center justify-between">
              <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
              <div className="h-8 w-12 bg-muted animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
