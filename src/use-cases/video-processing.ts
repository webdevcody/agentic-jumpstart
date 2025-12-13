import {
  createVideoProcessingJob,
  createVideoProcessingJobs,
  getVideoProcessingJobsBySegmentId,
  hasPendingOrProcessingJobs,
  getVideoProcessingJobsBySegmentIds,
} from "~/data-access/video-processing-jobs";
import { getSegments, getSegmentById } from "~/data-access/segments";
import { getStorage } from "~/utils/storage";
import { getVideoQualityKey } from "~/utils/storage/r2";
import type { VideoProcessingJobCreate } from "~/db/schema";

export type JobType = "transcript" | "transcode";

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
 * Queue both transcript and transcode jobs for a segment
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
  const { storage } = getStorage();
  const videoExists = await storage.exists(segment.videoKey);
  if (!videoExists) {
    throw new Error(
      `Video file not found in storage: ${segment.videoKey}. The video may have been deleted or the key is incorrect.`
    );
  }

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

  if (!hasActiveTranscriptJob) {
    jobs.push({
      segmentId,
      jobType: "transcript",
      status: "pending",
    });
  }

  if (!hasActiveTranscodeJob) {
    jobs.push({
      segmentId,
      jobType: "transcode",
      status: "pending",
    });
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

  // Only support R2 storage for transcoding
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
  }

  if (jobsToCreate.length === 0) {
    return [];
  }

  return createVideoProcessingJobs(jobsToCreate);
}
