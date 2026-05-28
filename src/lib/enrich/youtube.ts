// YouTube Data API v3 enrichment.
// Falls back gracefully if YOUTUBE_API_KEY missing or URL is not a YouTube video.

export interface YouTubeMetadata {
  videoId: string;
  title: string;
  channel: string;
  description: string;
  publishedAt: string;
  durationSec: number;
  viewCount: number;
  thumbnail: string;
}

// A YouTube video id is exactly 11 url-safe base64 chars. Validating against
// this prevents an attacker-controlled URL from injecting extra query params
// or path segments into the Data API request (SSRF / parameter injection).
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function extractVideoId(url: string): string | null {
  let raw: string | null = null;
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      raw = u.pathname.slice(1) || null;
    } else if (u.hostname === "youtube.com" || u.hostname.endsWith(".youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) {
        raw = v;
      } else {
        // /shorts/ID or /embed/ID
        const parts = u.pathname.split("/").filter(Boolean);
        if (parts[0] === "shorts" || parts[0] === "embed") raw = parts[1] ?? null;
      }
    }
  } catch {
    return null;
  }
  return raw && VIDEO_ID.test(raw) ? raw : null;
}

function parseISODuration(iso: string): number {
  // PT1H2M30S → 3750
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = Number(m[1] ?? 0);
  const min = Number(m[2] ?? 0);
  const s = Number(m[3] ?? 0);
  return h * 3600 + min * 60 + s;
}

export async function fetchYouTubeMetadata(
  url: string,
): Promise<YouTubeMetadata | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  const id = extractVideoId(url);
  if (!id) return null;
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${encodeURIComponent(id)}&key=${encodeURIComponent(key)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const item = json.items?.[0];
    if (!item) return null;
    return {
      videoId: id,
      title: item.snippet?.title ?? "",
      channel: item.snippet?.channelTitle ?? "",
      description: (item.snippet?.description ?? "").slice(0, 4000),
      publishedAt: item.snippet?.publishedAt ?? "",
      durationSec: parseISODuration(item.contentDetails?.duration ?? ""),
      viewCount: Number(item.statistics?.viewCount ?? 0),
      thumbnail:
        item.snippet?.thumbnails?.maxres?.url ??
        item.snippet?.thumbnails?.high?.url ??
        item.snippet?.thumbnails?.default?.url ??
        "",
    };
  } catch (err) {
    console.warn("[youtube] fetch failed", err);
    return null;
  }
}
