import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { Plus, Tag as TagIcon, X } from "lucide-react";
import { CreateLaunchKitForm } from "./basic-information-card";
import { TagForm } from "./tag-form";

interface Tag {
  id: number;
  name: string;
  color: string;
  category: string;
}

interface TagsCardProps {
  form: UseFormReturn<CreateLaunchKitForm>;
  isLoading: boolean;
  tags: Tag[];
  onTagToggle: (tagId: number, checked: boolean) => void;
  onDeleteTag: (tagId: number) => void;
  refetchTags: () => void;
}

export function TagsCard({ 
  form, 
  isLoading, 
  tags, 
  onTagToggle, 
  onDeleteTag,
  refetchTags 
}: TagsCardProps) {
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

  const tagsByCategory = tags.reduce(
    (acc: Record<string, typeof tags>, tag) => {
      if (!acc[tag.category]) {
        acc[tag.category] = [];
      }
      acc[tag.category].push(tag);
      return acc;
    },
    {}
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tags (Optional)</CardTitle>
          <Dialog
            open={isTagDialogOpen}
            onOpenChange={setIsTagDialogOpen}
          >
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Plus className="mr-2 h-3 w-3" />
                New Tag
              </Button>
            </DialogTrigger>
            <TagForm
              onSuccess={() => {
                setIsTagDialogOpen(false);
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
                  {Object.entries(tagsByCategory).map(
                    ([category, categoryTags]) => (
                      <div key={category}>
                        <Label className="text-sm font-medium capitalize mb-2 block">
                          {category}
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {categoryTags.map((tag) => {
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
                                >
                                  <Badge
                                    variant="outline"
                                    className="relative"
                                    style={{
                                      '--tag-color': tag.color,
                                      borderColor: tag.color,
                                      color: tag.color,
                                      backgroundColor: `color-mix(in srgb, ${tag.color} 15%, transparent)`,
                                    } as React.CSSProperties & { '--tag-color': string }}
                                  >
                                    <span className="relative z-10 dark:text-white dark:drop-shadow-sm">
                                      {tag.name}
                                    </span>
                                    <div 
                                      className="absolute inset-0 rounded-md dark:bg-gray-800/80 dark:border-gray-600"
                                      style={{
                                        borderColor: 'color-mix(in srgb, var(--tag-color) 60%, #6b7280)',
                                      }}
                                    />
                                  </Badge>
                                </Label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => onDeleteTag(tag.id)}
                                  disabled={isLoading}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}