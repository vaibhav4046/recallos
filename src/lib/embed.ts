// Gemini text-embedding-004 (768 dims). Falls back to null when no key.

export const EMBED_DIMS = 768;

export async function embedText(text: string): Promise<number[] | null> {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) return null;
  const trimmed = text.replace(/\s+/g, " ").trim().slice(0, 8000);
  if (!trimmed) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { parts: [{ text: trimmed }] },
          taskType: "RETRIEVAL_DOCUMENT",
          outputDimensionality: EMBED_DIMS,
        }),
      },
    );
    if (!res.ok) {
      console.warn("[embed] non-200", res.status);
      return null;
    }
    const json = (await res.json()) as any;
    const values = json?.embedding?.values;
    if (!Array.isArray(values) || values.length !== EMBED_DIMS) return null;
    return values;
  } catch (err) {
    console.warn("[embed] error", err);
    return null;
  }
}

export async function embedQuery(text: string): Promise<number[] | null> {
  // Same model, query-type embedding for retrieval search.
  const key = process.env.GOOGLE_API_KEY;
  if (!key) return null;
  const trimmed = text.replace(/\s+/g, " ").trim().slice(0, 4000);
  if (!trimmed) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { parts: [{ text: trimmed }] },
          taskType: "RETRIEVAL_QUERY",
          outputDimensionality: EMBED_DIMS,
        }),
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const values = json?.embedding?.values;
    if (!Array.isArray(values) || values.length !== EMBED_DIMS) return null;
    return values;
  } catch {
    return null;
  }
}

export function vectorLiteral(v: number[]): string {
  // pgvector literal — `[0.1,0.2,...]`
  return "[" + v.join(",") + "]";
}
