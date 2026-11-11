# Tick

A minimal personal time tracker: timer, projects, tags, reports and a calendar.

**[Live demo →](https://yuragets.github.io/tick/)**

![Tick demo: calendar view and day details](media/demo.gif)

<!-- Full demo video (media/demo.mp4): drag it into the GitHub editor here -->

## Features

- One-click timer with pause/resume; a running timer survives page reloads
- Projects with colors, tags, and descriptions editable while the timer runs
- Manual entry editing, filtering by project and tag, month-by-month list
- Reports for today / week / month / custom range
- Charts by project and by day, plus a calendar view
- Earnings calculator from tracked hours and an hourly rate
- Export to CSV (Excel-compatible), PNG image and JSON backup; CSV / JSON import
- Dark and light themes, English and Ukrainian UI

## Data stays in your browser

The live demo has no backend and no account. Everything is saved in your
browser's `localStorage`, so it never leaves your device — and it is gone if you
clear site data or switch browsers. Use **Export backup** (in the notice bar or
in Settings) to keep a JSON copy; import it to restore.

## Run locally

Locally, Tick runs with a small backend that stores data in a SQLite file.

```bash
npm run setup   # installs frontend and backend dependencies
npm run dev     # web app on :5173, API on :3001
```

- Data file: `server/data/tracker.db` — created on first run, ignored by git
- `PORT` sets the backend port; `VITE_API_URL` points the frontend elsewhere
- `npm run build:pages` builds the browser-only version served on GitHub Pages
- `npm run record:demo` re-records `media/` (demo video, GIF, poster); needs Google Chrome
- After cloning, run `git config core.hooksPath .githooks` to enable the repo's git hooks

## Tech stack

- **Frontend:** React 18, TypeScript, Vite 5, Zustand, Tailwind CSS, Recharts, Zod
- **Backend:** Express 4, TypeScript (`tsx`), better-sqlite3, Zod
- **Hosting:** GitHub Pages via GitHub Actions

## License

[MIT](LICENSE) © 2026 Yurii
