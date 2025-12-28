import { exec } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, unlink, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const execAsync = promisify(exec);

export type VideoQuality = "720p" | "480p";

export interface ThumbnailOptions {
  inputPath: string;
  outputPath: string;
  width?: number;
  seekTime?: number;
}

export interface TranscodeOptions {
  inputPath: string;
  outputPath: string;
  quality: VideoQuality;
}

const FFMPEG_PRESET = "medium";
const FFMPEG_CRF = "23";

/**
 * Transcodes a video file to the specified quality using ffmpeg
 */
export async function transcodeVideo(options: TranscodeOptions): Promise<void> {
  const { inputPath, outputPath, quality } = options;

  // Determine target height based on quality
  const targetHeight = quality === "720p" ? "720" : "480";

  // Build ffmpeg command
  // -vf "scale=-2:HEIGHT" maintains aspect ratio, sets height
  // -c:v libx264 uses H.264 codec
  // -preset medium balances speed vs compression
  // -crf 23 provides good quality (lower = better quality, 18-28 is typical range)
  // -c:a aac uses AAC audio codec
  const command = `ffmpeg -i "${inputPath}" -vf "scale=-2:${targetHeight}" -c:v libx264 -preset ${FFMPEG_PRESET} -crf ${FFMPEG_CRF} -c:a aac -y "${outputPath}"`;

  try {
    await execAsync(command);
  } catch (error) {
    throw new Error(
      `Failed to transcode video to ${quality}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Creates a temporary file path for video processing
 */
export function createTempVideoPath(
  prefix: string,
  suffix: string = ".mp4"
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return join(tmpdir(), `${prefix}_${timestamp}_${random}${suffix}`);
}

/**
 * Cleans up temporary files
 */
export async function cleanupTempFiles(...paths: string[]): Promise<void> {
  await Promise.allSettled(
    paths.map(async (path) => {
      try {
        await unlink(path);
      } catch (error) {
        // Ignore errors if file doesn't exist
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          console.error(`Failed to delete temp file ${path}:`, error);
        }
      }
    })
  );
}

/**
 * Writes a buffer to a temporary file
 */
export async function writeBufferToTempFile(
  buffer: Buffer,
  prefix: string,
  suffix: string = ".mp4"
): Promise<string> {
  const tempPath = createTempVideoPath(prefix, suffix);
  await writeFile(tempPath, buffer);
  return tempPath;
}

/**
 * Extracts a thumbnail from a video file using ffmpeg
 * @param options - Thumbnail extraction options
 * @returns Buffer containing the JPEG image data
 */
export async function extractThumbnail(
  options: ThumbnailOptions
): Promise<Buffer> {
  const { inputPath, outputPath, width = 640, seekTime = 1 } = options;

  // Create a temporary file for the initial extraction
  // Use a unique temp path to avoid conflicts
  const tempOutputPath = createTempThumbnailPath("temp_thumb");

  // Build ffmpeg command to extract thumbnail
  // -ss 1 seeks to 1 second into the video (avoids black frames at start)
  // -vframes 1 extracts only 1 frame
  // -vf "scale=WIDTH:-1" scales to specified width maintaining aspect ratio
  // -q:v 2 sets JPEG quality (1-31, lower is better)
  const ffmpegCommand = `ffmpeg -ss ${seekTime} -i "${inputPath}" -vframes 1 -vf "scale=${width}:-1" -q:v 2 -y "${tempOutputPath}"`;

  try {
    // Extract thumbnail with ffmpeg
    await execAsync(ffmpegCommand);

    // Convert to progressive JPEG using ImageMagick for faster perceived loading
    // Progressive JPEGs display a low-quality version first and progressively improve
    // This makes the thumbnail appear faster even while still downloading
    const convertCommand = `convert "${tempOutputPath}" -interlace Plane -quality 85 "${outputPath}"`;
    await execAsync(convertCommand);

    // Clean up temp file
    try {
      await unlink(tempOutputPath);
    } catch {
      // Ignore cleanup errors
    }

    // Read the generated progressive JPEG thumbnail
    const thumbnailBuffer = await readFile(outputPath);
    return thumbnailBuffer;
  } catch (error) {
    // Clean up temp file on error
    try {
      await unlink(tempOutputPath);
    } catch {
      // Ignore cleanup errors
    }
    throw new Error(
      `Failed to extract thumbnail: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Creates a temporary file path for thumbnail processing
 */
export function createTempThumbnailPath(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return join(tmpdir(), `${prefix}_${timestamp}_${random}.jpg`);
}

/**
 * Generates a thumbnail key from a base video key
 * @param baseKey - The original video key (e.g., "abc123.mp4")
 * @returns The thumbnail key (e.g., "abc123_thumb.jpg")
 */
export function getThumbnailKey(baseKey: string): string {
  if (baseKey.endsWith(".mp4")) {
    return baseKey.replace(".mp4", "_thumb.jpg");
  }
  return `${baseKey}_thumb.jpg`;
}
