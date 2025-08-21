# Vertical Slice 5: Search and Browse

## Overview
Implement comprehensive search functionality with full-text search, filters, pagination, and faceted browsing to help users discover agents efficiently.

## User Stories
- As a user, I can search agents by name, description, or content
- As a user, I can combine text search with tag filters
- As a user, I can filter by agent type (agent/command/hook)
- As a user, I can filter by author
- As a user, I can paginate through search results
- As a user, I can see search suggestions as I type
- As a user, I can save search queries for later use

## Database Schema

### Search Indexes
```sql
-- Full-text search index on agents
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For fuzzy search
CREATE EXTENSION IF NOT EXISTS tsv2; -- For full-text search

ALTER TABLE agents ADD COLUMN IF NOT EXISTS
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) STORED;

CREATE INDEX idx_agents_search ON agents USING GIN(search_vector);
CREATE INDEX idx_agents_name_trgm ON agents USING GIN(name gin_trgm_ops);
```

### Saved Searches Table
```sql
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  query TEXT,
  filters JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_saved_searches_user ON saved_searches(user_id);
```

### Search Analytics Table
```sql
CREATE TABLE search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  results_count INTEGER,
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(255),
  clicked_result_id UUID REFERENCES agents(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_search_analytics_query ON search_analytics(query);
CREATE INDEX idx_search_analytics_created ON search_analytics(created_at);
```

## Implementation Steps

### Step 1: Database Schema Updates
Update `/src/db/schema.ts`:
```typescript
export const savedSearches = pgTable("saved_searches", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  query: text("query"),
  filters: jsonb("filters"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const searchAnalytics = pgTable("search_analytics", {
  id: uuid("id").defaultRandom().primaryKey(),
  query: text("query").notNull(),
  resultsCount: integer("results_count"),
  userId: uuid("user_id").references(() => users.id),
  sessionId: varchar("session_id", { length: 255 }),
  clickedResultId: uuid("clicked_result_id").references(() => agents.id),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Step 2: Data Access Layer
Create `/src/data-access/search.ts`:
```typescript
interface SearchFilters {
  type?: string[];
  tags?: string[];
  authorId?: string;
  minLikes?: number;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

interface SearchOptions {
  query?: string;
  filters?: SearchFilters;
  sortBy?: 'relevance' | 'newest' | 'popular' | 'trending';
  page?: number;
  limit?: number;
}

// Main search function
export async function searchAgents({
  query,
  filters = {},
  sortBy = 'relevance',
  page = 1,
  limit = 20,
}: SearchOptions) {
  const offset = (page - 1) * limit;
  
  let baseQuery = db
    .select({
      agent: agents,
      rank: sql<number>`1`.as('rank'), // Will be replaced with actual rank
      highlights: sql<string>`''`.as('highlights'),
    })
    .from(agents)
    .where(eq(agents.isPublic, true));
    
  const conditions: SQL[] = [];
  
  // Full-text search
  if (query && query.trim()) {
    const searchQuery = query.trim().split(' ').join(' & ');
    
    baseQuery = db
      .select({
        agent: agents,
        rank: sql<number>`ts_rank(search_vector, plainto_tsquery('english', ${searchQuery}))`.as('rank'),
        highlights: sql<string>`
          ts_headline('english', name || ' ' || description, plainto_tsquery('english', ${searchQuery}))
        `.as('highlights'),
      })
      .from(agents)
      .where(
        and(
          eq(agents.isPublic, true),
          sql`search_vector @@ plainto_tsquery('english', ${searchQuery})`
        )
      );
  }
  
  // Apply filters
  if (filters.type && filters.type.length > 0) {
    conditions.push(inArray(agents.type, filters.type));
  }
  
  if (filters.authorId) {
    conditions.push(eq(agents.authorId, filters.authorId));
  }
  
  if (filters.minLikes !== undefined) {
    conditions.push(gte(agents.likeCount, filters.minLikes));
  }
  
  if (filters.dateRange) {
    conditions.push(
      and(
        gte(agents.createdAt, filters.dateRange.from),
        lte(agents.createdAt, filters.dateRange.to)
      )
    );
  }
  
  // Apply tag filters
  if (filters.tags && filters.tags.length > 0) {
    const agentsWithTags = await db
      .select({ agentId: agentTags.agentId })
      .from(agentTags)
      .innerJoin(tags, eq(agentTags.tagId, tags.id))
      .where(inArray(tags.slug, filters.tags))
      .groupBy(agentTags.agentId)
      .having(sql`COUNT(DISTINCT ${tags.id}) = ${filters.tags.length}`);
      
    const agentIds = agentsWithTags.map(a => a.agentId);
    if (agentIds.length > 0) {
      conditions.push(inArray(agents.id, agentIds));
    } else {
      // No agents match all tags
      return { results: [], total: 0 };
    }
  }
  
  // Combine all conditions
  if (conditions.length > 0) {
    baseQuery = baseQuery.where(and(...conditions));
  }
  
  // Apply sorting
  switch (sortBy) {
    case 'relevance':
      if (query) {
        baseQuery = baseQuery.orderBy(desc(sql`rank`));
      } else {
        baseQuery = baseQuery.orderBy(desc(agents.createdAt));
      }
      break;
    case 'newest':
      baseQuery = baseQuery.orderBy(desc(agents.createdAt));
      break;
    case 'popular':
      baseQuery = baseQuery.orderBy(desc(agents.likeCount));
      break;
    case 'trending':
      baseQuery = baseQuery.orderBy(desc(agents.trendingScore));
      break;
  }
  
  // Get total count
  const countQuery = db
    .select({ count: count() })
    .from(agents)
    .where(conditions.length > 0 ? and(...conditions) : eq(agents.isPublic, true));
    
  if (query && query.trim()) {
    countQuery.where(
      sql`search_vector @@ plainto_tsquery('english', ${query.trim().split(' ').join(' & ')})`
    );
  }
  
  const [totalResult] = await countQuery;
  const total = totalResult.count;
  
  // Get paginated results
  const results = await baseQuery
    .limit(limit)
    .offset(offset);
    
  // Get tags for each result
  const agentIds = results.map(r => r.agent.id);
  const agentTags = await getTagsForAgents(agentIds);
  
  // Combine results with tags
  const enrichedResults = results.map(r => ({
    ...r.agent,
    tags: agentTags[r.agent.id] || [],
    relevanceScore: r.rank,
    highlights: r.highlights,
  }));
  
  return {
    results: enrichedResults,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// Fuzzy search for autocomplete
export async function searchSuggestions(query: string, limit = 5) {
  if (!query || query.length < 2) return [];
  
  return await db
    .select({
      name: agents.name,
      slug: agents.slug,
      type: agents.type,
    })
    .from(agents)
    .where(
      and(
        eq(agents.isPublic, true),
        sql`${agents.name} ILIKE ${`%${query}%`}`
      )
    )
    .orderBy(sql`similarity(${agents.name}, ${query}) DESC`)
    .limit(limit);
}

// Get popular search terms
export async function getPopularSearches(limit = 10) {
  return await db
    .select({
      query: searchAnalytics.query,
      count: count().as('search_count'),
    })
    .from(searchAnalytics)
    .where(
      and(
        isNotNull(searchAnalytics.query),
        gte(searchAnalytics.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      )
    )
    .groupBy(searchAnalytics.query)
    .orderBy(desc(count()))
    .limit(limit);
}

// Save search query
export async function saveSearch(userId: string, name: string, query: string, filters: SearchFilters) {
  return await db
    .insert(savedSearches)
    .values({
      userId,
      name,
      query,
      filters: filters as any,
    })
    .returning();
}

// Get user's saved searches
export async function getUserSavedSearches(userId: string) {
  return await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.userId, userId))
    .orderBy(desc(savedSearches.createdAt));
}

// Track search analytics
export async function trackSearch(
  query: string,
  resultsCount: number,
  userId?: string,
  sessionId?: string
) {
  await db
    .insert(searchAnalytics)
    .values({
      query,
      resultsCount,
      userId,
      sessionId,
    });
}

// Track search click
export async function trackSearchClick(
  searchId: string,
  agentId: string
) {
  await db
    .update(searchAnalytics)
    .set({ clickedResultId: agentId })
    .where(eq(searchAnalytics.id, searchId));
}

// Get facets for search results
export async function getSearchFacets(baseFilters: SearchFilters = {}) {
  // Get type facets
  const typeFacets = await db
    .select({
      type: agents.type,
      count: count(),
    })
    .from(agents)
    .where(eq(agents.isPublic, true))
    .groupBy(agents.type);
    
  // Get top tag facets
  const tagFacets = await db
    .select({
      tag: tags.name,
      slug: tags.slug,
      count: count(),
    })
    .from(agentTags)
    .innerJoin(tags, eq(agentTags.tagId, tags.id))
    .innerJoin(agents, eq(agentTags.agentId, agents.id))
    .where(eq(agents.isPublic, true))
    .groupBy(tags.id, tags.name, tags.slug)
    .orderBy(desc(count()))
    .limit(20);
    
  // Get author facets (top authors)
  const authorFacets = await db
    .select({
      authorId: agents.authorId,
      username: users.username,
      count: count(),
    })
    .from(agents)
    .innerJoin(users, eq(agents.authorId, users.id))
    .where(eq(agents.isPublic, true))
    .groupBy(agents.authorId, users.username)
    .orderBy(desc(count()))
    .limit(10);
    
  return {
    types: typeFacets,
    tags: tagFacets,
    authors: authorFacets,
  };
}
```

### Step 3: Use Cases Layer
Create `/src/use-cases/search.ts`:
```typescript
// Enhanced search with analytics
export async function searchAgentsUseCase(
  options: SearchOptions,
  userId?: string,
  sessionId?: string
) {
  // Perform search
  const results = await searchAgents(options);
  
  // Track search analytics
  if (options.query) {
    await trackSearch(
      options.query,
      results.total,
      userId,
      sessionId
    );
  }
  
  return results;
}

// Get personalized search suggestions
export async function getPersonalizedSuggestions(userId: string) {
  // Get user's recent searches
  const recentSearches = await db
    .select({ query: searchAnalytics.query })
    .from(searchAnalytics)
    .where(eq(searchAnalytics.userId, userId))
    .orderBy(desc(searchAnalytics.createdAt))
    .limit(5);
    
  // Get user's liked agent tags
  const likedTags = await db
    .select({ tag: tags.name })
    .from(likes)
    .innerJoin(agents, eq(likes.agentId, agents.id))
    .innerJoin(agentTags, eq(agentTags.agentId, agents.id))
    .innerJoin(tags, eq(agentTags.tagId, tags.id))
    .where(eq(likes.userId, userId))
    .groupBy(tags.id, tags.name)
    .orderBy(desc(count()))
    .limit(10);
    
  return {
    recentSearches: recentSearches.map(r => r.query),
    suggestedTags: likedTags.map(t => t.tag),
  };
}
```

### Step 4: Server Functions
Create `/src/fn/search.ts`:
```typescript
export const searchAgentsFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ data }) => {
    const user = await getUserFromSession();
    const sessionId = data.sessionId || generateSessionId();
    
    return await searchAgentsUseCase(
      data,
      user?.id,
      sessionId
    );
  });

export const searchSuggestionsFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ data }) => {
    return await searchSuggestions(data.query);
  });

export const saveSearchFn = createServerFn({
  method: "POST",
})
  .middleware([authenticatedMiddleware])
  .handler(async ({ data }) => {
    const user = await getUserFromSession();
    return await saveSearch(
      user.id,
      data.name,
      data.query,
      data.filters
    );
  });

export const getSavedSearchesFn = createServerFn({
  method: "GET",
})
  .middleware([authenticatedMiddleware])
  .handler(async () => {
    const user = await getUserFromSession();
    return await getUserSavedSearches(user.id);
  });

export const getSearchFacetsFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ data }) => {
    return await getSearchFacets(data.filters);
  });

export const trackSearchClickFn = createServerFn({
  method: "POST",
})
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ data }) => {
    return await trackSearchClick(data.searchId, data.agentId);
  });
```

### Step 5: UI Components

#### Search Bar Component
Create `/src/components/search-bar.tsx`:
```typescript
interface SearchBarProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  showSuggestions?: boolean;
}

export function SearchBar({
  initialQuery = "",
  onSearch,
  placeholder = "Search agents...",
  showSuggestions = true,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounced search for suggestions
  const debouncedSearch = useMemo(
    () => debounce(async (q: string) => {
      if (q.length < 2) {
        setSuggestions([]);
        return;
      }
      
      const results = await searchSuggestionsFn({ data: { query: q } });
      setSuggestions(results);
      setShowDropdown(true);
    }, 300),
    []
  );
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (showSuggestions) {
      debouncedSearch(value);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
    setShowDropdown(false);
  };
  
  const handleSuggestionClick = (suggestion: any) => {
    setQuery(suggestion.name);
    onSearch(suggestion.name);
    setShowDropdown(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };
  
  return (
    <div className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder={placeholder}
            className="pl-10 pr-20"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2"
          >
            Search
          </Button>
        </div>
      </form>
      
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.slug}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={cn(
                "w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between",
                selectedIndex === index && "bg-gray-100"
              )}
            >
              <span>{suggestion.name}</span>
              <Badge variant="outline" className="text-xs">
                {suggestion.type}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### Search Filters Component
Create `/src/components/search-filters.tsx`:
```typescript
interface SearchFiltersProps {
  filters: SearchFilters;
  facets?: any;
  onChange: (filters: SearchFilters) => void;
}

export function SearchFilters({
  filters,
  facets,
  onChange,
}: SearchFiltersProps) {
  const handleTypeChange = (type: string, checked: boolean) => {
    const types = filters.type || [];
    if (checked) {
      onChange({ ...filters, type: [...types, type] });
    } else {
      onChange({ ...filters, type: types.filter(t => t !== type) });
    }
  };
  
  const handleTagChange = (tag: string, checked: boolean) => {
    const tags = filters.tags || [];
    if (checked) {
      onChange({ ...filters, tags: [...tags, tag] });
    } else {
      onChange({ ...filters, tags: tags.filter(t => t !== tag) });
    }
  };
  
  const handleMinLikesChange = (value: number[]) => {
    onChange({ ...filters, minLikes: value[0] });
  };
  
  const clearFilters = () => {
    onChange({});
  };
  
  const hasActiveFilters = 
    (filters.type && filters.type.length > 0) ||
    (filters.tags && filters.tags.length > 0) ||
    filters.minLikes !== undefined ||
    filters.authorId !== undefined;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
          >
            Clear all
          </Button>
        )}
      </div>
      
      {/* Type Filter */}
      <div>
        <h4 className="text-sm font-medium mb-3">Type</h4>
        <div className="space-y-2">
          {facets?.types?.map((facet: any) => (
            <label
              key={facet.type}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={filters.type?.includes(facet.type) || false}
                onCheckedChange={(checked) => 
                  handleTypeChange(facet.type, checked as boolean)
                }
              />
              <span className="text-sm">
                {facet.type}
                <span className="text-gray-500 ml-1">({facet.count})</span>
              </span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Tag Filter */}
      {facets?.tags && facets.tags.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Tags</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {facets.tags.map((facet: any) => (
              <label
                key={facet.slug}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={filters.tags?.includes(facet.slug) || false}
                  onCheckedChange={(checked) => 
                    handleTagChange(facet.slug, checked as boolean)
                  }
                />
                <span className="text-sm">
                  {facet.tag}
                  <span className="text-gray-500 ml-1">({facet.count})</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      {/* Minimum Likes Filter */}
      <div>
        <h4 className="text-sm font-medium mb-3">
          Minimum Likes: {filters.minLikes || 0}
        </h4>
        <Slider
          value={[filters.minLikes || 0]}
          onValueChange={handleMinLikesChange}
          max={100}
          step={5}
        />
      </div>
      
      {/* Date Range Filter */}
      <div>
        <h4 className="text-sm font-medium mb-3">Date Range</h4>
        <Select
          value={filters.dateRange ? 'custom' : 'all'}
          onValueChange={(value) => {
            if (value === 'all') {
              const { dateRange, ...rest } = filters;
              onChange(rest);
            } else if (value === 'week') {
              onChange({
                ...filters,
                dateRange: {
                  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  to: new Date(),
                },
              });
            } else if (value === 'month') {
              onChange({
                ...filters,
                dateRange: {
                  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  to: new Date(),
                },
              });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="week">Past week</SelectItem>
            <SelectItem value="month">Past month</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```

#### Search Results Component
Create `/src/components/search-results.tsx`:
```typescript
interface SearchResultsProps {
  results: any[];
  total: number;
  query?: string;
  loading?: boolean;
  onAgentClick?: (agent: any) => void;
}

export function SearchResults({
  results,
  total,
  query,
  loading,
  onAgentClick,
}: SearchResultsProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }
  
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No results found</h3>
        {query && (
          <p className="text-gray-600">
            No agents match "{query}". Try different keywords or filters.
          </p>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Found {total} {total === 1 ? 'result' : 'results'}
        {query && ` for "${query}"`}
      </div>
      
      {results.map((result) => (
        <div
          key={result.id}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onAgentClick?.(result)}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {result.highlights ? (
                  <span dangerouslySetInnerHTML={{ __html: result.highlights.split('\n')[0] }} />
                ) : (
                  result.name
                )}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge>{result.type}</Badge>
                {result.relevanceScore > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {Math.round(result.relevanceScore * 100)}% match
                  </Badge>
                )}
              </div>
            </div>
            <LikeButton
              agentId={result.id}
              initialLikeCount={result.likeCount}
              size="sm"
            />
          </div>
          
          <p className="text-gray-600 mb-3">
            {result.highlights ? (
              <span dangerouslySetInnerHTML={{ 
                __html: result.highlights.split('\n').slice(1).join(' ') 
              }} />
            ) : (
              result.description
            )}
          </p>
          
          {result.tags && result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {result.tags.map((tag: any) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span>by {result.author?.username}</span>
            <span>{formatDistanceToNow(result.createdAt)} ago</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### Search Page
Create `/src/routes/agents/search.tsx`:
```typescript
export const Route = createFileRoute("/agents/search")({
  validateSearch: (search) => {
    return {
      q: search.q as string || '',
      type: search.type as string[] || [],
      tags: search.tags as string[] || [],
      sort: search.sort as string || 'relevance',
      page: Number(search.page) || 1,
    };
  },
  component: SearchPage,
});

function SearchPage() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const [filters, setFilters] = useState<SearchFilters>({
    type: searchParams.type,
    tags: searchParams.tags,
  });
  
  // Search query
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', searchParams.q, filters, searchParams.sort, searchParams.page],
    queryFn: () => searchAgentsFn({
      data: {
        query: searchParams.q,
        filters,
        sortBy: searchParams.sort as any,
        page: searchParams.page,
        limit: 20,
      },
    }),
  });
  
  // Get facets
  const { data: facets } = useQuery({
    queryKey: ['facets', filters],
    queryFn: () => getSearchFacetsFn({ data: { filters } }),
  });
  
  // Saved searches for logged-in users
  const user = useUser();
  const { data: savedSearches } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: getSavedSearchesFn,
    enabled: !!user,
  });
  
  const handleSearch = (query: string) => {
    navigate({
      to: '/agents/search',
      search: { ...searchParams, q: query, page: 1 },
    });
  };
  
  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    navigate({
      to: '/agents/search',
      search: {
        ...searchParams,
        type: newFilters.type || [],
        tags: newFilters.tags || [],
        page: 1,
      },
    });
  };
  
  const handleSortChange = (sort: string) => {
    navigate({
      to: '/agents/search',
      search: { ...searchParams, sort, page: 1 },
    });
  };
  
  const handlePageChange = (page: number) => {
    navigate({
      to: '/agents/search',
      search: { ...searchParams, page },
    });
  };
  
  const handleAgentClick = (agent: any) => {
    // Track click for analytics
    if (searchResults?.searchId) {
      trackSearchClickFn({
        data: {
          searchId: searchResults.searchId,
          agentId: agent.id,
        },
      });
    }
    
    navigate({ to: `/agents/${agent.slug}` });
  };
  
  const handleSaveSearch = async () => {
    if (!user) {
      toast.error("Please sign in to save searches");
      return;
    }
    
    const name = prompt("Name this search:");
    if (!name) return;
    
    await saveSearchFn({
      data: {
        name,
        query: searchParams.q,
        filters,
      },
    });
    
    toast.success("Search saved!");
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <SearchBar
          initialQuery={searchParams.q}
          onSearch={handleSearch}
          showSuggestions={true}
        />
      </div>
      
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 space-y-6">
          <SearchFilters
            filters={filters}
            facets={facets}
            onChange={handleFilterChange}
          />
          
          {/* Saved Searches */}
          {savedSearches && savedSearches.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Saved Searches</h3>
              <div className="space-y-1">
                {savedSearches.map((saved) => (
                  <button
                    key={saved.id}
                    onClick={() => {
                      setFilters(saved.filters);
                      handleSearch(saved.query || '');
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                  >
                    {saved.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
        
        {/* Main content */}
        <div className="flex-1">
          {/* Search toolbar */}
          <div className="flex justify-between items-center mb-4">
            <SortOptions
              value={searchParams.sort}
              onChange={handleSortChange}
            />
            
            {searchParams.q && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveSearch}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Search
              </Button>
            )}
          </div>
          
          {/* Results */}
          <SearchResults
            results={searchResults?.results || []}
            total={searchResults?.total || 0}
            query={searchParams.q}
            loading={isLoading}
            onAgentClick={handleAgentClick}
          />
          
          {/* Pagination */}
          {searchResults && searchResults.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={searchParams.page}
                totalPages={searchResults.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Testing Checklist
- [ ] Text search returns relevant results
- [ ] Search highlights match terms in results
- [ ] Filters work correctly (type, tags, likes)
- [ ] Combining search and filters works
- [ ] Autocomplete suggestions appear as user types
- [ ] Sorting options work (relevance, newest, popular)
- [ ] Pagination works correctly
- [ ] Saved searches can be created and loaded
- [ ] Search analytics are tracked
- [ ] Empty state displays when no results
- [ ] Search is performant with large datasets

## Success Criteria
- Full-text search provides relevant results quickly
- Faceted search helps users narrow results
- Autocomplete improves search experience
- Analytics provide insights into popular searches
- Saved searches enable quick access to common queries

## Next Steps
With search functionality complete, you can now add:
- Fork functionality (Slice 6)
- Version control for agent updates (Slice 7)
- Advanced analytics dashboard (Slice 9)