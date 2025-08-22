import { ReactNode, CSSProperties } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "~/lib/utils";

interface AppCardProps {
  icon?: LucideIcon;
  iconColor?:
    | "theme"
    | "blue"
    | "green"
    | "purple"
    | "orange"
    | "red"
    | "yellow";
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const iconColorClasses = {
  theme: "text-theme-500",
  blue: "text-blue-500",
  green: "text-green-500",
  purple: "text-purple-500",
  orange: "text-orange-500",
  red: "text-red-500",
  yellow: "text-yellow-500",
};

export function AppCard({
  icon: Icon,
  iconColor = "theme",
  title,
  description,
  actions,
  children,
  className,
  style,
}: AppCardProps) {
  return (
    <Card className={className} style={style}>
      <CardHeader className="border-b border-border/50">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              {Icon && (
                <Icon className={cn("h-5 w-5", iconColorClasses[iconColor])} />
              )}
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {actions && <div className="ml-auto">{actions}</div>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
