import { database } from "~/db";
import { videoProcessingJobs } from "~/db/schema";
import { and, eq, inArray, or } from "drizzle-orm";
import type { VideoProcessingJob, VideoProcessingJobCreate } from "~/db/schema";

export async function createVideoProcessingJob(job: VideoProcessingJobCreate) {
  const result = await database
    .insert(videoProcessingJobs)
    .values(job)
    .returning();
  return result[0];
}

export async function createVideoProcessingJobs(
  jobs: VideoProcessingJobCreate[]
) {
  if (jobs.length === 0) return [];
  const result = await database
    .insert(videoProcessingJobs)
    .values(jobs)
    .returning();
  return result;
}

export async function getVideoProcessingJobById(id: number) {
  const result = await database
    .select()
    .from(videoProcessingJobs)
    .where(eq(videoProcessingJobs.id, id))
    .limit(1);
  return result[0];
}

export async function getVideoProcessingJobsBySegmentId(segmentId: number) {
  return database
    .select()
    .from(videoProcessingJobs)
    .where(eq(videoProcessingJobs.segmentId, segmentId));
}

export async function getPendingVideoProcessingJobs() {
  return database
    .select()
    .from(videoProcessingJobs)
    .where(eq(videoProcessingJobs.status, "pending"))
    .orderBy(videoProcessingJobs.createdAt);
}

export async function getProcessingVideoProcessingJobs() {
  return database
    .select()
    .from(videoProcessingJobs)
    .where(eq(videoProcessingJobs.status, "processing"));
}

export async function updateVideoProcessingJob(
  id: number,
  updates: Partial<VideoProcessingJobCreate>
) {
  const result = await database
    .update(videoProcessingJobs)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(videoProcessingJobs.id, id))
    .returning();
  return result[0];
}

export async function markJobAsProcessing(id: number) {
  return updateVideoProcessingJob(id, { status: "processing" });
}

export async function markJobAsCompleted(id: number) {
  return updateVideoProcessingJob(id, {
    status: "completed",
    completedAt: new Date(),
  });
}

export async function markJobAsFailed(id: number, error: string) {
  return updateVideoProcessingJob(id, {
    status: "failed",
    error,
    completedAt: new Date(),
  });
}

export async function getVideoProcessingJobsByStatus(
  status: VideoProcessingJob["status"]
) {
  return database
    .select()
    .from(videoProcessingJobs)
    .where(eq(videoProcessingJobs.status, status))
    .orderBy(videoProcessingJobs.createdAt);
}

export async function getAllVideoProcessingJobs() {
  return database
    .select()
    .from(videoProcessingJobs)
    .orderBy(videoProcessingJobs.createdAt);
}

export async function deleteVideoProcessingJob(id: number) {
  const result = await database
    .delete(videoProcessingJobs)
    .where(eq(videoProcessingJobs.id, id))
    .returning();
  return result[0];
}

export async function getVideoProcessingJobsBySegmentIds(segmentIds: number[]) {
  if (segmentIds.length === 0) return [];
  return database
    .select()
    .from(videoProcessingJobs)
    .where(inArray(videoProcessingJobs.segmentId, segmentIds));
}

export async function hasPendingOrProcessingJobs(segmentId: number) {
  const result = await database
    .select()
    .from(videoProcessingJobs)
    .where(
      and(
        eq(videoProcessingJobs.segmentId, segmentId),
        or(
          eq(videoProcessingJobs.status, "pending"),
          eq(videoProcessingJobs.status, "processing")
        )
      )
    )
    .limit(1);
  return result.length > 0;
}

export async function cancelPendingOrProcessingJobsByType(
  segmentId: number,
  jobType: string
) {
  const result = await database
    .delete(videoProcessingJobs)
    .where(
      and(
        eq(videoProcessingJobs.segmentId, segmentId),
        eq(videoProcessingJobs.jobType, jobType),
        or(
          eq(videoProcessingJobs.status, "pending"),
          eq(videoProcessingJobs.status, "processing")
        )
      )
    )
    .returning();
  return result;
}
