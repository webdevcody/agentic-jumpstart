import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { X } from "lucide-react";

interface ActiveFiltersProps {
  searchTerm: string;
  selectedTags: string[];
  tagsByCategory: Record<string, any[]> | undefined;
  onClearAll: () => void;
  onClearSearch: () => void;
  onRemoveTag: (tagSlug: string) => void;
}

export function ActiveFilters({
  searchTerm,
  selectedTags,
  tagsByCategory,
  onClearAll,
  onClearSearch,
  onRemoveTag,
}: ActiveFiltersProps) {
  const hasActiveFilters = searchTerm || selectedTags.length > 0;

  if (!hasActiveFilters) return null;

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          Active Filters
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2 text-xs"
        >
          Clear All
        </Button>
      </div>
      <div className="space-y-2">
        {searchTerm && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Search: "{searchTerm}"
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSearch}
              className="h-4 w-4 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        {selectedTags.map((tagSlug) => {
          const allTags = Object.values(tagsByCategory || {}).flat();
          const tag = allTags.find((t: any) => t.slug === tagSlug);
          return (
            <div key={tagSlug} className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="text-xs"
                style={{
                  backgroundColor: tag?.color + "20",
                  borderColor: tag?.color + "40",
                  color: tag?.color,
                }}
              >
                {tag?.name || tagSlug}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveTag(tagSlug)}
                className="h-4 w-4 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}