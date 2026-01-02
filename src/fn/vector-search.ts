import { createServerFn } from "@tanstack/react-start";
import { adminMiddleware } from "~/lib/auth";
import { z } from "zod";
import {
  searchTranscriptsUseCase,
  getVectorizationStatusUseCase,
} from "~/use-cases/vector-search";
import {
  queueVectorizeJobUseCase,
  queueVectorizeAllSegmentsUseCase,
  cancelVectorizeJobUseCase,
} from "~/use-cases/video-processing";
import { startVideoProcessingWorker } from "~/lib/video-processing-worker";

/**
 * Queue a vectorization job for a segment (non-blocking)
 */
export const queueVectorizeSegmentFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ segmentId: z.number() }))
  .handler(async ({ data }) => {
    const job = await queueVectorizeJobUseCase(data.segmentId);
    if (job) {
      // Start worker if not already running
      await startVideoProcessingWorker();
    }
    return { success: true, job };
  });

/**
 * Queue vectorization jobs for all segments that need it (non-blocking)
 */
export const queueVectorizeAllSegmentsFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .handler(async () => {
    const jobs = await queueVectorizeAllSegmentsUseCase();
    if (jobs.length > 0) {
      // Start worker if not already running
      await startVideoProcessingWorker();
    }
    return { success: true, jobsQueued: jobs.length, jobs };
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

/**
 * Cancel a pending or processing vectorization job for a segment
 */
export const cancelVectorizeSegmentFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ segmentId: z.number() }))
  .handler(async ({ data }) => {
    const result = await cancelVectorizeJobUseCase(data.segmentId);
    return { success: true, ...result };
  });
