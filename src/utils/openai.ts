import { spawn } from "child_process";
import { writeFile, unlink, readFile, readdir } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import { env } from "~/utils/env";

const OPENAI_API_KEY = env.OPENAI_API_KEY;

// OpenAI Whisper API has a 25MB limit (26,214,400 bytes)
// We use 20MB chunks to have buffer room for encoding overhead
const MAX_AUDIO_CHUNK_SIZE_BYTES = 20 * 1024 * 1024;
// Duration in seconds for each chunk (10 minutes)
// This typically results in ~15-20MB MP3 files at 128kbps
const AUDIO_CHUNK_DURATION_SECONDS = 600;

if (!OPENAI_API_KEY) {
  console.warn(
    "OPENAI_API_KEY is not set. Transcript generation will not work."
  );
}

/**
 * Extracts audio from a video buffer using ffmpeg
 * Returns the audio as a buffer in mp3 format
 */
async function extractAudioFromVideo(videoBuffer: Buffer): Promise<Buffer> {
  console.log(`[OpenAI] extractAudioFromVideo - input: ${videoBuffer.length} bytes`);
  const tempVideoPath = join(tmpdir(), `video-${randomUUID()}.mp4`);
  const tempAudioPath = join(tmpdir(), `audio-${randomUUID()}.mp3`);
  console.log(`[OpenAI] extractAudioFromVideo - tempVideoPath: ${tempVideoPath}, tempAudioPath: ${tempAudioPath}`);

  try {
    // Write video buffer to temp file
    await writeFile(tempVideoPath, videoBuffer);

    // Extract audio using ffmpeg
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        tempVideoPath,
        "-vn", // No video
        "-acodec",
        "libmp3lame",
        "-ab",
        "128k",
        "-ar",
        "44100",
        "-y", // Overwrite output file
        tempAudioPath,
      ]);

      let stderr = "";
      ffmpeg.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
        }
      });

      ffmpeg.on("error", (err) => {
        reject(new Error(`ffmpeg error: ${err.message}`));
      });
    });

    // Read the audio file
    const audioBuffer = await readFile(tempAudioPath);
    console.log(`[OpenAI] extractAudioFromVideo - output: ${audioBuffer.length} bytes`);
    return audioBuffer;
  } finally {
    // Clean up temp files
    try {
      await unlink(tempVideoPath);
    } catch {
      // Ignore cleanup errors
    }
    try {
      await unlink(tempAudioPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Splits an audio buffer into smaller chunks using ffmpeg
 * Returns an array of audio buffers, each under the size limit
 */
async function splitAudioIntoChunks(audioBuffer: Buffer): Promise<Buffer[]> {
  const tempAudioPath = join(tmpdir(), `audio-${randomUUID()}.mp3`);
  const tempOutputPattern = join(tmpdir(), `chunk-${randomUUID()}-%03d.mp3`);
  const tempOutputDir = tmpdir();
  const chunkPrefix = `chunk-${tempOutputPattern.split("chunk-")[1].split("-%03d")[0]}`;

  try {
    // Write audio buffer to temp file
    await writeFile(tempAudioPath, audioBuffer);

    // Split audio using ffmpeg with segment muxer
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        tempAudioPath,
        "-f",
        "segment",
        "-segment_time",
        AUDIO_CHUNK_DURATION_SECONDS.toString(),
        "-acodec",
        "libmp3lame",
        "-ab",
        "128k",
        "-ar",
        "44100",
        "-y",
        tempOutputPattern,
      ]);

      let stderr = "";
      ffmpeg.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ffmpeg split exited with code ${code}: ${stderr}`));
        }
      });

      ffmpeg.on("error", (err) => {
        reject(new Error(`ffmpeg split error: ${err.message}`));
      });
    });

    // Find and read all chunk files
    const files = await readdir(tempOutputDir);
    const chunkFiles = files
      .filter((f) => f.startsWith(chunkPrefix) && f.endsWith(".mp3"))
      .sort();

    const chunks: Buffer[] = [];
    for (const chunkFile of chunkFiles) {
      const chunkPath = join(tempOutputDir, chunkFile);
      const chunkBuffer = await readFile(chunkPath);
      chunks.push(chunkBuffer);
      // Clean up chunk file
      try {
        await unlink(chunkPath);
      } catch {
        // Ignore cleanup errors
      }
    }

    return chunks;
  } finally {
    // Clean up temp input file
    try {
      await unlink(tempAudioPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Sends a single audio chunk to OpenAI Whisper API for transcription
 */
async function transcribeSingleAudioChunk(
  audioBuffer: Buffer
): Promise<string> {
  console.log(`[OpenAI] transcribeSingleAudioChunk - input: ${audioBuffer.length} bytes`);
  if (!OPENAI_API_KEY) {
    console.log(`[OpenAI] transcribeSingleAudioChunk - OPENAI_API_KEY not configured`);
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const formData = new FormData();
  const audioBlob = new Blob([new Uint8Array(audioBuffer)], {
    type: "audio/mp3",
  });
  formData.append("file", audioBlob, "audio.mp3");
  formData.append("model", "whisper-1");
  formData.append("response_format", "text");

  console.log(`[OpenAI] transcribeSingleAudioChunk - calling Whisper API...`);
  const startTime = Date.now();
  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    }
  );
  const duration = Date.now() - startTime;

  if (!response.ok) {
    const errorText = await response.text();
    console.log(`[OpenAI] transcribeSingleAudioChunk - API error after ${duration}ms: ${response.status} - ${errorText}`);
    throw new Error(
      `OpenAI transcription failed: ${response.status} - ${errorText}`
    );
  }

  const result = await response.text();
  console.log(`[OpenAI] transcribeSingleAudioChunk - completed in ${duration}ms, output: ${result.length} characters`);
  return result;
}

/**
 * Transcribes audio, automatically splitting into chunks if the file is too large
 */
async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  // If audio is under the size limit, transcribe directly
  if (audioBuffer.length <= MAX_AUDIO_CHUNK_SIZE_BYTES) {
    return transcribeSingleAudioChunk(audioBuffer);
  }

  // Split audio into chunks and transcribe each
  console.log(
    `Audio file too large (${audioBuffer.length} bytes), splitting into chunks...`
  );
  const chunks = await splitAudioIntoChunks(audioBuffer);
  console.log(`Split audio into ${chunks.length} chunks`);

  const transcripts: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(
      `Transcribing chunk ${i + 1}/${chunks.length} (${chunks[i].length} bytes)...`
    );
    const transcript = await transcribeSingleAudioChunk(chunks[i]);
    transcripts.push(transcript);
  }

  // Join all transcripts with a space
  return transcripts.join(" ");
}

/**
 * Formats raw transcript text into paragraphs using GPT
 * This preserves the original words but adds proper paragraph breaks
 */
async function formatTranscriptIntoParagraphs(
  rawTranscript: string
): Promise<string> {
  console.log(`[OpenAI] formatTranscriptIntoParagraphs - input: ${rawTranscript.length} characters`);
  if (!OPENAI_API_KEY) {
    console.log(`[OpenAI] formatTranscriptIntoParagraphs - OPENAI_API_KEY not configured`);
    throw new Error("OPENAI_API_KEY is not configured");
  }

  console.log(`[OpenAI] formatTranscriptIntoParagraphs - calling GPT-4o-mini API...`);
  const startTime = Date.now();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a transcript formatter. Your job is to take raw transcription text and format it into readable paragraphs.

IMPORTANT RULES:
1. DO NOT change any words - keep the exact same words from the input
2. DO NOT add, remove, or substitute any words
3. DO NOT correct grammar or fix speech patterns
4. ONLY add paragraph breaks where natural topic transitions or pauses occur
5. Each paragraph should be 2-4 sentences for readability
6. Return only the formatted transcript, no additional commentary`,
        },
        {
          role: "user",
          content: `Please format this transcript into paragraphs without changing any words:\n\n${rawTranscript}`,
        },
      ],
      temperature: 0,
    }),
  });

  const duration = Date.now() - startTime;
  if (!response.ok) {
    const errorText = await response.text();
    console.log(`[OpenAI] formatTranscriptIntoParagraphs - API error after ${duration}ms: ${response.status} - ${errorText}`);
    throw new Error(
      `OpenAI formatting failed: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();
  const result = data.choices[0].message.content.trim();
  console.log(`[OpenAI] formatTranscriptIntoParagraphs - completed in ${duration}ms, output: ${result.length} characters`);
  return result;
}

/**
 * Main function to generate a transcript from a video buffer
 * 1. Extracts audio from the video
 * 2. Sends audio to OpenAI Whisper for transcription
 * 3. Formats the transcript into paragraphs using GPT
 */
export async function generateTranscriptFromVideo(
  videoBuffer: Buffer
): Promise<string> {
  console.log(`[OpenAI] generateTranscriptFromVideo - starting with ${videoBuffer.length} bytes`);
  const overallStartTime = Date.now();

  console.log("[OpenAI] generateTranscriptFromVideo - step 1: extracting audio...");
  const audioStartTime = Date.now();
  const audioBuffer = await extractAudioFromVideo(videoBuffer);
  console.log(`[OpenAI] generateTranscriptFromVideo - audio extracted: ${audioBuffer.length} bytes in ${Date.now() - audioStartTime}ms`);

  console.log("[OpenAI] generateTranscriptFromVideo - step 2: transcribing with Whisper...");
  const transcribeStartTime = Date.now();
  const rawTranscript = await transcribeAudio(audioBuffer);
  console.log(`[OpenAI] generateTranscriptFromVideo - raw transcript: ${rawTranscript.length} characters in ${Date.now() - transcribeStartTime}ms`);

  console.log("[OpenAI] generateTranscriptFromVideo - step 3: formatting into paragraphs...");
  const formatStartTime = Date.now();
  const formattedTranscript =
    await formatTranscriptIntoParagraphs(rawTranscript);
  console.log(`[OpenAI] generateTranscriptFromVideo - formatted transcript: ${formattedTranscript.length} characters in ${Date.now() - formatStartTime}ms`);

  console.log(`[OpenAI] generateTranscriptFromVideo - completed in ${Date.now() - overallStartTime}ms`);
  return formattedTranscript;
}

/**
 * Generates a structured summary from a transcript using GPT
 * Returns a formatted summary with:
 * - What the video is about
 * - What you'll learn
 * - Key takeaways
 */
export async function generateSummaryFromTranscript(
  transcript: string
): Promise<string> {
  console.log(`[OpenAI] generateSummaryFromTranscript - starting with ${transcript.length} characters`);

  if (!OPENAI_API_KEY) {
    console.log(`[OpenAI] generateSummaryFromTranscript - OPENAI_API_KEY not configured`);
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (!transcript || transcript.trim().length === 0) {
    console.log(`[OpenAI] generateSummaryFromTranscript - transcript is empty`);
    throw new Error("Transcript is empty or invalid");
  }

  console.log(`[OpenAI] generateSummaryFromTranscript - calling GPT-4o API...`);
  const startTime = Date.now();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at creating concise, informative video summaries for an online learning platform. Your summaries help learners quickly understand what a video covers and decide if it's relevant to their learning goals.

Create a well-structured summary with these exact sections:

## About This Video
A concise 1-2 sentence overview of what the video covers and its main purpose.

## What You'll Learn
- 3-5 specific, actionable learning outcomes
- Each bullet should start with an action verb (Learn, Understand, Build, Implement, etc.)
- Be specific about skills or concepts covered

## Key Takeaways
- 3-5 most important concepts or insights from the video
- Focus on memorable, practical points learners should remember
- These should be things learners can apply immediately

IMPORTANT:
- Keep the entire summary under 300 words
- Use clear, accessible language suitable for developers of all levels
- Be specific and avoid vague statements
- Format using markdown with ## headers and - for bullet points`,
        },
        {
          role: "user",
          content: `Please create a structured summary for this video transcript:\n\n${transcript}`,
        },
      ],
      temperature: 0.3,
    }),
  });

  const duration = Date.now() - startTime;
  if (!response.ok) {
    const errorText = await response.text();
    console.log(`[OpenAI] generateSummaryFromTranscript - API error after ${duration}ms: ${response.status} - ${errorText}`);
    throw new Error(
      `OpenAI summary generation failed: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();
  const result = data.choices[0].message.content.trim();
  console.log(`[OpenAI] generateSummaryFromTranscript - completed in ${duration}ms, output: ${result.length} characters`);
  return result;
}
