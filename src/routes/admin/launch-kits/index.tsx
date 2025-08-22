import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  getAllLaunchKitsFn,
  getLaunchKitStatsFn,
  getAllTagsFn,
} from "~/fn/launch-kits";
import { assertIsAdminFn } from "~/fn/auth";
import { PageHeader } from "../-components/page-header";
import { queryOptions } from "@tanstack/react-query";
import { StatsOverview } from "./-components/stats-overview";
import { LaunchKitsList } from "./-components/launch-kits-list";
import { DeleteLaunchKitDialog } from "./-components/delete-launch-kit-dialog";
import { useLaunchKitDeletion } from "./-components/use-launch-kit-deletion";
import { Page } from "../-components/page";

export const Route = createFileRoute("/admin/launch-kits/")({
  beforeLoad: () => assertIsAdminFn(),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(launchKitsQuery);
    context.queryClient.ensureQueryData(statsQuery);
    context.queryClient.ensureQueryData(tagsQuery);
  },
  component: AdminLaunchKits,
});

const launchKitsQuery = queryOptions({
  queryKey: ["admin", "launch-kits"],
  queryFn: () => getAllLaunchKitsFn({ data: {} }),
});

const statsQuery = queryOptions({
  queryKey: ["admin", "launch-kit-stats"],
  queryFn: () => getLaunchKitStatsFn(),
});

const tagsQuery = queryOptions({
  queryKey: ["launch-kit-tags"],
  queryFn: () => getAllTagsFn(),
});

function AdminLaunchKits() {
  const { data: launchKits, isLoading: kitsLoading } =
    useQuery(launchKitsQuery);
  const { data: stats, isLoading: statsLoading } = useQuery(statsQuery);
  const { data: tags } = useQuery(tagsQuery);

  const {
    isDialogOpen,
    handleDeleteLaunchKit,
    confirmDeleteLaunchKit,
    closeDialog,
  } = useLaunchKitDeletion();

  return (
    <Page>
      <PageHeader
        title="Launch Kits Management"
        highlightedWord="Management"
        description="Manage launch kits and monitor analytics for starter repositories"
      />

      <StatsOverview
        stats={stats}
        tagsCount={tags?.length}
        isLoading={statsLoading}
      />

      <LaunchKitsList
        launchKits={launchKits}
        isLoading={kitsLoading}
        onDeleteKit={handleDeleteLaunchKit}
      />

      <DeleteLaunchKitDialog
        open={isDialogOpen}
        onOpenChange={closeDialog}
        onConfirm={confirmDeleteLaunchKit}
      />
    </Page>
  );
}
