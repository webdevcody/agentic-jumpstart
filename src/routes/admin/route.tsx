import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminNav } from "~/routes/admin/-components/admin-nav";
import { assertIsAdminFn } from "~/fn/auth";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => assertIsAdminFn(),
  component: AdminLayout,
});

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-background flex">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-background/95 backdrop-blur-sm border-border/60"
        >
          {sidebarOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Navigation - Responsive with mobile slide-out */}
      <div className={`
        h-full overflow-y-auto transition-transform duration-300 ease-in-out z-40
        lg:relative lg:translate-x-0
        ${sidebarOpen 
          ? 'fixed translate-x-0' 
          : 'fixed -translate-x-full lg:translate-x-0'
        }
      `}>
        <AdminNav onItemClick={() => setSidebarOpen(false)} />
      </div>

      {/* Main content with background gradient */}
      <div className="flex-1 relative h-full overflow-y-auto">
        {/* Background with subtle gradient - only for main content */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-theme-50/5 to-theme-100/10 dark:from-background dark:via-theme-950/10 dark:to-theme-900/20"></div>
        
        {/* Main content */}
        <div className="relative z-10">
          <div className="container mx-auto px-6 py-8 max-w-7xl lg:ml-0 lg:pt-8 pt-16">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
