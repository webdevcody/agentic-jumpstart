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
import { vectorizeSegmentUseCase } from "~/use-cases/vector-search";
import { getStorage } from "~/utils/storage";
import { getVideoQualityKey } from "~/utils/storage/r2";
import {
  generateTranscriptFromVideo,
  generateSummaryFromTranscript,
} from "~/utils/openai";
import { queueSummaryJobUseCase } from "~/use-cases/video-processing";
import {
  transcodeVideo,
  writeBufferToTempFile,
  cleanupTempFiles,
  extractThumbnail,
  createTempThumbnailPath,
  getThumbnailKey,
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
      console.log("[Worker] Video processing worker is already running");
      return;
    }

    this.isRunning = true;
    this.shouldStop = false;
    console.log("[Worker] Video processing worker started at", new Date().toISOString());

    // Process jobs in a loop
    this.processJobsLoop().catch((error) => {
      console.error("[Worker] Video processing worker fatal error:", error);
      this.isRunning = false;
    });
  }

  /**
   * Stop the worker gracefully
   */
  stop(): void {
    this.shouldStop = true;
    console.log("[Worker] Video processing worker stop requested at", new Date().toISOString());
  }

  /**
   * Main processing loop
   */
  private async processJobsLoop(): Promise<void> {
    console.log("[Worker] Processing loop started");
    while (!this.shouldStop) {
      try {
        console.log("[Worker] Checking for pending jobs...");
        const pendingJobs = await getPendingVideoProcessingJobs();

        if (pendingJobs.length === 0) {
          console.log("[Worker] No pending jobs found, sleeping for 5 seconds...");
          // No jobs to process, wait a bit before checking again
          await this.sleep(5000); // 5 seconds
          continue;
        }

        console.log(`[Worker] Found ${pendingJobs.length} pending jobs: ${pendingJobs.map(j => `${j.jobType}(${j.id})`).join(', ')}`);

        // Process jobs sequentially
        for (const job of pendingJobs) {
          if (this.shouldStop) {
            console.log("[Worker] Stop requested, breaking out of job loop");
            break;
          }

          try {
            await this.processJob(job.id);
          } catch (error) {
            console.error(`[Worker] Error processing job ${job.id}:`, error);
            // Job will be marked as failed in processJob
          }
        }
      } catch (error) {
        console.error("[Worker] Error in video processing worker loop:", error);
        console.log("[Worker] Sleeping for 10 seconds before retrying...");
        // Wait before retrying
        await this.sleep(10000); // 10 seconds
      }
    }

    this.isRunning = false;
    console.log("[Worker] Video processing worker stopped at", new Date().toISOString());
  }

  /**
   * Process a single job
   */
  private async processJob(jobId: number): Promise<void> {
    const startTime = Date.now();
    console.log(`[Worker] Starting job ${jobId} at ${new Date().toISOString()}`);

    // Mark job as processing
    await markJobAsProcessing(jobId);
    console.log(`[Worker] Job ${jobId} marked as processing`);

    try {
      // Get the job again to ensure we have the latest data
      const job = await getVideoProcessingJobById(jobId);

      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      console.log(`[Worker] Job ${jobId} details: type=${job.jobType}, segmentId=${job.segmentId}, status=${job.status}`);

      if (job.jobType === "transcript") {
        await this.processTranscriptJob(job.segmentId);
      } else if (job.jobType === "transcode") {
        await this.processTranscodeJob(job.segmentId);
      } else if (job.jobType === "thumbnail") {
        await this.processThumbnailJob(job.segmentId);
      } else if (job.jobType === "vectorize") {
        await this.processVectorizeJob(job.segmentId);
      } else if (job.jobType === "summary") {
        await this.processSummaryJob(job.segmentId);
      } else {
        throw new Error(`Unknown job type: ${job.jobType}`);
      }

      // Mark job as completed
      await markJobAsCompleted(jobId);
      const durationMs = Date.now() - startTime;
      console.log(`[Worker] Job ${jobId} (${job.jobType}) completed successfully in ${durationMs}ms`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await markJobAsFailed(jobId, errorMessage);
      const durationMs = Date.now() - startTime;
      console.error(`[Worker] Job ${jobId} failed after ${durationMs}ms:`, errorMessage);
      throw error;
    }
  }

  /**
   * Process a transcript job
   */
  private async processTranscriptJob(segmentId: number): Promise<void> {
    console.log(`[Worker:Transcript] Starting transcript job for segment ${segmentId}`);
    const segment = await getSegmentByIdUseCase(segmentId);
    if (!segment) {
      console.log(`[Worker:Transcript] Segment ${segmentId} not found`);
      throw new Error("Segment not found");
    }

    console.log(`[Worker:Transcript] Segment ${segmentId} found: title="${segment.title}", videoKey=${segment.videoKey}`);

    if (!segment.videoKey) {
      console.log(`[Worker:Transcript] Segment ${segmentId} has no video attached`);
      throw new Error("This segment does not have a video attached");
    }

    // Check if video exists in storage before processing
    const { storage } = getStorage();
    console.log(`[Worker:Transcript] Checking if video exists in storage: ${segment.videoKey}`);
    const videoExists = await storage.exists(segment.videoKey);
    if (!videoExists) {
      console.log(`[Worker:Transcript] Video not found in storage: ${segment.videoKey}`);
      throw new Error(
        `Video file not found in storage: ${segment.videoKey}. The video may have been deleted or the key is incorrect.`
      );
    }

    // Download the video from storage
    console.log(
      `[Worker:Transcript] Downloading video for segment ${segmentId}: ${segment.videoKey}`
    );
    const downloadStartTime = Date.now();
    const videoBuffer = await storage.getBuffer(segment.videoKey);
    const downloadDuration = Date.now() - downloadStartTime;
    console.log(`[Worker:Transcript] Downloaded video: ${videoBuffer.length} bytes in ${downloadDuration}ms`);

    // Generate the transcript
    console.log(`[Worker:Transcript] Generating transcript for segment ${segmentId}`);
    const transcriptStartTime = Date.now();
    const transcript = await generateTranscriptFromVideo(videoBuffer);
    const transcriptDuration = Date.now() - transcriptStartTime;
    console.log(`[Worker:Transcript] Transcript generated in ${transcriptDuration}ms: ${transcript.length} characters`);

    // Update the segment with the new transcript
    console.log(`[Worker:Transcript] Saving transcript to segment ${segmentId}`);
    await editSegmentUseCase(segmentId, {
      transcripts: transcript,
    });

    console.log(`[Worker:Transcript] Transcript job completed for segment ${segmentId}`);

    // Queue summary job to run after transcript is complete
    try {
      const summaryJob = await queueSummaryJobUseCase(segmentId);
      if (summaryJob) {
        console.log(
          `[Worker] Queued summary job for segment ${segmentId} after transcript completion`
        );
      }
    } catch (error) {
      // Don't fail the transcript job if summary queuing fails
      console.error(
        `[Worker] Failed to queue summary job for segment ${segmentId}:`,
        error
      );
    }
  }

  /**
   * Process a transcode job
   */
  private async processTranscodeJob(segmentId: number): Promise<void> {
    console.log(`[Worker:Transcode] Starting transcode job for segment ${segmentId}`);
    const { storage, type } = getStorage();

    // Only support R2 storage for transcoding
    if (type !== "r2") {
      console.log(`[Worker:Transcode] Storage type ${type} not supported for transcoding`);
      throw new Error("Video transcoding is only supported with R2 storage");
    }

    // Get the segment
    const segment = await getSegmentByIdUseCase(segmentId);
    if (!segment) {
      console.log(`[Worker:Transcode] Segment ${segmentId} not found`);
      throw new Error("Segment not found");
    }

    console.log(`[Worker:Transcode] Segment ${segmentId} found: title="${segment.title}", videoKey=${segment.videoKey}`);

    if (!segment.videoKey) {
      console.log(`[Worker:Transcode] Segment ${segmentId} has no video attached`);
      throw new Error("Segment does not have a video attached");
    }

    const originalKey = segment.videoKey;
    const tempFiles: string[] = [];

    try {
      // Check if video exists in storage before processing
      console.log(`[Worker:Transcode] Checking if video exists in storage: ${originalKey}`);
      const videoExists = await storage.exists(originalKey);
      if (!videoExists) {
        console.log(`[Worker:Transcode] Video not found in storage: ${originalKey}`);
        throw new Error(
          `Video file not found in storage: ${originalKey}. The video may have been deleted or the key is incorrect.`
        );
      }

      // Download the original video from R2
      console.log(`[Worker:Transcode] Downloading video for transcoding: ${originalKey}`);
      const downloadStartTime = Date.now();
      const originalBuffer = await storage.getBuffer(originalKey);
      const downloadDuration = Date.now() - downloadStartTime;
      console.log(`[Worker:Transcode] Downloaded video: ${originalBuffer.length} bytes in ${downloadDuration}ms`);

      const originalTempPath = await writeBufferToTempFile(
        originalBuffer,
        "original"
      );
      tempFiles.push(originalTempPath);
      console.log(`[Worker:Transcode] Wrote video to temp file: ${originalTempPath}`);

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
        console.log(`[Worker:Transcode] Transcoding segment ${segmentId} to ${quality}...`);
        const transcodeStartTime = Date.now();
        await transcodeVideo({
          inputPath: originalTempPath,
          outputPath: outputTempPath,
          quality,
        });
        const transcodeDuration = Date.now() - transcodeStartTime;
        console.log(`[Worker:Transcode] Transcoded to ${quality} in ${transcodeDuration}ms`);

        // Read the transcoded file and upload to R2
        console.log(`[Worker:Transcode] Uploading ${quality} version to storage: ${outputKey}`);
        const uploadStartTime = Date.now();
        const transcodedBuffer = await readFile(outputTempPath);
        await storage.upload(outputKey, transcodedBuffer);
        const uploadDuration = Date.now() - uploadStartTime;
        console.log(`[Worker:Transcode] Uploaded ${quality} version (${transcodedBuffer.length} bytes) in ${uploadDuration}ms`);

        transcodedFiles.push({ quality, path: outputTempPath });
      }

      console.log(`[Worker:Transcode] Transcode job completed for segment ${segmentId}`);
    } catch (error) {
      console.error("[Worker:Transcode] Transcoding error:", error);
      throw new Error(
        `Failed to transcode video: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      // Clean up temporary files
      console.log(`[Worker:Transcode] Cleaning up ${tempFiles.length} temp files`);
      await cleanupTempFiles(...tempFiles);
    }
  }

  /**
   * Process a thumbnail job - extract first frame from video
   */
  private async processThumbnailJob(segmentId: number): Promise<void> {
    console.log(`[Worker:Thumbnail] Starting thumbnail job for segment ${segmentId}`);
    const { storage, type } = getStorage();

    // Only support R2 storage for thumbnails
    if (type !== "r2") {
      console.log(`[Worker:Thumbnail] Storage type ${type} not supported for thumbnails`);
      throw new Error("Thumbnail extraction is only supported with R2 storage");
    }

    // Get the segment
    const segment = await getSegmentByIdUseCase(segmentId);
    if (!segment) {
      console.log(`[Worker:Thumbnail] Segment ${segmentId} not found`);
      throw new Error("Segment not found");
    }

    console.log(`[Worker:Thumbnail] Segment ${segmentId} found: title="${segment.title}", videoKey=${segment.videoKey}`);

    if (!segment.videoKey) {
      console.log(`[Worker:Thumbnail] Segment ${segmentId} has no video attached`);
      throw new Error("Segment does not have a video attached");
    }

    const originalKey = segment.videoKey;
    const thumbnailKey = getThumbnailKey(originalKey);
    console.log(`[Worker:Thumbnail] Will create thumbnail at: ${thumbnailKey}`);
    const tempFiles: string[] = [];

    try {
      // Check if video exists in storage before processing
      console.log(`[Worker:Thumbnail] Checking if video exists in storage: ${originalKey}`);
      const videoExists = await storage.exists(originalKey);
      if (!videoExists) {
        console.log(`[Worker:Thumbnail] Video not found in storage: ${originalKey}`);
        throw new Error(
          `Video file not found in storage: ${originalKey}. The video may have been deleted or the key is incorrect.`
        );
      }

      // Download the original video from R2
      console.log(
        `[Worker:Thumbnail] Downloading video for thumbnail extraction: ${originalKey}`
      );
      const downloadStartTime = Date.now();
      const originalBuffer = await storage.getBuffer(originalKey);
      const downloadDuration = Date.now() - downloadStartTime;
      console.log(`[Worker:Thumbnail] Downloaded video: ${originalBuffer.length} bytes in ${downloadDuration}ms`);

      const originalTempPath = await writeBufferToTempFile(
        originalBuffer,
        "original_for_thumb"
      );
      tempFiles.push(originalTempPath);
      console.log(`[Worker:Thumbnail] Wrote video to temp file: ${originalTempPath}`);

      // Create temp path for thumbnail
      const thumbnailTempPath = createTempThumbnailPath("thumbnail");
      tempFiles.push(thumbnailTempPath);

      // Extract the thumbnail
      console.log(`[Worker:Thumbnail] Extracting thumbnail for segment ${segmentId}...`);
      const extractStartTime = Date.now();
      const thumbnailBuffer = await extractThumbnail({
        inputPath: originalTempPath,
        outputPath: thumbnailTempPath,
        width: 640,
        seekTime: 1,
      });
      const extractDuration = Date.now() - extractStartTime;
      console.log(`[Worker:Thumbnail] Extracted thumbnail (${thumbnailBuffer.length} bytes) in ${extractDuration}ms`);

      // Upload thumbnail to R2 with correct content type
      console.log(`[Worker:Thumbnail] Uploading thumbnail to storage: ${thumbnailKey}`);
      const uploadStartTime = Date.now();
      await storage.upload(thumbnailKey, thumbnailBuffer, "image/jpeg");
      const uploadDuration = Date.now() - uploadStartTime;
      console.log(`[Worker:Thumbnail] Uploaded thumbnail in ${uploadDuration}ms`);

      // Update the segment with the thumbnail key
      console.log(`[Worker:Thumbnail] Saving thumbnail key to segment ${segmentId}`);
      await editSegmentUseCase(segmentId, {
        thumbnailKey: thumbnailKey,
      });

      console.log(
        `[Worker:Thumbnail] Thumbnail job completed for segment ${segmentId}`
      );
    } catch (error) {
      console.error("[Worker:Thumbnail] Thumbnail extraction error:", error);
      throw new Error(
        `Failed to extract thumbnail: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      // Clean up temporary files
      console.log(`[Worker:Thumbnail] Cleaning up ${tempFiles.length} temp files`);
      await cleanupTempFiles(...tempFiles);
    }
  }

  /**
   * Process a vectorization job - generate embeddings for transcript chunks
   */
  private async processVectorizeJob(segmentId: number): Promise<void> {
    const startedAt = Date.now();
    console.log(`[Worker] Starting vectorization for segment ${segmentId}`);

    try {
      const result = await vectorizeSegmentUseCase(segmentId);
      const durationMs = Date.now() - startedAt;
      console.log(
        `[Worker] Vectorization completed for segment ${segmentId}: ${result.chunksCreated} chunks created in ${durationMs}ms`
      );
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      console.error(`[Worker] Vectorization failed for segment ${segmentId}`, {
        durationMs,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      throw error;
    }
  }

  /**
   * Process a summary job - generate summary from transcript using GPT
   */
  private async processSummaryJob(segmentId: number): Promise<void> {
    console.log(`[Worker:Summary] Starting summary job for segment ${segmentId}`);

    const segment = await getSegmentByIdUseCase(segmentId);
    if (!segment) {
      console.log(`[Worker:Summary] Segment ${segmentId} not found`);
      throw new Error("Segment not found");
    }

    console.log(`[Worker:Summary] Segment ${segmentId} found: title="${segment.title}", hasTranscript=${!!segment.transcripts}, transcriptLength=${segment.transcripts?.length || 0}`);

    if (!segment.transcripts) {
      console.log(`[Worker:Summary] Segment ${segmentId} has no transcript`);
      throw new Error(
        "Segment does not have a transcript - transcript required for summary generation"
      );
    }

    try {
      // Generate summary from transcript
      console.log(`[Worker:Summary] Generating summary from transcript (${segment.transcripts.length} characters)...`);
      const summaryStartTime = Date.now();
      const summary = await generateSummaryFromTranscript(segment.transcripts);
      const summaryDuration = Date.now() - summaryStartTime;
      console.log(`[Worker:Summary] Generated summary (${summary.length} characters) in ${summaryDuration}ms`);

      // Update the segment with the new summary
      console.log(`[Worker:Summary] Saving summary to segment ${segmentId}`);
      await editSegmentUseCase(segmentId, {
        summary: summary,
      });

      console.log(`[Worker:Summary] Summary job completed for segment ${segmentId}`);
    } catch (error) {
      console.error(
        `[Worker:Summary] Summary generation failed for segment ${segmentId}:`,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
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
  console.log("[Worker] startVideoProcessingWorker called");
  const worker = getVideoProcessingWorker();
  if (!worker.isActive()) {
    console.log("[Worker] Worker not active, starting...");
    await worker.start();
  } else {
    console.log("[Worker] Worker already active, skipping start");
  }
}
