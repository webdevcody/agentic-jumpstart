import { database } from "~/db";
import {
  launchKits,
  launchKitTags,
  launchKitTagRelations,
  launchKitComments,
  launchKitAnalytics,
  launchKitCategories,
  users,
  profiles,
} from "~/db/schema";
import { and, eq, desc, asc, like, inArray, sql, count } from "drizzle-orm";
import type {
  LaunchKit,
  LaunchKitCreate,
  LaunchKitTag,
  LaunchKitTagCreate,
  LaunchKitCategory,
  LaunchKitCategoryCreate,
  LaunchKitComment,
  LaunchKitCommentCreate,
  LaunchKitAnalytics,
  LaunchKitAnalyticsCreate,
} from "~/db/schema";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
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
      .innerJoin(
        launchKitTags,
        eq(launchKitTagRelations.tagId, launchKitTags.id)
      )
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

export async function createLaunchKit(
  data: Omit<LaunchKitCreate, "slug"> & { name: string }
) {
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

export async function updateLaunchKit(
  id: number,
  data: Partial<Omit<LaunchKitCreate, "id">>
) {
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

// Categories
export async function getAllCategories() {
  return database
    .select()
    .from(launchKitCategories)
    .orderBy(asc(launchKitCategories.name));
}

export async function getCategoryById(id: number) {
  const result = await database
    .select()
    .from(launchKitCategories)
    .where(eq(launchKitCategories.id, id))
    .limit(1);
  return result[0];
}

export async function getCategoryBySlug(slug: string) {
  const result = await database
    .select()
    .from(launchKitCategories)
    .where(eq(launchKitCategories.slug, slug))
    .limit(1);
  return result[0];
}

export async function createCategory(
  data: Omit<LaunchKitCategoryCreate, "slug"> & { name: string }
) {
  const slug = generateSlug(data.name);
  const result = await database
    .insert(launchKitCategories)
    .values({
      ...data,
      slug,
    })
    .returning();
  return result[0];
}

export async function updateCategory(
  id: number,
  data: Partial<Omit<LaunchKitCategoryCreate, "id">>
) {
  const updateData = {
    ...data,
    updatedAt: new Date(),
  };

  if (data.name) {
    updateData.slug = generateSlug(data.name);
  }

  const result = await database
    .update(launchKitCategories)
    .set(updateData)
    .where(eq(launchKitCategories.id, id))
    .returning();
  return result[0];
}

export async function deleteCategory(id: number) {
  const result = await database
    .delete(launchKitCategories)
    .where(eq(launchKitCategories.id, id))
    .returning();
  return result[0];
}

// Tags
export async function getAllTags() {
  return database
    .select({
      id: launchKitTags.id,
      name: launchKitTags.name,
      slug: launchKitTags.slug,
      color: launchKitTags.color,
      categoryId: launchKitTags.categoryId,
      createdAt: launchKitTags.createdAt,
      updatedAt: launchKitTags.updatedAt,
      category: {
        id: launchKitCategories.id,
        name: launchKitCategories.name,
        slug: launchKitCategories.slug,
      },
    })
    .from(launchKitTags)
    .leftJoin(
      launchKitCategories,
      eq(launchKitTags.categoryId, launchKitCategories.id)
    )
    .orderBy(asc(launchKitCategories.name), asc(launchKitTags.name));
}

export async function getTagById(id: number) {
  const result = await database
    .select({
      id: launchKitTags.id,
      name: launchKitTags.name,
      slug: launchKitTags.slug,
      color: launchKitTags.color,
      categoryId: launchKitTags.categoryId,
      createdAt: launchKitTags.createdAt,
      updatedAt: launchKitTags.updatedAt,
      category: {
        id: launchKitCategories.id,
        name: launchKitCategories.name,
        slug: launchKitCategories.slug,
      },
    })
    .from(launchKitTags)
    .leftJoin(
      launchKitCategories,
      eq(launchKitTags.categoryId, launchKitCategories.id)
    )
    .where(eq(launchKitTags.id, id))
    .limit(1);
  return result[0];
}

export async function getTagsByCategory() {
  const tags = await getAllTags();

  // Group tags by category
  const groupedTags = tags.reduce(
    (acc, tag) => {
      const categoryName = tag.category?.name || "uncategorized";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(tag);
      return acc;
    },
    {} as Record<string, typeof tags>
  );

  return groupedTags;
}

export async function createTag(
  data: Omit<LaunchKitTagCreate, "slug"> & { name: string }
) {
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

export async function updateTag(
  id: number,
  data: Partial<Omit<LaunchKitTagCreate, "id">>
) {
  const updateData = {
    ...data,
    updatedAt: new Date(),
  };

  if (data.name) {
    updateData.slug = generateSlug(data.name);
  }

  const result = await database
    .update(launchKitTags)
    .set(updateData)
    .where(eq(launchKitTags.id, id))
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

export async function getTagUsageCount(id: number) {
  const result = await database
    .select({ count: count() })
    .from(launchKitTagRelations)
    .where(eq(launchKitTagRelations.tagId, id));
  return result[0]?.count || 0;
}

export async function getLaunchKitTags(launchKitId: number) {
  return database
    .select({
      id: launchKitTags.id,
      name: launchKitTags.name,
      slug: launchKitTags.slug,
      color: launchKitTags.color,
      categoryId: launchKitTags.categoryId,
      category: {
        id: launchKitCategories.id,
        name: launchKitCategories.name,
        slug: launchKitCategories.slug,
      },
    })
    .from(launchKitTags)
    .innerJoin(
      launchKitTagRelations,
      eq(launchKitTags.id, launchKitTagRelations.tagId)
    )
    .leftJoin(
      launchKitCategories,
      eq(launchKitTags.categoryId, launchKitCategories.id)
    )
    .where(eq(launchKitTagRelations.launchKitId, launchKitId));
}

export async function addTagToLaunchKit(launchKitId: number, tagId: number) {
  const result = await database
    .insert(launchKitTagRelations)
    .values({ launchKitId, tagId })
    .returning();
  return result[0];
}

export async function removeTagFromLaunchKit(
  launchKitId: number,
  tagId: number
) {
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
    const tagRelations = tagIds.map((tagId) => ({ launchKitId, tagId }));
    await database.insert(launchKitTagRelations).values(tagRelations);
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
        // Don't expose email - use displayName and image only
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
  try {
    const result = await database
      .insert(launchKitAnalytics)
      .values(data)
      .returning();
    return result[0];
  } catch (error) {
    // Silently fail - analytics shouldn't break the user experience
    console.error("Failed to track launch kit event:", error);
    return null;
  }
}

export async function getLaunchKitAnalytics(
  launchKitId: number,
  eventType?: string
) {
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
