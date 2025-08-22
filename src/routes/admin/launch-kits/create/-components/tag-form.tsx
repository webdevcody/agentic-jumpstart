import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createTagFn } from "~/fn/launch-kits";
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
} from "~/components/ui/dialog";
import { X, Check } from "lucide-react";

interface TagFormProps {
  onSuccess: () => void;
}

export function TagForm({ onSuccess }: TagFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    color: "#3B82F6",
    category: "framework" as const,
  });

  const createTagMutation = useMutation({
    mutationFn: createTagFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["launch-kit-tags"] });
      toast.success("Tag created successfully");
      onSuccess();
      setFormData({
        name: "",
        color: "#3B82F6",
        category: "framework",
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create tag");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    createTagMutation.mutate({ data: formData });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create New Tag</DialogTitle>
        <DialogDescription>
          Create a new tag to categorize launch kits
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="tag-name">Name *</Label>
          <Input
            id="tag-name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g., React, TypeScript, Docker"
            required
            disabled={isSubmitting}
          />
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
              value={formData.color}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, color: e.target.value }))
              }
              placeholder="#3B82F6"
              className="flex-1"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="tag-category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value: any) =>
              setFormData((prev) => ({ ...prev, category: value }))
            }
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="framework">Framework</SelectItem>
              <SelectItem value="language">Language</SelectItem>
              <SelectItem value="database">Database</SelectItem>
              <SelectItem value="tool">Tool</SelectItem>
              <SelectItem value="deployment">Deployment</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between pt-4">
          <DialogTrigger asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </DialogTrigger>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Create Tag
              </>
            )}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}