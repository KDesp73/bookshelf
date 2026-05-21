# BookShelf

A private, mobile-responsive web app to catalog your personal book collection. Scan ISBN barcodes with your phone camera, fetch metadata from Open Library and Google Books, and browse your library with server-side search and filters.

## Stack

- **Next.js 16** (App Router, React 19, Server Actions)
- **MongoDB** + Mongoose
- **Tailwind CSS 4** + Radix UI primitives
- **html5-qrcode** for barcode scanning

## Getting started

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Start MongoDB locally (or use Atlas) and set `MONGODB_URI` in `.env.local`.

3. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Troubleshooting dev server

If you see a Turbopack panic (`Next.js package not found` on `/add` or other routes):

1. Stop the dev server and delete the cache: `rm -rf .next`
2. Reinstall if needed: `rm -rf node_modules && npm install`
3. The default `npm run dev` uses `--webpack` to avoid this Turbopack issue on Next.js 16.

## Features

- **Scan flow** — Camera scans EAN-13 ISBN barcodes, beeps on success, looks up metadata, confirms before save
- **Duplicate detection** — Alerts if the ISBN is already in your library
- **Dashboard** — Responsive cover grid with hover details
- **URL filters** — `?search=dune&status=Read&tag=Sci-Fi&sort=title`
- **Manual entry** — Multi-step form for books without reliable API metadata
- **Admin login** — Password-protected editing; guests browse read-only
- **Book details** — Read-only detail view; admins can edit status, tags, notes, and cover

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `ADMIN_PASSWORD` | Prod | Admin password (dev default: `admin` if unset) |
| `SESSION_SECRET` | Prod | Random string for signing session cookies |
| `BOOKSHELF_USER_ID` | No | User isolation key (default: `default-user`) |
| `GOOGLE_BOOKS_API_KEY` | No | Optional Google Books API key |
| `THEBOOKDB_API_KEY` | No | Optional TheBookDB metadata API key |
| `ISBNDB_API_KEY` | No | Optional ISBNdb API key (higher coverage) |

## Project structure

```
app/              # Routes (dashboard, scan, add)
actions/          # Server Actions
components/       # UI, scanner, library
lib/books/        # ISBN utils, API lookup, queries
models/           # Mongoose Book schema
```
