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

export function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (u.hostname.endsWith("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      // /shorts/ID or /embed/ID
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "shorts" || parts[0] === "embed") return parts[1] ?? null;
    }
  } catch {
    return null;
  }
  return null;
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
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${id}&key=${key}`,
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
