import { encode, decode } from "gpt-tokenizer";

const TARGET_CHUNK_SIZE = 500; // tokens
const OVERLAP_SIZE = 50; // tokens for context overlap

export interface Chunk {
  text: string;
  tokenCount: number;
  index: number;
}

export function chunkTranscript(transcript: string): Chunk[] {
  if (!transcript || transcript.trim().length === 0) {
    return [];
  }

  const tokens = encode(transcript);
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

    // Move forward with overlap
    start = end - OVERLAP_SIZE;

    // Only break when we've processed all tokens
    if (start >= tokens.length) {
      break;
    }

    index++;
  }

  return chunks;
}
