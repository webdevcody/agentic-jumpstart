import { database } from "~/db";
import { transcriptChunks, segments, modules } from "~/db/schema";
import { eq, sql, inArray } from "drizzle-orm";
import type { TranscriptChunkCreate } from "~/db/schema";

export async function createTranscriptChunks(chunks: TranscriptChunkCreate[]) {
  if (chunks.length === 0) return [];
  return database.insert(transcriptChunks).values(chunks).returning();
}

export async function deleteChunksBySegmentId(segmentId: number) {
  return database
    .delete(transcriptChunks)
    .where(eq(transcriptChunks.segmentId, segmentId))
    .returning();
}

export async function getChunksBySegmentId(segmentId: number) {
  return database
    .select()
    .from(transcriptChunks)
    .where(eq(transcriptChunks.segmentId, segmentId))
    .orderBy(transcriptChunks.chunkIndex);
}

export async function getChunkCountBySegmentIds(segmentIds: number[]) {
  if (segmentIds.length === 0) return new Map<number, number>();

  const results = await database
    .select({
      segmentId: transcriptChunks.segmentId,
      count: sql<number>`count(*)::int`,
    })
    .from(transcriptChunks)
    .where(inArray(transcriptChunks.segmentId, segmentIds))
    .groupBy(transcriptChunks.segmentId);

  return new Map(results.map((r) => [r.segmentId, r.count]));
}

export async function getTotalChunkCount(): Promise<number> {
  const result = await database
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(transcriptChunks);

  return result[0]?.count ?? 0;
}

export interface SearchResult {
  id: number;
  segmentId: number;
  chunkText: string;
  chunkIndex: number;
  similarity: number;
  segmentTitle: string;
  segmentSlug: string;
  moduleTitle: string;
}

export async function searchByEmbedding(
  embedding: number[],
  limit: number = 10
): Promise<SearchResult[]> {
  // Using pgvector cosine distance operator (<=>)
  // Similarity = 1 - cosine_distance
  const embeddingStr = `[${embedding.join(",")}]`;

  const results = await database.execute(sql`
    SELECT
      tc.id,
      tc."segmentId" as "segmentId",
      tc."chunkText" as "chunkText",
      tc."chunkIndex" as "chunkIndex",
      1 - (tc.embedding <=> ${embeddingStr}::vector) as similarity,
      s.title as "segmentTitle",
      s.slug as "segmentSlug",
      m.title as "moduleTitle"
    FROM app_transcript_chunk tc
    JOIN app_segment s ON tc."segmentId" = s.id
    JOIN app_module m ON s."moduleId" = m.id
    WHERE tc.embedding IS NOT NULL
    ORDER BY tc.embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `);

  return results.rows as unknown as SearchResult[];
}
