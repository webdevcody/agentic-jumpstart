import { Link } from "@tanstack/react-router";
import { Badge } from "~/components/ui/badge";
import { ArrowRight, CheckCircle, Lock } from "lucide-react";
import { type Segment } from "~/db/schema";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { GlassPanel } from "~/components/ui/glass-panel";

interface UpgradePlaceholderProps {
  currentSegment: Segment;
}

export function UpgradePlaceholder({
  currentSegment,
}: UpgradePlaceholderProps) {
  return (
    <div className="relative">
      <GlassPanel
        variant="cyan"
        className="aspect-video flex items-center justify-center"
      >
        {/* Content */}
        <div className="p-8 text-center space-y-6">
          {/* Premium badge and lock icon */}
          <div className="flex items-center justify-center space-x-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 shadow-elevation-2">
              <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <Badge
              variant="outline"
              className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 px-4 py-2 text-sm font-semibold"
            >
              PREMIUM CONTENT
            </Badge>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground leading-tight">
              {currentSegment.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              This lesson is part of our premium curriculum
            </p>
          </div>

          {/* Description */}
          <div className="max-w-lg mx-auto space-y-4">
            {/* Benefits list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-theme-500" />
                <span>Advanced content</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-theme-500" />
                <span>Downloadable resources</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-theme-500" />
                <span>Priority support</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-theme-500" />
                <span>All future updates</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="space-y-3">
            <Link
              to="/purchase"
              className={cn(buttonVariants({ variant: "default" }), "w-fit")}
            >
              Upgrade to Premium
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
