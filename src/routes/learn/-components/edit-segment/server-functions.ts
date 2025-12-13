import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminMiddleware, authenticatedMiddleware } from "~/lib/auth";
import {
  getSegmentBySlugUseCase,
  updateSegmentUseCase,
  getSegmentByIdUseCase,
} from "~/use-cases/segments";
import { getModuleById } from "~/data-access/modules";
import { getModulesUseCase } from "~/use-cases/modules";
import { isSlugInUse } from "~/data-access/segments";
import { sendSegmentNotificationUseCase } from "~/use-cases/notifications";
import { queueAllJobsForSegmentUseCase } from "~/use-cases/video-processing";
import { startVideoProcessingWorker } from "~/lib/video-processing-worker";

export const updateSegmentFn = createServerFn()
  .middleware([adminMiddleware])
  .validator(
    z.object({
      segmentId: z.number(),
      updates: z.object({
        title: z.string(),
        content: z.string().optional(),
        transcripts: z.string().optional(),
        videoKey: z.string().optional(),
        moduleTitle: z.string(),
        slug: z.string(),
        length: z.string().optional(),
        isPremium: z.boolean(),
        isComingSoon: z.boolean(),
      }),
      notifyUsers: z.boolean().optional().default(false),
    })
  )
  .handler(async ({ data }) => {
    const { segmentId, updates, notifyUsers } = data;

    // Check if slug is already in use by another segment
    if (await isSlugInUse(updates.slug, segmentId)) {
      throw new Error(
        `The slug "${updates.slug}" is already in use. Please choose a different slug.`
      );
    }

    // Check if a new video is being uploaded
    const existingSegment = await getSegmentByIdUseCase(segmentId);
    const isNewVideoUpload =
      updates.videoKey && existingSegment?.videoKey !== updates.videoKey;

    const updatedSegment = await updateSegmentUseCase(segmentId, updates);

    // Queue video processing jobs if a new video was uploaded
    if (isNewVideoUpload && updates.videoKey) {
      // Queue jobs in background to not block segment update
      queueAllJobsForSegmentUseCase(segmentId)
        .then((jobs) => {
          if (jobs.length > 0) {
            // Start worker if not already running
            startVideoProcessingWorker().catch((error) => {
              console.error("Failed to start video processing worker:", error);
            });
          }
        })
        .catch((error) => {
          console.error("Failed to queue video processing jobs:", error);
        });
    }

    // Send notification to all subscribers if requested
    if (notifyUsers) {
      // Run in background to not block segment update
      sendSegmentNotificationUseCase(updatedSegment, "updated").catch(
        (error) => {
          console.error("Failed to send segment update notification:", error);
        }
      );
    }

    return updatedSegment;
  });

export const getSegmentFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const segment = await getSegmentBySlugUseCase(data.slug);
    if (!segment) throw new Error("Segment not found");

    const module = await getModuleById(segment.moduleId);
    if (!module) throw new Error("Module not found");

    return { segment: { ...segment, moduleTitle: module.title } };
  });

export const getUniqueModuleNamesFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .handler(async () => {
    const modules = await getModulesUseCase();
    return modules.map((module) => module.title);
  });
