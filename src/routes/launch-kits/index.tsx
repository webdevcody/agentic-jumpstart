import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAllLaunchKitsFn, getTagsByCategoryFn } from "~/fn/launch-kits";
import { queryOptions } from "@tanstack/react-query";
import {
  PageHeader,
  SidebarFilters,
  ResultsGrid,
  useLaunchKitsFiltering,
  useCloneAction,
} from "./-components";

export const Route = createFileRoute("/launch-kits/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(allLaunchKitsQuery);
    context.queryClient.ensureQueryData(tagsByCategoryQuery);
  },
  component: LaunchKitsPage,
});

const allLaunchKitsQuery = queryOptions({
  queryKey: ["launch-kits-all"],
  queryFn: () =>
    getAllLaunchKitsFn({
      data: {
        search: "",
        tags: [],
      },
    }),
});

const tagsByCategoryQuery = queryOptions({
  queryKey: ["launch-kit-tags-by-category"],
  queryFn: () => getTagsByCategoryFn(),
});

function LaunchKitsPage() {
  const { data: allLaunchKits, isLoading } = useQuery(allLaunchKitsQuery);
  const { data: tagsByCategory } = useQuery(tagsByCategoryQuery);

  const {
    searchTerm,
    selectedTags,
    expandedCategories,
    filteredLaunchKits,
    hasActiveFilters,
    handleSearchChange,
    toggleTag,
    toggleCategory,
    clearFilters,
  } = useLaunchKitsFiltering(allLaunchKits, tagsByCategory);

  const { handleClone } = useCloneAction();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <SidebarFilters
            searchTerm={searchTerm}
            selectedTags={selectedTags}
            expandedCategories={expandedCategories}
            tagsByCategory={tagsByCategory}
            onSearchChange={handleSearchChange}
            onToggleTag={toggleTag}
            onToggleCategory={toggleCategory}
            onClearFilters={clearFilters}
          />

          <ResultsGrid
            isLoading={isLoading}
            filteredLaunchKits={filteredLaunchKits}
            hasActiveFilters={hasActiveFilters}
            onClone={handleClone}
            onClearFilters={clearFilters}
          />
        </div>
      </div>
    </div>
  );
}

