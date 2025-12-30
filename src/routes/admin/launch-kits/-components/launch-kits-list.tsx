import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { AppCard } from "~/components/app-card";
import { LaunchKitCard } from "./launch-kit-card";
import { Plus, GitFork } from "lucide-react";

interface LaunchKitTag {
  id: number;
  name: string;
  slug: string;
  color: string;
  categoryId: number | null;
  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

interface LaunchKit {
  id: number;
  name: string;
  slug: string;
  description: string;
  longDescription: string | null;
  repositoryUrl: string;
  demoUrl: string | null;
  imageUrl: string | null;
  cloneCount: number;
  createdAt: Date;
  tags?: LaunchKitTag[];
}

interface LaunchKitsListProps {
  launchKits: LaunchKit[] | undefined;
  isLoading: boolean;
  onDeleteKit: (id: number) => void;
}

export function LaunchKitsList({
  launchKits,
  isLoading,
  onDeleteKit,
}: LaunchKitsListProps) {
  if (isLoading) {
    return <div className="text-center py-8">Loading launch kits...</div>;
  }

  if (launchKits?.length === 0) {
    return (
      <AppCard
        title="No Launch Kits Found"
        description="Get started by creating your first launch kit."
        icon={GitFork}
      >
        <div className="text-center py-4">
          <Button asChild>
            <Link to="/admin/launch-kits/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Launch Kit
            </Link>
          </Button>
        </div>
      </AppCard>
    );
  }

  return (
    <div
      className="space-y-4"
    >
      {launchKits?.map((kit, index) => (
        <div
          key={kit.id}
          style={{
            animationDelay: `${0.6 + index * 0.1}s`,
            animationFillMode: "both",
          }}
        >
          <LaunchKitCard kit={kit} onDelete={onDeleteKit} />
        </div>
      ))}
    </div>
  );
}
