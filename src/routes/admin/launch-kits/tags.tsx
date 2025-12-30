import { createFileRoute, Link } from "@tanstack/react-router";
import { assertIsAdminFn } from "~/fn/auth";
import { Page } from "~/routes/admin/-components/page";
import { PageHeader } from "~/routes/admin/-components/page-header";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllTagsFn,
  getAllCategoriesFn,
  deleteTagFn,
  deleteCategoryFn,
  updateCategoryFn,
  createCategoryFn,
} from "~/fn/launch-kits";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Plus,
  Tag as TagIcon,
  Edit2,
  Trash2,
  MoreVertical,
  FolderOpen,
  Check,
  X,
  ArrowLeft,
} from "lucide-react";
import { TagForm } from "./create/-components/tag-form";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/launch-kits/tags")({
  beforeLoad: () => assertIsAdminFn(),
  component: TagManagementPage,
});

function TagManagementPage() {
  const queryClient = useQueryClient();
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);
  const [deletingTagId, setDeletingTagId] = useState<number | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(
    null
  );
  const [renamingCategoryId, setRenamingCategoryId] = useState<number | null>(
    null
  );
  const [categoryNewName, setCategoryNewName] = useState("");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedCategoryForTag, setSelectedCategoryForTag] = useState<
    number | null
  >(null);

  // Fetch data
  const {
    data: tags = [],
    isLoading: tagsLoading,
    refetch: refetchTags,
  } = useQuery({
    queryKey: ["tags"],
    queryFn: () => getAllTagsFn(),
  });

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getAllCategoriesFn(),
  });

  // Mutations
  const deleteTagMutation = useMutation({
    mutationFn: deleteTagFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag deleted successfully");
      setDeletingTagId(null);
    },
    onError: (error: any) => {
      const message = error.message || "Failed to delete tag";
      if (message.includes("in use")) {
        toast.error("Cannot delete tag: " + message);
      } else {
        toast.error(message);
      }
      setDeletingTagId(null);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategoryFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Category deleted successfully");
      setDeletingCategoryId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete category");
      setDeletingCategoryId(null);
    },
  });

  const renameCategoryMutation = useMutation({
    mutationFn: updateCategoryFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Category renamed successfully");
      setRenamingCategoryId(null);
      setCategoryNewName("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to rename category");
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: createCategoryFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Category created successfully");
      setIsCategoryDialogOpen(false);
      setNewCategoryName("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create category");
    },
  });

  // Group tags by category
  const tagsByCategory = tags.reduce(
    (acc: Record<string, typeof tags>, tag: any) => {
      const categoryName = tag.category?.name || "Uncategorized";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(tag);
      return acc;
    },
    {}
  );

  // Create a complete list of all categories (including those without tags)
  const allCategories = categories.map((category: any) => category.name);
  const categoriesWithTags = Object.keys(tagsByCategory);

  // Add categories that don't have any tags yet
  allCategories.forEach((categoryName) => {
    if (!tagsByCategory[categoryName]) {
      tagsByCategory[categoryName] = [];
    }
  });

  // Sort categories alphabetically, but keep "Uncategorized" at the end
  const sortedCategories = Object.keys(tagsByCategory).sort((a, b) => {
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });

  const handleEditTag = (tag: any) => {
    setEditingTag(tag);
    setIsTagDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsTagDialogOpen(false);
    setEditingTag(null);
    setSelectedCategoryForTag(null);
    refetchTags();
  };

  const handleRenameCategory = (categoryId: number, currentName: string) => {
    setRenamingCategoryId(categoryId);
    setCategoryNewName(currentName);
  };

  const submitRenameCategory = () => {
    if (renamingCategoryId && categoryNewName.trim()) {
      renameCategoryMutation.mutate({
        data: {
          id: renamingCategoryId,
          updates: { name: categoryNewName.trim() },
        },
      });
    }
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      createCategoryMutation.mutate({
        data: { name: newCategoryName.trim() },
      });
    }
  };

  const handleAddTagToCategory = (categoryId: number) => {
    setSelectedCategoryForTag(categoryId);
    setIsTagDialogOpen(true);
  };

  return (
    <Page>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link
          to="/admin/launch-kits"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Launch Kits
        </Link>
        <span>/</span>
        <span className="text-foreground">Tag Management</span>
      </div>

      <PageHeader
        title="Tag Management"
        highlightedWord="Management"
        description="Manage tags and categories for launch kits"
        actions={
          <div className="flex gap-2 self-end">
            <Dialog
              open={isCategoryDialogOpen}
              onOpenChange={(open) => {
                if (!open) {
                  setIsCategoryDialogOpen(false);
                  setNewCategoryName("");
                } else {
                  setIsCategoryDialogOpen(true);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  New Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                  <DialogDescription>
                    Create a new category to organize your tags.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input
                      id="category-name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCreateCategory();
                        }
                      }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCategoryDialogOpen(false);
                      setNewCategoryName("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCategory}
                    disabled={
                      !newCategoryName.trim() ||
                      createCategoryMutation.isPending
                    }
                  >
                    {createCategoryMutation.isPending
                      ? "Creating..."
                      : "Create Category"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Tag
                </Button>
              </DialogTrigger>
              <TagForm
                tag={editingTag || undefined}
                onSuccess={handleDialogClose}
                preSelectedCategoryId={selectedCategoryForTag || undefined}
              />
            </Dialog>
          </div>
        }
      />

      {tagsLoading || categoriesLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : tags.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <TagIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No tags yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first tag to start categorizing launch kits.
            </p>
            <Button onClick={() => setIsTagDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Tag
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedCategories.map((categoryName) => {
            const category = categories.find(
              (c: any) => c.name === categoryName
            );
            const categoryTags = tagsByCategory[categoryName];

            return (
              <Card key={categoryName} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FolderOpen className="h-5 w-5 text-muted-foreground" />
                      {renamingCategoryId === category?.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={categoryNewName}
                            onChange={(e) => setCategoryNewName(e.target.value)}
                            className="h-8 w-48"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                submitRenameCategory();
                              } else if (e.key === "Escape") {
                                setRenamingCategoryId(null);
                                setCategoryNewName("");
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={submitRenameCategory}
                            disabled={!categoryNewName.trim()}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setRenamingCategoryId(null);
                              setCategoryNewName("");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          {categoryName}
                          <span className="text-sm text-muted-foreground font-normal">
                            ({categoryTags.length}{" "}
                            {categoryTags.length === 1 ? "tag" : "tags"})
                          </span>
                        </>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {categoryName !== "Uncategorized" ? (
                        category && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddTagToCategory(category.id)}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add Tag
                          </Button>
                        )
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCategoryForTag(null);
                            setIsTagDialogOpen(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Tag
                        </Button>
                      )}
                      {category &&
                        categoryName !== "Uncategorized" &&
                        renamingCategoryId !== category.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`Category settings for ${categoryName}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRenameCategory(
                                    category.id,
                                    category.name
                                  )
                                }
                              >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Rename Category
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setDeletingCategoryId(category.id)
                                }
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Category
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {categoryTags.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm border-t border-border/50">
                      No tags in this category
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 pt-3 border-t border-border/50">
                      {categoryTags.map((tag: any) => (
                        <div key={tag.id} className="group relative">
                          <Badge
                            variant="outline"
                            className="text-xs py-1 px-2 w-full justify-center text-center truncate"
                            style={{
                              borderColor: tag.color,
                              color: tag.color,
                              backgroundColor: `color-mix(in srgb, ${tag.color} 15%, transparent)`,
                            }}
                          >
                            {tag.name}
                          </Badge>
                          <div className="opacity-0 group-hover:opacity-100 flex gap-1 absolute -top-1 -right-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm border border-border/50"
                              onClick={() => handleEditTag(tag)}
                              aria-label={`Edit tag ${tag.name}`}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm border border-border/50"
                              onClick={() => setDeletingTagId(tag.id)}
                              aria-label={`Delete tag ${tag.name}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete tag confirmation dialog */}
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
              {tags.find((t: any) => t.id === deletingTagId)?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingTagId) {
                  deleteTagMutation.mutate({ data: { id: deletingTagId } });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete category confirmation dialog */}
      <AlertDialog
        open={deletingCategoryId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingCategoryId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "
              {categories.find((c: any) => c.id === deletingCategoryId)?.name}"?
              Tags in this category will become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingCategoryId) {
                  deleteCategoryMutation.mutate({
                    data: { id: deletingCategoryId },
                  });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
