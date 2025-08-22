import { Button } from "~/components/ui/button";
import { AppCard } from "~/components/app-card";
import { ExternalLink, Trash2, GitFork, Eye, Edit } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface LaunchKit {
  id: number;
  name: string;
  description: string;
  repositoryUrl: string;
  cloneCount: number;
  slug: string;
  createdAt: string;
}

interface LaunchKitCardProps {
  kit: LaunchKit;
  onDelete: (id: number) => void;
}

export function LaunchKitCard({ kit, onDelete }: LaunchKitCardProps) {
  return (
    <AppCard
      title={kit.name}
      description={kit.description}
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(kit.repositoryUrl, "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/admin/launch-kits/edit/$id" params={{ id: kit.id.toString() }}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(kit.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <GitFork className="h-4 w-4" />
          {kit.cloneCount} clones
        </span>
        <span className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          {kit.slug}
        </span>
        <span>{new Date(kit.createdAt).toLocaleDateString()}</span>
      </div>
    </AppCard>
  );
}
