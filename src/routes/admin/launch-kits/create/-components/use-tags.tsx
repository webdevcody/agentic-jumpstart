import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAllTagsFn, deleteTagFn } from "~/fn/launch-kits";
import { UseFormReturn } from "react-hook-form";
import { CreateLaunchKitForm } from "./basic-information-card";

export function useTags(form: UseFormReturn<CreateLaunchKitForm>) {
  const queryClient = useQueryClient();
  const [deleteTagId, setDeleteTagId] = useState<number | null>(null);

  const { data: tags = [], refetch: refetchTags } = useQuery({
    queryKey: ["tags"],
    queryFn: () => getAllTagsFn(),
  });

  const deleteTagMutation = useMutation({
    mutationFn: deleteTagFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      refetchTags();
      toast.success("Tag deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete tag");
    },
  });

  const handleDeleteTag = (tagId: number) => {
    setDeleteTagId(tagId);
  };

  const confirmDeleteTag = () => {
    if (deleteTagId === null) return;

    const currentTags = form.getValues("tagIds") || [];
    if (currentTags.includes(deleteTagId)) {
      form.setValue(
        "tagIds",
        currentTags.filter((id) => id !== deleteTagId)
      );
    }

    deleteTagMutation.mutate({ data: { id: deleteTagId } });
    setDeleteTagId(null);
  };

  const closeDeleteDialog = () => {
    setDeleteTagId(null);
  };

  return {
    tags,
    refetchTags,
    deleteTagId,
    handleDeleteTag,
    confirmDeleteTag,
    closeDeleteDialog,
    isDeleteDialogOpen: deleteTagId !== null,
  };
}