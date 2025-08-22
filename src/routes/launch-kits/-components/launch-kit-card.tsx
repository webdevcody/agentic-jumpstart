import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { GitFork, ExternalLink, Eye, Clock } from "lucide-react";

interface LaunchKitCardProps {
  kit: any;
  onClone: () => void;
}

export function LaunchKitCard({ kit, onClone }: LaunchKitCardProps) {
  const kitTags = kit.tags || [];

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-theme-200 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg group-hover:text-theme-400 dark:group-hover:text-theme-300 transition-colors mb-2 line-clamp-2">
              {kit.name}
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed line-clamp-3">
              {kit.description}
            </CardDescription>
          </div>

          {kit.imageUrl && (
            <div className="ml-3 flex-shrink-0">
              <img
                src={kit.imageUrl}
                alt={kit.name}
                className="w-16 h-16 rounded-lg object-cover border"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Tags */}
        {kitTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {kitTags.slice(0, 4).map((tag: any) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs h-5 px-2"
                style={{
                  borderColor: tag.color + "60",
                  color: tag.color,
                  backgroundColor: tag.color + "08",
                }}
              >
                {tag.name}
              </Badge>
            ))}
            {kitTags.length > 4 && (
              <Badge variant="outline" className="text-xs h-5 px-2">
                +{kitTags.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Meta Information */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <GitFork className="h-3 w-3" />
            {kit.cloneCount}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(kit.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Spacer to push actions to bottom */}
        <div className="flex-1"></div>

        {/* Primary Action - Clone (most prominent) */}
        <Button
          onClick={onClone}
          size="sm"
          className="w-full group/btn text-xs mb-3"
        >
          <GitFork className="mr-1 h-3 w-3 group-hover/btn:rotate-12 transition-transform" />
          Clone Repository
        </Button>

        {/* Secondary Actions - Horizontal layout */}
        <div className="flex gap-2 text-xs">
          <Link
            to="/launch-kits/$slug"
            params={{ slug: kit.slug }}
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full text-xs">
              <Eye className="mr-1 h-3 w-3" />
              Details
            </Button>
          </Link>

          {kit.demoUrl && (
            <Button variant="ghost" size="sm" asChild className="flex-1">
              <a
                href={kit.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Demo
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}