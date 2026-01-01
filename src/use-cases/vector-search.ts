import {
  createTranscriptChunks,
  deleteChunksBySegmentId,
  getChunkCountBySegmentIds,
  getTotalChunkCount,
  searchByEmbedding,
  type SearchResult,
} from "~/data-access/transcript-chunks";
import { getSegmentById, getSegments } from "~/data-access/segments";
import { getModulesWithSegmentsUseCase } from "~/use-cases/modules";
import { chunkTranscript } from "~/lib/chunking";
import { generateEmbedding, generateEmbeddings } from "~/lib/openai";

const EMBEDDING_BATCH_SIZE = 20;

export async function vectorizeSegmentUseCase(segmentId: number) {
  const segment = await getSegmentById(segmentId);
  if (!segment) {
    throw new Error("Segment not found");
  }
  if (!segment.transcripts) {
    throw new Error("Segment has no transcript");
  }

  // Delete existing chunks for this segment
  await deleteChunksBySegmentId(segmentId);

  // Chunk the transcript
  const chunks = chunkTranscript(segment.transcripts);

  if (chunks.length === 0) {
    return {
      segmentId,
      chunksCreated: 0,
    };
  }

  // Generate embeddings in batches
  const allChunksWithEmbeddings: Array<{
    segmentId: number;
    chunkIndex: number;
    chunkText: string;
    embedding: number[];
    tokenCount: number;
  }> = [];

  for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
    const texts = batch.map((c) => c.text);
    const embeddings = await generateEmbeddings(texts);

    for (let j = 0; j < batch.length; j++) {
      allChunksWithEmbeddings.push({
        segmentId,
        chunkIndex: batch[j].index,
        chunkText: batch[j].text,
        embedding: embeddings[j],
        tokenCount: batch[j].tokenCount,
      });
    }
  }

  // Store chunks
  const created = await createTranscriptChunks(allChunksWithEmbeddings);

  return {
    segmentId,
    chunksCreated: created.length,
  };
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

  const segmentsWithStatus: SegmentVectorizationStatus[] = modules.flatMap(
    (module) =>
      module.segments.map((segment) => ({
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
      }))
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
