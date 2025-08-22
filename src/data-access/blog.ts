import { database } from "~/db";
import { blogPosts, blogPostViews, users, profiles } from "~/db/schema";
import { and, eq, desc, sql, count, isNotNull } from "drizzle-orm";
import type { BlogPost, BlogPostCreate, BlogPostView, BlogPostViewCreate } from "~/db/schema";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function getPublishedBlogPosts() {
  return database
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      excerpt: blogPosts.excerpt,
      featuredImage: blogPosts.featuredImage,
      tags: blogPosts.tags,
      publishedAt: blogPosts.publishedAt,
      createdAt: blogPosts.createdAt,
      author: {
        displayName: profiles.displayName,
        image: profiles.image,
      },
    })
    .from(blogPosts)
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(and(eq(blogPosts.isPublished, true), isNotNull(blogPosts.publishedAt)))
    .orderBy(desc(blogPosts.publishedAt));
}

export async function getBlogPostBySlug(slug: string) {
  const result = await database
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      content: blogPosts.content,
      excerpt: blogPosts.excerpt,
      isPublished: blogPosts.isPublished,
      featuredImage: blogPosts.featuredImage,
      tags: blogPosts.tags,
      publishedAt: blogPosts.publishedAt,
      createdAt: blogPosts.createdAt,
      updatedAt: blogPosts.updatedAt,
      author: {
        id: users.id,
        displayName: profiles.displayName,
        image: profiles.image,
      },
    })
    .from(blogPosts)
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(blogPosts.slug, slug))
    .limit(1);
  return result[0];
}

export async function getBlogPostById(id: number) {
  const result = await database
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .limit(1);
  return result[0];
}

export type BlogPostFilters = {
  isPublished?: boolean;
  authorId?: number;
};

export async function getBlogPosts(filters: BlogPostFilters = {}) {
  const conditions = [];
  
  if (filters.isPublished !== undefined) {
    conditions.push(eq(blogPosts.isPublished, filters.isPublished));
  }
  
  if (filters.authorId) {
    conditions.push(eq(blogPosts.authorId, filters.authorId));
  }

  return database
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      excerpt: blogPosts.excerpt,
      isPublished: blogPosts.isPublished,
      featuredImage: blogPosts.featuredImage,
      tags: blogPosts.tags,
      publishedAt: blogPosts.publishedAt,
      createdAt: blogPosts.createdAt,
      updatedAt: blogPosts.updatedAt,
      author: {
        displayName: profiles.displayName,
        image: profiles.image,
      },
    })
    .from(blogPosts)
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(blogPosts.createdAt));
}

export async function createBlogPost(data: Omit<BlogPostCreate, 'slug'> & { title: string }) {
  const slug = generateSlug(data.title);
  const result = await database
    .insert(blogPosts)
    .values({
      ...data,
      slug,
    })
    .returning();
  return result[0];
}

export async function updateBlogPost(id: number, data: Partial<Omit<BlogPostCreate, 'id'>>) {
  const updateData = {
    ...data,
    updatedAt: new Date(),
  };

  if (data.title) {
    updateData.slug = generateSlug(data.title);
  }

  // Set publishedAt when publishing for the first time
  if (data.isPublished && data.publishedAt === undefined) {
    updateData.publishedAt = new Date();
  }

  const result = await database
    .update(blogPosts)
    .set(updateData)
    .where(eq(blogPosts.id, id))
    .returning();
  return result[0];
}

export async function deleteBlogPost(id: number) {
  const result = await database
    .delete(blogPosts)
    .where(eq(blogPosts.id, id))
    .returning();
  return result[0];
}

export async function trackBlogPostView(data: BlogPostViewCreate) {
  // Use INSERT ... ON CONFLICT DO NOTHING to prevent duplicate views per session
  try {
    const result = await database
      .insert(blogPostViews)
      .values(data)
      .returning();
    return result[0];
  } catch (error) {
    // If it's a unique constraint violation, just return null (view already tracked)
    return null;
  }
}

export async function getBlogAnalytics() {
  // Get total blog posts
  const totalPostsResult = await database
    .select({ count: count() })
    .from(blogPosts);

  // Get published blog posts
  const publishedPostsResult = await database
    .select({ count: count() })
    .from(blogPosts)
    .where(eq(blogPosts.isPublished, true));

  // Get total views
  const totalViewsResult = await database
    .select({ count: count() })
    .from(blogPostViews);

  // Get most viewed posts
  const mostViewedPosts = await database
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      viewCount: count(blogPostViews.id),
    })
    .from(blogPosts)
    .leftJoin(blogPostViews, eq(blogPosts.id, blogPostViews.blogPostId))
    .where(eq(blogPosts.isPublished, true))
    .groupBy(blogPosts.id, blogPosts.title, blogPosts.slug)
    .orderBy(desc(count(blogPostViews.id)))
    .limit(10);

  // Get recent posts with view counts
  const recentPosts = await database
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      isPublished: blogPosts.isPublished,
      publishedAt: blogPosts.publishedAt,
      createdAt: blogPosts.createdAt,
      viewCount: count(blogPostViews.id),
    })
    .from(blogPosts)
    .leftJoin(blogPostViews, eq(blogPosts.id, blogPostViews.blogPostId))
    .groupBy(
      blogPosts.id,
      blogPosts.title,
      blogPosts.slug,
      blogPosts.isPublished,
      blogPosts.publishedAt,
      blogPosts.createdAt
    )
    .orderBy(desc(blogPosts.createdAt))
    .limit(20);

  return {
    totalPosts: totalPostsResult[0]?.count || 0,
    publishedPosts: publishedPostsResult[0]?.count || 0,
    totalViews: totalViewsResult[0]?.count || 0,
    mostViewedPosts,
    recentPosts,
  };
}