import { database } from "~/db";
import { 
  launchKits, 
  launchKitTags, 
  launchKitTagRelations, 
  launchKitComments, 
  launchKitAnalytics,
  users,
  profiles
} from "~/db/schema";
import { and, eq, desc, asc, like, inArray, sql, count } from "drizzle-orm";
import type { 
  LaunchKit, 
  LaunchKitCreate, 
  LaunchKitTag,
  LaunchKitTagCreate,
  LaunchKitComment,
  LaunchKitCommentCreate,
  LaunchKitAnalytics,
  LaunchKitAnalyticsCreate
} from "~/db/schema";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Launch Kits
export async function getAllLaunchKits(filters?: {
  tags?: string[];
  search?: string;
}) {
  let query = database
    .select({
      id: launchKits.id,
      name: launchKits.name,
      slug: launchKits.slug,
      description: launchKits.description,
      longDescription: launchKits.longDescription,
      repositoryUrl: launchKits.repositoryUrl,
      demoUrl: launchKits.demoUrl,
      imageUrl: launchKits.imageUrl,
      cloneCount: launchKits.cloneCount,
      createdAt: launchKits.createdAt,
    })
    .from(launchKits);

  let whereConditions = [eq(launchKits.isActive, true)];

  if (filters?.search) {
    whereConditions.push(like(launchKits.name, `%${filters.search}%`));
  }

  if (filters?.tags && filters.tags.length > 0) {
    // Filter by tags - kit must have at least one of the selected tags
    const tagConditions = database
      .select({ launchKitId: launchKitTagRelations.launchKitId })
      .from(launchKitTagRelations)
      .innerJoin(launchKitTags, eq(launchKitTagRelations.tagId, launchKitTags.id))
      .where(inArray(launchKitTags.slug, filters.tags));

    whereConditions.push(inArray(launchKits.id, tagConditions));
  }

  query = query.where(and(...whereConditions));

  const kits = await query.orderBy(desc(launchKits.createdAt));

  // Get tags for each kit
  const kitsWithTags = await Promise.all(
    kits.map(async (kit) => {
      const tags = await getLaunchKitTags(kit.id);
      return { ...kit, tags };
    })
  );

  return kitsWithTags;
}

export async function getLaunchKitBySlug(slug: string) {
  const result = await database
    .select({
      id: launchKits.id,
      name: launchKits.name,
      slug: launchKits.slug,
      description: launchKits.description,
      longDescription: launchKits.longDescription,
      repositoryUrl: launchKits.repositoryUrl,
      demoUrl: launchKits.demoUrl,
      imageUrl: launchKits.imageUrl,
      cloneCount: launchKits.cloneCount,
      createdAt: launchKits.createdAt,
      updatedAt: launchKits.updatedAt,
    })
    .from(launchKits)
    .where(and(eq(launchKits.slug, slug), eq(launchKits.isActive, true)))
    .limit(1);
  return result[0];
}

export async function getLaunchKitById(id: number) {
  const result = await database
    .select()
    .from(launchKits)
    .where(eq(launchKits.id, id))
    .limit(1);
  return result[0];
}

export async function createLaunchKit(data: Omit<LaunchKitCreate, 'slug'> & { name: string }) {
  const slug = generateSlug(data.name);
  const result = await database
    .insert(launchKits)
    .values({
      ...data,
      slug,
    })
    .returning();
  return result[0];
}

export async function updateLaunchKit(id: number, data: Partial<Omit<LaunchKitCreate, 'id'>>) {
  const updateData = {
    ...data,
    updatedAt: new Date(),
  };

  if (data.name) {
    updateData.slug = generateSlug(data.name);
  }

  const result = await database
    .update(launchKits)
    .set(updateData)
    .where(eq(launchKits.id, id))
    .returning();
  return result[0];
}

export async function deleteLaunchKit(id: number) {
  const result = await database
    .update(launchKits)
    .set({ isActive: false })
    .where(eq(launchKits.id, id))
    .returning();
  return result[0];
}

export async function incrementCloneCount(id: number) {
  const result = await database
    .update(launchKits)
    .set({ cloneCount: sql`${launchKits.cloneCount} + 1` })
    .where(eq(launchKits.id, id))
    .returning();
  return result[0];
}

// Tags
export async function getAllTags() {
  return database
    .select()
    .from(launchKitTags)
    .orderBy(asc(launchKitTags.category), asc(launchKitTags.name));
}

export async function getTagsByCategory() {
  const tags = await database
    .select()
    .from(launchKitTags)
    .orderBy(asc(launchKitTags.category), asc(launchKitTags.name));

  // Group tags by category
  const groupedTags = tags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, typeof tags>);

  return groupedTags;
}

export async function createTag(data: Omit<LaunchKitTagCreate, 'slug'> & { name: string }) {
  const slug = generateSlug(data.name);
  const result = await database
    .insert(launchKitTags)
    .values({
      ...data,
      slug,
    })
    .returning();
  return result[0];
}

export async function deleteTag(id: number) {
  const result = await database
    .delete(launchKitTags)
    .where(eq(launchKitTags.id, id))
    .returning();
  return result[0];
}

export async function getLaunchKitTags(launchKitId: number) {
  return database
    .select({
      id: launchKitTags.id,
      name: launchKitTags.name,
      slug: launchKitTags.slug,
      color: launchKitTags.color,
      category: launchKitTags.category,
    })
    .from(launchKitTags)
    .innerJoin(launchKitTagRelations, eq(launchKitTags.id, launchKitTagRelations.tagId))
    .where(eq(launchKitTagRelations.launchKitId, launchKitId));
}

export async function addTagToLaunchKit(launchKitId: number, tagId: number) {
  const result = await database
    .insert(launchKitTagRelations)
    .values({ launchKitId, tagId })
    .returning();
  return result[0];
}

export async function removeTagFromLaunchKit(launchKitId: number, tagId: number) {
  const result = await database
    .delete(launchKitTagRelations)
    .where(
      and(
        eq(launchKitTagRelations.launchKitId, launchKitId),
        eq(launchKitTagRelations.tagId, tagId)
      )
    )
    .returning();
  return result[0];
}

export async function setLaunchKitTags(launchKitId: number, tagIds: number[]) {
  // Remove existing tags
  await database
    .delete(launchKitTagRelations)
    .where(eq(launchKitTagRelations.launchKitId, launchKitId));

  // Add new tags
  if (tagIds.length > 0) {
    const tagRelations = tagIds.map(tagId => ({ launchKitId, tagId }));
    await database
      .insert(launchKitTagRelations)
      .values(tagRelations);
  }
}

// Comments
export async function getLaunchKitComments(launchKitId: number) {
  return database
    .select({
      id: launchKitComments.id,
      content: launchKitComments.content,
      createdAt: launchKitComments.createdAt,
      updatedAt: launchKitComments.updatedAt,
      parentId: launchKitComments.parentId,
      user: {
        id: users.id,
        email: users.email,
        displayName: profiles.displayName,
        image: profiles.image,
      },
    })
    .from(launchKitComments)
    .leftJoin(users, eq(launchKitComments.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(launchKitComments.launchKitId, launchKitId))
    .orderBy(asc(launchKitComments.createdAt));
}

export async function createLaunchKitComment(data: LaunchKitCommentCreate) {
  const result = await database
    .insert(launchKitComments)
    .values(data)
    .returning();
  return result[0];
}

export async function updateLaunchKitComment(id: number, content: string) {
  const result = await database
    .update(launchKitComments)
    .set({ content, updatedAt: new Date() })
    .where(eq(launchKitComments.id, id))
    .returning();
  return result[0];
}

export async function deleteLaunchKitComment(id: number) {
  const result = await database
    .delete(launchKitComments)
    .where(eq(launchKitComments.id, id))
    .returning();
  return result[0];
}

// Analytics
export async function trackLaunchKitEvent(data: LaunchKitAnalyticsCreate) {
  const result = await database
    .insert(launchKitAnalytics)
    .values(data)
    .returning();
  return result[0];
}

export async function getLaunchKitAnalytics(launchKitId: number, eventType?: string) {
  let query = database
    .select()
    .from(launchKitAnalytics)
    .where(eq(launchKitAnalytics.launchKitId, launchKitId));

  if (eventType) {
    query = query.where(
      and(
        eq(launchKitAnalytics.launchKitId, launchKitId),
        eq(launchKitAnalytics.eventType, eventType)
      )
    );
  }

  return query.orderBy(desc(launchKitAnalytics.createdAt));
}

export async function getLaunchKitStats() {
  const totalKits = await database
    .select({ count: count() })
    .from(launchKits)
    .where(eq(launchKits.isActive, true));

  const totalClones = await database
    .select({ total: sql<number>`sum(${launchKits.cloneCount})` })
    .from(launchKits)
    .where(eq(launchKits.isActive, true));

  const totalComments = await database
    .select({ count: count() })
    .from(launchKitComments);

  const popularKits = await database
    .select({
      id: launchKits.id,
      name: launchKits.name,
      slug: launchKits.slug,
      cloneCount: launchKits.cloneCount,
    })
    .from(launchKits)
    .where(eq(launchKits.isActive, true))
    .orderBy(desc(launchKits.cloneCount))
    .limit(5);

  return {
    totalKits: totalKits[0]?.count || 0,
    totalClones: totalClones[0]?.total || 0,
    totalComments: totalComments[0]?.count || 0,
    popularKits,
  };
}