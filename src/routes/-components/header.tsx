import { Link, useRouterState } from "@tanstack/react-router";
import { Button, buttonVariants } from "../../components/ui/button";
import {
  LogOut,
  Menu,
  User,
  ChevronDown,
  TrendingUp,
  DollarSign,
  MessageCircle,
  Users,
  Mail,
  Settings,
  Target,
  Bot,
  Video,
  Tag,
  LogIn,
  Newspaper,
  Rocket,
  BookOpen,
  MessageSquare,
  Link2,
  ShieldCheck,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "../../components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "../../components/ui/dropdown-menu";
import { useState } from "react";
import { useContinueSlug } from "~/hooks/use-continue-slug";
import { cn } from "~/lib/utils";
import { useAuthWithProfile } from "~/hooks/use-auth";
import { ModeToggle } from "~/components/ModeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { checkIfUserIsAffiliateFn } from "~/fn/affiliates";
import { useFeatureFlag } from "~/components/feature-flag";

interface NavLink {
  to: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: {
    text: string;
    className: string;
  };
  condition?: (data: {
    user: any;
    continueSlug: string | null;
    affiliateStatus?: { isAffiliate: boolean };
    agentsFeatureEnabled?: boolean;
    affiliatesFeatureEnabled?: boolean;
    launchKitsFeatureEnabled?: boolean;
    newsFeatureEnabled?: boolean;
    blogFeatureEnabled?: boolean;
  }) => boolean;
  params?: any;
  category?: "primary" | "resources" | "community" | "more";
}

interface AdminMenuItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "content" | "users" | "business" | "communications" | "system";
}

const NAVIGATION_LINKS: NavLink[] = [
  // Primary navigation (always visible in top nav)
  {
    to: "/learn/$slug",
    label: "Course Content",
    icon: Video,
    condition: ({ continueSlug }) => !!continueSlug,
    params: (data: any) => ({ slug: data.continueSlug }),
    category: "primary",
  },
  {
    to: "/learn",
    label: "Course Content",
    icon: Video,
    condition: ({ continueSlug }) => !continueSlug,
    category: "primary",
  },
  {
    to: "/purchase",
    label: "Pricing",
    icon: Tag,
    category: "primary",
  },
  // Community dropdown
  {
    to: "/community",
    label: "Discord",
    icon: MessageSquare,
    category: "community",
  },
  {
    to: "/members",
    label: "Members",
    icon: Users,
    category: "community",
  },

  // Resources dropdown (all secondary links)
  {
    to: "/blog",
    label: "Blog",
    icon: Video,
    condition: ({ blogFeatureEnabled }) => !!blogFeatureEnabled,
    category: "resources",
  },
  {
    to: "/launch-kits",
    label: "Launch Kits",
    icon: Rocket,
    badge: {
      text: "NEW",
      className:
        "ml-2 px-1.5 py-0.5 text-xs bg-theme-500/20 text-theme-600 dark:text-theme-400 rounded-md font-medium",
    },
    condition: ({ launchKitsFeatureEnabled }) => !!launchKitsFeatureEnabled,
    category: "resources",
  },
  {
    to: "/news",
    label: "AI News",
    icon: Newspaper,
    badge: {
      text: "NEW",
      className:
        "ml-2 px-1.5 py-0.5 text-xs bg-theme-500/20 text-theme-600 dark:text-theme-400 rounded-md font-medium",
    },
    condition: ({ newsFeatureEnabled }) => !!newsFeatureEnabled,
    category: "resources",
  },
  {
    to: "/agents",
    label: "Agents",
    icon: Bot,
    badge: {
      text: "Beta",
      className:
        "ml-2 px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-md font-medium",
    },
    condition: ({ agentsFeatureEnabled }) => !!agentsFeatureEnabled,
    category: "resources",
  },
  {
    to: "/affiliates",
    label: "Affiliate Program",
    icon: DollarSign,
    condition: ({ user, affiliatesFeatureEnabled }) =>
      !user && !!affiliatesFeatureEnabled,
    category: "resources",
  },
  {
    to: "/affiliates",
    label: "Become an Affiliate",
    icon: DollarSign,
    condition: ({ user, affiliateStatus, affiliatesFeatureEnabled }) =>
      user &&
      !user.isAdmin &&
      !affiliateStatus?.isAffiliate &&
      !!affiliatesFeatureEnabled,
    category: "resources",
  },
];

const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
  // Content Management
  {
    to: "/admin/comments",
    label: "Comments",
    icon: MessageCircle,
    category: "content",
  },
  { to: "/admin/blog", label: "Blog", icon: Video, category: "content" },
  { to: "/admin/news", label: "News", icon: Newspaper, category: "content" },

  // User Management
  { to: "/admin/users", label: "Users", icon: Users, category: "users" },
  {
    to: "/admin/affiliates",
    label: "Affiliates",
    icon: DollarSign,
    category: "users",
  },

  // Business
  {
    to: "/admin/launch-kits",
    label: "Launch Kits",
    icon: Rocket,
    category: "business",
  },
  {
    to: "/admin/analytics",
    label: "Analytics",
    icon: TrendingUp,
    category: "business",
  },
  {
    to: "/admin/conversions",
    label: "Conversions",
    icon: Target,
    category: "business",
  },
  {
    to: "/admin/utm-analytics",
    label: "UTM Analytics",
    icon: Link2,
    category: "business",
  },

  // Communications
  {
    to: "/admin/emails",
    label: "Emails",
    icon: Mail,
    category: "communications",
  },

  // System
  {
    to: "/admin/settings",
    label: "Settings",
    icon: Settings,
    category: "system",
  },
];

const ADMIN_CATEGORY_LABELS: Record<AdminMenuItem["category"], string> = {
  content: "Content Management",
  users: "User Management",
  business: "Business",
  communications: "Communications",
  system: "System",
};

function getFilteredNavLinks(data: {
  user: any;
  continueSlug: string | null;
  affiliateStatus?: { isAffiliate: boolean };
  agentsFeatureEnabled?: boolean;
  affiliatesFeatureEnabled?: boolean;
  launchKitsFeatureEnabled?: boolean;
  newsFeatureEnabled?: boolean;
  blogFeatureEnabled?: boolean;
}) {
  return NAVIGATION_LINKS.filter(
    (link) => !link.condition || link.condition(data)
  );
}

function getGroupedAdminMenuItems() {
  const grouped: Record<string, AdminMenuItem[]> = {};

  ADMIN_MENU_ITEMS.forEach((item) => {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  });

  return grouped;
}

const DesktopNavigation = ({
  navLinks,
  routerState,
  navData,
}: {
  navLinks: NavLink[];
  routerState: any;
  navData: any;
}) => {
  const primaryLinks = navLinks.filter((link) => link.category === "primary");
  const resourcesLinks = navLinks.filter(
    (link) => link.category === "resources"
  );
  const communityLinks = navLinks.filter(
    (link) => link.category === "community"
  );

  const renderNavLink = (link: NavLink, key?: string) => {
    const Icon = link.icon;
    const isActive = routerState.location.pathname.startsWith(
      link.to.split("$")[0].replace("/$slug", "")
    );

    return (
      <Link
        key={key || `${link.to}-${link.label}`}
        to={link.to}
        params={link.params ? link.params(navData) : undefined}
        className={cn(
          "flex items-center",
          "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          isActive
            ? "text-theme-600 dark:text-theme-400 bg-theme-500/15 dark:bg-theme-500/10 font-semibold"
            : ""
        )}
      >
        {Icon && <Icon className="mr-2 h-4 w-4 text-theme-400" />}
        {link.label}
        {link.badge && (
          <span className={link.badge.className}>{link.badge.text}</span>
        )}
      </Link>
    );
  };

  const renderDropdownItem = (link: NavLink) => {
    const Icon = link.icon;
    const isActive = routerState.location.pathname.startsWith(
      link.to.split("$")[0].replace("/$slug", "")
    );

    return (
      <DropdownMenuItem key={`dropdown-${link.to}-${link.label}`} asChild>
        <Link
          to={link.to}
          params={link.params ? link.params(navData) : undefined}
          className={cn(
            "flex items-center w-full",
            isActive ? "text-theme-600 dark:text-theme-400 font-semibold" : ""
          )}
        >
          {Icon && <Icon className="mr-2 h-4 w-4 text-theme-400" />}
          {link.label}
          {link.badge && (
            <span className={cn("ml-auto", link.badge.className)}>
              {link.badge.text}
            </span>
          )}
        </Link>
      </DropdownMenuItem>
    );
  };

  return (
    <div className="hidden md:flex items-center gap-1">
      {/* Always show primary links */}
      {primaryLinks.map((link) => renderNavLink(link))}

      {/* Community dropdown with FREE badge */}
      {communityLinks.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <Users className="h-4 w-4" />
              <span>Community</span>
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-600 dark:text-green-400 rounded-md font-medium">
                FREE
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {communityLinks.map((link) => renderDropdownItem(link))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Resources dropdown with FREE badge */}
      {resourcesLinks.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <BookOpen className="h-4 w-4" />
              <span>Resources</span>
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-600 dark:text-green-400 rounded-md font-medium">
                FREE
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {resourcesLinks.map((link) => renderDropdownItem(link))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

const MobileNavigation = ({
  navLinks,
  setIsOpen,
  navData,
}: {
  navLinks: NavLink[];
  setIsOpen: (open: boolean) => void;
  navData: any;
}) => {
  const primaryLinks = navLinks.filter((link) => link.category === "primary");
  const resourcesLinks = navLinks.filter(
    (link) => link.category === "resources"
  );
  const communityLinks = navLinks.filter(
    (link) => link.category === "community"
  );

  const renderMobileNavLink = (link: NavLink, key?: string) => {
    const Icon = link.icon;

    return (
      <Link
        key={key || `mobile-${link.to}-${link.label}`}
        to={link.to}
        params={link.params ? link.params(navData) : undefined}
        className="flex items-center py-3 text-lg text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50 px-3"
        onClick={() => setIsOpen(false)}
      >
        {Icon ? (
          <Icon className="mr-3 h-5 w-5 text-theme-400 flex-shrink-0" />
        ) : (
          <div className="mr-3 h-5 w-5 flex-shrink-0" />
        )}
        <span className="flex-1">{link.label}</span>
        {link.badge && (
          <span className={link.badge.className}>{link.badge.text}</span>
        )}
      </Link>
    );
  };

  return (
    <nav className="flex flex-col gap-2 mt-8 px-6">
      {/* Primary links */}
      {primaryLinks.length > 0 && (
        <div className="space-y-1">
          {primaryLinks.map((link) => renderMobileNavLink(link))}
        </div>
      )}

      {/* Community section */}
      {communityLinks.length > 0 && (
        <div className="space-y-1 mt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-3 flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Community
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-600 dark:text-green-400 rounded-md font-medium">
              FREE
            </span>
          </h3>
          {communityLinks.map((link) => renderMobileNavLink(link))}
        </div>
      )}

      {/* Resources section */}
      {resourcesLinks.length > 0 && (
        <div className="space-y-1 mt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-3 flex items-center">
            <BookOpen className="mr-2 h-4 w-4" />
            Resources
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-600 dark:text-green-400 rounded-md font-medium">
              FREE
            </span>
          </h3>
          {resourcesLinks.map((link) => renderMobileNavLink(link))}
        </div>
      )}
    </nav>
  );
};

export function Header({ hasBanner = false }: { hasBanner?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const continueSlug = useContinueSlug();
  const { user, profile } = useAuthWithProfile();
  const routerState = useRouterState();

  // Helper to get user initials for avatar fallback
  const getUserInitials = () => {
    if (profile?.displayName) {
      return profile.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  // Check if user is an affiliate (only for authenticated users)
  const { data: affiliateStatus } = useQuery({
    queryKey: ["user", "isAffiliate"],
    queryFn: () => checkIfUserIsAffiliateFn(),
    enabled: !!user && !user.isAdmin,
  });

  const { isEnabled: agentsFeatureEnabled } = useFeatureFlag("AGENTS_FEATURE");
  const { isEnabled: affiliatesFeatureEnabled } = useFeatureFlag("AFFILIATES_FEATURE");
  const { isEnabled: launchKitsFeatureEnabled } = useFeatureFlag("LAUNCH_KITS_FEATURE");
  const { isEnabled: newsFeatureEnabled } = useFeatureFlag("NEWS_FEATURE");
  const { isEnabled: blogFeatureEnabled } = useFeatureFlag("BLOG_FEATURE");

  const navData = {
    user,
    continueSlug,
    affiliateStatus,
    agentsFeatureEnabled,
    affiliatesFeatureEnabled,
    launchKitsFeatureEnabled,
    newsFeatureEnabled,
    blogFeatureEnabled,
  };

  const filteredNavLinks = getFilteredNavLinks(navData);

  return (
    <div className={`fixed left-0 right-0 z-50 ${hasBanner ? "top-[40px]" : "top-0"}`}>
      {/* Sophisticated gradient background matching hero */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background to-background"></div>

      {/* Subtle theme accent line - more visible in light mode */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>

      {/* Floating theme elements for visual consistency */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-theme-500/10 dark:bg-theme-500/5 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-theme-400/10 dark:bg-theme-400/5 rounded-full blur-2xl"></div>
      </div>

      {/* Glass morphism overlay with better light mode contrast */}
      <div className="absolute inset-0 backdrop-blur-md bg-white/85 dark:bg-background/20 border-b border-border/60"></div>

      <div className="relative z-10">
        <div className="mx-auto container">
          <div className="flex h-16 items-center justify-between px-4">
            {/* Logo and Brand */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="relative">
                  <img
                    src="/logo.png"
                    alt="Beginner React Challenges"
                    className="size-12 transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Subtle glow on logo hover */}
                  <div className="absolute inset-0 rounded-full bg-theme-500/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <span className="font-semibold text-sm text-foreground/90">
                  Agentic Jumpstart
                </span>
              </Link>

              <DesktopNavigation
                navLinks={filteredNavLinks}
                routerState={routerState}
                navData={navData}
              />
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-3">
              {user?.isAdmin && (
                <Link to="/admin/analytics">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    title="Admin Panel"
                  >
                    <ShieldCheck className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Admin Panel</span>
                  </Button>
                </Link>
              )}
              {user ? (
                <>
                  {user.isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex items-center gap-2 p-1 pr-2"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={profile?.image || undefined}
                              alt={profile?.displayName || "User"}
                            />
                            <AvatarFallback className="bg-theme-500 text-white text-xs">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <span>Admin</span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {Object.entries(getGroupedAdminMenuItems()).map(
                          ([category, items], categoryIndex) => (
                            <div key={category}>
                              {categoryIndex > 0 && <DropdownMenuSeparator />}
                              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                                {
                                  ADMIN_CATEGORY_LABELS[
                                    category as AdminMenuItem["category"]
                                  ]
                                }
                              </DropdownMenuLabel>
                              <DropdownMenuGroup>
                                {items.map((item) => {
                                  const Icon = item.icon;
                                  return (
                                    <DropdownMenuItem key={item.to} asChild>
                                      <Link
                                        to={item.to}
                                        className="flex items-center"
                                      >
                                        <Icon className="mr-2 h-4 w-4" />
                                        {item.label}
                                      </Link>
                                    </DropdownMenuItem>
                                  );
                                })}
                              </DropdownMenuGroup>
                            </div>
                          )
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <a href="/api/logout" className="flex items-center">
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {affiliateStatus?.isAffiliate && !user.isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex items-center gap-2 p-1"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={profile?.image || undefined}
                              alt={profile?.displayName || "User"}
                            />
                            <AvatarFallback className="bg-theme-500 text-white text-xs">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            to="/profile/edit"
                            className="flex items-center"
                          >
                            <User className="mr-2 h-4 w-4" />
                            Edit Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/settings" className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link
                            to="/affiliate-dashboard"
                            className="flex items-center"
                          >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Affiliate Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <a href="/api/logout" className="flex items-center">
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {!affiliateStatus?.isAffiliate && !user.isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex items-center gap-2 p-1"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={profile?.image || undefined}
                              alt={profile?.displayName || "User"}
                            />
                            <AvatarFallback className="bg-theme-500 text-white text-xs">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            to="/profile/edit"
                            className="flex items-center"
                          >
                            <User className="mr-2 h-4 w-4" />
                            Edit Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/settings" className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <a href="/api/logout" className="flex items-center">
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              ) : (
                <a
                  href="/api/login/google"
                  className={buttonVariants({ variant: "ghost" })}
                >
                  Login
                </a>
              )}
              {!user?.isPremium && !user?.isAdmin && (
                <Link to="/purchase">
                  <Button>Buy Now</Button>
                </Link>
              )}
              <ModeToggle />
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button>
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <SheetDescription className="sr-only">
                    Main navigation menu with links to different sections of the
                    website
                  </SheetDescription>
                  {/* Mobile menu with matching gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background"></div>
                  <div className="absolute inset-0 backdrop-blur-md bg-white/90 dark:bg-background/20"></div>
                  <div className="relative z-10 h-full flex flex-col">
                    {/* Top section with Buy Now */}
                    <div className="flex-shrink-0 px-6 pt-6">
                      {user?.isAdmin && (
                        <Link to="/admin/analytics" onClick={() => setIsOpen(false)}>
                          <Button variant="outline" className="w-full mb-4 flex items-center justify-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            Admin Panel
                          </Button>
                        </Link>
                      )}
                      {!user?.isPremium && !user?.isAdmin && (
                        <Link to="/purchase" onClick={() => setIsOpen(false)}>
                          <Button className="w-full mb-4">Buy Now</Button>
                        </Link>
                      )}
                    </div>

                    {/* Scrollable navigation content */}
                    <div className="flex-1 overflow-y-auto">
                      <MobileNavigation
                        navLinks={filteredNavLinks}
                        setIsOpen={setIsOpen}
                        navData={navData}
                      />

                      {/* Admin and user specific links */}
                      <div className="px-6 pb-4 space-y-3">
                        {user?.isAdmin && (
                          <>
                            <div className="border-t border-border pt-4">
                              <h3 className="text-sm font-medium text-muted-foreground mb-3 px-3">
                                Admin
                              </h3>
                              {Object.entries(getGroupedAdminMenuItems()).map(
                                ([category, items], categoryIndex) => (
                                  <div key={category} className="mb-4">
                                    <h4 className="text-xs font-medium text-muted-foreground mb-2 px-3 uppercase tracking-wider">
                                      {
                                        ADMIN_CATEGORY_LABELS[
                                          category as AdminMenuItem["category"]
                                        ]
                                      }
                                    </h4>
                                    {items.map((item) => {
                                      const Icon = item.icon;
                                      return (
                                        <Link
                                          key={`mobile-admin-${item.to}`}
                                          to={item.to}
                                          className={buttonVariants({
                                            variant: "ghost",
                                            className:
                                              "w-full justify-start mb-1",
                                          })}
                                          onClick={() => setIsOpen(false)}
                                        >
                                          <Icon className="mr-2 h-4 w-4" />
                                          {item.label}
                                        </Link>
                                      );
                                    })}
                                  </div>
                                )
                              )}
                            </div>
                          </>
                        )}

                        {affiliateStatus?.isAffiliate && !user?.isAdmin && (
                          <div className="border-t border-border pt-4">
                            <Link
                              to="/affiliate-dashboard"
                              className={buttonVariants({
                                variant: "ghost",
                                className: "w-full justify-start",
                              })}
                              onClick={() => setIsOpen(false)}
                            >
                              <TrendingUp className="mr-2 h-4 w-4" />
                              Affiliate Dashboard
                            </Link>
                          </div>
                        )}

                        {user ? (
                          <div className="border-t border-border pt-4">
                            {!user.isAdmin && !affiliateStatus?.isAffiliate && (
                              <>
                                <Link
                                  to="/profile/edit"
                                  className={buttonVariants({
                                    variant: "ghost",
                                    className: "w-full justify-start mb-2",
                                  })}
                                  onClick={() => setIsOpen(false)}
                                >
                                  <User className="mr-2 h-4 w-4" />
                                  Edit Profile
                                </Link>
                                <Link
                                  to="/settings"
                                  className={buttonVariants({
                                    variant: "ghost",
                                    className: "w-full justify-start mb-2",
                                  })}
                                  onClick={() => setIsOpen(false)}
                                >
                                  <Settings className="mr-2 h-4 w-4" />
                                  Settings
                                </Link>
                              </>
                            )}
                            <a
                              href="/api/logout"
                              className={buttonVariants({
                                variant: "ghost",
                                className: "w-full justify-start",
                              })}
                            >
                              <LogOut className="mr-2 h-4 w-4" />
                              Logout
                            </a>
                          </div>
                        ) : (
                          <div className="border-t border-border pt-4 flex justify-center">
                            <a
                              href="/api/login/google"
                              className={buttonVariants({
                                variant: "default",
                                className: "flex items-center gap-2",
                              })}
                            >
                              <LogIn className="h-4 w-4" />
                              Login
                            </a>
                          </div>
                        )}

                        {/* Dark mode toggle at bottom of scrollable area */}
                        <div className="border-t border-border pt-4">
                          <div className="flex items-center justify-center">
                            <ModeToggle />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
