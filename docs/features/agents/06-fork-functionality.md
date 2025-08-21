# Vertical Slice 6: Fork Functionality

## Overview
Implement forking capability that allows users to create derivative agents based on existing ones, track parent-child relationships, and visualize fork networks.

## User Stories
- As a user, I can fork an agent to create my own version
- As a user, I can see which agent a fork was derived from
- As a user, I can view all forks of my agents
- As a user, I can see the fork tree/network of an agent
- As a user, I can submit improvements back to the parent agent
- As an author, I receive notifications when my agent is forked

## Database Schema

### Update Agents Table
```sql
ALTER TABLE agents ADD COLUMN IF NOT EXISTS
  parent_id UUID REFERENCES agents(id),
  fork_count INTEGER DEFAULT 0,
  is_fork BOOLEAN DEFAULT false;

CREATE INDEX idx_agents_parent ON agents(parent_id);
CREATE INDEX idx_agents_fork_count ON agents(fork_count DESC);
```

### Fork Relationships Table
```sql
CREATE TABLE fork_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  child_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  forked_by UUID NOT NULL REFERENCES users(id),
  fork_date TIMESTAMP DEFAULT NOW(),
  changes_summary TEXT,
  UNIQUE(child_agent_id) -- Each agent can only have one parent
);

CREATE INDEX idx_fork_relationships_parent ON fork_relationships(parent_agent_id);
CREATE INDEX idx_fork_relationships_child ON fork_relationships(child_agent_id);
CREATE INDEX idx_fork_relationships_user ON fork_relationships(forked_by);
```

### Fork Merge Requests Table
```sql
CREATE TABLE fork_merge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fork_id UUID NOT NULL REFERENCES agents(id),
  parent_id UUID NOT NULL REFERENCES agents(id),
  requester_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  changes_diff TEXT, -- JSON diff of changes
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, merged
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_comment TEXT
);

CREATE INDEX idx_merge_requests_fork ON fork_merge_requests(fork_id);
CREATE INDEX idx_merge_requests_parent ON fork_merge_requests(parent_id);
CREATE INDEX idx_merge_requests_status ON fork_merge_requests(status);
```

## Implementation Steps

### Step 1: Database Schema Updates
Update `/src/db/schema.ts`:
```typescript
// Update agents table
export const agents = pgTable("agents", {
  // ... existing fields
  parentId: uuid("parent_id").references(() => agents.id),
  forkCount: integer("fork_count").default(0),
  isFork: boolean("is_fork").default(false),
});

export const forkRelationships = pgTable("fork_relationships", {
  id: uuid("id").defaultRandom().primaryKey(),
  parentAgentId: uuid("parent_agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  childAgentId: uuid("child_agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  forkedBy: uuid("forked_by").notNull().references(() => users.id),
  forkDate: timestamp("fork_date").defaultNow(),
  changesSummary: text("changes_summary"),
});

export const forkMergeRequests = pgTable("fork_merge_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  forkId: uuid("fork_id").notNull().references(() => agents.id),
  parentId: uuid("parent_id").notNull().references(() => agents.id),
  requesterId: uuid("requester_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  changesDiff: text("changes_diff"),
  status: varchar("status", { length: 50 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewComment: text("review_comment"),
});
```

### Step 2: Data Access Layer
Create `/src/data-access/forks.ts`:
```typescript
// Fork an agent
export async function forkAgent(
  parentId: string,
  userId: string,
  changes?: {
    name?: string;
    description?: string;
    content?: string;
  }
) {
  // Get parent agent
  const parent = await db
    .select()
    .from(agents)
    .where(eq(agents.id, parentId))
    .limit(1);
    
  if (!parent[0]) {
    throw new Error("Parent agent not found");
  }
  
  // Create forked agent
  const forkName = changes?.name || `${parent[0].name} (Fork)`;
  const forkSlug = generateSlug(forkName);
  
  const [fork] = await db
    .insert(agents)
    .values({
      name: forkName,
      slug: forkSlug,
      description: changes?.description || parent[0].description,
      type: parent[0].type,
      content: changes?.content || parent[0].content,
      authorId: userId,
      parentId: parentId,
      isFork: true,
      isPublic: true,
    })
    .returning();
    
  // Create fork relationship
  await db
    .insert(forkRelationships)
    .values({
      parentAgentId: parentId,
      childAgentId: fork.id,
      forkedBy: userId,
      changesSummary: changes ? JSON.stringify(changes) : null,
    });
    
  // Increment parent's fork count
  await db
    .update(agents)
    .set({ 
      forkCount: sql`${agents.forkCount} + 1` 
    })
    .where(eq(agents.id, parentId));
    
  // Copy parent's tags to fork
  const parentTags = await db
    .select({ tagId: agentTags.tagId })
    .from(agentTags)
    .where(eq(agentTags.agentId, parentId));
    
  if (parentTags.length > 0) {
    await db
      .insert(agentTags)
      .values(parentTags.map(t => ({
        agentId: fork.id,
        tagId: t.tagId,
      })));
  }
  
  return fork;
}

// Get fork lineage (ancestors)
export async function getForkLineage(agentId: string): Promise<any[]> {
  const lineage = [];
  let currentId = agentId;
  
  while (currentId) {
    const agent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, currentId))
      .limit(1);
      
    if (!agent[0]) break;
    
    lineage.push(agent[0]);
    currentId = agent[0].parentId;
  }
  
  return lineage.reverse(); // Return from root to current
}

// Get direct forks of an agent
export async function getAgentForks(agentId: string, limit = 20, offset = 0) {
  return await db
    .select({
      fork: agents,
      relationship: forkRelationships,
      author: users,
    })
    .from(forkRelationships)
    .innerJoin(agents, eq(forkRelationships.childAgentId, agents.id))
    .innerJoin(users, eq(agents.authorId, users.id))
    .where(eq(forkRelationships.parentAgentId, agentId))
    .orderBy(desc(forkRelationships.forkDate))
    .limit(limit)
    .offset(offset);
}

// Get fork tree (recursive)
export async function getForkTree(rootId: string, maxDepth = 3): Promise<any> {
  async function buildTree(agentId: string, depth: number): Promise<any> {
    if (depth >= maxDepth) return null;
    
    const agent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);
      
    if (!agent[0]) return null;
    
    const forks = await db
      .select({
        id: agents.id,
        name: agents.name,
        slug: agents.slug,
        authorUsername: users.username,
        forkCount: agents.forkCount,
        likeCount: agents.likeCount,
      })
      .from(forkRelationships)
      .innerJoin(agents, eq(forkRelationships.childAgentId, agents.id))
      .innerJoin(users, eq(agents.authorId, users.id))
      .where(eq(forkRelationships.parentAgentId, agentId));
      
    const children = await Promise.all(
      forks.map(fork => buildTree(fork.id, depth + 1))
    );
    
    return {
      ...agent[0],
      children: children.filter(Boolean),
    };
  }
  
  return buildTree(rootId, 0);
}

// Create merge request
export async function createMergeRequest(
  forkId: string,
  parentId: string,
  requesterId: string,
  data: {
    title: string;
    description?: string;
    changesDiff?: any;
  }
) {
  return await db
    .insert(forkMergeRequests)
    .values({
      forkId,
      parentId,
      requesterId,
      title: data.title,
      description: data.description,
      changesDiff: data.changesDiff ? JSON.stringify(data.changesDiff) : null,
    })
    .returning();
}

// Get merge requests for an agent
export async function getAgentMergeRequests(
  agentId: string,
  status?: string
) {
  let query = db
    .select({
      request: forkMergeRequests,
      fork: agents,
      requester: users,
    })
    .from(forkMergeRequests)
    .innerJoin(agents, eq(forkMergeRequests.forkId, agents.id))
    .innerJoin(users, eq(forkMergeRequests.requesterId, users.id))
    .where(eq(forkMergeRequests.parentId, agentId));
    
  if (status) {
    query = query.where(eq(forkMergeRequests.status, status));
  }
  
  return await query.orderBy(desc(forkMergeRequests.createdAt));
}

// Review merge request
export async function reviewMergeRequest(
  requestId: string,
  reviewerId: string,
  decision: 'approved' | 'rejected' | 'merged',
  comment?: string
) {
  const [updated] = await db
    .update(forkMergeRequests)
    .set({
      status: decision,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewComment: comment,
      updatedAt: new Date(),
    })
    .where(eq(forkMergeRequests.id, requestId))
    .returning();
    
  // If merged, update parent agent with fork's content
  if (decision === 'merged') {
    const request = await db
      .select()
      .from(forkMergeRequests)
      .where(eq(forkMergeRequests.id, requestId))
      .limit(1);
      
    if (request[0]) {
      const fork = await db
        .select()
        .from(agents)
        .where(eq(agents.id, request[0].forkId))
        .limit(1);
        
      if (fork[0]) {
        await db
          .update(agents)
          .set({
            content: fork[0].content,
            updatedAt: new Date(),
          })
          .where(eq(agents.id, request[0].parentId));
      }
    }
  }
  
  return updated;
}

// Get fork statistics
export async function getForkStatistics(agentId: string) {
  const directForks = await db
    .select({ count: count() })
    .from(forkRelationships)
    .where(eq(forkRelationships.parentAgentId, agentId));
    
  const totalDescendants = await db
    .select({ count: count() })
    .from(agents)
    .where(eq(agents.parentId, agentId));
    
  const activeForks = await db
    .select({ count: count() })
    .from(agents)
    .where(
      and(
        eq(agents.parentId, agentId),
        gte(agents.updatedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      )
    );
    
  return {
    directForks: directForks[0].count,
    totalDescendants: totalDescendants[0].count,
    activeForks: activeForks[0].count,
  };
}
```

### Step 3: Use Cases Layer
Create `/src/use-cases/forks.ts`:
```typescript
// Fork agent with validation
export async function forkAgentUseCase(
  userId: string,
  parentId: string,
  changes?: any
) {
  // Check if parent exists and is public
  const parent = await getAgentById(parentId);
  if (!parent || !parent.isPublic) {
    throw new Error("Cannot fork private or non-existent agent");
  }
  
  // Prevent self-forking
  if (parent.authorId === userId) {
    throw new Error("You cannot fork your own agent");
  }
  
  // Check if user already forked this agent
  const existingFork = await db
    .select()
    .from(forkRelationships)
    .where(
      and(
        eq(forkRelationships.parentAgentId, parentId),
        eq(forkRelationships.forkedBy, userId)
      )
    )
    .limit(1);
    
  if (existingFork[0]) {
    throw new Error("You have already forked this agent");
  }
  
  // Create fork
  const fork = await forkAgent(parentId, userId, changes);
  
  // Send notification to parent author
  await createNotification(parent.authorId, {
    type: 'agent_forked',
    message: `Your agent "${parent.name}" was forked`,
    agentId: parent.id,
    forkId: fork.id,
  });
  
  return fork;
}

// Create merge request with diff generation
export async function createMergeRequestUseCase(
  userId: string,
  forkId: string,
  title: string,
  description?: string
) {
  // Get fork and parent
  const fork = await getAgentById(forkId);
  if (!fork || fork.authorId !== userId) {
    throw new Error("You can only create merge requests for your own forks");
  }
  
  if (!fork.parentId) {
    throw new Error("This agent is not a fork");
  }
  
  const parent = await getAgentById(fork.parentId);
  if (!parent) {
    throw new Error("Parent agent not found");
  }
  
  // Generate diff
  const changesDiff = generateDiff(parent.content, fork.content);
  
  // Check for existing pending merge request
  const existing = await db
    .select()
    .from(forkMergeRequests)
    .where(
      and(
        eq(forkMergeRequests.forkId, forkId),
        eq(forkMergeRequests.parentId, fork.parentId),
        eq(forkMergeRequests.status, 'pending')
      )
    )
    .limit(1);
    
  if (existing[0]) {
    throw new Error("You already have a pending merge request for this fork");
  }
  
  // Create merge request
  const request = await createMergeRequest(
    forkId,
    fork.parentId,
    userId,
    {
      title,
      description,
      changesDiff,
    }
  );
  
  // Notify parent author
  await createNotification(parent.authorId, {
    type: 'merge_request',
    message: `New merge request for "${parent.name}": ${title}`,
    agentId: parent.id,
    mergeRequestId: request[0].id,
  });
  
  return request[0];
}

// Helper function to generate diff
function generateDiff(original: string, modified: string): any {
  // Use a diff library like diff-match-patch or similar
  // This is a simplified version
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  
  const changes = [];
  const maxLines = Math.max(originalLines.length, modifiedLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    if (originalLines[i] !== modifiedLines[i]) {
      changes.push({
        line: i + 1,
        original: originalLines[i] || '',
        modified: modifiedLines[i] || '',
      });
    }
  }
  
  return {
    changes,
    additions: modifiedLines.length - originalLines.length,
    deletions: originalLines.length - modifiedLines.length,
  };
}
```

### Step 4: Server Functions
Create `/src/fn/forks.ts`:
```typescript
export const forkAgentFn = createServerFn({
  method: "POST",
})
  .middleware([authenticatedMiddleware])
  .handler(async ({ data }) => {
    const user = await getUserFromSession();
    return await forkAgentUseCase(user.id, data.parentId, data.changes);
  });

export const getAgentForksFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ data }) => {
    const { agentId, page = 1, limit = 20 } = data;
    const offset = (page - 1) * limit;
    return await getAgentForks(agentId, limit, offset);
  });

export const getForkLineageFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ data }) => {
    return await getForkLineage(data.agentId);
  });

export const getForkTreeFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ data }) => {
    return await getForkTree(data.agentId, data.maxDepth || 3);
  });

export const createMergeRequestFn = createServerFn({
  method: "POST",
})
  .middleware([authenticatedMiddleware])
  .handler(async ({ data }) => {
    const user = await getUserFromSession();
    return await createMergeRequestUseCase(
      user.id,
      data.forkId,
      data.title,
      data.description
    );
  });

export const getMergeRequestsFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ data }) => {
    return await getAgentMergeRequests(data.agentId, data.status);
  });

export const reviewMergeRequestFn = createServerFn({
  method: "POST",
})
  .middleware([authenticatedMiddleware])
  .handler(async ({ data }) => {
    const user = await getUserFromSession();
    
    // Verify user owns the parent agent
    const request = await db
      .select()
      .from(forkMergeRequests)
      .where(eq(forkMergeRequests.id, data.requestId))
      .limit(1);
      
    if (!request[0]) {
      throw new Error("Merge request not found");
    }
    
    const parent = await getAgentById(request[0].parentId);
    if (!parent || parent.authorId !== user.id) {
      throw new Error("You can only review merge requests for your own agents");
    }
    
    return await reviewMergeRequest(
      data.requestId,
      user.id,
      data.decision,
      data.comment
    );
  });
```

### Step 5: UI Components

#### Fork Button Component
Create `/src/components/fork-button.tsx`:
```typescript
interface ForkButtonProps {
  agentId: string;
  forkCount: number;
  onForkComplete?: (fork: any) => void;
}

export function ForkButton({
  agentId,
  forkCount,
  onForkComplete,
}: ForkButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();
  const user = useUser();
  
  const forkMutation = useMutation({
    mutationFn: forkAgentFn,
    onSuccess: (fork) => {
      toast.success("Agent forked successfully!");
      onForkComplete?.(fork);
      navigate({ to: `/agents/${fork.slug}` });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const handleFork = (changes?: any) => {
    if (!user) {
      toast.error("Please sign in to fork agents");
      return;
    }
    
    forkMutation.mutate({
      data: {
        parentId: agentId,
        changes,
      },
    });
  };
  
  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowDialog(true)}
        disabled={forkMutation.isPending}
      >
        <GitBranch className="h-4 w-4 mr-2" />
        Fork ({forkCount})
      </Button>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fork Agent</DialogTitle>
            <DialogDescription>
              Create your own version of this agent. You can customize it and submit improvements back.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Button
              onClick={() => {
                handleFork();
                setShowDialog(false);
              }}
              className="w-full"
            >
              Fork as-is
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                // Show customization form
                setShowDialog(false);
                // Navigate to fork customization page
              }}
              className="w-full"
            >
              Fork with changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

#### Fork Lineage Component
Create `/src/components/fork-lineage.tsx`:
```typescript
interface ForkLineageProps {
  agentId: string;
}

export function ForkLineage({ agentId }: ForkLineageProps) {
  const { data: lineage, isLoading } = useQuery({
    queryKey: ['fork-lineage', agentId],
    queryFn: () => getForkLineageFn({ data: { agentId } }),
  });
  
  if (isLoading) return <Spinner />;
  if (!lineage || lineage.length <= 1) return null;
  
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <GitBranch className="h-4 w-4" />
        Fork History
      </h3>
      
      <div className="flex items-center gap-2 text-sm">
        {lineage.map((agent, index) => (
          <React.Fragment key={agent.id}>
            <Link
              to={`/agents/${agent.slug}`}
              className="hover:underline text-blue-600"
            >
              {agent.name}
            </Link>
            {index < lineage.length - 1 && (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
```

#### Fork Tree Visualization
Create `/src/components/fork-tree.tsx`:
```typescript
interface ForkTreeProps {
  agentId: string;
}

export function ForkTree({ agentId }: ForkTreeProps) {
  const { data: tree, isLoading } = useQuery({
    queryKey: ['fork-tree', agentId],
    queryFn: () => getForkTreeFn({ data: { agentId, maxDepth: 3 } }),
  });
  
  if (isLoading) return <Spinner />;
  if (!tree) return null;
  
  const renderNode = (node: any, depth = 0) => {
    return (
      <div key={node.id} className="ml-4">
        <div className="flex items-center gap-2 py-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full" />
          <Link
            to={`/agents/${node.slug}`}
            className="hover:underline font-medium"
          >
            {node.name}
          </Link>
          <span className="text-sm text-gray-500">
            by {node.authorUsername}
          </span>
          {node.forkCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {node.forkCount} forks
            </Badge>
          )}
        </div>
        
        {node.children && node.children.length > 0 && (
          <div className="border-l-2 border-gray-200 ml-2">
            {node.children.map((child: any) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-semibold mb-4">Fork Network</h3>
      {renderNode(tree)}
    </div>
  );
}
```

#### Merge Request Component
Create `/src/components/merge-request.tsx`:
```typescript
interface MergeRequestFormProps {
  forkId: string;
  parentId: string;
  onSuccess?: () => void;
}

export function MergeRequestForm({
  forkId,
  parentId,
  onSuccess,
}: MergeRequestFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  const createMutation = useMutation({
    mutationFn: createMergeRequestFn,
    onSuccess: () => {
      toast.success("Merge request created!");
      onSuccess?.();
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        forkId,
        title,
        description,
      },
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief description of your changes"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailed explanation of what changed and why"
          rows={5}
        />
      </div>
      
      <Button type="submit" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Creating..." : "Create Merge Request"}
      </Button>
    </form>
  );
}
```

#### Update Agent Detail Page
Add fork information to the agent detail page:
```typescript
function AgentDetailPage() {
  const { agent } = Route.useLoaderData();
  const user = useUser();
  const isOwner = user?.id === agent.authorId;
  
  // Get fork information
  const { data: forks } = useQuery({
    queryKey: ['agent-forks', agent.id],
    queryFn: () => getAgentForksFn({ data: { agentId: agent.id } }),
  });
  
  const { data: mergeRequests } = useQuery({
    queryKey: ['merge-requests', agent.id],
    queryFn: () => getMergeRequestsFn({ 
      data: { agentId: agent.id, status: 'pending' } 
    }),
    enabled: isOwner,
  });
  
  return (
    <div className="container mx-auto p-4">
      {/* Agent header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1>{agent.name}</h1>
            {agent.isFork && agent.parentId && (
              <ForkLineage agentId={agent.id} />
            )}
          </div>
          
          <div className="flex gap-2">
            <LikeButton
              agentId={agent.id}
              initialLikeCount={agent.likeCount}
            />
            <ForkButton
              agentId={agent.id}
              forkCount={agent.forkCount}
            />
            <Button onClick={handleCopy}>Copy Markdown</Button>
          </div>
        </div>
      </div>
      
      {/* Merge requests (for owners) */}
      {isOwner && mergeRequests && mergeRequests.length > 0 && (
        <Alert className="mb-6">
          <AlertTitle>Pending Merge Requests</AlertTitle>
          <AlertDescription>
            You have {mergeRequests.length} pending merge request(s) for this agent.
            <Link to={`/agents/${agent.slug}/merge-requests`}>
              <Button variant="link" size="sm">Review</Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Content */}
      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="forks">
            Forks ({agent.forkCount})
          </TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content">
          <MarkdownRenderer content={agent.content} />
        </TabsContent>
        
        <TabsContent value="forks">
          {forks && forks.length > 0 ? (
            <div className="space-y-4">
              {forks.map(({ fork, relationship, author }) => (
                <div key={fork.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link
                        to={`/agents/${fork.slug}`}
                        className="font-semibold hover:underline"
                      >
                        {fork.name}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">
                        {fork.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>by {author.username}</span>
                        <span>
                          {formatDistanceToNow(relationship.forkDate)} ago
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <Heart className="h-3 w-3 mr-1" />
                        {fork.likeCount}
                      </Badge>
                      <Badge variant="outline">
                        <GitBranch className="h-3 w-3 mr-1" />
                        {fork.forkCount}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600">
              No forks yet. Be the first to fork this agent!
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="network">
          <ForkTree agentId={agent.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Testing Checklist
- [ ] Can fork an agent successfully
- [ ] Fork creates a copy with proper attribution
- [ ] Cannot fork own agents
- [ ] Cannot fork the same agent twice
- [ ] Fork lineage displays correctly
- [ ] Fork count updates immediately
- [ ] Fork tree visualization works
- [ ] Can create merge requests from forks
- [ ] Parent authors receive fork notifications
- [ ] Merge request review process works
- [ ] Can navigate between parent and forks

## Success Criteria
- Forking enables collaboration and improvement
- Clear parent-child relationships are maintained
- Fork network visualization helps understand relationships
- Merge requests facilitate contribution back to originals
- Authors maintain control over their agents

## Next Steps
With forking in place, you can now add:
- Version control for tracking changes (Slice 7)
- Comments and discussions on agents (Slice 8)
- Automated fork syncing with parent updates (future enhancement)