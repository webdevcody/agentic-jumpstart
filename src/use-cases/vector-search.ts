import {
  createTranscriptChunksBatch,
  deleteChunksBySegmentId,
  getChunkCountBySegmentIds,
  getTotalChunkCount,
  searchByEmbedding,
  type SearchResult,
} from "~/data-access/transcript-chunks";
import { getSegmentById, getSegments } from "~/data-access/segments";
import { getVideoProcessingJobsBySegmentIds } from "~/data-access/video-processing-jobs";
import { getModulesWithSegmentsUseCase } from "~/use-cases/modules";
import { chunkTranscript } from "~/lib/chunking";
import { generateEmbedding, generateEmbeddings } from "~/lib/openai";

const EMBEDDING_BATCH_SIZE = 20;
const DB_INSERT_BATCH_SIZE = 50;

export async function vectorizeSegmentUseCase(segmentId: number) {
  const startedAt = Date.now();
  try {
    const segment = await getSegmentById(segmentId);
    if (!segment) {
      throw new Error("Segment not found");
    }
    if (!segment.transcripts) {
      throw new Error("Segment has no transcript");
    }

    console.log("[Vectorize] Starting", {
      segmentId,
      transcriptLength: segment.transcripts.length,
    });

    // Delete existing chunks for this segment
    console.log("[Vectorize] Deleting existing chunks", { segmentId });
    await deleteChunksBySegmentId(segmentId);
    console.log("[Vectorize] Delete operation completed, continuing...", {
      segmentId,
    });

    // Don't log the full transcript - it can be 10KB+ and crash dev server console
    console.log("[Vectorize] Transcript loaded", {
      segmentId,
      transcriptLength: segment.transcripts.length,
      transcriptPreview: segment.transcripts.substring(0, 100) + "...",
    });

    // Chunk the transcript (async to avoid blocking event loop)
    const chunks = await chunkTranscript(segment.transcripts);
    const totalTokens = chunks.reduce((sum, c) => sum + c.tokenCount, 0);
    console.log("[Vectorize] Chunked transcript", {
      segmentId,
      chunks: chunks.length,
      totalTokens,
    });

    if (chunks.length === 0) {
      return {
        segmentId,
        chunksCreated: 0,
      };
    }

    // Generate embeddings in batches and insert incrementally to avoid memory buildup
    let totalChunksCreated = 0;
    let pendingChunks: Array<{
      segmentId: number;
      chunkIndex: number;
      chunkText: string;
      embedding: number[];
      tokenCount: number;
    }> = [];

    for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
      const texts = batch.map((c) => c.text);
      console.log("[Vectorize] Generating embeddings", {
        segmentId,
        batchStart: i,
        batchSize: batch.length,
        totalBatches: Math.ceil(chunks.length / EMBEDDING_BATCH_SIZE),
      });

      const embeddings = await generateEmbeddings(texts);
      const embeddingDimensions = embeddings[0]?.length ?? 0;
      console.log("[Vectorize] Embeddings generated", {
        segmentId,
        batchStart: i,
        embeddingsReturned: embeddings.length,
        embeddingDimensions,
      });

      for (let j = 0; j < batch.length; j++) {
        pendingChunks.push({
          segmentId,
          chunkIndex: batch[j].index,
          chunkText: batch[j].text,
          embedding: embeddings[j],
          tokenCount: batch[j].tokenCount,
        });
      }

      // Insert to database when we've accumulated enough chunks to reduce memory
      if (pendingChunks.length >= DB_INSERT_BATCH_SIZE) {
        console.log("[Vectorize] Inserting batch to database", {
          segmentId,
          batchSize: pendingChunks.length,
        });
        await createTranscriptChunksBatch(pendingChunks);
        totalChunksCreated += pendingChunks.length;
        pendingChunks = []; // Release memory
      }
    }

    // Insert any remaining chunks
    if (pendingChunks.length > 0) {
      console.log("[Vectorize] Inserting final batch to database", {
        segmentId,
        batchSize: pendingChunks.length,
      });
      await createTranscriptChunksBatch(pendingChunks);
      totalChunksCreated += pendingChunks.length;
    }

    const durationMs = Date.now() - startedAt;
    console.log("[Vectorize] Completed", {
      segmentId,
      chunksCreated: totalChunksCreated,
      durationMs,
    });

    return {
      segmentId,
      chunksCreated: totalChunksCreated,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const errorDetails =
      error && typeof error === "object"
        ? {
            errorCode:
              "code" in error ? (error as { code?: string }).code : undefined,
            errorStatus:
              "status" in error
                ? (error as { status?: number }).status
                : undefined,
            errorContext:
              "context" in error
                ? (error as { context?: Record<string, unknown> }).context
                : undefined,
          }
        : undefined;
    console.error("[Vectorize] Failed", {
      segmentId,
      durationMs,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : "UnknownError",
      ...errorDetails,
    });
    throw error;
  }
}

export async function vectorizeAllSegmentsUseCase() {
  const segments = await getSegments();
  const segmentsWithTranscripts = segments.filter((s) => s.transcripts);

  const results = {
    processed: 0,
    skipped: 0,
    errors: [] as Array<{ segmentId: number; title: string; error: string }>,
  };

  for (const segment of segmentsWithTranscripts) {
    try {
      await vectorizeSegmentUseCase(segment.id);
      results.processed++;
    } catch (error) {
      results.errors.push({
        segmentId: segment.id,
        title: segment.title,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  results.skipped = segments.length - segmentsWithTranscripts.length;

  return results;
}

export async function searchTranscriptsUseCase(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const queryEmbedding = await generateEmbedding(query);
  const results = await searchByEmbedding(queryEmbedding, limit);

  return results;
}

export interface SegmentVectorizationStatus {
  id: number;
  slug: string;
  title: string;
  moduleTitle: string;
  moduleOrder: number;
  hasTranscript: boolean;
  chunkCount: number;
  isVectorized: boolean;
  needsVectorization: boolean;
  activeVectorizeJob: boolean;
}

export interface VectorizationStatus {
  segments: SegmentVectorizationStatus[];
  modules: Array<{ id: number; title: string; order: number }>;
  stats: {
    totalSegments: number;
    withTranscripts: number;
    vectorized: number;
    needsVectorization: number;
    totalChunks: number;
  };
}

export async function getVectorizationStatusUseCase(): Promise<VectorizationStatus> {
  const modules = await getModulesWithSegmentsUseCase();

  const segmentIds = modules.flatMap((m) => m.segments.map((s) => s.id));
  const chunkCounts = await getChunkCountBySegmentIds(segmentIds);
  const totalChunks = await getTotalChunkCount();

  // Get all vectorization jobs for these segments
  const allJobs = await getVideoProcessingJobsBySegmentIds(segmentIds);
  const jobsBySegmentId = new Map<number, typeof allJobs>();
  allJobs.forEach((job) => {
    if (!jobsBySegmentId.has(job.segmentId)) {
      jobsBySegmentId.set(job.segmentId, []);
    }
    jobsBySegmentId.get(job.segmentId)!.push(job);
  });

  const segmentsWithStatus: SegmentVectorizationStatus[] = modules.flatMap(
    (module) =>
      module.segments.map((segment) => {
        const jobs = jobsBySegmentId.get(segment.id) || [];
        const hasActiveVectorizeJob = jobs.some(
          (job) =>
            job.jobType === "vectorize" &&
            (job.status === "pending" || job.status === "processing")
        );

        return {
          id: segment.id,
          slug: segment.slug,
          title: segment.title,
          moduleTitle: module.title,
          moduleOrder: module.order,
          hasTranscript: !!segment.transcripts,
          chunkCount: chunkCounts.get(segment.id) || 0,
          isVectorized: (chunkCounts.get(segment.id) || 0) > 0,
          needsVectorization:
            !!segment.transcripts && (chunkCounts.get(segment.id) || 0) === 0,
          activeVectorizeJob: hasActiveVectorizeJob,
        };
      })
  );

  return {
    segments: segmentsWithStatus,
    modules: modules.map((m) => ({ id: m.id, title: m.title, order: m.order })),
    stats: {
      totalSegments: segmentsWithStatus.length,
      withTranscripts: segmentsWithStatus.filter((s) => s.hasTranscript).length,
      vectorized: segmentsWithStatus.filter((s) => s.isVectorized).length,
      needsVectorization: segmentsWithStatus.filter((s) => s.needsVectorization)
        .length,
      totalChunks,
    },
  };
}
