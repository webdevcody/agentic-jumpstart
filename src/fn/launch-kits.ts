import { createServerFn } from "@tanstack/react-start";
import { 
  authenticatedMiddleware, 
  adminMiddleware,
  unauthenticatedMiddleware 
} from "~/lib/auth";
import {
  createLaunchKitUseCase,
  updateLaunchKitUseCase,
  deleteLaunchKitUseCase,
  getAllLaunchKitsUseCase,
  getLaunchKitByIdUseCase,
  getLaunchKitBySlugUseCase,
  cloneLaunchKitUseCase,
  createTagUseCase,
  getAllTagsUseCase,
  getTagsByCategoryUseCase,
  deleteTagUseCase,
  getLaunchKitCommentsUseCase,
  createLaunchKitCommentUseCase,
  updateLaunchKitCommentUseCase,
  deleteLaunchKitCommentUseCase,
  trackLaunchKitViewUseCase,
  getLaunchKitStatsUseCase,
  type CreateLaunchKitInput,
  type UpdateLaunchKitInput,
  type CreateTagInput,
  type CreateCommentInput,
} from "~/use-cases/launch-kits";

// Public functions
export const getAllLaunchKitsFn = createServerFn({
  method: "POST",
})
  .middleware([unauthenticatedMiddleware])
  .validator((data: {
    tags?: string[];
    search?: string;
  }) => data)
  .handler(async ({ data }) => {
    return getAllLaunchKitsUseCase(data);
  });

export const getLaunchKitBySlugFn = createServerFn({
  method: "POST",
})
  .middleware([unauthenticatedMiddleware])
  .validator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    return getLaunchKitBySlugUseCase(data.slug);
  });

export const getLaunchKitByIdFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .validator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    return getLaunchKitByIdUseCase(data.id);
  });

export const trackLaunchKitViewFn = createServerFn({
  method: "POST",
})
  .middleware([unauthenticatedMiddleware])
  .validator((data: { slug: string; userId?: number }) => data)
  .handler(async ({ data }) => {
    return trackLaunchKitViewUseCase(data.slug, data.userId);
  });

export const cloneLaunchKitFn = createServerFn({
  method: "POST",
})
  .middleware([unauthenticatedMiddleware])
  .validator((data: { slug: string; userId?: number }) => data)
  .handler(async ({ data }) => {
    return cloneLaunchKitUseCase(data.slug, data.userId);
  });

// Admin functions
export const createLaunchKitFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .validator((data: CreateLaunchKitInput) => data)
  .handler(async ({ data, context }) => {
    return createLaunchKitUseCase(context.userId, data);
  });

export const updateLaunchKitFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .validator((data: { id: number; updates: UpdateLaunchKitInput }) => data)
  .handler(async ({ data, context }) => {
    return updateLaunchKitUseCase(context.userId, data.id, data.updates);
  });

export const deleteLaunchKitFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .validator((data: { id: number }) => data)
  .handler(async ({ data, context }) => {
    return deleteLaunchKitUseCase(context.userId, data.id);
  });

export const getLaunchKitStatsFn = createServerFn({
  method: "GET",
})
  .middleware([adminMiddleware])
  .handler(async ({ context }) => {
    return getLaunchKitStatsUseCase(context.userId);
  });

// Tag management (Admin)
export const createTagFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .validator((data: CreateTagInput) => data)
  .handler(async ({ data, context }) => {
    return createTagUseCase(context.userId, data);
  });

export const getAllTagsFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .handler(async () => {
    return getAllTagsUseCase();
  });

export const getTagsByCategoryFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .handler(async () => {
    return getTagsByCategoryUseCase();
  });

export const deleteTagFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .validator((data: { id: number }) => data)
  .handler(async ({ data, context }) => {
    return deleteTagUseCase(context.userId, data.id);
  });

// Comments
export const getLaunchKitCommentsFn = createServerFn({
  method: "POST",
})
  .middleware([unauthenticatedMiddleware])
  .validator((data: { launchKitId: number }) => data)
  .handler(async ({ data }) => {
    return getLaunchKitCommentsUseCase(data.launchKitId);
  });

export const createLaunchKitCommentFn = createServerFn({
  method: "POST",
})
  .middleware([authenticatedMiddleware])
  .validator((data: { launchKitId: number } & CreateCommentInput) => data)
  .handler(async ({ data, context }) => {
    return createLaunchKitCommentUseCase(
      context.userId,
      data.launchKitId,
      {
        content: data.content,
        parentId: data.parentId,
      }
    );
  });

export const updateLaunchKitCommentFn = createServerFn({
  method: "POST",
})
  .middleware([authenticatedMiddleware])
  .validator((data: { commentId: number; content: string }) => data)
  .handler(async ({ data, context }) => {
    return updateLaunchKitCommentUseCase(
      context.userId,
      data.commentId,
      data.content
    );
  });

export const deleteLaunchKitCommentFn = createServerFn({
  method: "POST",
})
  .middleware([authenticatedMiddleware])
  .validator((data: { commentId: number }) => data)
  .handler(async ({ data, context }) => {
    return deleteLaunchKitCommentUseCase(context.userId, data.commentId);
  });