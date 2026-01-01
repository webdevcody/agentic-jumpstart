import OpenAI from "openai";
import { env } from "~/utils/env";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = "text-embedding-3-small";
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_BATCH_SIZE = 100;

class EmbeddingError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "EmbeddingError";
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  context: Record<string, unknown>
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isRetryable =
        error instanceof OpenAI.APIError &&
        (error.status === 429 ||
          error.status === 500 ||
          error.status === 502 ||
          error.status === 503);

      if (!isRetryable || attempt === MAX_RETRIES - 1) {
        break;
      }

      const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
      console.warn(
        `Embedding API call failed (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay}ms...`,
        { error: lastError.message, ...context }
      );
      await sleep(delay);
    }
  }

  if (lastError instanceof OpenAI.APIError) {
    throw new EmbeddingError(
      `OpenAI API error: ${lastError.message}`,
      lastError.code ?? undefined,
      lastError.status,
      context
    );
  }

  throw new EmbeddingError(
    `Embedding generation failed: ${lastError?.message ?? "Unknown error"}`,
    undefined,
    undefined,
    context
  );
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || typeof text !== "string") {
    throw new EmbeddingError("Input text must be a non-empty string", undefined, undefined, {
      inputType: typeof text,
      inputLength: text?.length ?? 0,
    });
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    throw new EmbeddingError("Input text cannot be empty or whitespace only");
  }

  return withRetry(async () => {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: trimmedText,
    });

    if (!response.data?.[0]?.embedding) {
      throw new EmbeddingError(
        "Invalid API response: missing embedding data",
        undefined,
        undefined,
        { responseData: response.data }
      );
    }

    return response.data[0].embedding;
  }, { inputLength: trimmedText.length });
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!Array.isArray(texts)) {
    throw new EmbeddingError("Input must be an array of strings", undefined, undefined, {
      inputType: typeof texts,
    });
  }

  if (texts.length === 0) return [];

  const validTexts = texts.map((t, i) => {
    if (!t || typeof t !== "string" || t.trim().length === 0) {
      throw new EmbeddingError(
        `Invalid text at index ${i}: must be a non-empty string`,
        undefined,
        undefined,
        { index: i, inputType: typeof t }
      );
    }
    return t.trim();
  });

  const allEmbeddings: number[][] = [];

  for (let i = 0; i < validTexts.length; i += MAX_BATCH_SIZE) {
    const batch = validTexts.slice(i, i + MAX_BATCH_SIZE);
    const batchStartIndex = i;

    const batchEmbeddings = await withRetry(async () => {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch,
      });

      if (!response.data || response.data.length !== batch.length) {
        throw new EmbeddingError(
          `Invalid API response: expected ${batch.length} embeddings, got ${response.data?.length ?? 0}`,
          undefined,
          undefined,
          { batchSize: batch.length, responseSize: response.data?.length }
        );
      }

      for (let j = 0; j < response.data.length; j++) {
        if (!response.data[j]?.embedding) {
          throw new EmbeddingError(
            `Missing embedding at index ${j} in batch`,
            undefined,
            undefined,
            { batchIndex: j, absoluteIndex: batchStartIndex + j }
          );
        }
      }

      return response.data.map((d) => d.embedding);
    }, { batchSize: batch.length, batchStartIndex, totalTexts: validTexts.length });

    allEmbeddings.push(...batchEmbeddings);
  }

  return allEmbeddings;
}
