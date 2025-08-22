/// <reference types="vite/client" />
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  redirect,
} from "@tanstack/react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { HeadContent, Scripts } from "@tanstack/react-router";
import * as React from "react";
import { type QueryClient } from "@tanstack/react-query";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import appCss from "~/styles/app.css?url";
import { seo } from "~/utils/seo";
import { Header } from "~/routes/-components/header";
import { FooterSection } from "~/routes/-components/footer";
import { ThemeProvider } from "~/components/ThemeProvider";
import { ThemeToggle } from "~/components/theme-toggle";
import { Toaster } from "sonner";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { shouldShowEarlyAccessFn } from "~/fn/early-access";
import { useAnalytics } from "~/hooks/use-analytics";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    beforeLoad: async ({ location }) => {
      const shouldShowEarlyAccess = await shouldShowEarlyAccessFn();
      if (shouldShowEarlyAccess && location.pathname !== "/") {
        throw redirect({ to: "/" });
      }
    },
    loader: async () => {
      const shouldShowEarlyAccess = await shouldShowEarlyAccessFn();
      return { shouldShowEarlyAccess };
    },
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        ...seo({
          title: "Agentic Jumpstart | by WebDevCody",
          description:
            "A course to help you learn agentic coding and build real-world projects using AI agents and automation.",
        }),
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/favicon-16x16.png",
        },
        { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
        { rel: "icon", href: "/favicon.ico" },
      ],
      scripts: [
        {
          src: "https://umami-production-101d.up.railway.app/script.js",
          defer: true,
          "data-website-id": "a25b9b45-4772-4642-b752-052c04e52cf5",
        },
      ],
    }),
    errorComponent: (props) => {
      return (
        <RootDocument>
          <DefaultCatchBoundary {...props} />
        </RootDocument>
      );
    },
    notFoundComponent: () => <NotFound />,
    component: RootComponent,
  }
);

function RootComponent() {
  // Initialize analytics tracking
  useAnalytics();

  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const routerState = useRouterState();
  const { shouldShowEarlyAccess } = Route.useLoaderData();
  const showFooter =
    !routerState.location.pathname.startsWith("/learn") &&
    !routerState.location.pathname.startsWith("/admin") &&
    !shouldShowEarlyAccess;
  const showHeader =
    !routerState.location.pathname.startsWith("/learn") &&
    !routerState.location.pathname.startsWith("/admin") &&
    !shouldShowEarlyAccess;
  const showThemeToggle =
    routerState.location.pathname === "/" && shouldShowEarlyAccess;

  const prevPathnameRef = React.useRef("");

  React.useEffect(() => {
    const currentPathname = routerState.location.pathname;
    const pathnameChanged = prevPathnameRef.current !== currentPathname;

    if (pathnameChanged && routerState.status === "pending") {
      NProgress.start();
      prevPathnameRef.current = currentPathname;
    }

    if (routerState.status === "idle") {
      NProgress.done();
    }
  }, [routerState.status, routerState.location.pathname]);

  return (
    <html className="font-inter" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Constants (must match ThemeProvider.tsx)
                const THEME_COOKIE_NAME = 'ui-theme';
                const COOKIE_EXPIRY_DAYS = 365;
                const MILLISECONDS_PER_DAY = 864e5;
                const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)';
                const THEME_CLASSES = { LIGHT: 'light', DARK: 'dark' };
                
                // Get theme from cookie
                let theme = document.cookie.match(new RegExp('(^| )' + THEME_COOKIE_NAME + '=([^;]+)'))?.[2];
                
                let resolvedTheme;
                let root = document.documentElement;
                
                // Clear any existing theme classes
                root.classList.remove(THEME_CLASSES.LIGHT, THEME_CLASSES.DARK);
                
                if (!theme || theme === 'system') {
                  // Use system preference for system theme or if no theme is set
                  resolvedTheme = window.matchMedia(DARK_MODE_MEDIA_QUERY).matches ? THEME_CLASSES.DARK : THEME_CLASSES.LIGHT;
                  
                  if (!theme) {
                    // Set cookie with system preference on first visit
                    const expires = new Date(Date.now() + COOKIE_EXPIRY_DAYS * MILLISECONDS_PER_DAY).toUTCString();
                    document.cookie = THEME_COOKIE_NAME + '=system; expires=' + expires + '; path=/; SameSite=Lax';
                  }
                } else {
                  resolvedTheme = theme;
                }
                
                root.classList.add(resolvedTheme);
                
                // Add data attribute for debugging
                root.setAttribute('data-theme', theme || 'system');
                root.setAttribute('data-resolved-theme', resolvedTheme);
              })();
            `,
          }}
        />
        <style>{`
          #nprogress .bar {
            background: #00acc1 !important;
            height: 3px;
          }
          #nprogress .peg {
            box-shadow: 0 0 10px #00acc1, 0 0 5px #00acc1;
          }
          #nprogress .spinner-icon {
            display: none;
          }
        `}</style>
      </head>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider>
          {showHeader && <Header />}
          <main
            className={`overflow-x-hidden flex-1 ${showHeader ? "mt-16" : ""}`}
          >
            {children}
          </main>
          {showFooter && <FooterSection />}
          {showThemeToggle && (
            <div className="fixed top-4 right-4 z-50">
              <ThemeToggle />
            </div>
          )}
          <Toaster />
          {/* <TanStackRouterDevtools position="bottom-right" />
          <ReactQueryDevtools buttonPosition="bottom-left" /> */}
          <Scripts />
        </ThemeProvider>
      </body>
    </html>
  );
}
