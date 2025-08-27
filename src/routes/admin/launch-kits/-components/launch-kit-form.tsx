import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { ArrowLeft, Save } from "lucide-react";
import { BasicInformationCard } from "../create/-components/basic-information-card";
import { LinksMediaCard } from "../create/-components/links-media-card";
import { TagsCard } from "../create/-components/tags-card";
import { DeleteTagDialog } from "../create/-components/delete-tag-dialog";
import { useTags } from "../create/-components/use-tags";
import { UseFormReturn } from "react-hook-form";

export interface LaunchKitFormData {
  name: string;
  description: string;
  longDescription?: string;
  repositoryUrl: string;
  demoUrl?: string;
  imageUrl?: string;
  tagIds?: number[];
}

interface LaunchKitFormProps {
  form: UseFormReturn<LaunchKitFormData>;
  isLoading: boolean;
  formError?: string;
  onSubmit: (data: LaunchKitFormData) => void;
  onTagToggle: (tagId: number, checked: boolean) => void;
  submitLabel: string;
  mode: "create" | "edit";
}

export function LaunchKitForm({
  form,
  isLoading,
  formError,
  onSubmit,
  onTagToggle,
  submitLabel,
  mode,
}: LaunchKitFormProps) {
  const {
    tags,
    refetchTags,
    handleDeleteTag,
    confirmDeleteTag,
    closeDeleteDialog,
    isDeleteDialogOpen,
  } = useTags(form);

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Display */}
          {formError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{formError}</p>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <BasicInformationCard form={form} isLoading={isLoading} />
            <LinksMediaCard form={form} isLoading={isLoading} />
          </div>

          <TagsCard
            form={form}
            isLoading={isLoading}
            tags={tags}
            onTagToggle={onTagToggle}
            onDeleteTag={handleDeleteTag}
            refetchTags={refetchTags}
          />

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 gap-2">
            <Button variant="outline" asChild disabled={isLoading}>
              <Link to="/admin/launch-kits">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Link>
            </Button>

            <Button
              type="submit"
              disabled={isLoading}
              className="gap-2"
              data-testid="save-launch-kit-button"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {submitLabel}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      <DeleteTagDialog
        open={isDeleteDialogOpen}
        onOpenChange={closeDeleteDialog}
        onConfirm={confirmDeleteTag}
      />
    </div>
  );
}
