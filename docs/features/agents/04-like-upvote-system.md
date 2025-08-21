# Vertical Slice 4: Like/Upvote System

## Overview
Implement a like/upvote system that allows users to show appreciation for agents, influences ranking/sorting, and contributes to author reputation scores.

## User Stories
- As a user, I can like/unlike an agent with a single click
- As a user, I can see how many likes an agent has received
- As a user, I can see which agents I've liked
- As a user, I can sort agents by popularity (like count)
- As an author, my reputation increases when my agents receive likes
- As a system, I prevent users from liking their own agents

## Database Schema

### Likes Table
```sql
CREATE TABLE likes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, agent_id)
);

CREATE INDEX idx_likes_agent ON likes(agent_id);
CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_likes_created ON likes(created_at DESC);
```

### Update Agents Table
```sql
ALTER TABLE agents ADD COLUMN IF NOT EXISTS
  like_count INTEGER DEFAULT 0,
  trending_score DECIMAL DEFAULT 0; -- For hot/trending sorting

CREATE INDEX idx_agents_likes ON agents(like_count DESC);
CREATE INDEX idx_agents_trending ON agents(trending_score DESC);
```

## Implementation Steps

### Step 1: Database Schema Updates
Update `/src/db/schema.ts`:
```typescript
export const likes = pgTable("likes", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.agentId] }),
}));

// Update agents table
export const agents = pgTable("agents", {
  // ... existing fields
  likeCount: integer("like_count").default(0),
  trendingScore: decimal("trending_score").default("0"),
});

// Relations
export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  agent: one(agents, {
    fields: [likes.agentId],
    references: [agents.id],
  }),
}));
```

### Step 2: Data Access Layer
Create `/src/data-access/likes.ts`:
```typescript
// Check if user has liked an agent
export async function hasUserLikedAgent(userId: string, agentId: string) {
  const result = await db
    .select({ count: count() })
    .from(likes)
    .where(
      and(
        eq(likes.userId, userId),
        eq(likes.agentId, agentId)
      )
    );
    
  return result[0].count > 0;
}

// Toggle like (like/unlike)
export async function toggleLike(userId: string, agentId: string) {
  // Check if already liked
  const existing = await db
    .select()
    .from(likes)
    .where(
      and(
        eq(likes.userId, userId),
        eq(likes.agentId, agentId)
      )
    )
    .limit(1);
    
  if (existing[0]) {
    // Unlike
    await db
      .delete(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.agentId, agentId)
        )
      );
      
    // Decrement like count
    await db
      .update(agents)
      .set({ 
        likeCount: sql`GREATEST(0, ${agents.likeCount} - 1)` 
      })
      .where(eq(agents.id, agentId));
      
    return { liked: false };
  } else {
    // Like
    await db
      .insert(likes)
      .values({
        userId,
        agentId,
      });
      
    // Increment like count
    await db
      .update(agents)
      .set({ 
        likeCount: sql`${agents.likeCount} + 1` 
      })
      .where(eq(agents.id, agentId));
      
    return { liked: true };
  }
}

// Get user's liked agents
export async function getUserLikedAgents(userId: string, limit = 20, offset = 0) {
  return await db
    .select({
      agent: agents,
      likedAt: likes.createdAt,
    })
    .from(likes)
    .innerJoin(agents, eq(likes.agentId, agents.id))
    .where(eq(likes.userId, userId))
    .orderBy(desc(likes.createdAt))
    .limit(limit)
    .offset(offset);
}

// Get agents with like status for user
export async function getAgentsWithLikeStatus(
  userId: string | null,
  agentIds: string[]
) {
  const agentsData = await db
    .select()
    .from(agents)
    .where(inArray(agents.id, agentIds));
    
  if (!userId) {
    return agentsData.map(agent => ({
      ...agent,
      isLiked: false,
    }));
  }
  
  // Get user's likes for these agents
  const userLikes = await db
    .select({ agentId: likes.agentId })
    .from(likes)
    .where(
      and(
        eq(likes.userId, userId),
        inArray(likes.agentId, agentIds)
      )
    );
    
  const likedAgentIds = new Set(userLikes.map(l => l.agentId));
  
  return agentsData.map(agent => ({
    ...agent,
    isLiked: likedAgentIds.has(agent.id),
  }));
}

// Get top liked agents
export async function getTopLikedAgents(period: 'all' | 'month' | 'week' = 'all', limit = 10) {
  let query = db
    .select({
      agent: agents,
      likeCount: agents.likeCount,
    })
    .from(agents)
    .where(eq(agents.isPublic, true));
    
  if (period !== 'all') {
    const startDate = period === 'week' 
      ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
    // Join with likes to filter by date
    query = db
      .select({
        agent: agents,
        likeCount: count(likes.userId).as('recent_likes'),
      })
      .from(agents)
      .leftJoin(likes, eq(likes.agentId, agents.id))
      .where(
        and(
          eq(agents.isPublic, true),
          gte(likes.createdAt, startDate)
        )
      )
      .groupBy(agents.id);
  }
  
  return await query
    .orderBy(desc(agents.likeCount))
    .limit(limit);
}

// Update trending scores (run periodically)
export async function updateTrendingScores() {
  // Calculate trending score based on recent likes and time decay
  // Score = (recent_likes * 2 + total_likes) / (hours_since_creation + 2)^1.5
  
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Get recent likes count for each agent
  const recentLikes = await db
    .select({
      agentId: likes.agentId,
      count: count().as('recent_count'),
    })
    .from(likes)
    .where(gte(likes.createdAt, oneDayAgo))
    .groupBy(likes.agentId);
    
  const recentLikesMap = new Map(
    recentLikes.map(r => [r.agentId, r.count])
  );
  
  // Update all agents' trending scores
  const allAgents = await db.select().from(agents);
  
  for (const agent of allAgents) {
    const recentCount = recentLikesMap.get(agent.id) || 0;
    const hoursSinceCreation = 
      (now.getTime() - agent.createdAt.getTime()) / (1000 * 60 * 60);
      
    const trendingScore = 
      (recentCount * 2 + agent.likeCount) / 
      Math.pow(hoursSinceCreation + 2, 1.5);
      
    await db
      .update(agents)
      .set({ trendingScore: trendingScore.toString() })
      .where(eq(agents.id, agent.id));
  }
}
```

### Step 3: Use Cases Layer
Create `/src/use-cases/likes.ts`:
```typescript
// Like/unlike agent with validation
export async function toggleLikeUseCase(userId: string, agentId: string) {
  // Get agent to check ownership
  const agent = await getAgentById(agentId);
  
  if (!agent) {
    throw new Error("Agent not found");
  }
  
  // Prevent self-liking
  if (agent.authorId === userId) {
    throw new Error("You cannot like your own agent");
  }
  
  // Toggle like
  const result = await toggleLike(userId, agentId);
  
  // Update author's reputation score
  await updateUserReputationScore(agent.authorId);
  
  // Trigger trending score update for this agent
  await updateAgentTrendingScore(agentId);
  
  return result;
}

// Update single agent's trending score
async function updateAgentTrendingScore(agentId: string) {
  const agent = await getAgentById(agentId);
  if (!agent) return;
  
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Count recent likes
  const [recentLikes] = await db
    .select({ count: count() })
    .from(likes)
    .where(
      and(
        eq(likes.agentId, agentId),
        gte(likes.createdAt, oneDayAgo)
      )
    );
    
  const hoursSinceCreation = 
    (now.getTime() - agent.createdAt.getTime()) / (1000 * 60 * 60);
    
  const trendingScore = 
    (recentLikes.count * 2 + agent.likeCount) / 
    Math.pow(hoursSinceCreation + 2, 1.5);
    
  await db
    .update(agents)
    .set({ trendingScore: trendingScore.toString() })
    .where(eq(agents.id, agentId));
}

// Update user reputation based on likes
async function updateUserReputationScore(userId: string) {
  // Count total likes received
  const [likesReceived] = await db
    .select({ count: count() })
    .from(likes)
    .innerJoin(agents, eq(likes.agentId, agents.id))
    .where(eq(agents.authorId, userId));
    
  // Count agents created
  const [agentCount] = await db
    .select({ count: count() })
    .from(agents)
    .where(eq(agents.authorId, userId));
    
  // Calculate reputation
  // Base: 10 points per agent
  // Bonus: 5 points per like received
  const reputation = (agentCount.count * 10) + (likesReceived.count * 5);
  
  await db
    .update(users)
    .set({ reputationScore: reputation })
    .where(eq(users.id, userId));
    
  return reputation;
}
```

### Step 4: Server Functions
Create `/src/fn/likes.ts`:
```typescript
export const toggleLikeFn = createServerFn({
  method: "POST",
})
  .middleware([authenticatedMiddleware])
  .handler(async ({ data }) => {
    const user = await getUserFromSession();
    return await toggleLikeUseCase(user.id, data.agentId);
  });

export const getUserLikedAgentsFn = createServerFn({
  method: "GET",
})
  .middleware([authenticatedMiddleware])
  .handler(async ({ data }) => {
    const user = await getUserFromSession();
    const { page = 1, limit = 20 } = data;
    const offset = (page - 1) * limit;
    return await getUserLikedAgents(user.id, limit, offset);
  });

export const getTopAgentsFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ data }) => {
    const { period = 'all', limit = 10 } = data;
    return await getTopLikedAgents(period, limit);
  });

export const checkLikeStatusFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ data }) => {
    const user = await getUserFromSession();
    if (!user) return { isLiked: false };
    
    return {
      isLiked: await hasUserLikedAgent(user.id, data.agentId),
    };
  });
```

### Step 5: UI Components

#### Like Button Component
Create `/src/components/like-button.tsx`:
```typescript
interface LikeButtonProps {
  agentId: string;
  initialLikeCount: number;
  initialIsLiked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  onLikeChange?: (liked: boolean) => void;
}

export function LikeButton({
  agentId,
  initialLikeCount,
  initialIsLiked = false,
  size = 'md',
  showCount = true,
  onLikeChange,
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const user = useUser();
  
  const likeMutation = useMutation({
    mutationFn: toggleLikeFn,
    onMutate: () => {
      // Optimistic update
      const newLiked = !isLiked;
      setIsLiked(newLiked);
      setLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    },
    onSuccess: (result) => {
      onLikeChange?.(result.liked);
    },
    onError: (error) => {
      // Revert optimistic update
      setIsLiked(!isLiked);
      setLikeCount(initialLikeCount);
      toast.error(error.message);
    },
  });
  
  const handleClick = () => {
    if (!user) {
      toast.error("Please sign in to like agents");
      return;
    }
    
    likeMutation.mutate({ data: { agentId } });
  };
  
  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10',
    lg: 'h-12 text-lg',
  };
  
  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };
  
  return (
    <Button
      variant={isLiked ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={likeMutation.isPending}
      className={cn(
        sizeClasses[size],
        "gap-2 transition-all",
        isAnimating && "scale-110"
      )}
    >
      <Heart 
        className={cn(
          iconSize[size],
          isLiked && "fill-current",
          isAnimating && "animate-pulse"
        )} 
      />
      {showCount && (
        <span className="min-w-[2ch] text-center">
          {likeCount}
        </span>
      )}
    </Button>
  );
}
```

#### Trending Agents Component
Create `/src/components/trending-agents.tsx`:
```typescript
interface TrendingAgentsProps {
  period?: 'all' | 'month' | 'week';
  limit?: number;
}

export function TrendingAgents({ 
  period = 'week', 
  limit = 5 
}: TrendingAgentsProps) {
  const { data: agents, isLoading } = useQuery({
    queryKey: ['trending-agents', period, limit],
    queryFn: () => getTopAgentsFn({ data: { period, limit } }),
  });
  
  if (isLoading) {
    return <div>Loading trending agents...</div>;
  }
  
  if (!agents || agents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        No trending agents yet
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">
          🔥 Trending {period !== 'all' && `This ${period}`}
        </h3>
      </div>
      
      {agents.map((item, index) => (
        <div 
          key={item.agent.id} 
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50"
        >
          <div className="text-2xl font-bold text-gray-400 w-8">
            {index + 1}
          </div>
          
          <div className="flex-1 min-w-0">
            <Link 
              to={`/agents/${item.agent.slug}`}
              className="font-medium hover:underline block truncate"
            >
              {item.agent.name}
            </Link>
            <p className="text-sm text-gray-600 line-clamp-2">
              {item.agent.description}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {item.likeCount} likes
              </span>
              <Badge variant="outline" className="text-xs">
                {item.agent.type}
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### Sort Options Component
Create `/src/components/sort-options.tsx`:
```typescript
interface SortOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

const sortOptions: SortOption[] = [
  { value: 'newest', label: 'Newest', icon: <Clock className="h-4 w-4" /> },
  { value: 'popular', label: 'Most Popular', icon: <Heart className="h-4 w-4" /> },
  { value: 'trending', label: 'Trending', icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'name', label: 'Name (A-Z)', icon: <SortAsc className="h-4 w-4" /> },
];

interface SortOptionsProps {
  value: string;
  onChange: (value: string) => void;
}

export function SortOptions({ value, onChange }: SortOptionsProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              {option.icon}
              {option.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

#### Update Agent List Page
Update the agents list page to include sorting and like buttons:
```typescript
function AgentsListPage() {
  const [sortBy, setSortBy] = useState('newest');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const user = useUser();
  
  const { data: agents } = useQuery({
    queryKey: ['agents', sortBy, selectedTags],
    queryFn: async () => {
      let agentsData;
      
      if (selectedTags.length > 0) {
        agentsData = await getAgentsByTagsFn({ 
          data: { tags: selectedTags } 
        });
      } else {
        agentsData = await getPublicAgents();
      }
      
      // Sort agents based on selection
      switch (sortBy) {
        case 'popular':
          return agentsData.sort((a, b) => b.likeCount - a.likeCount);
        case 'trending':
          return agentsData.sort((a, b) => 
            parseFloat(b.trendingScore) - parseFloat(a.trendingScore)
          );
        case 'name':
          return agentsData.sort((a, b) => 
            a.name.localeCompare(b.name)
          );
        case 'newest':
        default:
          return agentsData.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    },
  });
  
  // Get like status for all agents if user is logged in
  const agentIds = agents?.map(a => a.id) || [];
  const { data: likeStatuses } = useQuery({
    queryKey: ['like-statuses', agentIds, user?.id],
    queryFn: () => {
      if (!user || agentIds.length === 0) return {};
      return getAgentsWithLikeStatus(user.id, agentIds);
    },
    enabled: !!user && agentIds.length > 0,
  });
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 space-y-6">
          <TagFilter
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
          
          <TrendingAgents period="week" limit={5} />
        </aside>
        
        {/* Main content */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h1>Agent Marketplace</h1>
            <div className="flex items-center gap-4">
              <SortOptions value={sortBy} onChange={setSortBy} />
              <Link to="/agents/new">
                <Button>Create Agent</Button>
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents?.map((agent) => (
              <AgentCard 
                key={agent.id} 
                agent={agent}
                isLiked={likeStatuses?.[agent.id]?.isLiked}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### Update Agent Card Component
Update agent card to include like button:
```typescript
export function AgentCard({ agent, isLiked = false, showAuthor = true }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate">{agent.name}</CardTitle>
            <Badge className="mt-1">{agent.type}</Badge>
          </div>
          <LikeButton
            agentId={agent.id}
            initialLikeCount={agent.likeCount}
            initialIsLiked={isLiked}
            size="sm"
          />
        </div>
        {/* ... author info ... */}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 line-clamp-3">
          {agent.description}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Link to={`/agents/${agent.slug}`}>
          <Button variant="outline" size="sm">View Details</Button>
        </Link>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Eye className="h-4 w-4" />
          {agent.viewCount || 0}
        </div>
      </CardFooter>
    </Card>
  );
}
```

#### User's Liked Agents Page
Create `/src/routes/users/$username/likes.tsx`:
```typescript
export const Route = createFileRoute("/users/$username/likes")({
  loader: async ({ params }) => {
    const user = await getUserByUsername(params.username);
    if (!user) throw new Error("User not found");
    
    const likedAgents = await getUserLikedAgents(user.id);
    return { user, likedAgents };
  },
  component: UserLikedAgentsPage,
});

function UserLikedAgentsPage() {
  const { user, likedAgents } = Route.useLoaderData();
  
  return (
    <div className="container mx-auto p-4">
      <h1>{user.username}'s Liked Agents</h1>
      
      {likedAgents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Heart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No liked agents yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {likedAgents.map(({ agent, likedAt }) => (
            <div key={agent.id}>
              <AgentCard agent={agent} isLiked={true} />
              <p className="text-xs text-gray-500 mt-1">
                Liked {formatDistanceToNow(likedAt)} ago
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Testing Checklist
- [ ] Can like an agent when logged in
- [ ] Can unlike a previously liked agent
- [ ] Cannot like when not logged in (shows error)
- [ ] Cannot like own agents
- [ ] Like count updates immediately (optimistic)
- [ ] Like state persists on page refresh
- [ ] Can sort agents by popularity (like count)
- [ ] Can sort agents by trending score
- [ ] Trending agents widget shows correct agents
- [ ] User profile shows total likes received
- [ ] Can view user's liked agents page
- [ ] Reputation score updates when receiving likes

## Success Criteria
- Like system provides instant feedback with optimistic updates
- Trending algorithm surfaces recently popular agents
- Users can discover quality content through likes
- Authors receive recognition through reputation scores
- System prevents gaming through self-liking prevention

## Next Steps
With the like system in place, you can now add:
- Advanced search functionality (Slice 5)
- Fork functionality building on likes for discovery (Slice 6)
- Notifications when agents receive likes (future enhancement)