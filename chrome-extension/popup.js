const DEFAULT_ENDPOINT = "https://recallos-vaibhav4046s-projects.vercel.app";

const titleEl = document.getElementById("title");
const urlEl = document.getElementById("url");
const noteEl = document.getElementById("note");
const intentEl = document.getElementById("intent");
const statusEl = document.getElementById("status");
const saveBtn = document.getElementById("save");
const cancelBtn = document.getElementById("cancel");
const endpointLink = document.getElementById("endpoint-link");
const changeEndpoint = document.getElementById("change-endpoint");

function setStatus(text, tone) {
  statusEl.textContent = text;
  statusEl.className = "status" + (tone ? " " + tone : "");
}

async function getEndpoint() {
  const { musemintEndpoint } = await chrome.storage.sync.get("musemintEndpoint");
  return musemintEndpoint || DEFAULT_ENDPOINT;
}

function detectKind(url) {
  const u = (url || "").toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("linkedin.com")) return "linkedin";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("github.com")) return "github";
  if (u.startsWith("http")) return "url";
  return "note";
}

async function bootstrap() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    titleEl.value = tab.title || "";
    urlEl.value = tab.url || "";
  }
  const ep = await getEndpoint();
  endpointLink.textContent = ep.replace(/^https?:\/\//, "");
  endpointLink.href = ep;
}

changeEndpoint.addEventListener("click", async (e) => {
  e.preventDefault();
  const current = await getEndpoint();
  const next = prompt("Musemint endpoint URL:", current);
  if (next) {
    await chrome.storage.sync.set({ musemintEndpoint: next });
    endpointLink.textContent = next.replace(/^https?:\/\//, "");
    endpointLink.href = next;
  }
});

cancelBtn.addEventListener("click", () => window.close());

saveBtn.addEventListener("click", async () => {
  saveBtn.disabled = true;
  setStatus("Saving…");
  try {
    const endpoint = await getEndpoint();
    const payload = {
      kind: detectKind(urlEl.value),
      url: urlEl.value || undefined,
      title: titleEl.value || undefined,
      rawContent: noteEl.value || undefined,
      intent: intentEl.value,
      process: true,
    };
    const res = await fetch(endpoint + "/api/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const { item } = await res.json();
    setStatus(`Captured · ${item.category || "saved"}`, "ok");
    setTimeout(() => window.close(), 900);
  } catch (err) {
    setStatus(err.message || "Failed", "err");
  } finally {
    saveBtn.disabled = false;
  }
});

bootstrap();
