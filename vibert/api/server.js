import { Hono } from "hono";
import chalk from "chalk";

const app = new Hono();

// Enable CORS for extension requests
app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type");

  if (c.req.method === "OPTIONS") {
    return c.text("", 204);
  }

  await next();
});

// In-memory job storage
const jobs = new Map(); // jobId -> { id, prompt, status, progress, completeMessage, startedAt, finishedAt, color }

// Process job in background using async iteration
async function processJobInBackground(jobId) {
  const job = jobs.get(jobId);
  if (!job) return;

  try {
    const { proc } = runClaudeProcess(job.prompt);
    const decoder = new TextDecoder();

    // Use async iteration for stdout
    for await (const chunk of proc.stdout) {
      const text = decoder.decode(chunk, { stream: true });
      if (text) {
        job.progress += text;
        job.status = "running";
        jobs.set(jobId, job);

        // Also log to server console with color
        const colorize = chalk.hex(job.color);
        process.stdout.write(colorize(text));
      }
    }

    // Wait for process to complete
    const exitCode = await proc.exited;

    if (exitCode === 0) {
      // Mark job as completed
      job.status = "completed";
      job.completeMessage = job.progress;
      job.finishedAt = Date.now();
      jobs.set(jobId, job);
    } else {
      // Mark job as failed due to non-zero exit
      job.status = "failed";
      job.completeMessage =
        job.progress + `\nProcess exited with code ${exitCode}`;
      job.finishedAt = Date.now();
      jobs.set(jobId, job);
    }

    // Broadcast final update
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);

    // Mark job as failed
    job.status = "failed";
    job.completeMessage =
      job.progress + "\nError: " + (error?.message || error);
    job.finishedAt = Date.now();
    jobs.set(jobId, job);

    // Broadcast failure update
  }
}

function runClaudeProcess(prompt) {
  const proc = Bun.spawn(
    [
      "/Users/webdevcody/.claude/local/claude",
      "--dangerously-skip-permissions",
      "-p",
      prompt,
    ],
    {
      stdout: "pipe",
      stderr: "pipe",
    }
  );

  return { proc };
}

app.post("/prompt", async (c) => {
  try {
    const body = await c.req.json();
    const { prompt, jobId } = body;
    if (!prompt || typeof prompt !== "string") {
      return c.json({ error: "Missing or invalid prompt" }, 400);
    }

    // Generate job ID if not provided
    const id =
      jobId ||
      `job_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const color = generateHighContrastHex();

    // Create job entry
    const job = {
      id,
      prompt,
      status: "running",
      progress: "",
      completeMessage: "",
      startedAt: Date.now(),
      finishedAt: null,
      color,
    };

    jobs.set(id, job);

    // Log when a prompt is received
    console.log(
      `[${new Date().toISOString()}] Received prompt (${id}):`,
      prompt
    );

    // Broadcast job start to SSE clients

    // Process job in background
    processJobInBackground(id).catch((error) => {
      console.error(`Background job processing failed for ${id}:`, error);
    });

    // Return immediately with job ID
    return c.json({ jobId: id, status: "started" });
  } catch (e) {
    return c.json({ error: e?.message || "Internal error" }, 500);
  }
});

// Get all jobs
app.get("/jobs", (c) => {
  const jobArray = Array.from(jobs.values()).map((job) => ({
    id: job.id,
    prompt:
      job.prompt.length > 100
        ? job.prompt.substring(0, 100) + "..."
        : job.prompt,
    status: job.status,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    color: job.color,
    hasCompleteMessage: Boolean(job.completeMessage),
  }));

  return c.json({ jobs: jobArray });
});

// Get specific job details
app.get("/jobs/:id", (c) => {
  const id = c.req.param("id");
  const job = jobs.get(id);

  if (!job) {
    return c.json({ error: "Job not found" }, 404);
  }

  return c.json({ job });
});

// Dismiss/delete completed job
app.delete("/jobs/:id", (c) => {
  const id = c.req.param("id");
  const job = jobs.get(id);

  if (!job) {
    return c.json({ error: "Job not found" }, 404);
  }

  if (job.status === "running") {
    return c.json({ error: "Cannot dismiss running job" }, 400);
  }

  jobs.delete(id);
  return c.json({ success: true });
});

function generateHighContrastHex() {
  // High saturation and medium-high lightness for dark backgrounds
  const hue = Math.floor(Math.random() * 360);
  const saturation = 95; // 0-100
  const lightness = 70; // 0-100
  return hslToHex(hue, saturation, lightness);
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const r = Math.round(255 * f(0));
  const g = Math.round(255 * f(8));
  const b = Math.round(255 * f(4));
  const toHex = (x) => x.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Resolve the port from CLI flags or environment variables, defaulting to 1337
const cliPortArgIndex = Bun.argv.findIndex(
  (arg) => arg === "--port" || arg === "-p"
);
const cliPort =
  cliPortArgIndex !== -1 ? Number(Bun.argv[cliPortArgIndex + 1]) : undefined;
const envPort = Number(Bun.env.PORT ?? Bun.env.VIBERT_PORT ?? process.env.PORT);
const port =
  Number.isFinite(cliPort) && cliPort > 0
    ? cliPort
    : Number.isFinite(envPort) && envPort > 0
      ? envPort
      : 1337;

console.log("Server is running on port", port);

// Start the server
Bun.serve({
  port,
  fetch: app.fetch,
});
