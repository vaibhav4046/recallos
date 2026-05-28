# Musemint Chrome Extension

One-click capture from any web page into your Musemint memory.

## Features

- **Popup** — edit title/note/intent before saving.
- **Right-click menu** — save page / selection / link in one click.
- **Keyboard shortcut** — `Alt+Shift+R` saves the current tab instantly.
- **Endpoint config** — defaults to the public Musemint deployment; change in the popup to point at your own.

## Install (developer mode)

1. Open `chrome://extensions/`
2. Toggle **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this `chrome-extension/` folder
5. Optional: pin the extension to the toolbar

## Endpoint

Default: `https://recallos-vaibhav4046s-projects.vercel.app`

Click **change** in the popup to point at a self-hosted Musemint (e.g. `http://localhost:3000`).

## Icons

Drop 16/48/128 PNG icons into `icons/`. The default extension will load without them but Chrome will use a placeholder.

## How it works

```text
[ active tab ]
      │
      ▼
[ extension ] ── POST /api/capture ──▶ [ Musemint ]
      │                                     │
      ▼                                     ▼
 toast / badge                        AI processing,
                                      scoring, storage
```

`POST /api/capture` body:
```json
{
  "kind": "youtube|url|note|...",
  "url": "https://...",
  "title": "page title",
  "rawContent": "selection or note",
  "intent": "auto",
  "process": true
}
```
