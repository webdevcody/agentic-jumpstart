import {
  createVideoProcessingJob,
  createVideoProcessingJobs,
  getVideoProcessingJobsBySegmentId,
  getVideoProcessingJobsBySegmentIds,
  cancelPendingOrProcessingJobsByType,
} from "~/data-access/video-processing-jobs";
import { getSegments, getSegmentById } from "~/data-access/segments";
import { getStorage } from "~/utils/storage";
import { getVideoQualityKey } from "~/utils/storage/r2";
import type { VideoProcessingJobCreate } from "~/db/schema";

export type JobType = "transcript" | "transcode" | "thumbnail" | "vectorize";

/**
 * Queue a transcript job for a segment
 */
export async function queueTranscriptJobUseCase(segmentId: number) {
  // Check if there's already a pending or processing transcript job
  const existingJobs = await getVideoProcessingJobsBySegmentId(segmentId);
  const hasActiveTranscriptJob = existingJobs.some(
    (job) =>
      job.jobType === "transcript" &&
      (job.status === "pending" || job.status === "processing")
  );

  if (hasActiveTranscriptJob) {
    return null; // Job already queued
  }

  return createVideoProcessingJob({
    segmentId,
    jobType: "transcript",
    status: "pending",
  });
}

/**
 * Queue a transcode job for a segment
 */
export async function queueTranscodeJobUseCase(segmentId: number) {
  // Check if there's already a pending or processing transcode job
  const existingJobs = await getVideoProcessingJobsBySegmentId(segmentId);
  const hasActiveTranscodeJob = existingJobs.some(
    (job) =>
      job.jobType === "transcode" &&
      (job.status === "pending" || job.status === "processing")
  );

  if (hasActiveTranscodeJob) {
    return null; // Job already queued
  }

  return createVideoProcessingJob({
    segmentId,
    jobType: "transcode",
    status: "pending",
  });
}

/**
 * Queue a thumbnail job for a segment
 */
export async function queueThumbnailJobUseCase(segmentId: number) {
  // Check if there's already a pending or processing thumbnail job
  const existingJobs = await getVideoProcessingJobsBySegmentId(segmentId);
  const hasActiveThumbnailJob = existingJobs.some(
    (job) =>
      job.jobType === "thumbnail" &&
      (job.status === "pending" || job.status === "processing")
  );

  if (hasActiveThumbnailJob) {
    return null; // Job already queued
  }

  return createVideoProcessingJob({
    segmentId,
    jobType: "thumbnail",
    status: "pending",
  });
}

/**
 * Queue transcript, transcode, and thumbnail jobs for a segment
 */
export async function queueAllJobsForSegmentUseCase(segmentId: number) {
  const jobs: VideoProcessingJobCreate[] = [];

  // Get the segment to verify it has a video
  const segment = await getSegmentById(segmentId);
  if (!segment) {
    throw new Error("Segment not found");
  }

  if (!segment.videoKey) {
    throw new Error("Segment does not have a video attached");
  }

  // Verify the video actually exists in storage
  const { storage, type } = getStorage();
  const videoExists = await storage.exists(segment.videoKey);
  if (!videoExists) {
    throw new Error(
      `Video file not found in storage: ${segment.videoKey}. The video may have been deleted or the key is incorrect.`
    );
  }

  // Only support R2 storage for transcoding and thumbnails
  const canTranscode = type === "r2";

  // Check existing jobs
  const existingJobs = await getVideoProcessingJobsBySegmentId(segmentId);
  const hasActiveTranscriptJob = existingJobs.some(
    (job) =>
      job.jobType === "transcript" &&
      (job.status === "pending" || job.status === "processing")
  );
  const hasActiveTranscodeJob = existingJobs.some(
    (job) =>
      job.jobType === "transcode" &&
      (job.status === "pending" || job.status === "processing")
  );
  const hasActiveThumbnailJob = existingJobs.some(
    (job) =>
      job.jobType === "thumbnail" &&
      (job.status === "pending" || job.status === "processing")
  );

  // Queue transcript job if missing and no active job
  if (!segment.transcripts && !hasActiveTranscriptJob) {
    jobs.push({
      segmentId,
      jobType: "transcript",
      status: "pending",
    });
  }

  // Queue transcode job if missing (only for R2 storage)
  if (canTranscode && !hasActiveTranscodeJob) {
    // Check if 720p or 480p variants exist
    const has720p = await storage.exists(
      getVideoQualityKey(segment.videoKey, "720p")
    );
    const has480p = await storage.exists(
      getVideoQualityKey(segment.videoKey, "480p")
    );

    if (!has720p || !has480p) {
      jobs.push({
        segmentId,
        jobType: "transcode",
        status: "pending",
      });
    }
  }

  // Queue thumbnail job if missing (only for R2 storage)
  if (canTranscode && !hasActiveThumbnailJob) {
    // Only check thumbnail if thumbnailKey exists in database
    // If thumbnailKey was deleted from DB, we need to queue a job to regenerate it
    let hasThumbnail = false;
    if (segment.thumbnailKey) {
      hasThumbnail = await storage.exists(segment.thumbnailKey);
    }

    if (!hasThumbnail) {
      jobs.push({
        segmentId,
        jobType: "thumbnail",
        status: "pending",
      });
    }
  }

  if (jobs.length === 0) {
    return [];
  }

  return createVideoProcessingJobs(jobs);
}

/**
 * Queue jobs for all segments that need processing
 */
export async function queueMissingJobsForAllSegmentsUseCase() {
  const segments = await getSegments();
  const { storage, type } = getStorage();

  // Only support R2 storage for transcoding and thumbnails
  const canTranscode = type === "r2";

  const jobsToCreate: VideoProcessingJobCreate[] = [];
  const segmentIds = segments.map((s) => s.id);

  // Get all existing jobs for these segments
  const existingJobs = await getVideoProcessingJobsBySegmentIds(segmentIds);
  const existingJobsBySegment = new Map<number, typeof existingJobs>();
  existingJobs.forEach((job) => {
    if (!existingJobsBySegment.has(job.segmentId)) {
      existingJobsBySegment.set(job.segmentId, []);
    }
    existingJobsBySegment.get(job.segmentId)!.push(job);
  });

  for (const segment of segments) {
    if (!segment.videoKey) {
      continue; // Skip segments without videos
    }

    // Verify the video actually exists in storage before queueing jobs
    const videoExists = await storage.exists(segment.videoKey);
    if (!videoExists) {
      console.warn(
        `Skipping segment ${segment.id} (${segment.title}): video file not found in storage: ${segment.videoKey}`
      );
      continue; // Skip segments where video doesn't exist in storage
    }

    const segmentJobs = existingJobsBySegment.get(segment.id) || [];
    const hasActiveTranscriptJob = segmentJobs.some(
      (job) =>
        job.jobType === "transcript" &&
        (job.status === "pending" || job.status === "processing")
    );
    const hasActiveTranscodeJob = segmentJobs.some(
      (job) =>
        job.jobType === "transcode" &&
        (job.status === "pending" || job.status === "processing")
    );
    const hasActiveThumbnailJob = segmentJobs.some(
      (job) =>
        job.jobType === "thumbnail" &&
        (job.status === "pending" || job.status === "processing")
    );

    // Queue transcript job if missing
    if (!segment.transcripts && !hasActiveTranscriptJob) {
      jobsToCreate.push({
        segmentId: segment.id,
        jobType: "transcript",
        status: "pending",
      });
    }

    // Queue transcode job if missing (only for R2 storage)
    if (canTranscode && !hasActiveTranscodeJob) {
      // Check if 720p or 480p variants exist
      const has720p = await storage.exists(
        getVideoQualityKey(segment.videoKey, "720p")
      );
      const has480p = await storage.exists(
        getVideoQualityKey(segment.videoKey, "480p")
      );

      if (!has720p || !has480p) {
        jobsToCreate.push({
          segmentId: segment.id,
          jobType: "transcode",
          status: "pending",
        });
      }
    }

    // Queue thumbnail job if missing (only for R2 storage)
    if (canTranscode && !hasActiveThumbnailJob) {
      // Only check thumbnail if thumbnailKey exists in database
      // If thumbnailKey was deleted from DB, we need to queue a job to regenerate it
      let hasThumbnail = false;
      if (segment.thumbnailKey) {
        hasThumbnail = await storage.exists(segment.thumbnailKey);
      }

      if (!hasThumbnail) {
        jobsToCreate.push({
          segmentId: segment.id,
          jobType: "thumbnail",
          status: "pending",
        });
      }
    }
  }

  if (jobsToCreate.length === 0) {
    return [];
  }

  return createVideoProcessingJobs(jobsToCreate);
}

/**
 * Queue a vectorization job for a segment
 */
export async function queueVectorizeJobUseCase(segmentId: number) {
  // Check if there's already a pending or processing vectorize job
  const existingJobs = await getVideoProcessingJobsBySegmentId(segmentId);
  const hasActiveVectorizeJob = existingJobs.some(
    (job) =>
      job.jobType === "vectorize" &&
      (job.status === "pending" || job.status === "processing")
  );

  if (hasActiveVectorizeJob) {
    return null; // Job already queued
  }

  return createVideoProcessingJob({
    segmentId,
    jobType: "vectorize",
    status: "pending",
  });
}

/**
 * Queue vectorization jobs for all segments that need it
 */
export async function queueVectorizeAllSegmentsUseCase() {
  const segments = await getSegments();

  const jobsToCreate: VideoProcessingJobCreate[] = [];
  const segmentIds = segments.map((s) => s.id);

  // Get all existing jobs for these segments
  const existingJobs = await getVideoProcessingJobsBySegmentIds(segmentIds);
  const existingJobsBySegment = new Map<number, typeof existingJobs>();
  existingJobs.forEach((job) => {
    if (!existingJobsBySegment.has(job.segmentId)) {
      existingJobsBySegment.set(job.segmentId, []);
    }
    existingJobsBySegment.get(job.segmentId)!.push(job);
  });

  for (const segment of segments) {
    // Only vectorize segments that have transcripts
    if (!segment.transcripts) {
      continue;
    }

    const segmentJobs = existingJobsBySegment.get(segment.id) || [];
    const hasActiveVectorizeJob = segmentJobs.some(
      (job) =>
        job.jobType === "vectorize" &&
        (job.status === "pending" || job.status === "processing")
    );

    if (!hasActiveVectorizeJob) {
      jobsToCreate.push({
        segmentId: segment.id,
        jobType: "vectorize",
        status: "pending",
      });
    }
  }

  if (jobsToCreate.length === 0) {
    return [];
  }

  return createVideoProcessingJobs(jobsToCreate);
}

/**
 * Cancel a pending or processing vectorization job for a segment
 */
export async function cancelVectorizeJobUseCase(segmentId: number) {
  const cancelledJobs = await cancelPendingOrProcessingJobsByType(
    segmentId,
    "vectorize"
  );
  return { cancelledCount: cancelledJobs.length, jobs: cancelledJobs };
}
