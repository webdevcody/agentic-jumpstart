import {
  createBlogPost,
  deleteBlogPost,
  getBlogPostById,
  getBlogPostBySlug,
  getBlogPosts,
  getPublishedBlogPosts,
  updateBlogPost,
  trackBlogPostView,
  getBlogAnalytics,
  type BlogPostFilters,
} from "~/data-access/blog";
import { PublicError } from "./errors";
import { UserId } from "./types";

export type CreateBlogPostInput = {
  title: string;
  content: string;
  excerpt?: string;
  isPublished?: boolean;
  featuredImage?: string;
  tags?: string[];
};

export type UpdateBlogPostInput = Partial<CreateBlogPostInput> & {
  tags?: string[] | string;
  publishedAt?: Date;
};

export { type BlogPostFilters };

export async function getPublishedBlogPostsUseCase() {
  return getPublishedBlogPosts();
}

export async function getBlogPostBySlugUseCase(slug: string) {
  const blogPost = await getBlogPostBySlug(slug);
  if (!blogPost) {
    throw new PublicError("Blog post not found");
  }
  
  // If it's not published, only allow admins to view it
  if (!blogPost.isPublished) {
    throw new PublicError("Blog post not found");
  }
  
  return blogPost;
}

export async function getBlogPostsUseCase(filters: BlogPostFilters = {}) {
  return getBlogPosts(filters);
}

export async function getBlogPostByIdUseCase(id: number) {
  const blogPost = await getBlogPostById(id);
  if (!blogPost) {
    throw new PublicError("Blog post not found");
  }
  return blogPost;
}

export async function createBlogPostUseCase(
  userId: UserId,
  data: CreateBlogPostInput
) {
  // Validate title
  if (!data.title || data.title.length < 5) {
    throw new PublicError("Blog post title must be at least 5 characters");
  }

  // Validate content
  if (!data.content || data.content.length < 50) {
    throw new PublicError("Blog post content must be at least 50 characters");
  }

  // Parse tags if provided
  const tagsString = data.tags && Array.isArray(data.tags) && data.tags.length > 0 
    ? JSON.stringify(data.tags) 
    : null;

  const blogPostData = {
    ...data,
    authorId: userId,
    tags: tagsString,
    isPublished: data.isPublished ?? false,
  };

  return createBlogPost(blogPostData);
}

export async function updateBlogPostUseCase(
  userId: UserId,
  blogPostId: number,
  data: UpdateBlogPostInput
) {
  // Check if blog post exists
  const blogPost = await getBlogPostById(blogPostId);
  if (!blogPost) {
    throw new PublicError("Blog post not found");
  }

  // Check ownership (only the author can edit)
  if (blogPost.authorId !== userId) {
    throw new PublicError("You can only edit your own blog posts");
  }

  // Validate title if provided
  if (data.title !== undefined && data.title.length < 5) {
    throw new PublicError("Blog post title must be at least 5 characters");
  }

  // Validate content if provided
  if (data.content !== undefined && data.content.length < 50) {
    throw new PublicError("Blog post content must be at least 50 characters");
  }

  // Parse tags if provided
  const updateData = { ...data };
  if (data.tags !== undefined) {
    // Handle both array and string inputs for tags
    if (Array.isArray(data.tags)) {
      updateData.tags = data.tags.length > 0 ? JSON.stringify(data.tags) : null;
    } else if (typeof data.tags === 'string') {
      // If it's already a string, use it as is (could be JSON or empty)
      updateData.tags = data.tags || null;
    }
  }

  // If publishing for the first time, set publishedAt
  if (data.isPublished && !blogPost.isPublished) {
    updateData.publishedAt = new Date();
  }

  return updateBlogPost(blogPostId, updateData);
}

export async function deleteBlogPostUseCase(userId: UserId, blogPostId: number) {
  // Check if blog post exists
  const blogPost = await getBlogPostById(blogPostId);
  if (!blogPost) {
    throw new PublicError("Blog post not found");
  }

  // Check ownership (only the author can delete)
  if (blogPost.authorId !== userId) {
    throw new PublicError("You can only delete your own blog posts");
  }

  return deleteBlogPost(blogPostId);
}

export async function trackBlogPostViewUseCase(data: {
  blogPostId: number;
  sessionId: string;
  ipAddressHash?: string;
  userAgent?: string;
  referrer?: string;
}) {
  return trackBlogPostView(data);
}

export async function getBlogAnalyticsUseCase() {
  return getBlogAnalytics();
}