# Vertical Slice 3: Tagging System

## Overview
Implement a comprehensive tagging system that allows users to categorize agents by programming languages, frameworks, libraries, and custom categories. This enables better discoverability and filtering of agents.

## User Stories
- As a user, I can add multiple tags to my agent when creating/editing
- As a user, I can filter agents by one or more tags
- As a user, I can see all available tags with usage counts
- As a user, I can search for tags by name
- As a system, I auto-suggest tags based on agent content

## Database Schema

### Tags Table
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(50), -- 'language', 'framework', 'library', 'tool', 'category'
  description TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tags_category ON tags(category);
CREATE INDEX idx_tags_usage ON tags(usage_count DESC);
```

### Agent Tags Junction Table
```sql
CREATE TABLE agent_tags (
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (agent_id, tag_id)
);

CREATE INDEX idx_agent_tags_agent ON agent_tags(agent_id);
CREATE INDEX idx_agent_tags_tag ON agent_tags(tag_id);
```

### Predefined Tags Data
```sql
-- Languages
INSERT INTO tags (name, slug, category) VALUES
('JavaScript', 'javascript', 'language'),
('TypeScript', 'typescript', 'language'),
('Python', 'python', 'language'),
('Go', 'go', 'language'),
('Rust', 'rust', 'language'),
('Java', 'java', 'language'),
('C++', 'cpp', 'language'),
('Ruby', 'ruby', 'language'),
('PHP', 'php', 'language'),
('Swift', 'swift', 'language');

-- Frameworks
INSERT INTO tags (name, slug, category) VALUES
('React', 'react', 'framework'),
('Vue', 'vue', 'framework'),
('Svelte', 'svelte', 'framework'),
('Angular', 'angular', 'framework'),
('Next.js', 'nextjs', 'framework'),
('Nuxt', 'nuxt', 'framework'),
('SvelteKit', 'sveltekit', 'framework'),
('Express', 'express', 'framework'),
('NestJS', 'nestjs', 'framework'),
('Django', 'django', 'framework'),
('Flask', 'flask', 'framework'),
('FastAPI', 'fastapi', 'framework'),
('Rails', 'rails', 'framework'),
('Laravel', 'laravel', 'framework');

-- Libraries/Tools
INSERT INTO tags (name, slug, category) VALUES
('Node.js', 'nodejs', 'tool'),
('Docker', 'docker', 'tool'),
('Kubernetes', 'kubernetes', 'tool'),
('PostgreSQL', 'postgresql', 'tool'),
('MongoDB', 'mongodb', 'tool'),
('Redis', 'redis', 'tool'),
('GraphQL', 'graphql', 'tool'),
('REST API', 'rest-api', 'tool'),
('TailwindCSS', 'tailwindcss', 'library'),
('Bootstrap', 'bootstrap', 'library'),
('Jest', 'jest', 'library'),
('Pytest', 'pytest', 'library'),
('Webpack', 'webpack', 'tool'),
('Vite', 'vite', 'tool');

-- Categories
INSERT INTO tags (name, slug, category) VALUES
('Testing', 'testing', 'category'),
('Documentation', 'documentation', 'category'),
('Deployment', 'deployment', 'category'),
('Security', 'security', 'category'),
('Performance', 'performance', 'category'),
('Debugging', 'debugging', 'category'),
('Database', 'database', 'category'),
('API', 'api', 'category'),
('Frontend', 'frontend', 'category'),
('Backend', 'backend', 'category'),
('DevOps', 'devops', 'category'),
('CI/CD', 'ci-cd', 'category'),
('Monitoring', 'monitoring', 'category'),
('Authentication', 'authentication', 'category'),
('State Management', 'state-management', 'category');
```

## Implementation Steps

### Step 1: Database Schema
Update `/src/db/schema.ts`:
```typescript
export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  category: varchar("category", { length: 50 }),
  description: text("description"),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const agentTags = pgTable("agent_tags", {
  agentId: uuid("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.agentId, table.tagId] }),
}));

// Relations
export const agentTagsRelations = relations(agentTags, ({ one }) => ({
  agent: one(agents, {
    fields: [agentTags.agentId],
    references: [agents.id],
  }),
  tag: one(tags, {
    fields: [agentTags.tagId],
    references: [tags.id],
  }),
}));

export const agentsRelations = relations(agents, ({ many }) => ({
  tags: many(agentTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  agents: many(agentTags),
}));
```

### Step 2: Data Access Layer
Create `/src/data-access/tags.ts`:
```typescript
// Get all tags with usage counts
export async function getAllTags() {
  return await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      category: tags.category,
      description: tags.description,
      usageCount: tags.usageCount,
    })
    .from(tags)
    .orderBy(desc(tags.usageCount), asc(tags.name));
}

// Get tags by category
export async function getTagsByCategory(category: string) {
  return await db
    .select()
    .from(tags)
    .where(eq(tags.category, category))
    .orderBy(desc(tags.usageCount));
}

// Search tags
export async function searchTags(query: string) {
  return await db
    .select()
    .from(tags)
    .where(
      or(
        ilike(tags.name, `%${query}%`),
        ilike(tags.description, `%${query}%`)
      )
    )
    .limit(10);
}

// Get or create tag
export async function getOrCreateTag(name: string, category?: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  // Try to get existing
  const existing = await db
    .select()
    .from(tags)
    .where(eq(tags.slug, slug))
    .limit(1);
    
  if (existing[0]) return existing[0];
  
  // Create new
  const [newTag] = await db
    .insert(tags)
    .values({ name, slug, category })
    .returning();
    
  return newTag;
}

// Add tags to agent
export async function addTagsToAgent(agentId: string, tagIds: string[]) {
  if (tagIds.length === 0) return;
  
  // Remove existing tags
  await db
    .delete(agentTags)
    .where(eq(agentTags.agentId, agentId));
    
  // Add new tags
  await db
    .insert(agentTags)
    .values(tagIds.map(tagId => ({
      agentId,
      tagId,
    })));
    
  // Update usage counts
  await db
    .update(tags)
    .set({ 
      usageCount: sql`${tags.usageCount} + 1` 
    })
    .where(inArray(tags.id, tagIds));
}

// Get agent tags
export async function getAgentTags(agentId: string) {
  return await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      category: tags.category,
    })
    .from(tags)
    .innerJoin(agentTags, eq(agentTags.tagId, tags.id))
    .where(eq(agentTags.agentId, agentId));
}

// Get agents by tags (AND operation)
export async function getAgentsByTags(tagSlugs: string[], limit = 20, offset = 0) {
  // Get tag IDs from slugs
  const tagRecords = await db
    .select({ id: tags.id })
    .from(tags)
    .where(inArray(tags.slug, tagSlugs));
    
  const tagIds = tagRecords.map(t => t.id);
  
  if (tagIds.length === 0) return [];
  
  // Find agents that have ALL specified tags
  const agentsWithAllTags = await db
    .select({
      agentId: agentTags.agentId,
    })
    .from(agentTags)
    .where(inArray(agentTags.tagId, tagIds))
    .groupBy(agentTags.agentId)
    .having(sql`COUNT(DISTINCT ${agentTags.tagId}) = ${tagIds.length}`);
    
  const agentIds = agentsWithAllTags.map(a => a.agentId);
  
  if (agentIds.length === 0) return [];
  
  // Get full agent data
  return await db
    .select()
    .from(agents)
    .where(inArray(agents.id, agentIds))
    .orderBy(desc(agents.createdAt))
    .limit(limit)
    .offset(offset);
}

// Get popular tags
export async function getPopularTags(limit = 20) {
  return await db
    .select()
    .from(tags)
    .orderBy(desc(tags.usageCount))
    .limit(limit);
}
```

### Step 3: Use Cases Layer
Create `/src/use-cases/tags.ts`:
```typescript
// Auto-suggest tags based on content
export async function suggestTagsFromContent(content: string): Promise<string[]> {
  const suggestions: string[] = [];
  const lowerContent = content.toLowerCase();
  
  // Language detection patterns
  const languagePatterns = {
    javascript: /\b(javascript|js|node|npm|yarn)\b/i,
    typescript: /\b(typescript|ts|tsc|tsconfig)\b/i,
    python: /\b(python|py|pip|conda|django|flask)\b/i,
    react: /\b(react|jsx|usestate|useeffect|component)\b/i,
    vue: /\b(vue|vuex|nuxt|v-model|v-for)\b/i,
    svelte: /\b(svelte|sveltekit|\$:)\b/i,
    docker: /\b(docker|dockerfile|container)\b/i,
    kubernetes: /\b(kubernetes|k8s|kubectl|pod|deployment)\b/i,
  };
  
  // Check for pattern matches
  for (const [tag, pattern] of Object.entries(languagePatterns)) {
    if (pattern.test(lowerContent)) {
      suggestions.push(tag);
    }
  }
  
  // Category detection
  if (/\b(test|jest|mocha|pytest|testing)\b/i.test(lowerContent)) {
    suggestions.push('testing');
  }
  if (/\b(api|rest|graphql|endpoint)\b/i.test(lowerContent)) {
    suggestions.push('api');
  }
  if (/\b(deploy|ci|cd|github.actions|pipeline)\b/i.test(lowerContent)) {
    suggestions.push('deployment', 'ci-cd');
  }
  if (/\b(auth|authentication|oauth|jwt)\b/i.test(lowerContent)) {
    suggestions.push('authentication');
  }
  
  // Remove duplicates
  return [...new Set(suggestions)];
}

// Process tags for agent
export async function processAgentTags(
  agentId: string,
  tagNames: string[],
  autoSuggest: boolean = true,
  content?: string
) {
  let finalTags = [...tagNames];
  
  // Add auto-suggested tags if enabled
  if (autoSuggest && content) {
    const suggested = await suggestTagsFromContent(content);
    finalTags = [...new Set([...finalTags, ...suggested])];
  }
  
  // Limit to 10 tags
  finalTags = finalTags.slice(0, 10);
  
  // Get or create tags
  const tagRecords = await Promise.all(
    finalTags.map(name => getOrCreateTag(name))
  );
  
  // Add tags to agent
  await addTagsToAgent(agentId, tagRecords.map(t => t.id));
  
  return tagRecords;
}
```

### Step 4: Server Functions
Create `/src/fn/tags.ts`:
```typescript
export const getAllTagsFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .handler(async () => {
    return await getAllTags();
  });

export const searchTagsFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ data }) => {
    return await searchTags(data.query);
  });

export const suggestTagsFn = createServerFn({
  method: "POST",
})
  .middleware([authenticatedMiddleware])
  .handler(async ({ data }) => {
    return await suggestTagsFromContent(data.content);
  });

export const getAgentsByTagsFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ data }) => {
    const { tags, page = 1, limit = 20 } = data;
    const offset = (page - 1) * limit;
    return await getAgentsByTags(tags, limit, offset);
  });
```

### Step 5: UI Components

#### Tag Input Component
Create `/src/components/tag-input.tsx`:
```typescript
interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  autoSuggest?: boolean;
  content?: string;
}

export function TagInput({
  value,
  onChange,
  placeholder = "Add tags...",
  maxTags = 10,
  autoSuggest = true,
  content,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Search for tag suggestions
  const searchMutation = useMutation({
    mutationFn: searchTagsFn,
    onSuccess: (data) => {
      setSuggestions(data);
    },
  });
  
  // Auto-suggest from content
  const suggestMutation = useMutation({
    mutationFn: suggestTagsFn,
    onSuccess: (suggested) => {
      // Add suggested tags that aren't already selected
      const newTags = suggested.filter(tag => !value.includes(tag));
      if (newTags.length > 0 && autoSuggest) {
        onChange([...value, ...newTags].slice(0, maxTags));
      }
    },
  });
  
  useEffect(() => {
    if (content && autoSuggest && value.length === 0) {
      suggestMutation.mutate({ data: { content } });
    }
  }, [content]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInput(query);
    
    if (query.length > 1) {
      searchMutation.mutate({ data: { query } });
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };
  
  const addTag = (tag: string) => {
    if (!value.includes(tag) && value.length < maxTags) {
      onChange([...value, tag]);
      setInput("");
      setShowSuggestions(false);
    }
  };
  
  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input) {
      e.preventDefault();
      addTag(input.toLowerCase().trim());
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-2 border rounded-lg min-h-[42px]">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        
        {value.length < maxTags && (
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] outline-none bg-transparent"
          />
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="border rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => addTag(tag.name)}
              className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded flex items-center justify-between"
            >
              <span>{tag.name}</span>
              <Badge variant="outline" className="text-xs">
                {tag.category}
              </Badge>
            </button>
          ))}
        </div>
      )}
      
      <p className="text-sm text-gray-600">
        {value.length}/{maxTags} tags
      </p>
    </div>
  );
}
```

#### Tag Filter Component
Create `/src/components/tag-filter.tsx`:
```typescript
interface TagFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagFilter({ selectedTags, onTagsChange }: TagFilterProps) {
  const { data: allTags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => getAllTagsFn(),
  });
  
  const tagsByCategory = useMemo(() => {
    if (!allTags) return {};
    
    return allTags.reduce((acc, tag) => {
      const category = tag.category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(tag);
      return acc;
    }, {} as Record<string, Tag[]>);
  }, [allTags]);
  
  const toggleTag = (tagSlug: string) => {
    if (selectedTags.includes(tagSlug)) {
      onTagsChange(selectedTags.filter(t => t !== tagSlug));
    } else {
      onTagsChange([...selectedTags, tagSlug]);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filter by Tags</h3>
        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTagsChange([])}
          >
            Clear all
          </Button>
        )}
      </div>
      
      {Object.entries(tagsByCategory).map(([category, tags]) => (
        <div key={category}>
          <h4 className="text-sm font-medium text-gray-600 mb-2 capitalize">
            {category}
          </h4>
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 10).map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.slug) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTag(tag.slug)}
              >
                {tag.name}
                {tag.usageCount > 0 && (
                  <span className="ml-1 text-xs opacity-60">
                    ({tag.usageCount})
                  </span>
                )}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### Update Agent Form with Tags
Update the agent form to include tag input:
```typescript
export function AgentForm({ agent, onSubmit }) {
  const [tags, setTags] = useState<string[]>(agent?.tags || []);
  
  const form = useForm({
    defaultValues: {
      name: agent?.name || "",
      description: agent?.description || "",
      type: agent?.type || "agent",
      content: agent?.content || "",
    },
  });
  
  const content = form.watch("content");
  
  const handleSubmit = (data: AgentFormData) => {
    onSubmit({
      ...data,
      tags,
    });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        {/* ... existing fields ... */}
        
        <div className="space-y-2">
          <Label>Tags</Label>
          <TagInput
            value={tags}
            onChange={setTags}
            content={content}
            placeholder="Add tags (e.g., react, typescript, testing)"
          />
          <p className="text-sm text-gray-600">
            Tags help others discover your agent. Add languages, frameworks, and categories.
          </p>
        </div>
        
        <Button type="submit">
          {agent ? "Update Agent" : "Create Agent"}
        </Button>
      </form>
    </Form>
  );
}
```

#### Update Agent List with Filters
Update the agents list page to include tag filtering:
```typescript
function AgentsListPage() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { data: agents } = useQuery({
    queryKey: ['agents', selectedTags],
    queryFn: () => {
      if (selectedTags.length > 0) {
        return getAgentsByTagsFn({ data: { tags: selectedTags } });
      }
      return getPublicAgents();
    },
  });
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex gap-6">
        {/* Sidebar with filters */}
        <aside className="w-64 shrink-0">
          <TagFilter
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
        </aside>
        
        {/* Main content */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h1>Agent Marketplace</h1>
            <Link to="/agents/new">
              <Button>Create Agent</Button>
            </Link>
          </div>
          
          {selectedTags.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Filtering by: {selectedTags.join(', ')}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents?.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Testing Checklist
- [ ] Can add tags when creating an agent
- [ ] Tags are auto-suggested based on content
- [ ] Can search for tags by name
- [ ] Can filter agents by single tag
- [ ] Can filter agents by multiple tags (AND operation)
- [ ] Tag usage counts update correctly
- [ ] Popular tags are displayed properly
- [ ] Can remove tags from agents
- [ ] Tag input respects maximum limit
- [ ] Tags appear on agent cards and detail pages

## Success Criteria
- Comprehensive tagging improves agent discoverability
- Auto-suggestions help users tag appropriately
- Filtering by tags returns accurate results
- Tag system scales to thousands of agents
- UI provides intuitive tag management

## Next Steps
With tagging in place, you can now add:
- Like/upvote functionality (Slice 4)
- Advanced search combining tags and text (Slice 5)
- Tag-based recommendations (future enhancement)