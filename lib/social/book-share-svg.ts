import { connectDB } from "@/lib/db";
import { Book } from "@/models/Book";
import { User } from "@/models/User";
import { getSiteUrl } from "@/lib/site-url";

const MAX_COVER_BYTES = 250_000;
const COVER_FETCH_TIMEOUT_MS = 4_000;

const CARD_WIDTH = 480;
const CARD_HEIGHT = 640;

async function fetchImageDataUri(url: string): Promise<string | null> {
  if (!/^https?:\/\//i.test(url)) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), COVER_FETCH_TIMEOUT_MS);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "image/*" },
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_COVER_BYTES) return null;

    return `data:${contentType.split(";")[0]};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trim()}…`;
}

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

export interface BookShareCardData {
  title: string;
  authors: string;
  coverDataUri: string | null;
  rating: number | null;
  readerName: string;
  readerUsername: string;
  hasCover: boolean;
}

export async function loadBookShareCardData(
  bookId: string,
): Promise<BookShareCardData | null> {
  await connectDB();

  const book = await Book.findById(bookId).lean();
  if (!book) return null;

  const user = await User.findById(book.userId).lean();
  if (!user) return null;

  let coverDataUri: string | null = null;
  if (book.coverUrl) {
    if (book.coverUrl.startsWith("data:image/")) {
      coverDataUri = book.coverUrl;
    } else {
      coverDataUri = await fetchImageDataUri(book.coverUrl);
    }
  }

  return {
    title: book.title,
    authors: (book.authors ?? []).join(", "),
    coverDataUri,
    rating: book.rating ?? null,
    readerName: user.name ?? user.username ?? "a reader",
    readerUsername: user.username ?? "unknown",
    hasCover: Boolean(coverDataUri),
  };
}

export function renderBookShareSvg(data: BookShareCardData): string {
  const title = escapeXml(truncate(data.title, 45));
  const authors = escapeXml(truncate(data.authors || "Unknown author", 50));
  const reader = escapeXml(data.readerName);
  const username = escapeXml(data.readerUsername);
  const siteUrl = escapeXml(getSiteUrl().replace(/^https?:\/\//, ""));

  const coverSize = 200;
  const coverX = (CARD_WIDTH - coverSize) / 2;
  const coverY = 80;

  const starsY = coverY + coverSize + 36;
  const titleY = starsY + 20;
  const authorY = titleY + 26;
  const readerY = authorY + 36;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" role="img" aria-label="${title} on BookShelf">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1c1917" />
      <stop offset="100%" stop-color="#292524" />
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(251, 191, 36, 0.08)" />
      <stop offset="100%" stop-color="rgba(251, 191, 36, 0)" />
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#bg)" />

  <rect x="0" y="0" width="${CARD_WIDTH}" height="320" fill="url(#glow)" />

  ${data.hasCover
    ? [
        `<clipPath id="cover-clip"><rect x="${coverX}" y="${coverY}" width="${coverSize}" height="${coverSize}" rx="8" /></clipPath>`,
        `<image href="${data.coverDataUri}" x="${coverX}" y="${coverY}" width="${coverSize}" height="${coverSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#cover-clip)" />`,
        `<rect x="${coverX}" y="${coverY}" width="${coverSize}" height="${coverSize}" rx="8" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" />`,
      ].join("")
    : [
        `<rect x="${coverX}" y="${coverY}" width="${coverSize}" height="${coverSize}" rx="8" fill="#44403c" />`,
        `<text x="${CARD_WIDTH / 2}" y="${coverY + coverSize / 2 + 4}" text-anchor="middle" font-family="Georgia, serif" font-size="48" font-weight="700" fill="#a8a29e">${escapeXml(title[0]?.toUpperCase() ?? "?")}</text>`,
      ].join("")}

  ${data.rating != null
    ? `<text x="${CARD_WIDTH / 2}" y="${starsY}" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="#fbbf24">${escapeXml(renderStars(data.rating))}</text>`
    : ""}

  <text x="${CARD_WIDTH / 2}" y="${titleY}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="700" fill="#f5f5f4">${title}</text>

  <text x="${CARD_WIDTH / 2}" y="${authorY}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="14" fill="#a8a29e">${authors}</text>

  <rect x="180" y="${readerY - 2}" width="120" height="1" fill="rgba(255,255,255,0.06)" />

  <text x="${CARD_WIDTH / 2}" y="${readerY + 16}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="11" fill="#78716c">Read by ${reader} · @${username}</text>

  <text x="${CARD_WIDTH / 2}" y="${CARD_HEIGHT - 24}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="11" fill="#57534e" letter-spacing="1">BookShelf</text>

  <text x="${CARD_WIDTH / 2}" y="${CARD_HEIGHT - 10}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="9" fill="#57534e">${siteUrl}</text>
</svg>`;
}

export async function buildBookShareSvg(bookId: string): Promise<string | null> {
  const data = await loadBookShareCardData(bookId);
  if (!data) return null;
  return renderBookShareSvg(data);
}
