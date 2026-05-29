# Musemint API reference

Exact contract for the user's own Musemint instance. Base URL resolution is in
`SKILL.md`. The single-user demo instance needs **no API key** for every REST
endpoint below. MCP write tools are gated (see bottom).

---

## REST endpoints

### POST /api/capture
Save one item to memory. Rate limit: 40/min per IP (soft), plus a daily AI
budget on the server.

Request body (JSON):

| field        | type    | notes |
|--------------|---------|-------|
| `kind`       | string  | **required.** One of `url`, `note`, `prompt`, `screenshot`, `youtube`, `linkedin`, `instagram`, `github`, `article`, `text`. |
| `url`        | string  | `http(s)` only. Required-ish for URL kinds (see refine rules). |
| `title`      | string  | ≤ 280 chars. Optional; server derives one if absent. |
| `rawContent` | string  | ≤ 20000 chars. The pasted post body / note text. |
| `imageData`  | string  | base64 image, ≤ ~9 MB. Only for `kind: "screenshot"`; triggers OCR + vision. |
| `intent`     | string  | `remember` \| `project` \| `prompt` \| `learn` \| `jobsearch` \| `reminder` \| `summarize` \| `auto`. Default `auto`. |
| `process`    | boolean | Default `true`. Set `false` to store raw without AI processing. |

Validation refines:
- URL kinds (`url`/`youtube`/`linkedin`/`instagram`/`github`/`article`) need at
  least one of `url`, `title`, `rawContent`.
- Text kinds (`note`/`prompt`/`text`) need `rawContent` or `title`.
- `screenshot` needs `imageData`, `rawContent`, or `title`.

Response `200`: `{ "item": { id, kind, sourcePlatform, url, title, summary,
category, tagsJson, scoresJson, nextAction, intent, isProcessed, ... } }`
Response `400`: `{ "error": "invalid_input", "issues": {...} }`

YouTube URLs get enriched (real title, channel, description, duration, views).
Screenshots get OCR + a scene summary via vision.

---

### GET /api/search?q=QUERY
Search memory. Add `&semantic=1` for pgvector meaning-based search (falls back
to keyword silently if embeddings/AI are unavailable). Rate limit 60/min. `q`
is truncated to 500 chars.

Response: `{ "items": [{ id, title, summary, category, sourcePlatform,
score? }], "mode": "keyword" | "semantic" }`
`score` (0–1) is only present for semantic matches.

---

### GET /api/items?status=STATUS&q=QUERY
List captured items. Both params optional. `status` filters lifecycle
(e.g. `ready`, `inbox`); `q` is a text filter.

Response: `{ "items": [ ...captured items... ] }`

---

### POST /api/items/{itemId}/project
Promote a captured item into a buildable ProjectIdea. Rate limit 30/min.

Response: `{ "project": { id, title, ... } }`

---

### POST /api/projects/{projectId}/build-pack
Generate a full implementation pack for a project. Rate limit 20/min, uses AI
budget.

Response: `{ "buildPack": { markdown / structured sections: problem statement,
user stories, features, architecture, API plan, schema, tasks, README } }`

---

## MCP transport

Endpoint: `POST {base}/api/mcp` — JSON-RPC 2.0.

List tools:
```json
{ "jsonrpc": "2.0", "id": 1, "method": "tools/list" }
```

Call a tool:
```json
{ "jsonrpc": "2.0", "id": 2, "method": "tools/call",
  "params": { "name": "musemint_search", "arguments": { "query": "resume tips", "limit": 5 } } }
```

### Tools

| tool | access | args | purpose |
|------|--------|------|---------|
| `musemint_search` | **open** | `{ query, limit? }` | keyword search over title/summary/tags/category/platform |
| `musemint_list_projects` | **open** | `{}` | list buildable ideas w/ portfolio value + stack + `id` |
| `musemint_capture` | **gated** | `{ kind, url?, title?, rawContent?, intent? }` | save to memory |
| `musemint_generate_build_pack` | **gated** | `{ projectId }` | full build pack markdown |

Tool results come back as `{ result: { content: [{ type: "text", text }],
isError? } }` — read the `text`.

### Gating (writes only)

Write tools (`musemint_capture`, `musemint_generate_build_pack`) are enabled
**only** when the server has `MCP_SECRET` set, and the request must include
`Authorization: Bearer <MCP_SECRET>` (compared timing-safe). If unset, the
server reports them disabled — **fall back to the REST endpoints**, which need
no auth on the single-user instance. Read tools never require auth.

---

## Notes
- Rate limits are a per-warm-instance "soft guard," not a global cap. The hard
  limit is a DB-backed daily AI budget (default 200 ops/day) that fails safe.
- All data is scoped to a single demo user on this instance. Multi-user / per-user
  auth is a future (v2) capability.
