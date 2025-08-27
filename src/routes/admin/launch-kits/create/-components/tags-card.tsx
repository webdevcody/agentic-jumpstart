import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogTrigger } from "~/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { FormField, FormItem, FormMessage } from "~/components/ui/form";
import { Plus, Tag as TagIcon, Edit2, Trash2 } from "lucide-react";
import { CreateLaunchKitForm } from "./basic-information-card";
import { TagForm } from "./tag-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTagFn } from "~/fn/launch-kits";
import { toast } from "sonner";

interface Tag {
  id: number;
  name: string;
  color: string;
  slug?: string;
  categoryId?: number | null;
  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

interface TagsCardProps {
  form: UseFormReturn<CreateLaunchKitForm>;
  isLoading: boolean;
  tags: Tag[];
  onTagToggle: (tagId: number, checked: boolean) => void;
  onDeleteTag?: (tagId: number) => void;
  refetchTags: () => void;
}

export function TagsCard({
  form,
  isLoading,
  tags,
  onTagToggle,
  refetchTags,
}: TagsCardProps) {
  const queryClient = useQueryClient();
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTagId, setDeletingTagId] = useState<number | null>(null);

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: deleteTagFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["launch-kit-tags"] });
      toast.success("Tag deleted successfully");
      setDeletingTagId(null);
      refetchTags();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete tag");
      setDeletingTagId(null);
    },
  });

  const handleDeleteTag = (tagId: number) => {
    deleteTagMutation.mutate({ data: { id: tagId } });
    // Also remove from selected tags if it was selected
    const currentTags = form.getValues("tagIds") || [];
    if (currentTags.includes(tagId)) {
      form.setValue(
        "tagIds",
        currentTags.filter((id) => id !== tagId)
      );
    }
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setIsTagDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsTagDialogOpen(false);
    setEditingTag(null);
  };

  // Group tags by category
  const tagsByCategory = tags.reduce(
    (acc: Record<string, typeof tags>, tag) => {
      const categoryName = tag.category?.name || "Uncategorized";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(tag);
      return acc;
    },
    {}
  );

  // Sort categories alphabetically, but keep "Uncategorized" at the end
  const sortedCategories = Object.keys(tagsByCategory).sort((a, b) => {
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tags (Optional)</CardTitle>
            <Dialog
              open={isTagDialogOpen}
              onOpenChange={(open) => {
                if (!open) {
                  handleDialogClose();
                } else {
                  setIsTagDialogOpen(true);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="new-tag-button"
                >
                  <Plus className="mr-2 h-3 w-3" />
                  New Tag
                </Button>
              </DialogTrigger>
              <TagForm
                tag={editingTag || undefined}
                onSuccess={() => {
                  handleDialogClose();
                  refetchTags();
                }}
              />
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="tagIds"
            render={() => (
              <FormItem>
                {tags.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TagIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No tags available yet.</p>
                    <p className="text-sm">
                      Create your first tag to categorize launch kits.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedCategories.map((categoryName) => (
                      <div key={categoryName}>
                        <Label className="text-sm font-medium mb-2 block">
                          {categoryName}
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {tagsByCategory[categoryName].map((tag) => {
                            const isSelected = (
                              form.getValues("tagIds") || []
                            ).includes(tag.id);
                            return (
                              <div
                                key={tag.id}
                                className="flex items-center space-x-2 group"
                              >
                                <Checkbox
                                  id={`tag-${tag.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) =>
                                    onTagToggle(tag.id, !!checked)
                                  }
                                  disabled={isLoading}
                                />
                                <Label
                                  htmlFor={`tag-${tag.id}`}
                                  className="text-sm cursor-pointer flex-1"
                                  data-testid={`tag-${tag.slug}`}
                                >
                                  <Badge
                                    variant="outline"
                                    className="relative"
                                    style={
                                      {
                                        "--tag-color": tag.color,
                                        borderColor: tag.color,
                                        color: tag.color,
                                        backgroundColor: `color-mix(in srgb, ${tag.color} 15%, transparent)`,
                                      } as React.CSSProperties & {
                                        "--tag-color": string;
                                      }
                                    }
                                    data-tag={tag.slug}
                                  >
                                    <span className="relative z-10 dark:text-white dark:drop-shadow-sm">
                                      {tag.name}
                                    </span>
                                    <div
                                      className="absolute inset-0 rounded-md dark:bg-gray-800/80 dark:border-gray-600"
                                      style={{
                                        borderColor:
                                          "color-mix(in srgb, var(--tag-color) 60%, #6b7280)",
                                      }}
                                    />
                                  </Badge>
                                </Label>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleEditTag(tag);
                                    }}
                                    disabled={isLoading}
                                    aria-label={`Edit tag ${tag.name}`}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setDeletingTagId(tag.id);
                                    }}
                                    disabled={isLoading}
                                    aria-label={`Delete tag ${tag.name}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deletingTagId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingTagId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tag "
              {tags.find((t) => t.id === deletingTagId)?.name}"?
              {/* Note: The backend will prevent deletion if the tag is in use */}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingTagId) {
                  handleDeleteTag(deletingTagId);
                }
              }}
              variant="destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
