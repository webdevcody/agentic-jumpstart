import { createFileRoute, Link } from "@tanstack/react-router";
import { getAgentBySlugFn } from "~/fn/agents";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
  CardDescription,
} from "~/components/ui/card";
import { MarkdownRenderer } from "~/components/markdown-renderer";
import { ScrollAnimation } from "~/components/scroll-animation";
import {
  Bot,
  Code,
  Zap,
  Copy,
  ArrowLeft,
  Calendar,
  User,
  Check,
} from "lucide-react";
import { useState } from "react";
import { isAuthenticatedFn } from "~/fn/auth";
import { Page } from "~/routes/admin/-components/page";
import { Title } from "~/components/title";
import { PageHeader } from "../admin/-components/page-header";

export const Route = createFileRoute("/agents/$slug")({
  component: AgentDetailPage,
  loader: async ({ params }) => {
    const [agent, isAuthenticated] = await Promise.all([
      getAgentBySlugFn({ data: { slug: params.slug } }),
      isAuthenticatedFn(),
    ]);
    return { agent, isAuthenticated };
  },
});

function AgentDetailPage() {
  const { agent, isAuthenticated } = Route.useLoaderData();
  const [copied, setCopied] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "agent":
        return <Bot className="h-5 w-5" />;
      case "command":
        return <Code className="h-5 w-5" />;
      case "hook":
        return <Zap className="h-5 w-5" />;
      default:
        return <Bot className="h-5 w-5" />;
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(agent.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <Page>
      <ScrollAnimation direction="up" delay={0}>
        <div className="flex items-center gap-4 mb-8">
          <Link to="/agents">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Agents
            </Button>
          </Link>
        </div>
      </ScrollAnimation>

      <ScrollAnimation direction="up" delay={0.1}>
        <PageHeader
          title={`${agent.name} ${agent.type.charAt(0).toUpperCase() + agent.type.slice(1)}`}
          highlightedWord={
            agent.type.charAt(0).toUpperCase() + agent.type.slice(1)
          }
          description={
            <div className="flex items-center gap-2">
              <Badge className={getTypeColor(agent.type)}>
                {getTypeIcon(agent.type)}
                <span className="ml-1 capitalize">{agent.type}</span>
              </Badge>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created {new Date(agent.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          }
        />
      </ScrollAnimation>

      <ScrollAnimation direction="up" delay={0.15}>
        <div className="mb-8">
          <p className="text-lg text-muted-foreground mb-6">
            {agent.description}
          </p>
        </div>
      </ScrollAnimation>

      {/* Content */}
      <ScrollAnimation direction="up" delay={0.2}>
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Agent Content
            </CardTitle>
            <CardDescription>
              Click the "Copy Markdown" button above to copy the agent content
              to your clipboard.
            </CardDescription>
            <CardAction>
              <Button onClick={handleCopy} className="whitespace-nowrap">
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Markdown
                  </>
                )}
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="prose-container">
              <MarkdownRenderer
                content={agent.content}
                className="prose-sm max-w-none"
              />
            </div>
          </CardContent>
        </Card>
      </ScrollAnimation>

      {/* Call to Action */}
      {isAuthenticated && (
        <ScrollAnimation direction="up" delay={0.4}>
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Inspired by this agent? Create your own!
            </p>
            <Link to="/agents/new">
              <Button size="lg">
                <Bot className="mr-2 h-5 w-5" />
                Create Your Agent
              </Button>
            </Link>
          </div>
        </ScrollAnimation>
      )}
    </Page>
  );
}
