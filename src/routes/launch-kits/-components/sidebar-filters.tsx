import { SearchSection } from "./search-section";
import { ActiveFilters } from "./active-filters";
import { TagCategories } from "./tag-categories";

interface SidebarFiltersProps {
  searchTerm: string;
  selectedTags: string[];
  expandedCategories: Set<string>;
  tagsByCategory: Record<string, any[]> | undefined;
  onSearchChange: (value: string) => void;
  onToggleTag: (tagSlug: string) => void;
  onToggleCategory: (category: string) => void;
  onClearFilters: () => void;
}

export function SidebarFilters({
  searchTerm,
  selectedTags,
  expandedCategories,
  tagsByCategory,
  onSearchChange,
  onToggleTag,
  onToggleCategory,
  onClearFilters,
}: SidebarFiltersProps) {
  return (
    <div className="lg:w-80 flex-shrink-0">
      <div className="lg:sticky lg:top-8 space-y-6">
        <SearchSection
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
        />

        <ActiveFilters
          searchTerm={searchTerm}
          selectedTags={selectedTags}
          tagsByCategory={tagsByCategory}
          onClearAll={onClearFilters}
          onClearSearch={() => onSearchChange("")}
          onRemoveTag={onToggleTag}
        />

        <TagCategories
          tagsByCategory={tagsByCategory}
          selectedTags={selectedTags}
          expandedCategories={expandedCategories}
          onToggleTag={onToggleTag}
          onToggleCategory={onToggleCategory}
        />
      </div>
    </div>
  );
}