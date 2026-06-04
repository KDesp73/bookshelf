# BookShelf

A social book catalog: scan ISBN barcodes, rate your reads Letterboxd-style, and discover other readers' collections.

## Stack

- **Next.js 16** (App Router, React 19, Server Actions)
- **Auth.js (NextAuth v5)** — email/password + optional Google/GitHub OAuth
- **MongoDB** + Mongoose
- **Tailwind CSS 4** + Radix UI primitives
- **html5-qrcode** for barcode scanning

## Getting started

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Set `MONGODB_URI` and `AUTH_SECRET` in `.env.local`. Optionally add OAuth credentials.

3. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Guests see the landing page at `/`; sign up to create your shelf.

### Troubleshooting dev server

If you see a Turbopack panic (`Next.js package not found` on `/add` or other routes):

1. Stop the dev server and delete the cache: `rm -rf .next`
2. Reinstall if needed: `rm -rf node_modules && npm install`
3. The default `npm run dev` uses `--webpack` to avoid this Turbopack issue on Next.js 16.

## Features

- **Personal library** — Scan or manually add books scoped to your account
- **Half-star ratings** — Rate books 0.5–5 stars, visible on your public profile
- **Public profiles** — `/u/username` shows a reader's collection (notes stay private)
- **Collection likes** — Like other users' shelves from their profile
- **Discover** — Browse and search readers by username
- **Admin panel** — `/admin` for platform admins to manage users and collections
- **URL filters** — `?search=dune&status=Read&tag=Sci-Fi&sort=title`

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `AUTH_SECRET` | Yes | Random string for Auth.js session signing |
| `AUTH_URL` | Recommended | Public site URL, e.g. `https://your-app.vercel.app` (no trailing slash). Required for OAuth on Vercel. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | No | Google OAuth — see [Google OAuth setup](#google-oauth-setup) |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | No | GitHub OAuth — callback: `https://YOUR-DOMAIN/api/auth/callback/github` |
| `ADMIN_EMAIL` | No | Email address auto-promoted to admin on sign-in |
| `GOOGLE_BOOKS_API_KEY` | No | Optional Google Books API key |
| `THEBOOKDB_API_KEY` | No | Optional TheBookDB metadata API key |
| `ISBNDB_API_KEY` | No | Optional ISBNdb API key (higher coverage) |

### Google OAuth setup

`redirect_uri_mismatch` means Google Cloud Console does not list the exact callback URL your app uses.

1. In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials** → your **OAuth 2.0 Client ID** (Web application).
2. Under **Authorized redirect URIs**, add every URL you sign in from:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://YOUR-DOMAIN/api/auth/callback/google`  
     Use your real Vercel URL or custom domain — must match exactly (including `https`, no trailing slash on the path).
3. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000`
   - `https://YOUR-DOMAIN`
4. In Vercel → **Settings** → **Environment Variables**, set:
   - `AUTH_URL=https://YOUR-DOMAIN` (same origin as step 2, no trailing slash)
   - `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` from the same OAuth client
5. Redeploy after changing env vars.

**Note:** Preview deployments (`*.vercel.app` branch URLs) use a different domain unless you add each one to Google — test OAuth on your main production URL.

## Migration note

Books stored under the legacy `default-user` id are automatically claimed by the admin account on first library visit after onboarding.

## Project structure

```
app/              # Routes (library, discover, profiles, auth)
actions/          # Server Actions
components/       # UI, scanner, library, social
lib/books/        # ISBN utils, API lookup, queries
lib/social/       # Likes and discover queries
models/           # User, Book, CollectionLike schemas
```
