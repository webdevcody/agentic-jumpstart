import { createServerFn } from "@tanstack/react-start";
import { adminMiddleware } from "~/lib/auth";
import { z } from "zod";
import { getStorage } from "~/utils/storage";

export const getPresignedUploadUrlFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(
    z.object({
      videoKey: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const { storage } = getStorage();
    const presignedUrl = await storage.getPresignedUploadUrl(data.videoKey);

    return { presignedUrl, videoKey: data.videoKey };
  });

export const getPresignedImageUploadUrlFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(
    z.object({
      imageKey: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const { storage } = getStorage();
    const presignedUrl = await storage.getPresignedUploadUrl(data.imageKey);

    return { presignedUrl, imageKey: data.imageKey };
  });

export const getImageUrlFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      imageKey: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const { storage } = getStorage();
    const imageUrl = await storage.getPresignedUrl(data.imageKey);

    return { imageUrl };
  });
