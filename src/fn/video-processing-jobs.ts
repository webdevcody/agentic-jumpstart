import { createServerFn } from "@tanstack/react-start";
import { adminMiddleware } from "~/lib/auth";
import { z } from "zod";
import {
  queueTranscriptJobUseCase,
  queueTranscodeJobUseCase,
  queueAllJobsForSegmentUseCase,
  queueMissingJobsForAllSegmentsUseCase,
} from "~/use-cases/video-processing";
import {
  getVideoProcessingJobsBySegmentId,
  getVideoProcessingJobsBySegmentIds,
} from "~/data-access/video-processing-jobs";
import { getModulesWithSegmentsUseCase } from "~/use-cases/modules";
import { getStorage } from "~/utils/storage";
import { getVideoQualityKey } from "~/utils/storage/r2";
import { startVideoProcessingWorker } from "~/lib/video-processing-worker";

/**
 * Queue a transcript job for a segment
 */
export const queueTranscriptJobFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(
    z.object({
      segmentId: z.number(),
    })
  )
  .handler(async ({ data }) => {
    const job = await queueTranscriptJobUseCase(data.segmentId);
    if (job) {
      // Start worker if not already running
      await startVideoProcessingWorker();
    }
    return { success: true, job };
  });

/**
 * Queue a transcode job for a segment
 */
export const queueTranscodeJobFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(
    z.object({
      segmentId: z.number(),
    })
  )
  .handler(async ({ data }) => {
    const job = await queueTranscodeJobUseCase(data.segmentId);
    if (job) {
      // Start worker if not already running
      await startVideoProcessingWorker();
    }
    return { success: true, job };
  });

/**
 * Queue both transcript and transcode jobs for a segment
 */
export const queueAllJobsForSegmentFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(
    z.object({
      segmentId: z.number(),
    })
  )
  .handler(async ({ data }) => {
    const jobs = await queueAllJobsForSegmentUseCase(data.segmentId);
    if (jobs.length > 0) {
      // Start worker if not already running
      await startVideoProcessingWorker();
    }
    return { success: true, jobs };
  });

/**
 * Queue jobs for all segments that need processing
 */
export const queueMissingJobsForAllSegmentsFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .handler(async () => {
    const jobs = await queueMissingJobsForAllSegmentsUseCase();
    if (jobs.length > 0) {
      // Start worker if not already running
      await startVideoProcessingWorker();
    }
    return { success: true, jobsQueued: jobs.length, jobs };
  });

/**
 * Get jobs for a specific segment
 */
export const getJobsForSegmentFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .validator(
    z.object({
      segmentId: z.number(),
    })
  )
  .handler(async ({ data }) => {
    const jobs = await getVideoProcessingJobsBySegmentId(data.segmentId);
    return { success: true, jobs };
  });

/**
 * Get all segments with their processing status
 */
export const getSegmentsWithProcessingStatusFn = createServerFn({
  method: "GET",
})
  .middleware([adminMiddleware])
  .handler(async () => {
    const modules = await getModulesWithSegmentsUseCase();
    const { storage, type } = getStorage();
    const canTranscode = type === "r2";

    // Debug: Log to verify segments are loaded
    const totalSegments = modules.reduce(
      (sum, m) => sum + m.segments.length,
      0
    );
    const segmentsWithVideo = modules
      .flatMap((m) => m.segments)
      .filter((s) => s.videoKey).length;
    console.log(
      `[Video Processing] Loaded ${totalSegments} segments, ${segmentsWithVideo} with videos`
    );

    // Get all segment IDs
    const segmentIds = modules.flatMap((module) =>
      module.segments.map((segment) => segment.id)
    );

    // Get all jobs for these segments
    const allJobs = await getVideoProcessingJobsBySegmentIds(segmentIds);
    const jobsBySegmentId = new Map<number, typeof allJobs>();
    allJobs.forEach((job) => {
      if (!jobsBySegmentId.has(job.segmentId)) {
        jobsBySegmentId.set(job.segmentId, []);
      }
      jobsBySegmentId.get(job.segmentId)!.push(job);
    });

    // Process each segment to determine status
    // Flatten all segments first, then process them all
    const allSegments = modules.flatMap((module) =>
      module.segments.map((segment) => ({ segment, module }))
    );

    const segmentsWithStatus = await Promise.all(
      allSegments.map(async ({ segment, module }) => {
        const jobs = jobsBySegmentId.get(segment.id) || [];
        const hasActiveTranscriptJob = jobs.some(
          (job) =>
            job.jobType === "transcript" &&
            (job.status === "pending" || job.status === "processing")
        );
        const hasActiveTranscodeJob = jobs.some(
          (job) =>
            job.jobType === "transcode" &&
            (job.status === "pending" || job.status === "processing")
        );

        let has720p = false;
        let has480p = false;

        if (segment.videoKey && canTranscode) {
          has720p = await storage.exists(
            getVideoQualityKey(segment.videoKey, "720p")
          );
          has480p = await storage.exists(
            getVideoQualityKey(segment.videoKey, "480p")
          );
        }

        return {
          ...segment,
          moduleTitle: module.title,
          moduleOrder: module.order,
          hasVideo: !!segment.videoKey,
          hasTranscript: !!segment.transcripts,
          has720p,
          has480p,
          needsTranscript: !segment.transcripts && !!segment.videoKey,
          needsTranscode:
            canTranscode && !!segment.videoKey && (!has720p || !has480p),
          activeTranscriptJob: hasActiveTranscriptJob,
          activeTranscodeJob: hasActiveTranscodeJob,
          jobs,
        };
      })
    );

    return {
      success: true,
      segments: segmentsWithStatus,
      modules: modules.map((module) => ({
        id: module.id,
        title: module.title,
        order: module.order,
      })),
    };
  });
