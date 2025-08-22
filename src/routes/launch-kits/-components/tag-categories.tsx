import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";

interface TagCategoriesProps {
  tagsByCategory: Record<string, any[]> | undefined;
  selectedTags: string[];
  expandedCategories: Set<string>;
  onToggleTag: (tagSlug: string) => void;
  onToggleCategory: (category: string) => void;
}

export function TagCategories({
  tagsByCategory,
  selectedTags,
  expandedCategories,
  onToggleTag,
  onToggleCategory,
}: TagCategoriesProps) {
  if (!tagsByCategory) return null;

  return (
    <>
      {Object.entries(tagsByCategory).map(([category, tags]) => (
        <div key={category} className="bg-card rounded-lg border p-4">
          <button
            onClick={() => onToggleCategory(category)}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              {category.replace("_", " ")}
            </h3>
            {expandedCategories.has(category) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {expandedCategories.has(category) && (
            <div className="space-y-1">
              {(tags as any[]).map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => onToggleTag(tag.slug)}
                  className={cn(
                    "flex items-center gap-2 w-full p-2 rounded-md text-sm transition-colors",
                    selectedTags.includes(tag.slug)
                      ? "bg-theme-100 text-theme-900 dark:bg-theme-900 dark:text-theme-100"
                      : "hover:bg-muted text-foreground hover:text-foreground"
                  )}
                >
                  <div
                    className="w-3 h-3 rounded-full border-2"
                    style={{
                      backgroundColor: selectedTags.includes(tag.slug)
                        ? tag.color
                        : "transparent",
                      borderColor: tag.color,
                    }}
                  />
                  <span className="flex-1 text-left">{tag.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}