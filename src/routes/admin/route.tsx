import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminNav } from "~/routes/admin/-components/admin-nav";
import { assertIsAdminFn } from "~/fn/auth";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => assertIsAdminFn(),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="h-screen bg-background flex">
      {/* Navigation - Full height with scroll */}
      <div className="h-full overflow-y-auto">
        <AdminNav />
      </div>

      {/* Main content with background gradient */}
      <div className="flex-1 relative h-full overflow-y-auto">
        {/* Background with subtle gradient - only for main content */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-theme-50/5 to-theme-100/10 dark:from-background dark:via-theme-950/10 dark:to-theme-900/20"></div>
        
        {/* Main content */}
        <div className="relative z-10">
          <div className="container mx-auto px-6 py-8 max-w-7xl">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
