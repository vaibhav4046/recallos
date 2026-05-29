/**
 * Escape user-controlled text for safe interpolation into HTML (e.g. the digest
 * email built in api/notifications/run). Item titles are free-text and can come
 * from external APIs, so anything placed into HTML must pass through this first.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
