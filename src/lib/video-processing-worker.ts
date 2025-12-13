import {
  getPendingVideoProcessingJobs,
  getVideoProcessingJobById,
  markJobAsProcessing,
  markJobAsCompleted,
  markJobAsFailed,
} from "~/data-access/video-processing-jobs";
import {
  getSegmentByIdUseCase,
  editSegmentUseCase,
} from "~/use-cases/segments";
import { getStorage } from "~/utils/storage";
import { getVideoQualityKey } from "~/utils/storage/r2";
import { generateTranscriptFromVideo } from "~/utils/openai";
import {
  transcodeVideo,
  writeBufferToTempFile,
  cleanupTempFiles,
  type VideoQuality,
} from "~/utils/video-transcoding";
import { readFile } from "node:fs/promises";

class VideoProcessingWorker {
  private isRunning = false;
  private shouldStop = false;

  /**
   * Check if the worker is currently running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Start the worker if it's not already running
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("Video processing worker is already running");
      return;
    }

    this.isRunning = true;
    this.shouldStop = false;
    console.log("Video processing worker started");

    // Process jobs in a loop
    this.processJobsLoop().catch((error) => {
      console.error("Video processing worker error:", error);
      this.isRunning = false;
    });
  }

  /**
   * Stop the worker gracefully
   */
  stop(): void {
    this.shouldStop = true;
    console.log("Video processing worker stop requested");
  }

  /**
   * Main processing loop
   */
  private async processJobsLoop(): Promise<void> {
    while (!this.shouldStop) {
      try {
        const pendingJobs = await getPendingVideoProcessingJobs();

        if (pendingJobs.length === 0) {
          // No jobs to process, wait a bit before checking again
          await this.sleep(5000); // 5 seconds
          continue;
        }

        // Process jobs sequentially
        for (const job of pendingJobs) {
          if (this.shouldStop) {
            break;
          }

          try {
            await this.processJob(job.id);
          } catch (error) {
            console.error(`Error processing job ${job.id}:`, error);
            // Job will be marked as failed in processJob
          }
        }
      } catch (error) {
        console.error("Error in video processing worker loop:", error);
        // Wait before retrying
        await this.sleep(10000); // 10 seconds
      }
    }

    this.isRunning = false;
    console.log("Video processing worker stopped");
  }

  /**
   * Process a single job
   */
  private async processJob(jobId: number): Promise<void> {
    // Mark job as processing
    await markJobAsProcessing(jobId);

    try {
      // Get the job again to ensure we have the latest data
      const job = await getVideoProcessingJobById(jobId);

      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      if (job.jobType === "transcript") {
        await this.processTranscriptJob(job.segmentId);
      } else if (job.jobType === "transcode") {
        await this.processTranscodeJob(job.segmentId);
      } else {
        throw new Error(`Unknown job type: ${job.jobType}`);
      }

      // Mark job as completed
      await markJobAsCompleted(jobId);
      console.log(`Job ${jobId} (${job.jobType}) completed successfully`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await markJobAsFailed(jobId, errorMessage);
      console.error(`Job ${jobId} failed:`, errorMessage);
      throw error;
    }
  }

  /**
   * Process a transcript job
   */
  private async processTranscriptJob(segmentId: number): Promise<void> {
    const segment = await getSegmentByIdUseCase(segmentId);
    if (!segment) {
      throw new Error("Segment not found");
    }

    if (!segment.videoKey) {
      throw new Error("This segment does not have a video attached");
    }

    // Check if video exists in storage before processing
    const { storage } = getStorage();
    const videoExists = await storage.exists(segment.videoKey);
    if (!videoExists) {
      throw new Error(
        `Video file not found in storage: ${segment.videoKey}. The video may have been deleted or the key is incorrect.`
      );
    }

    // Download the video from storage
    console.log(
      `[Worker] Downloading video for segment ${segmentId}: ${segment.videoKey}`
    );
    const videoBuffer = await storage.getBuffer(segment.videoKey);
    console.log(`[Worker] Downloaded video: ${videoBuffer.length} bytes`);

    // Generate the transcript
    console.log(`[Worker] Generating transcript for segment ${segmentId}`);
    const transcript = await generateTranscriptFromVideo(videoBuffer);

    // Update the segment with the new transcript
    await editSegmentUseCase(segmentId, {
      transcripts: transcript,
    });

    console.log(`[Worker] Transcript generated for segment ${segmentId}`);
  }

  /**
   * Process a transcode job
   */
  private async processTranscodeJob(segmentId: number): Promise<void> {
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
      // Check if video exists in storage before processing
      const videoExists = await storage.exists(originalKey);
      if (!videoExists) {
        throw new Error(
          `Video file not found in storage: ${originalKey}. The video may have been deleted or the key is incorrect.`
        );
      }

      // Download the original video from R2
      console.log(`[Worker] Downloading video for transcoding: ${originalKey}`);
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
        console.log(`[Worker] Transcoding segment ${segmentId} to ${quality}`);
        await transcodeVideo({
          inputPath: originalTempPath,
          outputPath: outputTempPath,
          quality,
        });

        // Read the transcoded file and upload to R2
        const transcodedBuffer = await readFile(outputTempPath);
        await storage.upload(outputKey, transcodedBuffer);

        transcodedFiles.push({ quality, path: outputTempPath });
        console.log(
          `[Worker] Uploaded ${quality} version for segment ${segmentId}`
        );
      }

      console.log(`[Worker] Transcoding completed for segment ${segmentId}`);
    } catch (error) {
      console.error("Transcoding error:", error);
      throw new Error(
        `Failed to transcode video: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      // Clean up temporary files
      await cleanupTempFiles(...tempFiles);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
let workerInstance: VideoProcessingWorker | null = null;

/**
 * Get the singleton video processing worker instance
 */
export function getVideoProcessingWorker(): VideoProcessingWorker {
  if (!workerInstance) {
    workerInstance = new VideoProcessingWorker();
  }
  return workerInstance;
}

/**
 * Start the video processing worker if it's not already running
 */
export async function startVideoProcessingWorker(): Promise<void> {
  const worker = getVideoProcessingWorker();
  if (!worker.isActive()) {
    await worker.start();
  }
}
