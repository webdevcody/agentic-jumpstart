import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "~/lib/utils";
import {
  Users,
  MessageSquare,
  Mail,
  Target,
  UserCheck,
  Settings,
  Newspaper,
  Home,
  FileText,
  Rocket,
  ExternalLink,
  LogOut,
  AlertCircle,
  TrendingUp,
  Video,
} from "lucide-react";
import { useFeatureFlag } from "~/components/feature-flag";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  featureKey?: "blog" | "launchKits" | "affiliates" | "news";
  category:
    | "dashboard"
    | "content"
    | "users"
    | "business"
    | "communications"
    | "system";
}

const navigation: NavigationItem[] = [
  // Dashboard
  {
    name: "Dashboard",
    href: "/admin/analytics",
    icon: Home,
    category: "dashboard",
  },

  // Content Management
  {
    name: "Comments",
    href: "/admin/comments",
    icon: MessageSquare,
    category: "content",
  },
  {
    name: "Video Processing",
    href: "/admin/video-processing",
    icon: Video,
    category: "content",
  },
  {
    name: "Blog",
    href: "/admin/blog",
    icon: FileText,
    category: "content",
    featureKey: "blog",
  },
  {
    name: "News",
    href: "/admin/news",
    icon: Newspaper,
    category: "content",
    featureKey: "news",
  },

  // User Management
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    category: "users",
  },
  {
    name: "Affiliates",
    href: "/admin/affiliates",
    icon: UserCheck,
    category: "users",
    featureKey: "affiliates",
  },

  // Business
  {
    name: "Launch Kits",
    href: "/admin/launch-kits",
    icon: Rocket,
    category: "business",
    featureKey: "launchKits",
  },
  {
    name: "Conversions",
    href: "/admin/conversions",
    icon: Target,
    category: "business",
  },
  {
    name: "UTM Analytics",
    href: "/admin/utm-analytics",
    icon: TrendingUp,
    category: "business",
  },

  // Communications
  {
    name: "Emails",
    href: "/admin/emails",
    icon: Mail,
    category: "communications",
  },

  // System
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    category: "system",
  },
];

const CATEGORY_LABELS: Record<NavigationItem["category"], string> = {
  dashboard: "Dashboard",
  content: "Content Management",
  users: "User Management",
  business: "Business",
  communications: "Communications",
  system: "System",
};

interface AdminNavProps {
  onItemClick?: () => void;
}

function getGroupedNavigationItems() {
  const grouped: Record<string, NavigationItem[]> = {};

  navigation.forEach((item) => {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  });

  return grouped;
}

export function AdminNav({ onItemClick }: AdminNavProps = {}) {
  const location = useLocation();

  const { isEnabled: launchKitsEnabled } = useFeatureFlag("LAUNCH_KITS_FEATURE");
  const { isEnabled: affiliatesEnabled } = useFeatureFlag("AFFILIATES_FEATURE");
  const { isEnabled: blogEnabled } = useFeatureFlag("BLOG_FEATURE");
  const { isEnabled: newsEnabled } = useFeatureFlag("NEWS_FEATURE");

  const featureStates = {
    launchKits: launchKitsEnabled,
    affiliates: affiliatesEnabled,
    blog: blogEnabled,
    news: newsEnabled,
  };

  return (
    <nav className="w-64 relative h-full flex flex-col">
      {/* Sophisticated gradient background matching header */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background"></div>

      {/* Floating theme elements for visual consistency */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/2 w-24 h-24 bg-theme-500/10 dark:bg-theme-500/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/4 right-1/2 w-32 h-32 bg-theme-400/10 dark:bg-theme-400/5 rounded-full blur-2xl"></div>
      </div>

      {/* Glass morphism overlay with better contrast */}
      <div className="absolute inset-0 backdrop-blur-md bg-white/85 dark:bg-background/20 border-r border-border/60"></div>

      <div className="relative z-10 p-6 h-full flex flex-col">
        {/* View Site Link at the top */}
        <div className="mb-6">
          <Link
            to="/"
            onClick={onItemClick}
            className="flex items-center px-4 py-3 text-sm font-medium rounded-lg group relative bg-theme-500/10 hover:bg-theme-500/20 border border-theme-500/30 text-theme-600 dark:text-theme-400 hover:text-theme-700 dark:hover:text-theme-300"
          >
            <ExternalLink className="mr-3 h-4 w-4 text-theme-500 group-hover:text-theme-600 dark:group-hover:text-theme-400" />
            <span className="relative z-10 font-semibold">View Site</span>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-theme-500/60">
              →
            </div>
          </Link>
        </div>

        {/* Admin Panel Header - now clickable */}
        <Link
          to="/admin/analytics"
          onClick={onItemClick}
          className="block mb-8 group"
        >
          <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2 cursor-pointer group-hover:text-theme-500">
            <div className="w-2 h-2 rounded-full bg-theme-500"></div>
            Admin Panel
          </h2>
          <div className="h-px bg-gradient-to-r from-theme-500/20 via-theme-400/30 to-transparent"></div>
        </Link>

        {/* Navigation links - flex-1 to take available space */}
        <div className="space-y-6 flex-1">
          {Object.entries(getGroupedNavigationItems()).map(
            ([category, items], categoryIndex) => {
              // Handle dashboard separately - no category header
              if (category === "dashboard") {
                return items.map((item) => {
                  const isActive =
                    item.href === "/admin/conversions"
                      ? location.pathname.startsWith("/admin/conversions")
                      : location.pathname === item.href;
                  const isDisabled =
                    item.featureKey &&
                    !featureStates[
                      item.featureKey as keyof typeof featureStates
                    ];

                  return (
                    <div key={item.name} className="mb-6">
                      <Link
                        to={item.href}
                        onClick={onItemClick}
                        className={cn(
                          "flex items-center px-4 py-3 text-sm font-medium rounded-lg group relative",
                          isActive
                            ? "text-theme-600 dark:text-theme-400 bg-theme-500/15 dark:bg-theme-500/10 shadow-sm"
                            : isDisabled
                              ? "text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-muted/30"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        {/* Subtle glow for active state */}
                        {isActive && !isDisabled && (
                          <div className="absolute inset-0 rounded-lg bg-theme-500/5 blur-sm"></div>
                        )}

                        <item.icon
                          className={cn(
                            "mr-3 h-4 w-4",
                            isActive && !isDisabled
                              ? "text-theme-500 dark:text-theme-400"
                              : isDisabled
                                ? "text-muted-foreground/40"
                                : "text-muted-foreground group-hover:text-theme-400"
                          )}
                        />
                        <span
                          className={cn(
                            "relative z-10 flex-1",
                            isActive && !isDisabled && "font-semibold",
                            isDisabled && "opacity-60"
                          )}
                        >
                          {item.name}
                        </span>
                        {isDisabled && (
                          <div className="flex items-center gap-1 ml-auto">
                            <span className="text-xs text-muted-foreground/50 font-normal">
                              Disabled
                            </span>
                            <AlertCircle className="h-3 w-3 text-muted-foreground/50" />
                          </div>
                        )}
                      </Link>
                    </div>
                  );
                });
              }

              return (
                <div key={category}>
                  <h3 className="text-xs font-medium text-muted-foreground mb-3 px-2 uppercase tracking-wider">
                    {CATEGORY_LABELS[category as NavigationItem["category"]]}
                  </h3>
                  <ul className="space-y-1">
                    {items.map((item) => {
                      const isActive =
                        item.href === "/admin/conversions"
                          ? location.pathname.startsWith("/admin/conversions")
                          : location.pathname === item.href;
                      const isDisabled =
                        item.featureKey &&
                        !featureStates[
                          item.featureKey as keyof typeof featureStates
                        ];

                      return (
                        <li key={item.name}>
                          <Link
                            to={item.href}
                            onClick={onItemClick}
                            className={cn(
                              "flex items-center px-4 py-3 text-sm font-medium rounded-lg group relative",
                              isActive
                                ? "text-theme-600 dark:text-theme-400 bg-theme-500/15 dark:bg-theme-500/10 shadow-sm"
                                : isDisabled
                                  ? "text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-muted/30"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                          >
                            {/* Subtle glow for active state */}
                            {isActive && !isDisabled && (
                              <div className="absolute inset-0 rounded-lg bg-theme-500/5 blur-sm"></div>
                            )}

                            <item.icon
                              className={cn(
                                "mr-3 h-4 w-4",
                                isActive && !isDisabled
                                  ? "text-theme-500 dark:text-theme-400"
                                  : isDisabled
                                    ? "text-muted-foreground/40"
                                    : "text-muted-foreground group-hover:text-theme-400"
                              )}
                            />
                            <span
                              className={cn(
                                "relative z-10 flex-1",
                                isActive && !isDisabled && "font-semibold",
                                isDisabled && "opacity-60"
                              )}
                            >
                              {item.name}
                            </span>
                            {isDisabled && (
                              <div className="flex items-center gap-1 ml-auto">
                                <span className="text-xs text-muted-foreground/50 font-normal">
                                  Disabled
                                </span>
                                <AlertCircle className="h-3 w-3 text-muted-foreground/50" />
                              </div>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            }
          )}
        </div>

        {/* Sign Out Button - stays at bottom */}
        <div className="mt-8 pt-6 mb-6 border-t border-border/40">
          <a
            href="/api/logout"
            onClick={onItemClick}
            className="flex items-center px-4 py-3 text-sm font-medium rounded-lg group relative text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <LogOut className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-red-500" />
            <span className="relative z-10">Sign Out</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
