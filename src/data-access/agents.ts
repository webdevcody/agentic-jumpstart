import { database } from "~/db";
import { agents } from "~/db/schema";
import { and, eq, desc } from "drizzle-orm";
import type { Agent, AgentCreate } from "~/db/schema";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function getPublicAgents() {
  return database
    .select()
    .from(agents)
    .where(eq(agents.isPublic, true))
    .orderBy(desc(agents.createdAt));
}

export async function getAgentBySlug(slug: string) {
  const result = await database
    .select()
    .from(agents)
    .where(eq(agents.slug, slug))
    .limit(1);
  return result[0];
}

export async function getAgentById(id: number) {
  const result = await database
    .select()
    .from(agents)
    .where(eq(agents.id, id))
    .limit(1);
  return result[0];
}

export async function getUserAgents(authorId: number) {
  return database
    .select()
    .from(agents)
    .where(eq(agents.authorId, authorId))
    .orderBy(desc(agents.createdAt));
}

export async function createAgent(data: Omit<AgentCreate, 'slug'> & { name: string }) {
  const slug = generateSlug(data.name);
  const result = await database
    .insert(agents)
    .values({
      ...data,
      slug,
    })
    .returning();
  return result[0];
}

export async function updateAgent(id: number, data: Partial<Omit<AgentCreate, 'id'>>) {
  const updateData = {
    ...data,
    updatedAt: new Date(),
  };

  if (data.name) {
    updateData.slug = generateSlug(data.name);
  }

  const result = await database
    .update(agents)
    .set(updateData)
    .where(eq(agents.id, id))
    .returning();
  return result[0];
}

export async function deleteAgent(id: number) {
  const result = await database
    .delete(agents)
    .where(eq(agents.id, id))
    .returning();
  return result[0];
}