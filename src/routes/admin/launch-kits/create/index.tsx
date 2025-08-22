import { createFileRoute, Link } from "@tanstack/react-router";
import { getAllTagsFn } from "~/fn/launch-kits";
import { assertIsAdminFn } from "~/fn/auth";
import { PageHeader } from "../../-components/page-header";
import { ArrowLeft } from "lucide-react";
import { useCreateLaunchKit } from "./-components/use-create-launch-kit";
import { LaunchKitForm } from "../-components/launch-kit-form";

export const Route = createFileRoute("/admin/launch-kits/create/")({
  beforeLoad: () => assertIsAdminFn(),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData({
      queryKey: ["tags"],
      queryFn: () => getAllTagsFn(),
    });
  },
  component: CreateLaunchKitPage,
});

function CreateLaunchKitPage() {
  const { form, isLoading, formError, onSubmit, handleTagToggle } =
    useCreateLaunchKit();

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to="/admin/launch-kits"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Launch Kits
        </Link>
        <span>/</span>
        <span className="text-foreground">Create New</span>
      </div>

      <PageHeader
        title="Create Launch Kit"
        highlightedWord="Create"
        description="Add a new launch kit to help developers get started quickly"
      />

      <LaunchKitForm
        form={form}
        isLoading={isLoading}
        formError={formError}
        onSubmit={onSubmit}
        onTagToggle={handleTagToggle}
        submitLabel="Create Launch Kit"
        mode="create"
      />
    </div>
  );
}
