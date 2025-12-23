import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminMiddleware, unauthenticatedMiddleware } from "~/lib/auth";
import { AuthenticationError } from "~/use-cases/errors";
import { getSegmentByIdUseCase } from "~/use-cases/segments";
import { getAuthenticatedUser } from "~/utils/auth";
import { getStorage } from "~/utils/storage";
import { getVideoQualityKey } from "~/utils/storage/r2";
import {
  transcodeVideo,
  writeBufferToTempFile,
  cleanupTempFiles,
  getThumbnailKey,
  type VideoQuality,
} from "~/utils/video-transcoding";
import { readFile } from "node:fs/promises";

/**
 * Transcodes a video segment to 720p and 480p versions
 */
export const transcodeVideoFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(
    z.object({
      segmentId: z.number(),
    })
  )
  .handler(async ({ data }) => {
    const { segmentId } = data;
    const { storage, type } = getStorage();

    // Only support R2 storage for transcoding
    if (type !== "r2") {
      throw new Error("Video transcoding is only supported with R2 storage");
    }

    // Get the segment
    const segment = await getSegmentByIdUseCase(segmentId);
    if (!segment) {
      throw new Error("Segment not found");
    }

    if (!segment.videoKey) {
      throw new Error("Segment does not have a video attached");
    }

    const originalKey = segment.videoKey;
    const tempFiles: string[] = [];

    try {
      // Download the original video from R2
      const originalBuffer = await storage.getBuffer(originalKey);
      const originalTempPath = await writeBufferToTempFile(
        originalBuffer,
        "original"
      );
      tempFiles.push(originalTempPath);

      // Transcode to both qualities
      const qualities: VideoQuality[] = ["720p", "480p"];
      const transcodedFiles: { quality: VideoQuality; path: string }[] = [];

      for (const quality of qualities) {
        const outputKey = getVideoQualityKey(originalKey, quality);
        const outputTempPath = await writeBufferToTempFile(
          Buffer.alloc(0),
          `transcoded_${quality}`,
          ".mp4"
        );
        tempFiles.push(outputTempPath);

        // Transcode the video
        await transcodeVideo({
          inputPath: originalTempPath,
          outputPath: outputTempPath,
          quality,
        });

        // Read the transcoded file and upload to R2
        const transcodedBuffer = await readFile(outputTempPath);
        await storage.upload(outputKey, transcodedBuffer);

        transcodedFiles.push({ quality, path: outputTempPath });
      }

      return {
        success: true,
        message: "Video transcoded successfully",
        qualities: qualities,
        keys: {
          original: originalKey,
          "720p": getVideoQualityKey(originalKey, "720p"),
          "480p": getVideoQualityKey(originalKey, "480p"),
        },
      };
    } catch (error) {
      console.error("Transcoding error:", error);
      throw new Error(
        `Failed to transcode video: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      // Clean up temporary files
      await cleanupTempFiles(...tempFiles);
    }
  });

/**
 * Gets available video quality variants for a segment
 */
export const getAvailableQualitiesFn = createServerFn({ method: "GET" })
  .middleware([unauthenticatedMiddleware])
  .inputValidator(
    z.object({
      segmentId: z.number(),
    })
  )
  .handler(async ({ data, context }) => {
    const { segmentId } = data;
    const { storage, type } = getStorage();

    // Get the segment
    const segment = await getSegmentByIdUseCase(segmentId);
    if (!segment) {
      throw new Error("Segment not found");
    }

    if (!segment.videoKey) {
      return {
        availableQualities: [],
        urls: {},
      };
    }

    // Check authentication for premium segments
    if (segment.isPremium) {
      if (!context.userId) throw new AuthenticationError();
      const user = await getAuthenticatedUser();
      if (!user || (!user.isPremium && !user.isAdmin)) {
        throw new Error("You don't have permission to access this video");
      }
    }

    const originalKey = segment.videoKey;
    const qualities: Array<{ quality: string; key: string }> = [
      { quality: "original", key: originalKey },
    ];

    // Check for 720p and 480p variants
    const qualityVariants: Array<{ quality: "720p" | "480p"; key: string }> = [
      { quality: "720p", key: getVideoQualityKey(originalKey, "720p") },
      { quality: "480p", key: getVideoQualityKey(originalKey, "480p") },
    ];

    // Check which quality variants exist
    const existingQualities = await Promise.all(
      qualityVariants.map(async (variant) => {
        const exists = await storage.exists(variant.key);
        return exists ? variant : null;
      })
    );

    // Add existing variants to the list
    existingQualities.forEach((variant) => {
      if (variant) {
        qualities.push(variant);
      }
    });

    // Generate presigned URLs for all available qualities
    const urls: Record<string, string> = {};
    for (const quality of qualities) {
      if (type === "r2" || type === "mock") {
        urls[quality.quality] = await storage.getPresignedUrl(quality.key);
      } else {
        // For non-R2 storage, return the API route
        urls[quality.quality] = `/api/segments/${segmentId}/video`;
      }
    }

    return {
      availableQualities: qualities.map((q) => q.quality),
      urls,
      keys: Object.fromEntries(qualities.map((q) => [q.quality, q.key])),
    };
  });

/**
 * Gets the thumbnail URL for a segment (if available)
 */
export const getThumbnailUrlFn = createServerFn({ method: "GET" })
  .middleware([unauthenticatedMiddleware])
  .inputValidator(
    z.object({
      segmentId: z.number(),
    })
  )
  .handler(async ({ data }) => {
    const { segmentId } = data;
    const { storage, type } = getStorage();

    // Only support R2/mock storage for thumbnails
    if (type !== "r2" && type !== "mock") {
      return { thumbnailUrl: null };
    }

    // Get the segment
    const segment = await getSegmentByIdUseCase(segmentId);
    if (!segment) {
      return { thumbnailUrl: null };
    }

    if (!segment.videoKey) {
      return { thumbnailUrl: null };
    }

    // Check if thumbnail key is stored in segment or derive from video key
    const thumbnailKey =
      segment.thumbnailKey || getThumbnailKey(segment.videoKey);

    // Check if thumbnail exists
    const exists = await storage.exists(thumbnailKey);
    if (!exists) {
      return { thumbnailUrl: null };
    }

    // Generate presigned URL for the thumbnail
    const thumbnailUrl = await storage.getPresignedUrl(thumbnailKey);
    return { thumbnailUrl };
  });
