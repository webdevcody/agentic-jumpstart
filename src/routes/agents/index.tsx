import { createFileRoute, Link } from "@tanstack/react-router";
import { getPublicAgentsFn } from "~/fn/agents";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Plus, Bot, Code, Zap, Users, Calendar } from "lucide-react";
import { isAuthenticatedFn } from "~/fn/auth";
import { PageHeader } from "../admin/-components/page-header";
import { Page } from "../admin/-components/page";

export const Route = createFileRoute("/agents/")({
  component: AgentsListPage,
  loader: async () => {
    const [agents, isAuthenticated] = await Promise.all([
      getPublicAgentsFn(),
      isAuthenticatedFn(),
    ]);
    return { agents, isAuthenticated };
  },
});

function AgentsListPage() {
  const { agents, isAuthenticated } = Route.useLoaderData();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "agent":
        return <Bot className="h-4 w-4" />;
      case "command":
        return <Code className="h-4 w-4" />;
      case "hook":
        return <Zap className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "agent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "command":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "hook":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <Page>
      <PageHeader
        title="Agent Marketplace"
        highlightedWord="Agent"
        description="Discover and share community agents."
        actions={
          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <Link to="/agents/new">
                <Button size="lg">
                  <Plus className="h-5 w-5" />
                  Upload Agent
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* Mobile Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-12 animate-in fade-in slide-in-from-bottom-2 duration-500 sm:hidden">
        <div className="group relative animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="module-card p-6 h-full">
            <div className="flex flex-row items-center justify-between space-y-0 mb-4">
              <div className="text-sm font-medium text-muted-foreground">
                Total Agents
              </div>
              <div className="w-10 h-10 rounded-full bg-theme-500/10 dark:bg-theme-400/20 flex items-center justify-center group-hover:bg-theme-500/20 dark:group-hover:bg-theme-400/30 transition-colors duration-300">
                <Bot className="h-5 w-5 text-theme-500 dark:text-theme-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-2 group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors duration-300">
              {agents.length}
            </div>
            <p className="text-sm text-muted-foreground">
              Available in marketplace
            </p>
          </div>
        </div>

        <div className="group relative animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="module-card p-6 h-full">
            <div className="flex flex-row items-center justify-between space-y-0 mb-4">
              <div className="text-sm font-medium text-muted-foreground">
                Contributors
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500/10 dark:bg-blue-400/20 flex items-center justify-center group-hover:bg-blue-500/20 dark:group-hover:bg-blue-400/30 transition-colors duration-300">
                <Users className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
              {new Set(agents.map((a) => a.authorId)).size}
            </div>
            <p className="text-sm text-muted-foreground">
              Community members sharing
            </p>
          </div>
        </div>

        <div className="group relative animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="module-card p-6 h-full">
            <div className="flex flex-row items-center justify-between space-y-0 mb-4">
              <div className="text-sm font-medium text-muted-foreground">
                AI Agents
              </div>
              <div className="w-10 h-10 rounded-full bg-green-500/10 dark:bg-green-400/20 flex items-center justify-center group-hover:bg-green-500/20 dark:group-hover:bg-green-400/30 transition-colors duration-300">
                <Zap className="h-5 w-5 text-green-500 dark:text-green-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
              {agents.filter((a) => a.type === "agent").length}
            </div>
            <p className="text-sm text-muted-foreground">
              Ready-to-use AI assistants
            </p>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      {agents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {agents.map((agent, index) => (
            <Card
              key={agent.id}
              className="module-card h-full hover:shadow-lg transition-all duration-300 hover:transform hover:scale-[1.02]"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2 text-foreground">
                    {agent.name}
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className={`ml-2 flex items-center gap-1 ${getTypeColor(agent.type)}`}
                  >
                    {getTypeIcon(agent.type)}
                    {agent.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                  {agent.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(agent.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link
                  to="/agents/$slug"
                  params={{ slug: agent.slug }}
                  className="w-full"
                >
                  <Button variant="outline" className="w-full">
                    <Bot className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="module-card">
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-theme-500/10 dark:bg-theme-400/10 flex items-center justify-center mx-auto mb-6">
              <Bot className="w-12 h-12 text-theme-600 dark:text-theme-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Agents Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Be the first to share an AI agent with the community!
            </p>
            {isAuthenticated && (
              <Link to="/agents/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Agent
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </Page>
  );
}
