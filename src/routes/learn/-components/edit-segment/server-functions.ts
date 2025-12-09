import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminMiddleware, authenticatedMiddleware } from "~/lib/auth";
import {
  getSegmentBySlugUseCase,
  updateSegmentUseCase,
} from "~/use-cases/segments";
import { getModuleById } from "~/data-access/modules";
import { getModulesUseCase } from "~/use-cases/modules";
import { isSlugInUse } from "~/data-access/segments";
import { sendSegmentNotificationUseCase } from "~/use-cases/notifications";

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

    const updatedSegment = await updateSegmentUseCase(segmentId, updates);

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
    return modules.map(module => module.title);
  });
