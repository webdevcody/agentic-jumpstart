import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createTagFn,
  updateTagFn,
  createCategoryFn,
  getAllCategoriesFn,
} from "~/fn/launch-kits";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "~/components/ui/dialog";
import { X, Check, Shuffle, Plus } from "lucide-react";

interface TagFormProps {
  onSuccess: () => void;
  tag?: {
    id: number;
    name: string;
    color: string;
    categoryId?: number | null;
  };
  preSelectedCategoryId?: number;
}

// Predefined colors for randomization
const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#84CC16", // Lime
  "#06B6D4", // Cyan
  "#A855F7", // Purple
  "#E11D48", // Rose
  "#0EA5E9", // Sky
  "#22C55E", // Green
];

export function TagForm({
  onSuccess,
  tag,
  preSelectedCategoryId,
}: TagFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [formData, setFormData] = useState({
    name: tag?.name || "",
    color: tag?.color || "#3B82F6",
    categoryId:
      preSelectedCategoryId ||
      tag?.categoryId ||
      (undefined as number | undefined),
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getAllCategoriesFn(),
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: createCategoryFn,
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setFormData((prev) => ({ ...prev, categoryId: newCategory.id }));
      setShowNewCategoryInput(false);
      setNewCategoryName("");
      toast.success("Category created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create category");
    },
  });

  // Create/Update tag mutation
  const tagMutation = useMutation({
    mutationFn: tag
      ? (data: typeof formData) =>
          updateTagFn({
            data: {
              id: tag.id,
              updates: {
                name: data.name,
                color: data.color,
                categoryId: data.categoryId,
              },
            },
          })
      : (data: typeof formData) => createTagFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["launch-kit-tags"] });
      toast.success(
        tag ? "Tag updated successfully" : "Tag created successfully"
      );
      onSuccess();
      if (!tag) {
        setFormData({
          name: "",
          color: "#3B82F6",
          categoryId: undefined,
        });
      }
    },
    onError: (error: any) => {
      toast.error(
        error.message || `Failed to ${tag ? "update" : "create"} tag`
      );
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSubmitting(true);
    tagMutation.mutate(formData);
  };

  const handleRandomizeColor = () => {
    // Get current color index or start at 0
    const currentIndex = PRESET_COLORS.indexOf(formData.color);
    const nextIndex = (currentIndex + 1) % PRESET_COLORS.length;
    setFormData((prev) => ({ ...prev, color: PRESET_COLORS[nextIndex] }));
  };

  const handleCreateCategory = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (newCategoryName.trim()) {
      createCategoryMutation.mutate({ data: { name: newCategoryName.trim() } });
    }
  };

  const isValidHexColor = (color: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  // Update form data when preSelectedCategoryId changes
  useEffect(() => {
    if (preSelectedCategoryId !== undefined && categories.length > 0) {
      console.log("Setting categoryId to:", preSelectedCategoryId);
      setFormData((prev) => ({ ...prev, categoryId: preSelectedCategoryId }));
    }
  }, [preSelectedCategoryId, categories]);

  // Debug logging
  useEffect(() => {
    console.log("TagForm state:", {
      preSelectedCategoryId,
      formData,
      categories: categories.length,
    });
  }, [preSelectedCategoryId, formData, categories]);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{tag ? "Edit Tag" : "Create New Tag"}</DialogTitle>
        <DialogDescription>
          {tag
            ? "Update the tag details"
            : "Create a new tag to categorize launch kits"}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="tag-name">Name *</Label>
          <Input
            data-testid="tag-name-input"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g., React, TypeScript, Docker"
            required
            minLength={2}
            maxLength={30}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground mt-1">2-30 characters</p>
        </div>

        <div>
          <Label htmlFor="tag-color">Color</Label>
          <div className="flex items-center gap-2">
            <Input
              id="tag-color"
              type="color"
              value={formData.color}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, color: e.target.value }))
              }
              className="w-20 h-10"
              disabled={isSubmitting}
            />
            <Input
              type="text"
              data-testid="tag-color-input"
              value={formData.color}
              onChange={(e) => {
                const value = e.target.value;
                if (value.startsWith("#") && value.length <= 7) {
                  setFormData((prev) => ({ ...prev, color: value }));
                }
              }}
              onBlur={(e) => {
                if (!isValidHexColor(e.target.value)) {
                  setFormData((prev) => ({ ...prev, color: "#3B82F6" }));
                }
              }}
              placeholder="#3B82F6"
              className="flex-1"
              disabled={isSubmitting}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRandomizeColor}
              disabled={isSubmitting}
              aria-label="Randomize color"
            >
              <Shuffle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="tag-category">Category</Label>
          {showNewCategoryInput ? (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter category name"
                data-testid="new-category-input"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={isSubmitting || createCategoryMutation.isPending}
                autoFocus
              />
              <Button
                type="button"
                size="sm"
                data-testid="add-category-button"
                onClick={(e) => handleCreateCategory(e)}
                disabled={
                  isSubmitting ||
                  createCategoryMutation.isPending ||
                  !newCategoryName.trim()
                }
              >
                Add Category
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="cancel-category-button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowNewCategoryInput(false);
                  setNewCategoryName("");
                }}
                disabled={isSubmitting || createCategoryMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Select
                key={preSelectedCategoryId || "no-category"}
                value={formData.categoryId?.toString() || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    categoryId: value ? parseInt(value) : undefined,
                  }))
                }
                disabled={isSubmitting || categoriesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category: any) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                data-testid="new-category-button"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowNewCategoryInput(true);
                }}
                disabled={isSubmitting}
                title="Create new category"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </DialogTrigger>
          <Button
            data-testid="create-tag-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                {tag ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {tag ? "Update Tag" : "Create Tag"}
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
