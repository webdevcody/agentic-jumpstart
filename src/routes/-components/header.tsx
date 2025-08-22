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
  MoreHorizontal,
  Tag,
  LogIn,
  Rocket,
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
} from "../../components/ui/dropdown-menu";
import { useState } from "react";
import { useContinueSlug } from "~/hooks/use-continue-slug";
import { cn } from "~/lib/utils";
import { useAuth } from "~/hooks/use-auth";
import { ModeToggle } from "~/components/ModeToggle";
import { useQuery } from "@tanstack/react-query";
import { checkIfUserIsAffiliateFn } from "~/fn/affiliates";
import {
  getAgentsFeatureEnabledFn,
  getAffiliatesFeatureEnabledFn,
  getLaunchKitsFeatureEnabledFn,
} from "~/fn/app-settings";

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
  }) => boolean;
  params?: any;
  priority?: "primary" | "secondary";
}

interface AdminMenuItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAVIGATION_LINKS: NavLink[] = [
  {
    to: "/purchase",
    label: "Pricing",
    icon: Tag,
    priority: "primary",
  },
  {
    to: "/blog",
    label: "Blog",
    icon: Video,
    priority: "primary",
  },
  {
    to: "/learn/$slug",
    label: "Course Content",
    icon: Video,
    condition: ({ continueSlug }) => !!continueSlug,
    params: (data: any) => ({ slug: data.continueSlug }),
    priority: "primary",
  },
  {
    to: "/learn",
    label: "Course Content",
    icon: Video,
    condition: ({ continueSlug }) => !continueSlug,
    priority: "primary",
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
    priority: "primary",
  },
  {
    to: "/community",
    label: "Community",
    icon: Users,
    badge: {
      text: "FREE",
      className:
        "ml-2 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-600 dark:text-green-400 rounded-md font-medium",
    },
    priority: "secondary",
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
    priority: "secondary",
  },
  {
    to: "/affiliates",
    label: "Affiliate Program",
    icon: DollarSign,
    condition: ({ user, affiliatesFeatureEnabled }) =>
      !user && !!affiliatesFeatureEnabled,
    priority: "secondary",
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
    priority: "secondary",
  },
];

const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
  { to: "/admin/comments", label: "Comments", icon: MessageCircle },
  { to: "/admin/blog", label: "Blog", icon: Video },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/launch-kits", label: "Launch Kits", icon: Rocket },
  { to: "/admin/affiliates", label: "Affiliates", icon: Users },
  { to: "/admin/analytics", label: "Analytics", icon: TrendingUp },
  { to: "/admin/conversions", label: "Conversions", icon: Target },
  { to: "/admin/emails", label: "Emails", icon: Mail },
];

function getFilteredNavLinks(data: {
  user: any;
  continueSlug: string | null;
  affiliateStatus?: { isAffiliate: boolean };
  agentsFeatureEnabled?: boolean;
  affiliatesFeatureEnabled?: boolean;
  launchKitsFeatureEnabled?: boolean;
}) {
  return NAVIGATION_LINKS.filter(
    (link) => !link.condition || link.condition(data)
  );
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
  const primaryLinks = navLinks.filter((link) => link.priority === "primary");
  const secondaryLinks = navLinks.filter(
    (link) => link.priority === "secondary"
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

  return (
    <div className="hidden md:flex items-center gap-1">
      {/* Always show primary links */}
      {primaryLinks.map((link) => renderNavLink(link))}

      {/* Show secondary links directly on larger screens, in dropdown on smaller screens */}
      {secondaryLinks.length > 0 && (
        <>
          {/* Show secondary links directly on xl screens */}
          <div className="hidden xl:flex items-center gap-1">
            {secondaryLinks.map((link) => renderNavLink(link))}
          </div>

          {/* Show "More" dropdown on lg screens */}
          <div className="xl:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span>More</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {secondaryLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = routerState.location.pathname.startsWith(
                    link.to.split("$")[0].replace("/$slug", "")
                  );

                  return (
                    <DropdownMenuItem
                      key={`dropdown-${link.to}-${link.label}`}
                      asChild
                    >
                      <Link
                        to={link.to}
                        params={link.params ? link.params(navData) : undefined}
                        className={cn(
                          "flex items-center w-full",
                          isActive
                            ? "text-theme-600 dark:text-theme-400 font-semibold"
                            : ""
                        )}
                      >
                        {Icon && (
                          <Icon className="mr-2 h-4 w-4 text-theme-400" />
                        )}
                        {link.label}
                        {link.badge && (
                          <span className={cn("ml-auto", link.badge.className)}>
                            {link.badge.text}
                          </span>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
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
  return (
    <nav className="flex flex-col gap-4 mt-8 px-6">
      {navLinks.map((link) => {
        const Icon = link.icon;

        return (
          <Link
            key={`mobile-${link.to}-${link.label}`}
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
      })}
    </nav>
  );
};

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const continueSlug = useContinueSlug();
  const user = useAuth();
  const routerState = useRouterState();

  // Check if user is an affiliate (only for authenticated users)
  const { data: affiliateStatus } = useQuery({
    queryKey: ["user", "isAffiliate"],
    queryFn: () => checkIfUserIsAffiliateFn(),
    enabled: !!user && !user.isAdmin,
  });

  // Check if agents feature is enabled
  const { data: agentsFeatureEnabled } = useQuery({
    queryKey: ["agentsFeatureEnabled"],
    queryFn: () => getAgentsFeatureEnabledFn(),
  });

  // Check if affiliates feature is enabled
  const { data: affiliatesFeatureEnabled } = useQuery({
    queryKey: ["affiliatesFeatureEnabled"],
    queryFn: () => getAffiliatesFeatureEnabledFn(),
  });

  // Check if launch kits feature is enabled
  const { data: launchKitsFeatureEnabled } = useQuery({
    queryKey: ["launchKitsFeatureEnabled"],
    queryFn: () => getLaunchKitsFeatureEnabledFn(),
  });

  const navData = {
    user,
    continueSlug,
    affiliateStatus,
    agentsFeatureEnabled,
    affiliatesFeatureEnabled,
    launchKitsFeatureEnabled,
  };

  const filteredNavLinks = getFilteredNavLinks(navData);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
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
              {user ? (
                <>
                  {user.isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex items-center gap-2"
                        >
                          <User className="h-4 w-4" />
                          <span>Admin</span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {ADMIN_MENU_ITEMS.map((item) => {
                          const Icon = item.icon;
                          return (
                            <DropdownMenuItem key={item.to} asChild>
                              <Link to={item.to} className="flex items-center">
                                <Icon className="mr-2 h-4 w-4" />
                                {item.label}
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
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
                          className="flex items-center gap-2"
                        >
                          <User className="h-4 w-4" />
                          <span>Account</span>
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
                          className="flex items-center gap-2"
                        >
                          <User className="h-4 w-4" />
                          <span>Account</span>
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
              {!user?.isPremium && (
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
                      {!user?.isPremium && (
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
                              {ADMIN_MENU_ITEMS.map((item) => {
                                const Icon = item.icon;
                                return (
                                  <Link
                                    key={`mobile-admin-${item.to}`}
                                    to={item.to}
                                    className={buttonVariants({
                                      variant: "ghost",
                                      className: "w-full justify-start mb-2",
                                    })}
                                    onClick={() => setIsOpen(false)}
                                  >
                                    <Icon className="mr-2 h-4 w-4" />
                                    {item.label}
                                  </Link>
                                );
                              })}
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
