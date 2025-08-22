async function getActiveTab() {
  // Prefer the currently active tab in the current window
  let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs && tabs[0]) return tabs[0];
  // Fallback to last focused window active tab
  tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tabs && tabs[0]) return tabs[0];
  // Final fallback: any tab in last focused window
  tabs = await chrome.tabs.query({ lastFocusedWindow: true });
  return tabs && tabs[0] ? tabs[0] : null;
}

const sendBtn = document.getElementById("send");
const spinnerEl = document.getElementById("spinner");
const statusEl = document.getElementById("status");
const jobsEl = document.getElementById("jobs");

let jobCounter = 0;
const jobs = new Map(); // id -> { id, color, text, startedAt, finishedAt, status, prompt }

const POLLING_INTERVAL_MS = 1000;
let pollingIntervalId = null;

// Load jobs from server on startup
async function loadJobsFromServer() {
  try {
    const response = await fetch("http://localhost:1337/jobs");
    if (!response.ok) return;
    const data = await response.json();
    updateJobsFromServer(data.jobs || []);
  } catch (error) {
    console.error("Failed to load jobs from server:", error);
  }
}

function updateJobsFromServer(serverJobs) {
  // Sync local jobs with server jobs; keep only minimal fields needed for UI
  for (const job of serverJobs) {
    const prev = jobs.get(job.id);
    jobs.set(job.id, {
      id: job.id,
      color: job.color,
      text: prev?.text || "",
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      status: job.status,
      prompt: job.prompt,
    });
  }

  renderJobs();
  ensurePollingState();
}

function ensurePollingState() {
  const hasPending = Array.from(jobs.values()).some(
    (j) => j.status !== "completed" && j.status !== "failed"
  );
  if (hasPending) startPolling();
  else stopPolling();
}

function startPolling() {
  if (pollingIntervalId) return;
  // Poll immediately, then every interval
  pollOnce();
  pollingIntervalId = setInterval(pollOnce, POLLING_INTERVAL_MS);
}

function stopPolling() {
  if (!pollingIntervalId) return;
  clearInterval(pollingIntervalId);
  pollingIntervalId = null;
}

async function pollOnce() {
  try {
    const response = await fetch("http://localhost:1337/jobs");
    if (!response.ok) return;
    const data = await response.json();
    updateJobsFromServer(data.jobs || []);

    // If no jobs pending after update, stop polling
    const hasPending = Array.from(jobs.values()).some(
      (j) => j.status !== "completed" && j.status !== "failed"
    );
    if (!hasPending) stopPolling();
  } catch (error) {
    console.warn("Polling error:", error);
  }
}

// Save input value to localStorage
function saveLastInput(value) {
  try {
    localStorage.setItem("vibert-last-input", value);
  } catch (error) {
    console.error("Failed to save input to localStorage:", error);
  }
}

// Restore input value from localStorage
function restoreLastInput() {
  try {
    const lastInput = localStorage.getItem("vibert-last-input");
    const promptEl = document.getElementById("prompt");
    if (lastInput && promptEl) {
      promptEl.value = lastInput;
    }
  } catch (error) {
    console.error("Failed to restore input from localStorage:", error);
  }
}

// Clear saved input
function clearLastInput() {
  try {
    localStorage.removeItem("vibert-last-input");
  } catch (error) {
    console.error("Failed to clear input from localStorage:", error);
  }
}

// Dismiss a job from both UI and server
async function dismissJob(jobId, clickedElement) {
  try {
    const response = await fetch(`http://localhost:1337/jobs/${jobId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`Failed to dismiss job ${jobId}`);
    }

    // Remove from local state
    jobs.delete(jobId);

    // Remove the clicked alert/row from UI
    const row = clickedElement
      ? clickedElement.closest(`[data-job-id="${jobId}"]`)
      : document.querySelector(`[data-job-id="${jobId}"]`);
    if (row) row.remove();

    ensurePollingState();
  } catch (error) {
    console.error("Failed to dismiss job:", error);
    setStatus("Could not dismiss job. Try again.");
  }
}

// No details view in simplified UI

// Load jobs and restore last input when popup opens
document.addEventListener("DOMContentLoaded", () => {
  loadJobsFromServer();
  restoreLastInput();

  // Save input on every change
  const promptEl = document.getElementById("prompt");
  if (promptEl) {
    promptEl.addEventListener("input", (e) => {
      saveLastInput(e.target.value);
    });
  }

  // Minimal interaction: allow dismissing completed/failed jobs
  if (jobsEl) {
    jobsEl.addEventListener("click", (e) => {
      const dismissButton = e.target.closest("[data-dismiss-job]");
      if (dismissButton) {
        e.preventDefault();
        e.stopPropagation();
        const jobId = dismissButton.getAttribute("data-dismiss-job");
        dismissJob(jobId, dismissButton);
      }
    });
  }

  // Clear all completed/failed jobs
  const clearCompletedBtn = document.getElementById("clearCompleted");
  if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener("click", async () => {
      const doneJobIds = Array.from(jobs.values())
        .filter((j) => j.status !== "running")
        .map((j) => j.id);
      await Promise.all(doneJobIds.map((id) => dismissJob(id)));
    });
  }
});

function createRequestId() {
  jobCounter += 1;
  return `job_${Date.now()}_${jobCounter}`;
}

function setLoading(isLoading) {
  if (isLoading) {
    sendBtn.disabled = true;
    spinnerEl.style.display = "inline-block";
  } else {
    sendBtn.disabled = false;
    spinnerEl.style.display = "none";
  }
}

function setStatus(text) {
  if (!statusEl) return;
  if (text && String(text).trim()) {
    statusEl.textContent = text;
    statusEl.style.display = "block";
  } else {
    statusEl.textContent = "";
    statusEl.style.display = "none";
  }
}

async function collectContext(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: "collectContext",
    });
    if (!response?.ok) throw new Error(response?.error || "Failed");
    return response.context;
  } catch (err) {
    // Try to inject content script if not already present (MV3 scripting API)
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"],
      });
      const response = await chrome.tabs.sendMessage(tabId, {
        type: "collectContext",
      });
      if (!response?.ok) throw new Error(response?.error || "Failed");
      return response.context;
    } catch (_) {
      // Some pages (e.g., chrome://, Web Store, PDF viewer) won't allow scripts
      // Fallback: use tab metadata so URL/Title/Path are still populated
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tab && tab.url) {
          let path = "";
          try {
            const u = new URL(tab.url);
            path = u.pathname + u.search + u.hash;
          } catch (_) {
            path = tab.url;
          }
          return {
            path,
            url: tab.url || "",
            title: tab.title || "",
            selection: "",
            components: [],
          };
        }
      } catch (_) {}
      return { path: "", url: "", title: "", selection: "", components: [] };
    }
  }
}

function buildPrompt(userPrompt, pageContext) {
  const safeString = (value) =>
    typeof value === "string" ? value : value == null ? "" : String(value);

  const url = safeString(pageContext?.url) || "<unknown>";
  const path = safeString(pageContext?.path) || "<unknown>";
  const contextBlock = `Context:\n- URL: ${url}\n- Path: ${path}`;
  if (!userPrompt) return contextBlock;
  return `${userPrompt}\n\n${contextBlock}`;
}

async function invokeLocalAgent({ userPrompt, pageContext, requestId }) {
  const headers = { "content-type": "application/json" };
  const composedPrompt = buildPrompt(userPrompt, pageContext);
  const res = await fetch("http://localhost:1337/prompt", {
    method: "POST",
    headers,
    body: JSON.stringify({ prompt: composedPrompt, jobId: requestId }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `Server error: ${res.status} ${res.statusText} ${errorText}`
    );
  }

  const result = await res.json();
  return { jobId: result.jobId, status: result.status };
}

// Settings no longer required; always allow sending to local server
async function ensureSettings() {
  return true;
}

document.getElementById("openOptions").addEventListener("click", () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open("options.html");
  }
});

document.getElementById("send").addEventListener("click", async () => {
  try {
    const hasSettings = await ensureSettings();
    if (!hasSettings) {
      setStatus(
        "Missing settings. Click 'Settings' to configure your Local Agent URL."
      );
      return;
    }

    const tab = await getActiveTab();
    const prompt = document.getElementById("prompt").value.trim();
    if (!prompt) {
      setStatus("Please enter a prompt.");
      return;
    }

    (async () => {
      try {
        // Save input before clearing and clear prompt immediately after submit
        saveLastInput(prompt);
        document.getElementById("prompt").value = "";
        clearLastInput(); // Clear since we successfully submitted
        setLoading(true);
        setStatus("Running in background...");
        const pageContext = await collectContext(tab.id);
        const delay = (ms) => new Promise((r) => setTimeout(r, ms));
        await delay(1000); // keep spinner visible ~1s
        setLoading(false);
        setTimeout(() => setStatus(""), 2000);

        const requestId = createRequestId();

        // Optimistically add job to UI immediately (minimal fields)
        ensureJob(requestId, {
          color: generateHighContrastColor(),
          prompt: prompt,
          status: "running",
        });
        startPolling();

        const { jobId } = await invokeLocalAgent({
          userPrompt: prompt,
          pageContext,
          requestId,
        });

        // If server returned a different jobId, re-key the optimistic entry
        if (jobId && jobId !== requestId && jobs.has(requestId)) {
          const optimistic = jobs.get(requestId);
          jobs.delete(requestId);
          jobs.set(jobId, { ...optimistic, id: jobId });
          renderJobs();
        }
      } catch (error) {
        setStatus(String(error?.message || error));
      }
    })();
  } catch (error) {
    setStatus(String(error?.message || error));
  }
});

function generateHighContrastColor() {
  // Pick bright hues and high saturation for dark UIs
  const hue = Math.floor(Math.random() * 360);
  const saturation = 95; // percent
  const lightness = 70; // percent for readability on dark backgrounds
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

function ensureJob(id, { color, prompt, status }) {
  if (!jobs.has(id)) {
    jobs.set(id, {
      id,
      color: color || null,
      text: "",
      startedAt: Date.now(),
      finishedAt: null,
      prompt: prompt || id,
      status: status || "pending",
    });
    renderJobs();
  }
}

function renderJobs() {
  if (!jobsEl) return;

  // Clear existing content
  jobsEl.innerHTML = "";

  const sortedJobs = Array.from(jobs.values()).sort(
    (a, b) => b.startedAt - a.startedAt
  );

  sortedJobs.forEach((job) => {
    const status =
      job.status === "completed"
        ? "Done"
        : job.status === "failed"
          ? "Failed"
          : "Running";
    const isDone = job.status === "completed" || job.status === "failed";
    const shortPrompt = job.prompt
      ? job.prompt.length > 30
        ? job.prompt.substring(0, 30) + "..."
        : job.prompt
      : job.id;

    // Determine circle color based on status
    let circleColor = job.color || "#38bdf8"; // Default running color
    if (job.status === "completed") {
      circleColor = "#22c55e"; // Green for completed
    } else if (job.status === "failed") {
      circleColor = "#ef4444"; // Red for failed
    }

    // Create job row element
    const jobRow = document.createElement("div");
    jobRow.style.cssText = `display:flex; align-items:center; gap:6px; padding: 4px; border-radius: 4px;`;
    jobRow.setAttribute("data-job-id", job.id);
    // No nested details or clickable rows

    // Create circle indicator
    const circle = document.createElement("span");
    circle.style.cssText = `display:inline-block; width:10px; height:10px; border-radius:50%; background:${circleColor}`;

    // Create prompt text
    const promptSpan = document.createElement("span");
    promptSpan.style.cssText =
      "flex: 1; min-width: 0; text-overflow: ellipsis; overflow: hidden;";
    promptSpan.textContent = shortPrompt;

    // Create status text
    const statusSpan = document.createElement("span");
    statusSpan.style.cssText = `color: ${job.status === "failed" ? "#ef4444" : "inherit"}`;
    statusSpan.textContent = status;

    // Append elements
    jobRow.appendChild(circle);
    jobRow.appendChild(promptSpan);
    jobRow.appendChild(statusSpan);
    // Dismiss button for completed/failed jobs
    if (isDone) {
      const dismissBtn = document.createElement("button");
      dismissBtn.style.cssText =
        "margin-left: auto; padding: 2px 6px; font-size: 14px; font-weight: bold; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; min-width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;";
      dismissBtn.textContent = "×";
      dismissBtn.setAttribute("data-dismiss-job", job.id);
      jobRow.appendChild(dismissBtn);
    }

    jobsEl.appendChild(jobRow);
  });

  jobsEl.style.display = sortedJobs.length ? "block" : "none";
}
// No alert UI in simplified version
