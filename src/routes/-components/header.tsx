import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "../../components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "../../components/ui/sheet";
import { useState } from "react";
import { useContinueSlug } from "~/hooks/use-continue-slug";
import { cn } from "~/lib/utils";
import { useAuth } from "~/hooks/use-auth";
import { ModeToggle } from "~/components/ModeToggle";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const continueSlug = useContinueSlug();
  const user = useAuth();
  const routerState = useRouterState();

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

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-1">
                <Link
                  to="/"
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  activeProps={{
                    className: "text-theme-600 dark:text-theme-400 bg-theme-500/15 dark:bg-theme-500/10 font-semibold",
                  }}
                >
                  Home
                </Link>
                <Link
                  to="/purchase"
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  activeProps={{
                    className: "text-theme-600 dark:text-theme-400 bg-theme-500/15 dark:bg-theme-500/10 font-semibold",
                  }}
                >
                  Pricing
                </Link>
                {continueSlug ? (
                  <Link
                    to="/learn/$slug"
                    params={{ slug: continueSlug }}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      routerState.location.pathname.startsWith("/learn")
                        ? "text-theme-600 dark:text-theme-400 bg-theme-500/15 dark:bg-theme-500/10 font-semibold"
                        : ""
                    )}
                  >
                    Course Content
                  </Link>
                ) : (
                  <Link
                    to="/learn"
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      routerState.location.pathname.startsWith("/learn")
                        ? "text-theme-600 dark:text-theme-400 bg-theme-500/15 dark:bg-theme-500/10 font-semibold"
                        : ""
                    )}
                  >
                    Course Content
                  </Link>
                )}
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-3">
              <ModeToggle />
              {user ? (
                <a href="/api/logout">
                  <Button>Logout</Button>
                </a>
              ) : (
                <a href="/api/login/google">
                  <Button>Login</Button>
                </a>
              )}
              {!user?.isPremium && (
                <Link to="/purchase">
                  <div className="relative group">
                    {/* Subtle glow effect behind button */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-theme-500/20 to-theme-600/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                    <Button variant="secondary">Buy Now</Button>
                  </div>
                </Link>
              )}
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
                <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                  {/* Mobile menu with matching gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background"></div>
                  <div className="absolute inset-0 backdrop-blur-md bg-white/90 dark:bg-background/20"></div>
                  <div className="relative z-10 h-full border-l border-border">
                    <nav className="flex flex-col gap-4 mt-8 px-6">
                      <Link
                        to="/"
                        className="flex items-center py-3 text-lg text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50 px-3"
                        onClick={() => setIsOpen(false)}
                      >
                        Home
                      </Link>
                      <Link
                        to="/purchase"
                        className="flex items-center py-3 text-lg text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50 px-3"
                        onClick={() => setIsOpen(false)}
                      >
                        Pricing
                      </Link>
                      {continueSlug ? (
                        <Link
                          to="/learn/$slug"
                          params={{ slug: continueSlug }}
                          className="flex items-center py-3 text-lg text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50 px-3"
                          onClick={() => setIsOpen(false)}
                        >
                          Course Content
                        </Link>
                      ) : (
                        <Link
                          to="/learn"
                          className="flex items-center py-3 text-lg text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50 px-3"
                          onClick={() => setIsOpen(false)}
                        >
                          Course Content
                        </Link>
                      )}

                      <div className="pt-4 space-y-3 border-t border-border mt-4">
                        <div className="flex items-center justify-center">
                          <ModeToggle />
                        </div>
                        {user ? (
                          <a href="/api/logout" className="block">
                            <Button className="w-full">Logout</Button>
                          </a>
                        ) : (
                          <a href="/api/login/google" className="block">
                            <Button className="w-full module-card">
                              Login
                            </Button>
                          </a>
                        )}
                        {!user?.isPremium && (
                          <Link to="/purchase" onClick={() => setIsOpen(false)}>
                            <Button variant={"secondary"}>Buy Now</Button>
                          </Link>
                        )}
                      </div>
                    </nav>
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
