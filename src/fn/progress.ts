import { createServerFn } from "@tanstack/react-start";
import { authenticatedMiddleware, unauthenticatedMiddleware } from "~/lib/auth";
import { z } from "zod";
import {
  getAllProgressForUserUseCase,
  markAsWatchedUseCase,
  unmarkAsWatchedUseCase,
} from "~/use-cases/progress";

export const markedAsWatchedFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .inputValidator(z.object({ segmentId: z.coerce.number() }))
  .handler(async ({ data, context }) => {
    await markAsWatchedUseCase(context.userId, data.segmentId);
  });

export const markAsCompletedFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .inputValidator(z.object({ segmentId: z.coerce.number() }))
  .handler(async ({ data, context }) => {
    await markAsWatchedUseCase(context.userId, data.segmentId);
  });

export const getProgressFn = createServerFn()
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ context }) => {
    return context.userId ? getAllProgressForUserUseCase(context.userId) : [];
  });

export const unmarkAsCompletedFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .inputValidator(z.object({ segmentId: z.coerce.number() }))
  .handler(async ({ data, context }) => {
    await unmarkAsWatchedUseCase(context.userId, data.segmentId);
  });
