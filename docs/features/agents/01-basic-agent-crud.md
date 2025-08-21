# Vertical Slice 1: Basic Agent CRUD and Display

## Overview
Implement the foundational functionality for creating, reading, updating, and deleting agent markdown files. This is the core feature that all other features will build upon.

## User Stories
- As a user, I can create a new agent by providing markdown content
- As a user, I can view an agent's details including its markdown content
- As a user, I can edit my own agents
- As a user, I can delete my own agents
- As a user, I can see a list of all public agents

## Database Schema

### Agents Table
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('agent', 'command', 'hook')),
  content TEXT NOT NULL, -- markdown content
  author_id UUID NOT NULL REFERENCES users(id),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agents_author ON agents(author_id);
CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agents_public ON agents(is_public);
```

## Implementation Steps

### Step 1: Database Setup
1. Create migration file for agents table using Drizzle
2. Define schema in `/src/db/schema.ts`:
```typescript
export const agents = pgTable("agents", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  content: text("content").notNull(),
  authorId: uuid("author_id").notNull().references(() => users.id),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Step 2: Data Access Layer
Create `/src/data-access/agents.ts`:
```typescript
// Get all public agents
export async function getPublicAgents() {
  return await db
    .select()
    .from(agents)
    .where(eq(agents.isPublic, true))
    .orderBy(desc(agents.createdAt));
}

// Get single agent by slug
export async function getAgentBySlug(slug: string) {
  return await db
    .select()
    .from(agents)
    .where(eq(agents.slug, slug))
    .limit(1);
}

// Create agent
export async function createAgent(data: NewAgent) {
  const slug = generateSlug(data.name);
  return await db.insert(agents).values({
    ...data,
    slug,
  }).returning();
}

// Update agent
export async function updateAgent(id: string, data: UpdateAgent) {
  return await db
    .update(agents)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(agents.id, id))
    .returning();
}

// Delete agent
export async function deleteAgent(id: string) {
  return await db
    .delete(agents)
    .where(eq(agents.id, id));
}
```

### Step 3: Use Cases Layer
Create `/src/use-cases/agents.ts`:
```typescript
// Create agent with validation
export async function createAgentUseCase(
  userId: string,
  data: CreateAgentInput
) {
  // Validate markdown content
  if (!data.content || data.content.length < 10) {
    throw new Error("Agent content must be at least 10 characters");
  }
  
  // Validate name uniqueness is handled by DB constraint
  
  return await createAgent({
    ...data,
    authorId: userId,
  });
}

// Update agent with authorization
export async function updateAgentUseCase(
  userId: string,
  agentId: string,
  data: UpdateAgentInput
) {
  // Check ownership
  const agent = await getAgentById(agentId);
  if (!agent || agent.authorId !== userId) {
    throw new Error("Unauthorized");
  }
  
  return await updateAgent(agentId, data);
}
```

### Step 4: Server Functions
Create `/src/fn/agents.ts`:
```typescript
export const createAgentFn = createServerFn({
  method: "POST",
})
  .middleware([authenticatedMiddleware])
  .handler(async ({ data }) => {
    const user = await getUserFromSession();
    return await createAgentUseCase(user.id, data);
  });

export const updateAgentFn = createServerFn({
  method: "POST",
})
  .middleware([authenticatedMiddleware])
  .handler(async ({ data }) => {
    const user = await getUserFromSession();
    return await updateAgentUseCase(user.id, data.id, data.updates);
  });

export const deleteAgentFn = createServerFn({
  method: "POST",
})
  .middleware([authenticatedMiddleware])
  .handler(async ({ data }) => {
    const user = await getUserFromSession();
    return await deleteAgentUseCase(user.id, data.id);
  });
```

### Step 5: Routes and UI

#### List Page Route
Create `/src/routes/agents/index.tsx`:
```typescript
export const Route = createFileRoute("/agents/")({
  loader: async () => {
    const agents = await getPublicAgents();
    return { agents };
  },
  component: AgentsListPage,
});

function AgentsListPage() {
  const { agents } = Route.useLoaderData();
  
  return (
    <div className="container mx-auto p-4">
      <h1>Agent Marketplace</h1>
      <Link to="/agents/new">
        <Button>Create Agent</Button>
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader>
              <CardTitle>{agent.name}</CardTitle>
              <Badge>{agent.type}</Badge>
            </CardHeader>
            <CardContent>
              <p>{agent.description}</p>
            </CardContent>
            <CardFooter>
              <Link to={`/agents/${agent.slug}`}>
                <Button variant="outline">View Details</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

#### Detail Page Route
Create `/src/routes/agents/$slug.tsx`:
```typescript
export const Route = createFileRoute("/agents/$slug")({
  loader: async ({ params }) => {
    const agent = await getAgentBySlug(params.slug);
    if (!agent) throw new Error("Agent not found");
    return { agent };
  },
  component: AgentDetailPage,
});

function AgentDetailPage() {
  const { agent } = Route.useLoaderData();
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(agent.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-start">
        <div>
          <h1>{agent.name}</h1>
          <p>{agent.description}</p>
          <Badge>{agent.type}</Badge>
        </div>
        
        <Button onClick={handleCopy}>
          {copied ? "Copied!" : "Copy Markdown"}
        </Button>
      </div>
      
      <div className="mt-8 prose max-w-none">
        <ReactMarkdown>{agent.content}</ReactMarkdown>
      </div>
    </div>
  );
}
```

#### Create/Edit Form Component
Create `/src/routes/agents/-components/agent-form.tsx`:
```typescript
export function AgentForm({ 
  agent, 
  onSubmit 
}: { 
  agent?: Agent, 
  onSubmit: (data: AgentFormData) => void 
}) {
  const form = useForm<AgentFormData>({
    defaultValues: agent || {
      name: "",
      description: "",
      type: "agent",
      content: "",
    },
  });
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="My Awesome Agent" />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select {...field}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="command">Command</SelectItem>
                  <SelectItem value="hook">Hook</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Markdown Content</FormLabel>
              <FormControl>
                <Textarea {...field} rows={20} className="font-mono" />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button type="submit">
          {agent ? "Update Agent" : "Create Agent"}
        </Button>
      </form>
    </Form>
  );
}
```

#### Create Page Route
Create `/src/routes/agents/new.tsx`:
```typescript
export const Route = createFileRoute("/agents/new")({
  beforeLoad: () => assertIsAuthenticatedFn(),
  component: CreateAgentPage,
});

function CreateAgentPage() {
  const navigate = useNavigate();
  const createMutation = useMutation({
    mutationFn: createAgentFn,
    onSuccess: (data) => {
      navigate({ to: `/agents/${data.slug}` });
    },
  });
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1>Create New Agent</h1>
      <AgentForm onSubmit={(data) => createMutation.mutate({ data })} />
    </div>
  );
}
```

### Step 6: Markdown Rendering
Install required packages:
```bash
npm install react-markdown remark-gfm rehype-highlight
```

Create markdown renderer component:
```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      className="prose prose-slate max-w-none"
    >
      {content}
    </ReactMarkdown>
  );
}
```

## Testing Checklist
- [ ] Can create a new agent with all required fields
- [ ] Name uniqueness is enforced
- [ ] Can view list of all public agents
- [ ] Can view individual agent details
- [ ] Markdown is properly rendered with syntax highlighting
- [ ] Copy button successfully copies markdown to clipboard
- [ ] Can edit own agents
- [ ] Cannot edit other users' agents
- [ ] Can delete own agents
- [ ] Cannot delete other users' agents

## Success Criteria
- Users can successfully create and share agent markdown files
- The system properly stores and retrieves agent data
- Markdown content is rendered correctly with code highlighting
- Basic CRUD operations work reliably
- Authorization prevents unauthorized edits/deletes

## Next Steps
After this slice is complete, you'll have the foundation to add:
- User authentication and profiles (Slice 2)
- Tagging system (Slice 3)
- Like/upvote functionality (Slice 4)
- Search and filtering (Slice 5)