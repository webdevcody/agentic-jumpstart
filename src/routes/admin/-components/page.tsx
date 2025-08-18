import { ReactNode } from "react";

interface PageProps {
  children: ReactNode;
}

export function Page({ children }: PageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-theme-50/5 to-theme-100/10 dark:from-background dark:via-theme-950/10 dark:to-theme-900/20"></div>

      {/* Main content */}
      <div className="relative z-10">
        <div className="container mx-auto px-6 py-20 pt-8 max-w-7xl">
          {children}
        </div>
      </div>
    </div>
  );
}
