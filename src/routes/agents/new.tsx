import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { assertAuthenticatedFn } from "~/fn/auth";
import { createAgentFn } from "~/fn/agents";
import { AgentForm, type AgentFormValues } from "./-components/agent-form";
import { Plus } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../admin/-components/page-header";
import { Page } from "../admin/-components/page";

export const Route = createFileRoute("/agents/new")({
  beforeLoad: async () => {
    await assertAuthenticatedFn();
  },
  component: CreateAgentPage,
});

function CreateAgentPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: AgentFormValues) => {
    setIsSubmitting(true);
    try {
      const agent = await createAgentFn({
        data: {
          name: values.name,
          description: values.description,
          type: values.type,
          content: values.content,
          isPublic: values.isPublic ?? true,
        },
      });

      // Navigate to the created agent
      navigate({
        to: "/agents/$slug",
        params: { slug: agent.slug },
      });
    } catch (error) {
      console.error("Failed to create agent:", error);
      // TODO: Add proper error handling/toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <PageHeader
        title="Upload New Agent"
        highlightedWord="New"
        description="Share your agents, command, or hook with the community."
      />

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <AgentForm
          buttonText="Create Agent"
          loadingText="Creating Agent..."
          buttonIcon={Plus}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </Page>
  );
}
