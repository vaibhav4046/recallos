# Musemint

> **Stop saving. Start building.**
>
> Musemint is an AI-powered personal memory and execution system. It captures saved content from YouTube, LinkedIn, Instagram, browser links, screenshots, notes, GitHub repos, and pasted text — then turns them into actionable project briefs, prompt libraries, reminders, learning plans, job-search actions, and GitHub-ready implementation packs.

**Live**: https://recallos-vaibhav4046s-projects.vercel.app
**Source**: https://github.com/vaibhav4046/recallos

A production-quality MVP built with Next.js App Router, Prisma, Tailwind, and a pluggable AI provider layer that runs **fully offline with a deterministic mock provider** until you bring your own key.

### Production stack (free-tier everything)

| Layer | Provider | Status |
|---|---|---|
| Hosting | Vercel (Hobby) | Live |
| Database | Neon Postgres (free) | Connected |
| Primary LLM | Gemini 2.5 Flash | Connected |
| Fallback LLM | Groq Llama 3.1 8B Instant | Connected |
| Tertiary LLM | Mistral Small | Connected |
| YouTube enrichment | YouTube Data API v3 | Connected — pulls title, channel, duration, views, thumbnail |
| Last-resort | Deterministic mock provider | Always available |

---

## What it does

- **Universal Capture** — URLs, notes, prompts, screenshots, YouTube / LinkedIn / Instagram / GitHub / articles, all into a single normalized `CapturedItem`.
- **AI Inbox triage** — each capture gets a 1–2 sentence summary, category, tags, and three scores: usefulness, actionability, portfolio value, plus a suggested next action.
- **Ready to Build** — clusters of captures become project briefs (difficulty, est. build time, tech stack, GitHub readiness, portfolio value).
- **Build Pack Generator** — one click expands a brief into a full implementation pack: problem statement, user stories, features, architecture, API plan, DB schema, UI screens, tasks, prompts, README draft, resume bullets. Exports as Markdown, README, JSON, or GitHub-style checklist.
- **Memory Graph** — clustered view of all saved content by category.
- **Prompt Library** — every saved prompt is improved + quality-scored. Copy or "use for new project".
- **Learning Queue** — saved tutorials/courses become priority-ranked study sprints with a "build something from this" CTA.
- **Job-Search Vault** — resume bullets, recruiter templates, interview prep, skill gaps, application reminders.
- **Content Studio** — LinkedIn posts, X threads, blog outlines, YouTube scripts, carousel concepts.
- **Reminders** — light-touch nudges for forgotten saves, weekend builds, learning reviews, job-search outreach.
- **Integrations** — YouTube, LinkedIn, Instagram, Chrome ext, mobile, screenshot OCR, GitHub, Notion, Drive, Gmail, Telegram, MCP.
- **Settings + Privacy** — API key status (no values shown), local-first toggle, full JSON export, complete wipe.
- **Mobile preview** at `/mobile` showing share-sheet, save confirmation, OCR, push, and "build pack ready" mockups.

## Screenshots

> Place screenshots in `public/screenshots/` and reference them here:
>
> - `dashboard.png` — daily AI digest + stats
> - `inbox.png` — scored cards with triage actions
> - `build-pack.png` — exportable implementation brief
> - `memory-graph.png` — cluster bubbles
> - `mobile.png` — phone-frame mockups

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom design tokens |
| UI primitives | shadcn-style components built on Radix |
| ORM | Prisma |
| DB | SQLite locally · swap `DATABASE_URL` for Postgres / Supabase |
| AI | Pluggable provider: Gemini → OpenAI → Anthropic → Groq → **deterministic mock** |
| Validation | Zod |
| Forms | React Hook Form (in capture flow) |
| Tests | Vitest (unit) · Playwright (E2E) |

## Setup

```bash
git clone <your-repo> recallos
cd recallos
cp .env.example .env       # then fill in any AI keys you have
npm install
npm run db:push            # create the SQLite schema
npm run db:seed            # load realistic demo data
npm run dev                # http://localhost:3000
```

> You can run Musemint **fully offline** with no AI keys — the mock provider produces deterministic outputs so every flow works end-to-end.

## Environment variables

Every variable is **optional** — see [`.env.example`](.env.example) for the full, annotated list. With an empty file the app runs as an open single-user demo on local SQLite with the deterministic mock AI provider.

```bash
DATABASE_URL="file:./dev.db"      # or a postgres:// URL for Neon/Supabase

# AI — first non-empty wins; mock provider if all blank.
GOOGLE_API_KEY=""
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
GROQ_API_KEY=""
MISTRAL_API_KEY=""

YOUTUBE_API_KEY=""                # optional enrichment (YouTube Data API v3)

# Auth — opt-in single-password gate. Blank = open demo.
APP_PASSWORD=""
AUTH_SECRET=""                    # optional; rotating it logs everyone out
```

Notifications (Web Push / email digest / cron) and security knobs (`MCP_SECRET`, `MUSEMINT_DAILY_AI_BUDGET`) are documented in `.env.example`; all stay dormant until configured.

The provider is picked in priority order: **Gemini → OpenAI → Anthropic → Groq → Mistral → Mock**. See [`src/lib/ai/provider.ts`](src/lib/ai/provider.ts).

## Run commands

```bash
npm run dev          # local dev server (Next.js)
npm run build        # production build (runs prisma generate + next build)
npm run start        # serve the production build
npm run lint         # next lint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright smoke tests (boots dev server)
npm run db:push      # apply Prisma schema to SQLite
npm run db:seed      # load demo data
npm run db:reset     # nuke + reseed
```

## Architecture

```
recallos/
├── prisma/
│   ├── schema.prisma          # User, CapturedItem, Tag, Collection,
│   │                          # ProjectIdea, BuildPack, Prompt,
│   │                          # Reminder, Integration, AiProcessingLog
│   ├── seed.ts                # realistic demo data
│   └── dev.db                 # SQLite (gitignored)
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Shell: Sidebar + TopBar + RightPanel + Toasts
│   │   ├── dashboard/         # daily digest + stats + ready-to-build
│   │   ├── inbox/             # scored triage
│   │   ├── capture/           # universal capture flow
│   │   ├── ready-to-build/    # project ideas
│   │   ├── build-packs/[id]/  # full implementation brief + exports
│   │   ├── memory-graph/      # cluster bubbles
│   │   ├── prompts/           # AI-improved prompt library
│   │   ├── learning/          # priority-ranked study sprints
│   │   ├── job-search/        # vault
│   │   ├── content-studio/    # LI / X / blog / YT / carousels
│   │   ├── reminders/         # CRUD + snooze + done
│   │   ├── integrations/      # cards w/ status
│   │   ├── settings/          # provider status, export, wipe
│   │   ├── mobile/            # phone-frame mockups
│   │   ├── error.tsx / loading.tsx / not-found.tsx
│   │   └── api/
│   │       ├── capture/route.ts
│   │       ├── items/{[id]/{process,project},route}.ts
│   │       ├── projects/{route,[id]/build-pack}.ts
│   │       ├── build-packs/[id]/route.ts
│   │       ├── prompts/route.ts
│   │       ├── reminders/{route,[id]}.ts
│   │       ├── integrations/{route,[id]}.ts
│   │       ├── search/route.ts
│   │       ├── stats/route.ts
│   │       ├── settings/route.ts
│   │       ├── digest/route.ts
│   │       └── export/route.ts (GET + DELETE)
│   ├── components/
│   │   ├── shell/ (Sidebar, TopBar, RightPanel, MobileNav)
│   │   ├── ui/    (Card, Button, Badge/ScoreBar, EmptyState, Toast)
│   │   └── ItemCard.tsx
│   └── lib/
│       ├── prisma.ts          # single-user demo upsert
│       ├── queries.ts         # listItems / listProjects / getStats / …
│       ├── capture.ts         # zod schema + createCapture orchestrator
│       ├── scoring.ts         # deterministic heuristic scoring + tagging
│       ├── utils.ts           # cn / formatRelative / detectPlatform …
│       └── ai/
│           ├── provider.ts          # Gemini/OpenAI/Anthropic/Groq/Mock
│           ├── processItem.ts       # capture → category/tags/scores/action
│           ├── generateBuildPack.ts # idea → full pack + md/checklist
│           ├── improvePrompt.ts     # prompt → improved + score
│           └── generateDigest.ts    # items+projects+reminders → digest
└── tests/
    ├── unit/    (scoring, ai-mock, capture, utils, buildpack)
    └── e2e/     (smoke: dashboard, inbox, capture, ready-to-build)
```

### AI provider abstraction

`getProvider()` reads env once, picks the first configured client, and falls back to the deterministic mock provider if SDK init fails. Every AI service file (`processItem`, `generateBuildPack`, `improvePrompt`, `generateDigest`) calls the provider with a JSON-shaped system prompt and **always** has a heuristic fallback so the UI is never blank.

Provider priority: **Gemini → OpenAI → Anthropic → Groq → Mistral → Mock**

### YouTube enrichment

Set `YOUTUBE_API_KEY` (separate from `GOOGLE_API_KEY` so it can be restricted to YouTube Data API v3) and every saved YouTube URL is auto-enriched on capture: real title overrides the fallback, full description joins the rawContent before AI processing, and `metadataJson` is populated with `{ channel, publishedAt, durationSec, viewCount, thumbnail, videoId }`. See `src/lib/enrich/youtube.ts`.

### Data flow for a single capture

1. `POST /api/capture` validates input with Zod (`CaptureSchema`).
2. `createCapture` derives the title, detects platform from URL, runs `processItem()`.
3. `processItem` calls the active provider with a JSON-only system prompt; on parse failure it returns deterministic heuristic scores so the inbox always populates.
4. Tags are upserted, the `CapturedItem` is created, and an `AiProcessingLog` row records provider + latency.
5. The dashboard, inbox, and right-side digest panel all re-render via Next.js fetch.

### Build pack generation

`POST /api/projects/:id/build-pack` → `generateBuildPack()` → persists `BuildPack` with `markdown`, `readme`, `checklist` columns. The detail page reads them straight out; downloads stream from `/api/build-packs/:id?format=markdown|readme|checklist|json`.

## Platform limitations

- **LinkedIn / Instagram saved posts** cannot be programmatically scraped without violating ToS. Musemint supports them via:
  - the native share sheet,
  - pasted URL,
  - screenshot upload + OCR,
  - browser extension (planned).
- **Chrome extension, iOS share extension, Android share target** are wired in the integrations page as `coming_soon` — the data model already supports captures from those sources.
- **MCP server, Telegram bot, Notion export, GitHub issue export** are stubbed integrations; the underlying schemas + APIs support them and the next slice is mostly transport code.
- **YouTube official import** requires `YOUTUBE_API_KEY`; without it the integration is shown as `available` but not active.

## Authentication model

Musemint is intentionally **single-user**: one deployment is one person's memory
vault. There are two modes, chosen by whether `APP_PASSWORD` is set:

| Mode | `APP_PASSWORD` | Who can access | Data wipe (`DELETE /api/export`) |
| --- | --- | --- | --- |
| **Open demo** | unset | anyone with the URL | **disabled** (returns 403) |
| **Private instance** | set | whoever knows the password | enabled for the owner |

When a password is set, `middleware.ts` gates every route: visitors enter it once
on `/login` and receive an httpOnly cookie holding a SHA-256 token derived from
`APP_PASSWORD` (+ optional `AUTH_SECRET`). The raw password is never stored in the
cookie, comparison is constant-time, and the gate is edge-safe (Web Crypto only).
The machine-to-machine cron route (`/api/notifications/run`) is exempt because it
carries its own timing-safe bearer secret.

**Multi-tenancy (per-account login, org sharing) is explicitly out of scope** for
this build. It is deliberately deferred, not forgotten: the bundled Claude skill
and MCP/REST surface are designed around keyless single-user access, so true
multi-tenancy is a separate milestone that would touch the data model, the skill
transport, and the auth layer together. For shared use today, run one instance
per person.

## Security & privacy notes

- API keys are read only from `process.env`. They are **never** rendered to the client and the Settings page only exposes a boolean "configured" flag.
- Default storage is local SQLite. Set `DATABASE_URL=postgres://…` to migrate to Postgres / Supabase.
- The capture flow does not log raw secrets and the AI provider layer never persists prompts outside the database.
- Privacy controls in the UI: local-first toggle, full JSON export, complete memory wipe (`DELETE /api/export`).
- No third-party scraping. Private-network captures (LinkedIn, Instagram) require the user to act — Musemint only processes what arrives through the share sheet, paste, or screenshot.

## Roadmap

- [ ] iOS share extension
- [ ] Android share target
- [ ] Chrome browser extension
- [ ] YouTube OAuth import (liked + watch later)
- [ ] Real screenshot OCR (Tesseract / cloud OCR)
- [ ] Telegram bot capture
- [ ] **MCP server** exposing captured memory as tools
- [ ] VS Code extension
- [ ] Notion export
- [ ] GitHub Issues export from build packs
- [ ] Vector embeddings + semantic search (the abstraction is already keyword-only but pluggable)
- [ ] Local-first encrypted storage

## What was built

- 14 routes (`/`, `/dashboard`, `/inbox`, `/capture`, `/ready-to-build`, `/build-packs/[id]`, `/memory-graph`, `/prompts`, `/learning`, `/job-search`, `/content-studio`, `/reminders`, `/integrations`, `/settings`) + `/mobile` preview + error/loading/not-found.
- 19 API routes covering capture, items (process / project), projects, build-packs (multi-format export), prompts, reminders, search, stats, integrations, settings, digest, and export/delete.
- Full Prisma schema with 10 models and realistic seed data (8 captures, 3 prompts, 4 reminders, 12 integrations, 3 project ideas).
- AI provider abstraction with deterministic mock fallback for every AI task.
- 21 Vitest unit tests across scoring, utils, AI mock, capture schema, and build pack generation — all green.
- Playwright smoke spec for dashboard / inbox / capture / ready-to-build (run after `npx playwright install`).
- Polished dark Linear/Raycast-style UI: sidebar + command bar + workspace + right insights panel + toasts.

## License

MIT — fork it, ship it.
