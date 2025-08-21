import {
  createAgent,
  deleteAgent,
  getAgentById,
  getAgentBySlug,
  getPublicAgents,
  getUserAgents,
  updateAgent,
} from "~/data-access/agents";
import { PublicError } from "./errors";
import { UserId } from "./types";

export type CreateAgentInput = {
  name: string;
  description: string;
  type: "agent" | "command" | "hook";
  content: string;
  isPublic?: boolean;
};

export type UpdateAgentInput = Partial<CreateAgentInput>;

export async function getPublicAgentsUseCase() {
  return getPublicAgents();
}

export async function getAgentBySlugUseCase(slug: string) {
  const agent = await getAgentBySlug(slug);
  if (!agent) {
    throw new PublicError("Agent not found");
  }
  return agent;
}

export async function getUserAgentsUseCase(userId: UserId) {
  return getUserAgents(userId);
}

export async function createAgentUseCase(
  userId: UserId,
  data: CreateAgentInput
) {
  // Validate markdown content
  if (!data.content || data.content.length < 10) {
    throw new PublicError("Agent content must be at least 10 characters");
  }

  // Validate name
  if (!data.name || data.name.length < 2) {
    throw new PublicError("Agent name must be at least 2 characters");
  }

  // Validate description
  if (!data.description || data.description.length < 10) {
    throw new PublicError("Agent description must be at least 10 characters");
  }

  // Validate type
  if (!["agent", "command", "hook"].includes(data.type)) {
    throw new PublicError("Invalid agent type");
  }

  return createAgent({
    ...data,
    authorId: userId,
    isPublic: data.isPublic ?? true,
  });
}

export async function updateAgentUseCase(
  userId: UserId,
  agentId: number,
  data: UpdateAgentInput
) {
  // Check ownership
  const agent = await getAgentById(agentId);
  if (!agent) {
    throw new PublicError("Agent not found");
  }

  if (agent.authorId !== userId) {
    throw new PublicError("You can only edit your own agents");
  }

  // Validate content if provided
  if (data.content !== undefined && data.content.length < 10) {
    throw new PublicError("Agent content must be at least 10 characters");
  }

  // Validate name if provided
  if (data.name !== undefined && data.name.length < 2) {
    throw new PublicError("Agent name must be at least 2 characters");
  }

  // Validate description if provided
  if (data.description !== undefined && data.description.length < 10) {
    throw new PublicError("Agent description must be at least 10 characters");
  }

  // Validate type if provided
  if (
    data.type !== undefined &&
    !["agent", "command", "hook"].includes(data.type)
  ) {
    throw new PublicError("Invalid agent type");
  }

  return updateAgent(agentId, data);
}

export async function deleteAgentUseCase(userId: UserId, agentId: number) {
  // Check ownership
  const agent = await getAgentById(agentId);
  if (!agent) {
    throw new PublicError("Agent not found");
  }

  if (agent.authorId !== userId) {
    throw new PublicError("You can only delete your own agents");
  }

  return deleteAgent(agentId);
}
