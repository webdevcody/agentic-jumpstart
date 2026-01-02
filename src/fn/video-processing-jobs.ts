import { createServerFn } from "@tanstack/react-start";
import { adminMiddleware } from "~/lib/auth";
import { z } from "zod";
import {
  queueTranscriptJobUseCase,
  queueTranscodeJobUseCase,
  queueThumbnailJobUseCase,
  queueAllJobsForSegmentUseCase,
  queueMissingJobsForAllSegmentsUseCase,
  queueSummaryJobUseCase,
  queueMissingSummaryJobsUseCase,
} from "~/use-cases/video-processing";
import {
  getVideoProcessingJobsBySegmentId,
  getVideoProcessingJobsBySegmentIds,
} from "~/data-access/video-processing-jobs";
import { getModulesWithSegmentsUseCase } from "~/use-cases/modules";
import { getStorage } from "~/utils/storage";
import { getVideoQualityKey } from "~/utils/storage/r2";
import { getThumbnailKey } from "~/utils/video-transcoding";
import { startVideoProcessingWorker } from "~/lib/video-processing-worker";

/**
 * Queue a transcript job for a segment
 */
export const queueTranscriptJobFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(
    z.object({
      segmentId: z.number(),
    })
  )
  .handler(async ({ data }) => {
    console.log(`[VideoProcessing] queueTranscriptJobFn called for segment ${data.segmentId}`);
    const job = await queueTranscriptJobUseCase(data.segmentId);
    if (job) {
      console.log(`[VideoProcessing] Transcript job ${job.id} created for segment ${data.segmentId}`);
      // Start worker if not already running
      await startVideoProcessingWorker();
    } else {
      console.log(`[VideoProcessing] Transcript job already exists for segment ${data.segmentId}, skipping`);
    }
    return { success: true, job };
  });

/**
 * Queue a transcode job for a segment
 */
export const queueTranscodeJobFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(
    z.object({
      segmentId: z.number(),
    })
  )
  .handler(async ({ data }) => {
    console.log(`[VideoProcessing] queueTranscodeJobFn called for segment ${data.segmentId}`);
    const job = await queueTranscodeJobUseCase(data.segmentId);
    if (job) {
      console.log(`[VideoProcessing] Transcode job ${job.id} created for segment ${data.segmentId}`);
      // Start worker if not already running
      await startVideoProcessingWorker();
    } else {
      console.log(`[VideoProcessing] Transcode job already exists for segment ${data.segmentId}, skipping`);
    }
    return { success: true, job };
  });

/**
 * Queue a thumbnail job for a segment
 */
export const queueThumbnailJobFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(
    z.object({
      segmentId: z.number(),
    })
  )
  .handler(async ({ data }) => {
    console.log(`[VideoProcessing] queueThumbnailJobFn called for segment ${data.segmentId}`);
    const job = await queueThumbnailJobUseCase(data.segmentId);
    if (job) {
      console.log(`[VideoProcessing] Thumbnail job ${job.id} created for segment ${data.segmentId}`);
      // Start worker if not already running
      await startVideoProcessingWorker();
    } else {
      console.log(`[VideoProcessing] Thumbnail job already exists for segment ${data.segmentId}, skipping`);
    }
    return { success: true, job };
  });

/**
 * Queue transcript, transcode, and thumbnail jobs for a segment
 */
export const queueAllJobsForSegmentFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(
    z.object({
      segmentId: z.number(),
    })
  )
  .handler(async ({ data }) => {
    console.log(`[VideoProcessing] queueAllJobsForSegmentFn called for segment ${data.segmentId}`);
    const jobs = await queueAllJobsForSegmentUseCase(data.segmentId);
    if (jobs.length > 0) {
      console.log(`[VideoProcessing] Created ${jobs.length} jobs for segment ${data.segmentId}: ${jobs.map(j => `${j.jobType}(${j.id})`).join(', ')}`);
      // Start worker if not already running
      await startVideoProcessingWorker();
    } else {
      console.log(`[VideoProcessing] No jobs needed for segment ${data.segmentId}`);
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
    console.log(`[VideoProcessing] queueMissingJobsForAllSegmentsFn called`);
    const jobs = await queueMissingJobsForAllSegmentsUseCase();
    if (jobs.length > 0) {
      const jobsByType = jobs.reduce((acc, j) => {
        acc[j.jobType] = (acc[j.jobType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`[VideoProcessing] Created ${jobs.length} jobs: ${JSON.stringify(jobsByType)}`);
      // Start worker if not already running
      await startVideoProcessingWorker();
    } else {
      console.log(`[VideoProcessing] No missing jobs found for any segment`);
    }
    return { success: true, jobsQueued: jobs.length, jobs };
  });

/**
 * Get jobs for a specific segment
 */
export const getJobsForSegmentFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(
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
        const hasActiveThumbnailJob = jobs.some(
          (job) =>
            job.jobType === "thumbnail" &&
            (job.status === "pending" || job.status === "processing")
        );
        const hasActiveSummaryJob = jobs.some(
          (job) =>
            job.jobType === "summary" &&
            (job.status === "pending" || job.status === "processing")
        );

        let has720p = false;
        let has480p = false;
        let hasThumbnail = false;

        if (segment.videoKey && canTranscode) {
          has720p = await storage.exists(
            getVideoQualityKey(segment.videoKey, "720p")
          );
          has480p = await storage.exists(
            getVideoQualityKey(segment.videoKey, "480p")
          );
          // Only check thumbnail if thumbnailKey exists in database
          // If thumbnailKey was deleted from DB, hasThumbnail should be false
          if (segment.thumbnailKey) {
            hasThumbnail = await storage.exists(segment.thumbnailKey);
          }
        }

        return {
          ...segment,
          moduleTitle: module.title,
          moduleOrder: module.order,
          hasVideo: !!segment.videoKey,
          hasTranscript: !!segment.transcripts,
          hasSummary: !!segment.summary,
          has720p,
          has480p,
          hasThumbnail,
          needsTranscript: !segment.transcripts && !!segment.videoKey,
          needsSummary: !!segment.transcripts && !segment.summary,
          needsTranscode:
            canTranscode && !!segment.videoKey && (!has720p || !has480p),
          needsThumbnail: canTranscode && !!segment.videoKey && !hasThumbnail,
          activeTranscriptJob: hasActiveTranscriptJob,
          activeTranscodeJob: hasActiveTranscodeJob,
          activeThumbnailJob: hasActiveThumbnailJob,
          activeSummaryJob: hasActiveSummaryJob,
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

/**
 * Queue a summary job for a segment
 */
export const queueSummaryJobFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(
    z.object({
      segmentId: z.number(),
    })
  )
  .handler(async ({ data }) => {
    console.log(`[VideoProcessing] queueSummaryJobFn called for segment ${data.segmentId}`);
    const job = await queueSummaryJobUseCase(data.segmentId);
    if (job) {
      console.log(`[VideoProcessing] Summary job ${job.id} created for segment ${data.segmentId}`);
      // Start worker if not already running
      await startVideoProcessingWorker();
    } else {
      console.log(`[VideoProcessing] Summary job already exists for segment ${data.segmentId}, skipping`);
    }
    return { success: true, job };
  });

/**
 * Queue summary jobs for all segments that have transcripts but no summary
 */
export const queueMissingSummaryJobsFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .handler(async () => {
    console.log(`[VideoProcessing] queueMissingSummaryJobsFn called`);
    const jobs = await queueMissingSummaryJobsUseCase();
    if (jobs.length > 0) {
      console.log(`[VideoProcessing] Created ${jobs.length} summary jobs for segments: ${jobs.map(j => j.segmentId).join(', ')}`);
      // Start worker if not already running
      await startVideoProcessingWorker();
    } else {
      console.log(`[VideoProcessing] No missing summary jobs found`);
    }
    return { success: true, jobsQueued: jobs.length, jobs };
  });
