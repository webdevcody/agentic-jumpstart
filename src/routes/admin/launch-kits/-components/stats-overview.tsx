import { BarChart3, GitFork, MessageSquare, Tag } from "lucide-react";
import { StatsCard } from "~/components/stats-card";

interface StatsOverviewProps {
  stats: {
    totalKits?: number;
    totalClones?: number;
    totalComments?: number;
  } | undefined;
  tagsCount: number | undefined;
  isLoading: boolean;
}

export function StatsOverview({ stats, tagsCount, isLoading }: StatsOverviewProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <StatsCard
        icon={BarChart3}
        iconColor="text-blue-500 dark:text-blue-400"
        iconBgColor="bg-blue-500/10 dark:bg-blue-400/20"
        title="Total Kits"
        value={isLoading ? null : stats?.totalKits}
        hoverColor="group-hover:text-blue-600 dark:group-hover:text-blue-400"
        animationDelay="0.1s"
      />

      <StatsCard
        icon={GitFork}
        iconColor="text-green-500 dark:text-green-400"
        iconBgColor="bg-green-500/10 dark:bg-green-400/20"
        title="Total Clones"
        value={isLoading ? null : stats?.totalClones}
        hoverColor="group-hover:text-green-600 dark:group-hover:text-green-400"
        animationDelay="0.2s"
      />

      <StatsCard
        icon={MessageSquare}
        iconColor="text-orange-500 dark:text-orange-400"
        iconBgColor="bg-orange-500/10 dark:bg-orange-400/20"
        title="Total Comments"
        value={isLoading ? null : stats?.totalComments}
        hoverColor="group-hover:text-orange-600 dark:group-hover:text-orange-400"
        animationDelay="0.3s"
      />

      <StatsCard
        icon={Tag}
        iconColor="text-purple-500 dark:text-purple-400"
        iconBgColor="bg-purple-500/10 dark:bg-purple-400/20"
        title="Active Tags"
        value={tagsCount}
        hoverColor="group-hover:text-purple-600 dark:group-hover:text-purple-400"
        animationDelay="0.4s"
      />
    </div>
  );
}