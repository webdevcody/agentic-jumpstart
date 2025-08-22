const urlInput = document.getElementById("agentUrl");
const tokenInput = document.getElementById("authToken");
const statusEl = document.getElementById("status");
const toggleBtn = document.getElementById("toggle");

async function load() {
  const { localAgentUrl, localAgentAuthToken } = await chrome.storage.sync.get([
    "localAgentUrl",
    "localAgentAuthToken",
  ]);
  if (localAgentUrl) urlInput.value = localAgentUrl;
  if (localAgentAuthToken) tokenInput.value = localAgentAuthToken;
  if (localAgentUrl) {
    statusEl.textContent = "Saved";
    statusEl.className = "ok";
  } else {
    statusEl.textContent = "No settings saved";
    statusEl.className = "muted";
  }
}

async function save() {
  const url = (urlInput.value || "").trim();
  const token = (tokenInput.value || "").trim();
  if (!url) {
    statusEl.textContent = "Please enter a Local Agent URL";
    statusEl.className = "error";
    return;
  }
  await chrome.storage.sync.set({ localAgentUrl: url, localAgentAuthToken: token });
  statusEl.textContent = "Saved";
  statusEl.className = "ok";
}

function toggleVisibility() {
  tokenInput.type = tokenInput.type === "password" ? "text" : "password";
  toggleBtn.textContent = tokenInput.type === "password" ? "Show" : "Hide";
}

load();

document.getElementById("save").addEventListener("click", save);

toggleBtn.addEventListener("click", toggleVisibility);
