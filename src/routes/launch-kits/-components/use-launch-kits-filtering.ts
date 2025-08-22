import { useState, useMemo } from "react";

export function useLaunchKitsFiltering(
  allLaunchKits: any[] | undefined,
  tagsByCategory: Record<string, any[]> | undefined
) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(tagsByCategory || {}))
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const toggleTag = (tagSlug: string) => {
    setSelectedTags(prev => 
      prev.includes(tagSlug)
        ? prev.filter((t) => t !== tagSlug)
        : [...prev, tagSlug]
    );
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTags([]);
  };

  const hasActiveFilters = Boolean(searchTerm || selectedTags.length > 0);

  // Client-side filtering using useMemo
  const filteredLaunchKits = useMemo(() => {
    if (!allLaunchKits) return [];

    return allLaunchKits.filter((kit: any) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = kit.name.toLowerCase().includes(searchLower);
        const matchesDescription = kit.description?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesDescription) return false;
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const kitTagSlugs = kit.tags?.map((tag: any) => tag.slug) || [];
        const hasSelectedTag = selectedTags.some(selectedTag => 
          kitTagSlugs.includes(selectedTag)
        );
        if (!hasSelectedTag) return false;
      }

      return true;
    });
  }, [allLaunchKits, searchTerm, selectedTags]);

  return {
    searchTerm,
    selectedTags,
    expandedCategories,
    filteredLaunchKits,
    hasActiveFilters,
    handleSearchChange,
    toggleTag,
    toggleCategory,
    clearFilters,
  };
}