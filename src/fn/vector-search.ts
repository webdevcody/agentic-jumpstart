import { createServerFn } from "@tanstack/react-start";
import { adminMiddleware } from "~/lib/auth";
import { z } from "zod";
import {
  vectorizeSegmentUseCase,
  vectorizeAllSegmentsUseCase,
  searchTranscriptsUseCase,
  getVectorizationStatusUseCase,
} from "~/use-cases/vector-search";

export const vectorizeSegmentFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ segmentId: z.number() }))
  .handler(async ({ data }) => {
    return vectorizeSegmentUseCase(data.segmentId);
  });

export const vectorizeAllSegmentsFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .handler(async () => {
    return vectorizeAllSegmentsUseCase();
  });

export const searchTranscriptsFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ query: z.string(), limit: z.number().optional() }))
  .handler(async ({ data }) => {
    return searchTranscriptsUseCase(data.query, data.limit);
  });

export const getVectorizationStatusFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    return getVectorizationStatusUseCase();
  });
