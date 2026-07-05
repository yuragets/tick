# Tick — personal time tracker

A time tracker with projects, tags, reports, a calendar and charts. Data is
stored **locally on your machine** in a SQLite file — the frontend talks to a
local backend service over HTTP. Nothing goes to the cloud.

## Stack

**Frontend**
- **React 18** + **TypeScript**
- **Vite 5** — bundler
- **Zustand** — state management
- **Tailwind CSS** — styling
- **Recharts** — charts
- **Zod** — data validation

**Backend** (`server/`)
- **Express 4** + **TypeScript** (run via `tsx`, no build step)
- **better-sqlite3** — SQLite storage
- **Zod** — server-side validation

## Storage architecture

```
React (browser)
   └── ApiAdapter ──HTTP──> Express (localhost:3001)
                                └── better-sqlite3 ──> server/data/tracker.db
```

The storage layer is abstracted behind a `StorageAdapter` interface. `ApiAdapter`
is currently active (talks to the backend). `LocalStorageAdapter` is kept as a
fallback and as the source for the one-time migration of old browser data.

## Features

- Timer that restores the running entry after a reload
- Projects with colors, and tags
- Manual entry editing
- Filtering by project and tag
- Reports: today / week / month / custom range
- Charts by project and by day, plus a calendar heatmap
- CSV export with BOM (UTF-8, Excel-compatible)
- CSV / JSON import
- Dark / light theme switch
- UI language switch (English / Ukrainian)

## Install

Installs both frontend **and** backend dependencies:

```bash
npm run setup
```

> `better-sqlite3` is a native module; installation pulls a prebuilt binary
> (prebuild). A separate compile step is usually not required.

## Run

Starts the frontend and backend with a single command (via `concurrently`):

```bash
npm run dev
```

- Web app: `http://localhost:5173`
- Data service (API): `http://localhost:3001`

You can also run the processes separately:

```bash
npm run dev:web      # Vite only
npm run dev:server   # backend only
```

The backend port is set via the `PORT` variable (default `3001`); the base URL
for the frontend is set via `VITE_API_URL` (create a `.env.local`).

## Where the data lives

```
server/data/tracker.db
```

The SQLite file is created automatically on the backend's first run. The
`server/data/` folder is in `.gitignore`, so data never lands in the repository.

For backups, use **↓ CSV** in the reports view or copy the `tracker.db` file.

## Migration from the old version

If your data used to live in the browser (`localStorage`, key `chronos-v1`), it
is migrated automatically on the first launch against an empty backend — no
prompt. The old copy in the browser is left untouched as a safety net.

## Security

- A CSP meta tag blocks external scripts and `eval`
- Zod validation on both the frontend and the backend
- Export is protected against CSV injection
- CORS is restricted to localhost origins
- Import limits on file size and entry count

## Reference

`tracker.html` — the original prototype (vanilla HTML/CSS/JS), kept for
comparison.

---

This repo enforces English-only content via git hooks in `.githooks/`; run `git config core.hooksPath .githooks` once after cloning.
