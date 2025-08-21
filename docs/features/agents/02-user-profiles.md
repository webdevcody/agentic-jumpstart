# Vertical Slice 2: User Profiles and Agent Ownership

## Overview
Extend the existing user system to support public profiles showing a user's published agents, contributions, and activity. This builds on the authentication system and connects users to their agents.

## User Stories
- As a user, I can view my profile showing all my agents
- As a user, I can view other users' profiles and their public agents
- As a user, I can see statistics about my agent contributions
- As a user, I can edit my profile information (bio, avatar, etc.)
- As a visitor, I can see who authored an agent

## Database Schema

### Update Users Table
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  bio TEXT,
  github_username VARCHAR(255),
  twitter_username VARCHAR(255),
  website_url VARCHAR(500),
  reputation_score INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false;

-- Add indexes for profile lookups
CREATE INDEX idx_users_username ON users(username);
```

### User Stats View (Materialized or Computed)
```sql
CREATE VIEW user_stats AS
SELECT 
  u.id as user_id,
  COUNT(DISTINCT a.id) as total_agents,
  COUNT(DISTINCT CASE WHEN a.type = 'agent' THEN a.id END) as agent_count,
  COUNT(DISTINCT CASE WHEN a.type = 'command' THEN a.id END) as command_count,
  COUNT(DISTINCT CASE WHEN a.type = 'hook' THEN a.id END) as hook_count,
  COALESCE(SUM(l.like_count), 0) as total_likes_received
FROM users u
LEFT JOIN agents a ON u.id = a.author_id
LEFT JOIN (
  SELECT agent_id, COUNT(*) as like_count 
  FROM likes 
  GROUP BY agent_id
) l ON a.id = l.agent_id
GROUP BY u.id;
```

## Implementation Steps

### Step 1: Update User Schema
Update `/src/db/schema.ts`:
```typescript
export const users = pgTable("users", {
  // ... existing fields
  bio: text("bio"),
  githubUsername: varchar("github_username", { length: 255 }),
  twitterUsername: varchar("twitter_username", { length: 255 }),
  websiteUrl: varchar("website_url", { length: 500 }),
  reputationScore: integer("reputation_score").default(0),
  isVerified: boolean("is_verified").default(false),
});
```

### Step 2: Data Access Layer
Create `/src/data-access/user-profiles.ts`:
```typescript
// Get user profile with stats
export async function getUserProfile(username: string) {
  const user = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      githubUsername: users.githubUsername,
      twitterUsername: users.twitterUsername,
      websiteUrl: users.websiteUrl,
      reputationScore: users.reputationScore,
      isVerified: users.isVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
    
  if (!user[0]) return null;
  
  // Get agent stats
  const stats = await db
    .select({
      totalAgents: count(agents.id),
      agentCount: count(
        sql`CASE WHEN ${agents.type} = 'agent' THEN 1 END`
      ),
      commandCount: count(
        sql`CASE WHEN ${agents.type} = 'command' THEN 1 END`
      ),
      hookCount: count(
        sql`CASE WHEN ${agents.type} = 'hook' THEN 1 END`
      ),
    })
    .from(agents)
    .where(eq(agents.authorId, user[0].id))
    .groupBy(agents.authorId);
    
  return {
    ...user[0],
    stats: stats[0] || { totalAgents: 0, agentCount: 0, commandCount: 0, hookCount: 0 },
  };
}

// Get user's agents
export async function getUserAgents(userId: string, limit = 20, offset = 0) {
  return await db
    .select()
    .from(agents)
    .where(eq(agents.authorId, userId))
    .orderBy(desc(agents.createdAt))
    .limit(limit)
    .offset(offset);
}

// Update user profile
export async function updateUserProfile(userId: string, data: UpdateProfileData) {
  return await db
    .update(users)
    .set({
      bio: data.bio,
      githubUsername: data.githubUsername,
      twitterUsername: data.twitterUsername,
      websiteUrl: data.websiteUrl,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
}
```

### Step 3: Use Cases Layer
Create `/src/use-cases/user-profiles.ts`:
```typescript
// Update profile with validation
export async function updateProfileUseCase(
  userId: string,
  data: UpdateProfileInput
) {
  // Validate URLs
  if (data.websiteUrl && !isValidUrl(data.websiteUrl)) {
    throw new Error("Invalid website URL");
  }
  
  // Validate social usernames (alphanumeric, underscores, dashes)
  const usernameRegex = /^[a-zA-Z0-9_-]*$/;
  if (data.githubUsername && !usernameRegex.test(data.githubUsername)) {
    throw new Error("Invalid GitHub username");
  }
  
  if (data.twitterUsername && !usernameRegex.test(data.twitterUsername)) {
    throw new Error("Invalid Twitter username");
  }
  
  // Bio length limit
  if (data.bio && data.bio.length > 500) {
    throw new Error("Bio must be 500 characters or less");
  }
  
  return await updateUserProfile(userId, data);
}

// Calculate and update reputation score
export async function updateReputationScore(userId: string) {
  // Calculate based on:
  // - Number of agents published
  // - Total likes received
  // - Number of forks of their agents
  // - Verification status
  
  const agentCount = await db
    .select({ count: count() })
    .from(agents)
    .where(eq(agents.authorId, userId));
    
  const likesReceived = await db
    .select({ count: count() })
    .from(likes)
    .innerJoin(agents, eq(likes.agentId, agents.id))
    .where(eq(agents.authorId, userId));
    
  const score = 
    (agentCount[0].count * 10) + 
    (likesReceived[0].count * 5);
    
  await db
    .update(users)
    .set({ reputationScore: score })
    .where(eq(users.id, userId));
    
  return score;
}
```

### Step 4: Server Functions
Create `/src/fn/user-profiles.ts`:
```typescript
export const getProfileFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ data }) => {
    return await getUserProfile(data.username);
  });

export const updateProfileFn = createServerFn({
  method: "POST",
})
  .middleware([authenticatedMiddleware])
  .handler(async ({ data }) => {
    const user = await getUserFromSession();
    return await updateProfileUseCase(user.id, data);
  });

export const getUserAgentsFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ data }) => {
    const { username, page = 1, limit = 20 } = data;
    const user = await getUserByUsername(username);
    if (!user) throw new Error("User not found");
    
    const offset = (page - 1) * limit;
    return await getUserAgents(user.id, limit, offset);
  });
```

### Step 5: Routes and UI

#### User Profile Route
Create `/src/routes/users/$username.tsx`:
```typescript
export const Route = createFileRoute("/users/$username")({
  loader: async ({ params }) => {
    const profile = await getUserProfile(params.username);
    if (!profile) throw new Error("User not found");
    
    const agents = await getUserAgents(profile.id);
    return { profile, agents };
  },
  component: UserProfilePage,
});

function UserProfilePage() {
  const { profile, agents } = Route.useLoaderData();
  const { username } = Route.useParams();
  const user = useUser(); // Current logged-in user
  const isOwnProfile = user?.username === username;
  
  return (
    <div className="container mx-auto p-4">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatarUrl} />
              <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{profile.username}</h1>
                {profile.isVerified && (
                  <Badge variant="secondary">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              
              {profile.bio && (
                <p className="text-gray-600 mt-2">{profile.bio}</p>
              )}
              
              <div className="flex gap-4 mt-3">
                {profile.githubUsername && (
                  <a 
                    href={`https://github.com/${profile.githubUsername}`}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Github className="h-4 w-4" />
                    {profile.githubUsername}
                  </a>
                )}
                {profile.twitterUsername && (
                  <a 
                    href={`https://twitter.com/${profile.twitterUsername}`}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Twitter className="h-4 w-4" />
                    {profile.twitterUsername}
                  </a>
                )}
                {profile.websiteUrl && (
                  <a 
                    href={profile.websiteUrl}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
          
          {isOwnProfile && (
            <Link to="/settings/profile">
              <Button variant="outline">Edit Profile</Button>
            </Link>
          )}
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold">{profile.stats.totalAgents}</div>
            <div className="text-sm text-gray-600">Total Agents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{profile.stats.agentCount}</div>
            <div className="text-sm text-gray-600">Agents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{profile.stats.commandCount}</div>
            <div className="text-sm text-gray-600">Commands</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{profile.stats.hookCount}</div>
            <div className="text-sm text-gray-600">Hooks</div>
          </div>
        </div>
      </div>
      
      {/* User's Agents */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Published Agents</h2>
        
        {agents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No agents published yet</p>
            {isOwnProfile && (
              <Link to="/agents/new">
                <Button className="mt-4">Create Your First Agent</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} showAuthor={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

#### Profile Settings Route
Create `/src/routes/settings/profile.tsx`:
```typescript
export const Route = createFileRoute("/settings/profile")({
  beforeLoad: () => assertIsAuthenticatedFn(),
  loader: async () => {
    const user = await getUserFromSession();
    return { user };
  },
  component: ProfileSettingsPage,
});

function ProfileSettingsPage() {
  const { user } = Route.useLoaderData();
  const updateMutation = useMutation({
    mutationFn: updateProfileFn,
    onSuccess: () => {
      toast.success("Profile updated successfully");
    },
  });
  
  const form = useForm({
    defaultValues: {
      bio: user.bio || "",
      githubUsername: user.githubUsername || "",
      twitterUsername: user.twitterUsername || "",
      websiteUrl: user.websiteUrl || "",
    },
  });
  
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1>Edit Profile</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => updateMutation.mutate({ data }))}>
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={500}
                  />
                </FormControl>
                <FormDescription>
                  {field.value.length}/500 characters
                </FormDescription>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="githubUsername"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GitHub Username</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="johndoe" />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="twitterUsername"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Twitter Username</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="johndoe" />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="websiteUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website URL</FormLabel>
                <FormControl>
                  <Input {...field} type="url" placeholder="https://example.com" />
                </FormControl>
              </FormItem>
            )}
          />
          
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
```

#### Update Agent Cards to Show Author
Update agent card component to show author info:
```typescript
export function AgentCard({ agent, showAuthor = true }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{agent.name}</CardTitle>
            <Badge className="mt-1">{agent.type}</Badge>
          </div>
        </div>
        {showAuthor && (
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={agent.author.avatarUrl} />
              <AvatarFallback>{agent.author.username[0]}</AvatarFallback>
            </Avatar>
            <Link 
              to={`/users/${agent.author.username}`}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {agent.author.username}
            </Link>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{agent.description}</p>
      </CardContent>
      <CardFooter>
        <Link to={`/agents/${agent.slug}`}>
          <Button variant="outline" size="sm">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
```

## Testing Checklist
- [ ] Can view own profile with all agents
- [ ] Can view other users' profiles
- [ ] Profile shows correct stats (agent counts by type)
- [ ] Can edit profile information (bio, social links)
- [ ] Social links are validated and work correctly
- [ ] Author information appears on agent cards
- [ ] Author links navigate to user profiles
- [ ] Reputation score updates based on activity
- [ ] Profile page handles non-existent users gracefully

## Success Criteria
- Users have rich profiles showcasing their contributions
- Profile statistics accurately reflect user activity
- Social links enhance discoverability
- Clean, intuitive profile UI
- Proper authorization for profile editing

## Next Steps
With user profiles in place, you can now add:
- Tagging system for categorizing agents (Slice 3)
- Like/upvote functionality with reputation impact (Slice 4)
- Follow system for users (future enhancement)