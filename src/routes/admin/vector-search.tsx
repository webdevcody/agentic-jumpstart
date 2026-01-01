import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Video, BookOpen } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { PageHeader } from "./-components/page-header";
import { Page } from "./-components/page";
import { searchTranscriptsFn } from "~/fn/vector-search";
import { assertIsAdminFn } from "~/fn/auth";
import { z } from "zod";

const searchParamsSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/admin/vector-search")({
  beforeLoad: () => assertIsAdminFn(),
  component: VectorSearchPage,
  validateSearch: searchParamsSchema,
});

function VectorSearchPage() {
  const { q: searchTerm = "" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [query, setQuery] = useState(searchTerm);

  useEffect(() => {
    setQuery(searchTerm);
  }, [searchTerm]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "vector-search", searchTerm],
    queryFn: () =>
      searchTranscriptsFn({ data: { query: searchTerm, limit: 20 } }),
    enabled: searchTerm.length > 0,
  });

  const handleSearch = () => {
    if (query.trim()) {
      navigate({ search: { q: query.trim() } });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Page>
      <PageHeader
        title="Vector Search"
        highlightedWord="Search"
        description="Search course transcripts using semantic similarity. Find videos that discuss specific topics."
      />

      <div className="flex gap-2 mb-8 items-center">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search transcripts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-12 h-12 text-lg"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
          size="icon"
          className="h-12 w-12 shrink-0"
        >
          {isFetching ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </Button>
      </div>

      {searchTerm && (
        <div className="mb-4 text-sm text-muted-foreground">
          Showing results for: <span className="font-medium">{searchTerm}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-4">
          {data.map((result, index) => (
            <Card key={`${result.id}-${index}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Video className="h-4 w-4 text-theme-500" />
                      {result.segmentTitle}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <BookOpen className="h-3 w-3" />
                      {result.moduleTitle}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      result.similarity > 0.8
                        ? "default"
                        : result.similarity > 0.6
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {(result.similarity * 100).toFixed(1)}% match
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {result.chunkText}
                </p>
                <Link
                  to="/learn/$slug"
                  params={{ slug: result.segmentSlug }}
                  className="text-sm text-theme-500 hover:text-theme-600 hover:underline inline-flex items-center gap-1"
                >
                  Go to video →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data && data.length === 0 && searchTerm && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No results found</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            No transcripts matched your search for "{searchTerm}". Try a
            different query or check that transcripts have been vectorized.
          </p>
        </div>
      )}

      {!searchTerm && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Search course transcripts
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Enter a topic or keyword to find videos that discuss it. This uses
            semantic search to find relevant content even if the exact words
            don't match.
          </p>
        </div>
      )}
    </Page>
  );
}
