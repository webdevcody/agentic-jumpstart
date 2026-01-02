import { encodeGenerator, decode } from "gpt-tokenizer";

const TARGET_CHUNK_SIZE = 500; // tokens
const OVERLAP_SIZE = 50; // tokens for context overlap
const YIELD_EVERY_N_TOKENS = 1000; // yield to event loop every N tokens during encoding
const YIELD_EVERY_N_CHUNKS = 10; // yield to event loop every N chunks during decoding

export interface Chunk {
  text: string;
  tokenCount: number;
  index: number;
}

/**
 * Yields to the event loop to prevent blocking during long-running operations.
 * This is critical for maintaining database connections and network keepalives.
 *
 * Uses setImmediate for better event loop yielding than setTimeout(0).
 */
function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Async version of chunkTranscript that uses encodeGenerator to avoid
 * blocking the event loop during tokenization of large transcripts.
 *
 * This prevents Railway/hosted PostgreSQL from closing "idle" connections
 * when processing large transcripts (14KB+).
 *
 * - Yields every 1000 tokens during encoding
 * - Yields every 10 chunks during decoding
 * - Properly terminates when all tokens are processed (no infinite loop)
 */
export async function chunkTranscript(transcript: string): Promise<Chunk[]> {
  if (!transcript || transcript.trim().length === 0) {
    console.log("[chunking] Empty transcript, returning empty array");
    return [];
  }

  console.log("[chunking] Starting tokenization", {
    transcriptLength: transcript.length,
  });

  // Use encodeGenerator to tokenize without blocking the event loop
  const tokens: number[] = [];
  let batchCount = 0;

  for (const tokenBatch of encodeGenerator(transcript)) {
    tokens.push(...tokenBatch);
    batchCount++;

    // Log progress periodically
    if (tokens.length % YIELD_EVERY_N_TOKENS === 0) {
      console.log("[chunking] Tokenization progress", {
        tokensProcessed: tokens.length,
        batchesProcessed: batchCount,
      });
      await yieldToEventLoop();
    }
  }

  console.log("[chunking] Tokenization complete", {
    totalTokens: tokens.length,
    totalBatches: batchCount,
  });

  const chunks: Chunk[] = [];

  // If the entire transcript fits in one chunk, return it as is
  if (tokens.length <= TARGET_CHUNK_SIZE) {
    return [
      {
        text: transcript.trim(),
        tokenCount: tokens.length,
        index: 0,
      },
    ];
  }

  const expectedChunks =
    Math.ceil(
      (tokens.length - TARGET_CHUNK_SIZE) / (TARGET_CHUNK_SIZE - OVERLAP_SIZE)
    ) + 1;

  console.log("[chunking] Starting chunk creation", {
    totalTokens: tokens.length,
    expectedChunks,
  });

  let start = 0;
  let index = 0;

  while (start < tokens.length) {
    const end = Math.min(start + TARGET_CHUNK_SIZE, tokens.length);
    const chunkTokens = tokens.slice(start, end);
    const text = decode(chunkTokens);

    chunks.push({
      text: text.trim(),
      tokenCount: chunkTokens.length,
      index,
    });

    // If we've reached the end of tokens, we're done
    if (end >= tokens.length) {
      break;
    }

    // Move forward with overlap for next chunk
    start = end - OVERLAP_SIZE;
    index++;

    // Yield periodically to keep event loop responsive
    if (index % YIELD_EVERY_N_CHUNKS === 0) {
      await yieldToEventLoop();
    }
  }

  console.log("[chunking] Complete", {
    tokenCount: tokens.length,
    chunkCount: chunks.length,
  });

  return chunks;
}
