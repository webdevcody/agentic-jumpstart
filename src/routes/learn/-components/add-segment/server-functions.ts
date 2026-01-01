import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminMiddleware, authenticatedMiddleware } from "~/lib/auth";
import { addSegmentUseCase } from "~/use-cases/segments";
import { getSegments, isSlugInUse } from "~/data-access/segments";
import { getModulesUseCase } from "~/use-cases/modules";
import { sendNewSegmentNotificationUseCase } from "~/use-cases/notifications";
import { queueAllJobsForSegmentUseCase } from "~/use-cases/video-processing";
import { startVideoProcessingWorker } from "~/lib/video-processing-worker";

export const createSegmentFn = createServerFn()
  .middleware([adminMiddleware])
  .inputValidator(
    z.object({
      title: z.string(),
      content: z.string().optional(),
      transcripts: z.string().optional(),
      videoKey: z.string().optional(),
      slug: z.string(),
      moduleTitle: z.string(),
      length: z.string().optional(),
      icon: z.string().nullable().optional(),
      isPremium: z.boolean(),
      isComingSoon: z.boolean(),
      notifyUsers: z.boolean().optional().default(false),
    })
  )
  .handler(async ({ data }) => {
    // Check if slug is already in use
    if (await isSlugInUse(data.slug)) {
      throw new Error(
        `The slug "${data.slug}" is already in use. Please choose a different slug.`
      );
    }

    // Get all segments to determine the next order number
    const segments = await getSegments();
    const maxOrder = segments.reduce(
      (max, segment) => Math.max(max, segment.order),
      -1
    );
    const nextOrder = maxOrder + 1;

    const segment = await addSegmentUseCase({
      title: data.title,
      content: data.content,
      transcripts: data.transcripts,
      slug: data.slug,
      order: nextOrder,
      moduleTitle: data.moduleTitle,
      videoKey: data.videoKey,
      length: data.length,
      icon: data.icon,
      isPremium: data.isPremium,
      isComingSoon: data.isComingSoon,
    });

    // Queue video processing jobs if a video was uploaded
    if (data.videoKey) {
      // Queue jobs in background to not block segment creation
      queueAllJobsForSegmentUseCase(segment.id)
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

    // Send notification to premium users if requested
    if (data.notifyUsers) {
      // Run in background to not block segment creation
      sendNewSegmentNotificationUseCase(segment).catch((error) => {
        console.error("Failed to send new segment notification:", error);
      });
    }

    return segment;
  });

export const getUniqueModuleNamesFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .handler(async () => {
    const modules = await getModulesUseCase();
    return modules.map((module) => module.title);
  });

export const validateSlugFn = createServerFn()
  .middleware([adminMiddleware])
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    if (await isSlugInUse(data.slug)) {
      throw new Error(
        `The slug "${data.slug}" is already in use. Please choose a different slug.`
      );
    }
    return { valid: true };
  });
