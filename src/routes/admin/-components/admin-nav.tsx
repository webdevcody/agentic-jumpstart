import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "~/lib/utils";
import {
  BarChart3,
  Users,
  MessageSquare,
  Mail,
  Target,
  UserCheck,
  Settings,
  FileText,
  Rocket,
  ExternalLink,
  Home,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/analytics",
    icon: Home,
    description: "Overview & Analytics",
  },
  {
    name: "Blog",
    href: "/admin/blog",
    icon: FileText,
    description: "Manage posts",
  },
  {
    name: "Conversions",
    href: "/admin/conversions",
    icon: Target,
    description: "Track performance",
  },
  {
    name: "Launch Kits",
    href: "/admin/launch-kits",
    icon: Rocket,
    description: "Startup resources",
  },
  {
    name: "Affiliates",
    href: "/admin/affiliates",
    icon: UserCheck,
    description: "Partner program",
  },
  {
    name: "Comments",
    href: "/admin/comments",
    icon: MessageSquare,
    description: "User feedback",
  },
  {
    name: "Emails",
    href: "/admin/emails",
    icon: Mail,
    description: "Email campaigns",
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "Site configuration",
  },
];

export function AdminNav() {
  const location = useLocation();

  return (
    <nav className="w-64 relative">
      {/* Sophisticated gradient background matching header */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background"></div>

      {/* Floating theme elements for visual consistency */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/2 w-24 h-24 bg-theme-500/10 dark:bg-theme-500/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/4 right-1/2 w-32 h-32 bg-theme-400/10 dark:bg-theme-400/5 rounded-full blur-2xl"></div>
      </div>

      {/* Glass morphism overlay with better contrast */}
      <div className="absolute inset-0 backdrop-blur-md bg-white/85 dark:bg-background/20 border-r border-border/60"></div>

      <div className="relative z-10 p-6">
        {/* View Site Link at the top */}
        <div className="mb-6">
          <Link
            to="/"
            className="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group relative bg-theme-500/10 hover:bg-theme-500/20 border border-theme-500/30 text-theme-600 dark:text-theme-400 hover:text-theme-700 dark:hover:text-theme-300"
          >
            <ExternalLink className="mr-3 h-4 w-4 transition-colors duration-200 text-theme-500 group-hover:text-theme-600 dark:group-hover:text-theme-400" />
            <span className="relative z-10 font-semibold">View Site</span>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-theme-500/60">→</div>
          </Link>
        </div>

        {/* Admin Panel Header - now clickable */}
        <Link
          to="/admin/analytics"
          className="block mb-8 group"
        >
          <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2 cursor-pointer transition-colors duration-200 group-hover:text-theme-500">
            <div className="w-2 h-2 rounded-full bg-theme-500 animate-pulse"></div>
            Admin Panel
          </h2>
          <div className="h-px bg-gradient-to-r from-theme-500/20 via-theme-400/30 to-transparent"></div>
        </Link>

        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex flex-col px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group relative",
                    isActive
                      ? "text-theme-600 dark:text-theme-400 bg-theme-500/15 dark:bg-theme-500/10 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {/* Subtle glow for active state */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg bg-theme-500/5 blur-sm"></div>
                  )}

                  <div className="flex items-center w-full">
                    <item.icon
                      className={cn(
                        "mr-3 h-4 w-4 transition-colors duration-200",
                        isActive
                          ? "text-theme-500 dark:text-theme-400"
                          : "text-muted-foreground group-hover:text-theme-400"
                      )}
                    />
                    <span className={cn("relative z-10", isActive && "font-semibold")}>{item.name}</span>
                  </div>
                  
                  {item.description && (
                    <span className="text-xs text-muted-foreground/70 ml-7 mt-0.5">
                      {item.description}
                    </span>
                  )}

                  {/* Hover indicator */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-theme-500 rounded-r-full transition-all duration-200 group-hover:h-8 opacity-0 group-hover:opacity-100"></div>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Decorative bottom element */}
        <div className="mt-8 pt-6 border-t border-border/40">
          <div className="flex items-center justify-center space-x-1 opacity-40">
            <div className="w-1 h-1 rounded-full bg-theme-400 animate-pulse"></div>
            <div
              className="w-1 h-1 rounded-full bg-theme-500 animate-pulse"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div
              className="w-1 h-1 rounded-full bg-theme-600 animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>
        </div>
      </div>
    </nav>
  );
}
