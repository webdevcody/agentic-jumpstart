import { createServerFn } from "@tanstack/react-start";
import { adminMiddleware, unauthenticatedMiddleware } from "~/lib/auth";
import {
  createBlogPostUseCase,
  deleteBlogPostUseCase,
  getBlogPostBySlugUseCase,
  getBlogPostsUseCase,
  getBlogPostByIdUseCase,
  getPublishedBlogPostsUseCase,
  updateBlogPostUseCase,
  trackBlogPostViewUseCase,
  getBlogAnalyticsUseCase,
  type CreateBlogPostInput,
  type UpdateBlogPostInput,
  type BlogPostFilters,
} from "~/use-cases/blog";

export const getPublishedBlogPostsFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .handler(async () => {
    return getPublishedBlogPostsUseCase();
  });

export const getBlogPostBySlugFn = createServerFn({
  method: "POST",
})
  .middleware([unauthenticatedMiddleware])
  .validator((data: { slug: string }) => data)
  .handler(async ({ data }: { data: { slug: string } }) => {
    return getBlogPostBySlugUseCase(data.slug);
  });

export const getBlogPostsFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .validator((data: BlogPostFilters) => data)
  .handler(async ({ data }: { data: BlogPostFilters }) => {
    return getBlogPostsUseCase(data);
  });

export const getBlogPostByIdFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .validator((data: { id: number }) => data)
  .handler(async ({ data }: { data: { id: number } }) => {
    return getBlogPostByIdUseCase(data.id);
  });

export const createBlogPostFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .validator((data: CreateBlogPostInput) => data)
  .handler(async ({ data, context }) => {
    return createBlogPostUseCase(context.userId, data);
  });

export const updateBlogPostFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .validator((data: { id: number; updates: UpdateBlogPostInput }) => data)
  .handler(
    async ({
      data,
      context,
    }: {
      data: { id: number; updates: UpdateBlogPostInput };
      context: { userId: number };
    }) => {
      return updateBlogPostUseCase(context.userId, data.id, data.updates);
    }
  );

export const deleteBlogPostFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .validator((data: { id: number }) => data)
  .handler(async ({ data, context }) => {
    return deleteBlogPostUseCase(context.userId, data.id);
  });

export const trackBlogPostViewFn = createServerFn({
  method: "POST",
})
  .middleware([unauthenticatedMiddleware])
  .validator((data: { blogPostId: number; sessionId: string; ipAddressHash?: string; userAgent?: string; referrer?: string }) => data)
  .handler(async ({ data }: { data: { blogPostId: number; sessionId: string; ipAddressHash?: string; userAgent?: string; referrer?: string } }) => {
    return trackBlogPostViewUseCase(data);
  });

export const getBlogAnalyticsFn = createServerFn({
  method: "GET",
})
  .middleware([adminMiddleware])
  .handler(async () => {
    return getBlogAnalyticsUseCase();
  });