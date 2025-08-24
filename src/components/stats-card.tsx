import { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

interface StatsCardProps {
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  title: string;
  value: string | number | null | undefined;
  description?: string | null | undefined;
  hoverColor?: string;
  animationDelay?: string;
}

function ValueSkeleton() {
  return <div className="h-8 w-24 bg-muted/50 rounded animate-pulse"></div>;
}

function DescriptionSkeleton() {
  return <div className="h-4 w-32 bg-muted/50 rounded animate-pulse"></div>;
}

export function StatsCard({
  icon: Icon,
  iconColor = "text-blue-500 dark:text-blue-400",
  iconBgColor = "bg-blue-500/10 dark:bg-blue-400/20",
  title,
  value,
  description,
  hoverColor = "group-hover:text-blue-600 dark:group-hover:text-blue-400",
  animationDelay = "0s",
}: StatsCardProps) {
  const iconHoverBg = iconBgColor.replace("/10", "/20").replace("/20", "/30");

  return (
    <div
      className="group relative animate-in fade-in slide-in-from-bottom-2 duration-500"
      style={{ animationDelay, animationFillMode: "both" }}
    >
      <div className="module-card p-6 h-full">
        <div className="flex flex-row items-center justify-between space-y-0 mb-4">
          <div className="text-sm font-medium text-muted-foreground">
            {title}
          </div>
          {Icon && (
            <div
              className={`w-10 h-10 rounded-full ${iconBgColor} flex items-center justify-center group-hover:${iconHoverBg} transition-colors duration-300`}
            >
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
          )}
        </div>
        <div
          className={`text-3xl font-bold text-foreground mb-2 ${hoverColor} transition-colors duration-300`}
        >
          {value === null || value === undefined ? (
            <ValueSkeleton />
          ) : typeof value === "number" ? (
            value.toLocaleString()
          ) : (
            value
          )}
        </div>
        {description !== undefined && (
          <div className="text-sm text-muted-foreground">
            {description === null ? <DescriptionSkeleton /> : description}
          </div>
        )}
      </div>
    </div>
  );
}
