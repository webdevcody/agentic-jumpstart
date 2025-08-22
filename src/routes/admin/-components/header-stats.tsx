import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "~/lib/utils";

interface HeaderStatCardProps {
  icon: LucideIcon;
  iconColor?: "blue" | "yellow" | "green" | "purple" | "orange" | "theme";
  value: ReactNode;
  label: string;
  subValue?: ReactNode;
  loading?: boolean;
}

export function HeaderStatCard({
  icon: Icon,
  iconColor = "blue",
  value,
  label,
  subValue,
  loading = false,
}: HeaderStatCardProps) {
  const iconColorClasses = {
    blue: "bg-blue-500/10 dark:bg-blue-400/20 text-blue-500 dark:text-blue-400",
    yellow:
      "bg-yellow-500/10 dark:bg-yellow-400/20 text-yellow-600 dark:text-yellow-400",
    green:
      "bg-green-500/10 dark:bg-green-400/20 text-green-600 dark:text-green-400",
    purple:
      "bg-purple-500/10 dark:bg-purple-400/20 text-purple-500 dark:text-purple-400",
    orange:
      "bg-orange-500/10 dark:bg-orange-400/20 text-orange-500 dark:text-orange-400",
    theme:
      "bg-theme-500/10 dark:bg-theme-400/20 text-theme-500 dark:text-theme-400",
  };

  const textColorClasses = {
    blue: "text-blue-600 dark:text-blue-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    green: "text-green-600 dark:text-green-400",
    purple: "text-purple-500 dark:text-purple-400",
    orange: "text-orange-500 dark:text-orange-400",
    theme: "text-theme-500 dark:text-theme-400",
  };

  return (
    <div className="text-center">
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1",
          iconColorClasses[iconColor]
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className={cn("text-lg font-bold", textColorClasses[iconColor])}>
        {loading ? (
          <div className="h-5 w-8 bg-muted/50 rounded animate-pulse mx-auto"></div>
        ) : (
          value
        )}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {subValue && !loading && (
        <p className="text-xs text-muted-foreground">{subValue}</p>
      )}
    </div>
  );
}

interface HeaderStatsProps {
  children: ReactNode;
  columns?: 3 | 4 | 5;
}

export function HeaderStats({ children, columns = 3 }: HeaderStatsProps) {
  const gridColsClass = {
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
  };

  return (
    <div className={cn("grid gap-8", gridColsClass[columns])}>{children}</div>
  );
}
