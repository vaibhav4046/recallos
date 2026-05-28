// Screenshot OCR + scene understanding via Gemini 2.5 Flash (multimodal).
// Returns null when no key is configured or the image can't be read, so the
// capture pipeline degrades gracefully to the user's note / filename.

export type VisionResult = { text: string; summary: string };

const MODEL = "gemini-2.5-flash";
// ~5.2 MB of base64 — matches the client-side upload guard.
const MAX_B64 = 7_000_000;

export async function describeImage(dataUrl: string): Promise<VisionResult | null> {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) return null;

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
  if (!match) return null;
  const mimeType = match[1];
  const data = match[2];
  if (!data || data.length > MAX_B64) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    "You are an OCR and screenshot-understanding engine. Extract ALL readable text " +
                    "from this image verbatim, then write one short sentence describing what the " +
                    'screenshot shows. Respond ONLY as JSON: {"text": string, "summary": string}.',
                },
                { inlineData: { mimeType, data } },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
        }),
      },
    );
    if (!res.ok) {
      console.warn("[vision] non-200", res.status);
      return null;
    }
    const json = (await res.json()) as any;
    const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw || typeof raw !== "string") return null;

    const parsed = JSON.parse(raw);
    const text = typeof parsed?.text === "string" ? parsed.text : "";
    const summary = typeof parsed?.summary === "string" ? parsed.summary : "";
    if (!text && !summary) return null;

    return { text: text.slice(0, 12_000), summary: summary.slice(0, 600) };
  } catch (err) {
    console.warn("[vision] error", err);
    return null;
  }
}
