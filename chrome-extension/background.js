// Keyboard shortcut + right-click context menu = one-shot capture (no popup).

const DEFAULT_ENDPOINT = "https://recallos-vaibhav4046s-projects.vercel.app";

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

async function captureTab(tab, selectionText) {
  if (!tab) return;
  const endpoint = await getEndpoint();
  const payload = {
    kind: detectKind(tab.url),
    url: tab.url,
    title: tab.title,
    rawContent: selectionText || undefined,
    intent: "auto",
    process: true,
  };
  try {
    const res = await fetch(endpoint + "/api/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    chrome.action.setBadgeBackgroundColor({ color: "#3ddc97" });
    chrome.action.setBadgeText({ text: "✓", tabId: tab.id });
    setTimeout(() => chrome.action.setBadgeText({ text: "", tabId: tab.id }), 2400);
  } catch (err) {
    chrome.action.setBadgeBackgroundColor({ color: "#ff6b81" });
    chrome.action.setBadgeText({ text: "!", tabId: tab.id });
    setTimeout(() => chrome.action.setBadgeText({ text: "", tabId: tab.id }), 2400);
    console.error("[Musemint] capture failed", err);
  }
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "capture-tab") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await captureTab(tab);
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "musemint-capture-page",
    title: "Save page to Musemint",
    contexts: ["page"],
  });
  chrome.contextMenus.create({
    id: "musemint-capture-selection",
    title: "Save selection to Musemint",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "musemint-capture-link",
    title: "Save link to Musemint",
    contexts: ["link"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "musemint-capture-page") {
    await captureTab(tab);
  } else if (info.menuItemId === "musemint-capture-selection") {
    await captureTab(tab, info.selectionText);
  } else if (info.menuItemId === "musemint-capture-link" && info.linkUrl) {
    await captureTab({ ...tab, url: info.linkUrl, title: info.selectionText || info.linkUrl });
  }
});
