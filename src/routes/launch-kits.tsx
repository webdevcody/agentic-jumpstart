import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  getAllLaunchKitsFn,
  getAllTagsFn,
  trackLaunchKitViewFn,
  cloneLaunchKitFn
} from "~/fn/launch-kits";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { 
  Search, 
  GitFork, 
  ExternalLink, 
  Eye,
  Filter,
  Tag as TagIcon,
  Clock,
  User,
  Zap
} from "lucide-react";
import { queryOptions } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/launch-kits")({
  validateSearch: (search: Record<string, unknown>) => ({
    search: (search.search as string) || "",
    difficulty: (search.difficulty as string) || "",
    tags: (search.tags as string[]) || [],
  }),
  loader: ({ context, params }) => {
    const query = getLaunchKitsQuery(params);
    context.queryClient.ensureQueryData(query);
    context.queryClient.ensureQueryData(tagsQuery);
  },
  component: LaunchKitsPage,
});

const getLaunchKitsQuery = (params: any) => queryOptions({
  queryKey: ["launch-kits", params],
  queryFn: () => getAllLaunchKitsFn({ 
    data: {
      search: params.search,
      difficulty: params.difficulty,
      tags: params.tags,
    }
  }),
});

const tagsQuery = queryOptions({
  queryKey: ["launch-kit-tags"],
  queryFn: () => getAllTagsFn(),
});

function LaunchKitsPage() {
  const navigate = useNavigate();
  const { search, difficulty, tags: selectedTags } = Route.useSearch();
  const { data: launchKits, isLoading } = useQuery(getLaunchKitsQuery({ search, difficulty, tags: selectedTags }));
  const { data: tags } = useQuery(tagsQuery);
  
  const [localSearch, setLocalSearch] = useState(search);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/launch-kits",
      search: { 
        search: localSearch, 
        difficulty, 
        tags: selectedTags 
      },
    });
  };

  const handleDifficultyChange = (value: string) => {
    navigate({
      to: "/launch-kits",
      search: { 
        search, 
        difficulty: value === "all" ? "" : value, 
        tags: selectedTags 
      },
    });
  };

  const clearFilters = () => {
    setLocalSearch("");
    navigate({
      to: "/launch-kits",
      search: { search: "", difficulty: "", tags: [] },
    });
  };

  const handleClone = async (kit: any) => {
    try {
      await cloneLaunchKitFn({ data: { slug: kit.slug } });
      toast.success(`${kit.name} cloned! Check your repository.`);
      // Open repository URL
      window.open(kit.repositoryUrl, '_blank');
    } catch (error) {
      toast.error("Failed to track clone");
      // Still open the repository
      window.open(kit.repositoryUrl, '_blank');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'advanced': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-theme-500 to-theme-600 bg-clip-text text-transparent">
          Launch Kits
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover pre-built starter templates to jumpstart your next project. 
          Each kit comes with modern tools and best practices built right in.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-card/50 backdrop-blur-sm rounded-xl border p-6 mb-8">
        <div className="space-y-4">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search launch kits by name..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 pr-4 py-2"
            />
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select 
              value={difficulty || "all"} 
              onValueChange={handleDifficultyChange}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            {(search || difficulty || selectedTags.length > 0) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {(search || difficulty || selectedTags.length > 0) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {search && (
                <Badge variant="secondary">
                  Search: "{search}"
                </Badge>
              )}
              {difficulty && (
                <Badge variant="secondary">
                  Difficulty: {difficulty}
                </Badge>
              )}
              {selectedTags.map(tag => (
                <Badge key={tag} variant="secondary">
                  Tag: {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : launchKits?.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Launch Kits Found</h3>
              <p className="text-muted-foreground mb-4">
                {search || difficulty || selectedTags.length > 0 
                  ? "Try adjusting your filters to find more results."
                  : "No launch kits are available yet. Check back soon!"
                }
              </p>
              {(search || difficulty || selectedTags.length > 0) && (
                <Button onClick={clearFilters}>Clear Filters</Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            {launchKits?.length === 1 
              ? "1 launch kit found"
              : `${launchKits?.length || 0} launch kits found`
            }
          </div>

          {/* Launch Kits Grid - Single Column for Visual Impact */}
          <div className="space-y-6">
            {launchKits?.map((kit: any) => (
              <LaunchKitCard 
                key={kit.id} 
                kit={kit} 
                onClone={() => handleClone(kit)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LaunchKitCard({ kit, onClone }: { kit: any; onClone: () => void }) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-theme-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-xl group-hover:text-theme-600 transition-colors">
                {kit.name}
              </CardTitle>
              <Badge 
                className={`${getDifficultyColor(kit.difficulty)} border-0`}
                variant="secondary"
              >
                {kit.difficulty}
              </Badge>
            </div>
            <CardDescription className="text-base leading-relaxed">
              {kit.description}
            </CardDescription>
          </div>
          
          {kit.imageUrl && (
            <div className="ml-4 flex-shrink-0">
              <img 
                src={kit.imageUrl} 
                alt={kit.name}
                className="w-20 h-20 rounded-lg object-cover border"
              />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Long Description */}
        {kit.longDescription && (
          <p className="text-muted-foreground leading-relaxed">
            {kit.longDescription}
          </p>
        )}

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <GitFork className="h-4 w-4" />
            {kit.cloneCount} clones
          </span>
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {kit.authorName}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {new Date(kit.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex gap-2">
            <Button onClick={onClone} className="group/btn">
              <GitFork className="mr-2 h-4 w-4 group-hover/btn:rotate-12 transition-transform" />
              Clone Repository
            </Button>
            
            {kit.demoUrl && (
              <Button variant="outline" asChild>
                <a href={kit.demoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Demo
                </a>
              </Button>
            )}
          </div>

          <Link
            to="/launch-kits/$slug"
            params={{ slug: kit.slug }}
            className="inline-flex items-center text-sm text-theme-600 hover:text-theme-700 font-medium transition-colors"
          >
            <Eye className="mr-1 h-4 w-4" />
            View Details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}