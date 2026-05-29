#!/usr/bin/env bash
# Save one item to Musemint memory from any shell (phone term, laptop, CI).
# No API key needed on the single-user instance.
#
# Usage:
#   ./capture.sh url      "https://youtu.be/xyz"            "optional title"
#   ./capture.sh note     ""                                "title" "body text..."
#   ./capture.sh linkedin "https://linkedin.com/posts/..."  "pasted post text"
#
# Base URL: $MUSEMINT_BASE_URL, else config.json baseUrl, else the default.

set -euo pipefail

KIND="${1:?kind required (url|note|prompt|youtube|linkedin|instagram|github|article|text)}"
URL="${2:-}"
TITLE="${3:-}"
BODY="${4:-}"
INTENT="${MUSEMINT_INTENT:-auto}"

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
base="${MUSEMINT_BASE_URL:-}"
if [ -z "$base" ] && [ -f "$here/config.json" ]; then
  base="$(grep -o '"baseUrl"[^,}]*' "$here/config.json" | sed -E 's/.*"baseUrl"\s*:\s*"([^"]+)".*/\1/')"
fi
base="${base:-https://recallos-vaibhav4046s-projects.vercel.app}"
base="${base%/}"

# Prefer jq when present; otherwise build JSON in pure bash (no python needed).
json_escape() {
  # Escape backslash, double-quote, and control chars for a JSON string value.
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\r'/\\r}"
  s="${s//$'\t'/\\t}"
  printf '%s' "$s"
}

payload() {
  if command -v jq >/dev/null 2>&1; then
    jq -nc --arg k "$KIND" --arg u "$URL" --arg t "$TITLE" --arg b "$BODY" --arg i "$INTENT" \
      '{kind:$k, intent:$i} + (if $u!="" then {url:$u} else {} end) + (if $t!="" then {title:$t} else {} end) + (if $b!="" then {rawContent:$b} else {} end)'
    return
  fi
  local out="{\"kind\":\"$(json_escape "$KIND")\",\"intent\":\"$(json_escape "$INTENT")\""
  [ -n "$URL" ]   && out="$out,\"url\":\"$(json_escape "$URL")\""
  [ -n "$TITLE" ] && out="$out,\"title\":\"$(json_escape "$TITLE")\""
  [ -n "$BODY" ]  && out="$out,\"rawContent\":\"$(json_escape "$BODY")\""
  printf '%s}' "$out"
}

curl -fsS -X POST "$base/api/capture" \
  -H "Content-Type: application/json" \
  -d "$(payload)"
echo
